import uuid
import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage
from core.database import get_db
from models.chat_session import ChatSession
from models.hcp import HCP
from schemas.chat import ChatRequest, ChatResponse, ChatSessionResponse
from agent.graph import get_compiled_graph
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def get_or_create_session(session_id: str, hcp_id: str, db: Session) -> ChatSession:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        session = ChatSession(
            id=session_id,
            hcp_id=hcp_id,
            messages=[],
            session_state={},
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == request.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    session_id = request.session_id or str(uuid.uuid4())
    session = get_or_create_session(session_id, request.hcp_id, db)

    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": session_id}}

    # Build initial state
    initial_state = {
        "messages": [HumanMessage(content=request.message)],
        "hcp_id": request.hcp_id,
        "interaction_id": None,
        "current_interaction": None,
        "extracted_entities": None,
        "compliance_result": None,
        "next_actions": None,
        "conversation_stage": "gathering",
        "error": None,
        "tool_calls_made": [],
    }

    try:
        result = graph.invoke(initial_state, config=config)
        messages = result.get("messages", [])

        # Get last AI message
        ai_response = ""
        for msg in reversed(messages):
            if hasattr(msg, "content") and msg.type in ("ai", "assistant"):
                ai_response = msg.content
                break

        # Save session
        session_messages = session.messages or []
        session_messages.append({"role": "user", "content": request.message, "timestamp": datetime.utcnow().isoformat()})
        session_messages.append({"role": "assistant", "content": ai_response, "timestamp": datetime.utcnow().isoformat()})
        session.messages = session_messages
        if result.get("interaction_id"):
            session.interaction_id = result["interaction_id"]
        db.commit()

        return ChatResponse(
            session_id=session_id,
            message=ai_response or "I'm here to help. Could you tell me more about your HCP interaction?",
            tool_calls=result.get("tool_calls_made", []),
            interaction_id=result.get("interaction_id"),
        )
    except Exception as e:
        return ChatResponse(
            session_id=session_id,
            message=f"I encountered an issue processing your request. Please try again. ({str(e)[:100]})",
        )


@router.get("/session/{session_id}", response_model=ChatSessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    graph = get_compiled_graph()
    config = {"configurable": {"thread_id": session_id}}

    # Get or init session data
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    hcp_id = session.hcp_id if session else None

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            message = payload.get("message", "")
            if not hcp_id:
                hcp_id = payload.get("hcp_id", "")

            # Send typing indicator
            await websocket.send_text(json.dumps({"type": "typing", "content": ""}))

            initial_state = {
                "messages": [HumanMessage(content=message)],
                "hcp_id": hcp_id or "",
                "interaction_id": None,
                "current_interaction": None,
                "extracted_entities": None,
                "compliance_result": None,
                "next_actions": None,
                "conversation_stage": "gathering",
                "error": None,
                "tool_calls_made": [],
            }

            try:
                # Stream events
                async for event in graph.astream_events(initial_state, config=config, version="v1"):
                    kind = event.get("event", "")

                    if kind == "on_tool_start":
                        tool_name = event.get("name", "unknown")
                        await websocket.send_text(json.dumps({
                            "type": "tool_start",
                            "tool": tool_name,
                            "content": f"Running {tool_name}..."
                        }))

                    elif kind == "on_tool_end":
                        tool_name = event.get("name", "unknown")
                        output = event.get("data", {}).get("output", "")
                        await websocket.send_text(json.dumps({
                            "type": "tool_end",
                            "tool": tool_name,
                            "content": f"Completed {tool_name}",
                            "result": str(output)[:500] if output else "",
                        }))

                    elif kind == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk", {})
                        if hasattr(chunk, "content") and chunk.content:
                            await websocket.send_text(json.dumps({
                                "type": "stream",
                                "content": chunk.content,
                            }))

                await websocket.send_text(json.dumps({"type": "done", "content": ""}))

            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "content": f"Error: {str(e)[:200]}",
                }))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "content": str(e)}))
        except Exception:
            pass
