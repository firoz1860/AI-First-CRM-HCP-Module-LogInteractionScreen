from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant' | 'tool'
    content: str
    timestamp: Optional[str] = None
    tool_name: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    hcp_id: str


class ChatResponse(BaseModel):
    session_id: str
    message: str
    tool_calls: Optional[List[Dict[str, Any]]] = []
    interaction_id: Optional[str] = None
    ai_summary: Optional[str] = None
    compliance_result: Optional[Dict[str, Any]] = None
    next_action: Optional[Dict[str, Any]] = None


class ChatSessionResponse(BaseModel):
    id: str
    hcp_id: str
    interaction_id: Optional[str] = None
    messages: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True
