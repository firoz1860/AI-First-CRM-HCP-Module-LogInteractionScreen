import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Date, Boolean, Text, JSON, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hcp_id = Column(String(36), ForeignKey("hcps.id"), nullable=False)
    rep_id = Column(String(100), default="rep_001")
    interaction_date = Column(Date, nullable=False)
    interaction_type = Column(
        SAEnum(
            "detail_visit", "lunch_meeting", "conference",
            "phone_call", "virtual_meeting", "sample_drop",
            name="interaction_type_enum"
        ),
        nullable=False,
    )
    products_discussed = Column(JSON, default=list)
    samples_provided = Column(JSON, default=list)
    key_messages_delivered = Column(Text)
    hcp_feedback = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(Date, nullable=True)
    follow_up_notes = Column(Text, nullable=True)
    ai_summary = Column(Text)
    ai_entities = Column(JSON, default=dict)
    compliance_status = Column(
        SAEnum("compliant", "flagged", "pending", name="compliance_status_enum"),
        default="pending",
    )
    compliance_notes = Column(Text)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
    next_best_actions = relationship("NextBestAction", back_populates="interaction")
