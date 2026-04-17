import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from core.database import Base


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    specialty = Column(String(100))
    institution = Column(String(255))
    email = Column(String(255), unique=True)
    phone = Column(String(50))
    territory = Column(String(100))
    tier = Column(SAEnum("A", "B", "C", name="tier_enum"), default="C")
    preferred_contact = Column(
        SAEnum("email", "phone", "in-person", name="preferred_contact_enum"),
        default="email",
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="hcp", lazy="dynamic")
    next_best_actions = relationship("NextBestAction", back_populates="hcp", lazy="dynamic")
    chat_sessions = relationship("ChatSession", back_populates="hcp", lazy="dynamic")
