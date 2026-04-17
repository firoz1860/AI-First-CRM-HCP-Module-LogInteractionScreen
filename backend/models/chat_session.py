import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interaction_id = Column(String(36), ForeignKey("interactions.id"), nullable=True)
    hcp_id = Column(String(36), ForeignKey("hcps.id"), nullable=False)
    messages = Column(JSON, default=list)
    session_state = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    hcp = relationship("HCP", back_populates="chat_sessions")
