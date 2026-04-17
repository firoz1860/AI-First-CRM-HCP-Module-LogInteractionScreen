from typing import TypedDict, Optional, List, Any
from langchain_core.messages import BaseMessage


class HCPInteractionState(TypedDict):
    messages: List[BaseMessage]
    hcp_id: str
    interaction_id: Optional[str]
    current_interaction: Optional[dict]
    extracted_entities: Optional[dict]
    compliance_result: Optional[dict]
    next_actions: Optional[List[dict]]
    conversation_stage: str  # 'gathering' | 'confirming' | 'logged' | 'editing'
    error: Optional[str]
    tool_calls_made: List[str]
