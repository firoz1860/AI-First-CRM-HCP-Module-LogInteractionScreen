from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class InteractionTypeEnum(str, Enum):
    detail_visit = "detail_visit"
    lunch_meeting = "lunch_meeting"
    conference = "conference"
    phone_call = "phone_call"
    virtual_meeting = "virtual_meeting"
    sample_drop = "sample_drop"


class ComplianceStatusEnum(str, Enum):
    compliant = "compliant"
    flagged = "flagged"
    pending = "pending"


class SampleProvided(BaseModel):
    product: str
    quantity: int


class InteractionBase(BaseModel):
    hcp_id: str
    rep_id: Optional[str] = "rep_001"
    interaction_date: date
    interaction_type: InteractionTypeEnum
    products_discussed: Optional[List[str]] = []
    samples_provided: Optional[List[Dict[str, Any]]] = []
    key_messages_delivered: Optional[str] = None
    hcp_feedback: Optional[str] = None
    follow_up_required: Optional[bool] = False
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None


class InteractionCreate(InteractionBase):
    raw_conversation: Optional[str] = None


class InteractionUpdate(BaseModel):
    interaction_date: Optional[date] = None
    interaction_type: Optional[InteractionTypeEnum] = None
    products_discussed: Optional[List[str]] = None
    samples_provided: Optional[List[Dict[str, Any]]] = None
    key_messages_delivered: Optional[str] = None
    hcp_feedback: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None
    modification_request: Optional[str] = None


class InteractionResponse(InteractionBase):
    id: str
    ai_summary: Optional[str] = None
    ai_entities: Optional[Dict[str, Any]] = {}
    compliance_status: Optional[ComplianceStatusEnum] = ComplianceStatusEnum.pending
    compliance_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    hcp_name: Optional[str] = None
    hcp_specialty: Optional[str] = None

    class Config:
        from_attributes = True
