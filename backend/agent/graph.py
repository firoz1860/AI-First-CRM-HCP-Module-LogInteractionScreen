import json
from typing import Literal
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .state import HCPInteractionState
from .tools import ALL_TOOLS
from core.config import settings


def create_llm():
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL_SECONDARY,
        temperature=0.3,
    )


def agent_node(state: HCPInteractionState) -> HCPInteractionState:
    """Main agent node — calls LLM with tool definitions."""
    llm = create_llm()
    llm_with_tools = llm.bind_tools(ALL_TOOLS)

    system_prompt = f"""You are an AI assistant for pharmaceutical field representatives managing HCP interactions.
You have access to tools to help log interactions, check profiles, suggest next actions, and verify compliance.

Current HCP ID: {state.get('hcp_id', 'unknown')}
Conversation stage: {state.get('conversation_stage', 'gathering')}

Guidelines:
- When a user describes a visit or interaction, use log_interaction tool to capture it
- When a user asks to edit, use edit_interaction tool
- When asked about an HCP, use get_hcp_profile tool
- For next steps/recommendations, use suggest_next_best_action tool
- For compliance questions, use check_compliance tool
- After logging, always confirm what was captured
- Be concise and professional"""

    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.type if m.type != "ai" else "assistant", "content": m.content}
        if not hasattr(m, "tool_calls") or not m.tool_calls
        else m
        for m in state["messages"]
    ]

    response = llm_with_tools.invoke(messages)

    return {
        **state,
        "messages": state["messages"] + [response],
    }


def tool_executor_node(state: HCPInteractionState) -> HCPInteractionState:
    """Executes tool calls from the agent."""
    last_message = state["messages"][-1]
    tool_results = []

    tool_map = {t.name: t for t in ALL_TOOLS}

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        # Inject hcp_id if not present
        if "hcp_id" not in tool_args and state.get("hcp_id"):
            tool_args["hcp_id"] = state["hcp_id"]

        tool_fn = tool_map.get(tool_name)
        if tool_fn:
            try:
                result = tool_fn.invoke(tool_args)
            except Exception as e:
                result = {"success": False, "error": str(e)}
        else:
            result = {"success": False, "error": f"Tool {tool_name} not found"}

        tool_results.append(
            ToolMessage(
                content=json.dumps(result) if isinstance(result, dict) else str(result),
                tool_call_id=tool_call["id"],
                name=tool_name,
            )
        )

    # Update state based on tool results
    new_state = {**state, "messages": state["messages"] + tool_results}
    new_state["tool_calls_made"] = state.get("tool_calls_made", []) + [
        tc["name"] for tc in last_message.tool_calls
    ]

    # Update interaction_id if log_interaction was called
    for tr in tool_results:
        if tr.name == "log_interaction":
            try:
                result_data = json.loads(tr.content)
                if result_data.get("interaction_id"):
                    new_state["interaction_id"] = result_data["interaction_id"]
                    new_state["conversation_stage"] = "logged"
            except Exception:
                pass

    return new_state


def should_use_tool(state: HCPInteractionState) -> Literal["tool_call", "end"]:
    """Determine if the last message contains tool calls."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tool_call"
    return "end"


def finalize_node(state: HCPInteractionState) -> HCPInteractionState:
    """Finalizes the conversation turn."""
    return {**state, "conversation_stage": state.get("conversation_stage", "gathering")}


def build_hcp_agent_graph():
    """Build and compile the LangGraph agent."""
    graph = StateGraph(HCPInteractionState)

    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_executor_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("agent")

    graph.add_conditional_edges(
        "agent",
        should_use_tool,
        {
            "tool_call": "tools",
            "end": "finalize",
        },
    )

    graph.add_edge("tools", "agent")
    graph.add_edge("finalize", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


# Singleton compiled graph
_compiled_graph = None


def get_compiled_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_hcp_agent_graph()
    return _compiled_graph
