import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Date, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class NextBestAction(Base):
    __tablename__ = "next_best_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hcp_id = Column(String(36), ForeignKey("hcps.id"), nullable=False)
    interaction_id = Column(String(36), ForeignKey("interactions.id"), nullable=True)
    action_type = Column(String(100))
    action_description = Column(Text)
    priority = Column(
        SAEnum("high", "medium", "low", name="priority_enum"),
        default="medium",
    )
    due_date = Column(Date, nullable=True)
    status = Column(
        SAEnum("pending", "completed", "dismissed", name="action_status_enum"),
        default="pending",
    )
    rationale = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    hcp = relationship("HCP", back_populates="next_best_actions")
    interaction = relationship("Interaction", back_populates="next_best_actions")
