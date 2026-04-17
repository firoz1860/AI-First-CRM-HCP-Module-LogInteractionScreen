from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TierEnum(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class PreferredContactEnum(str, Enum):
    email = "email"
    phone = "phone"
    in_person = "in-person"


class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    institution: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None
    tier: Optional[TierEnum] = TierEnum.C
    preferred_contact: Optional[PreferredContactEnum] = PreferredContactEnum.email


class HCPCreate(HCPBase):
    pass


class HCPUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    institution: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None
    tier: Optional[TierEnum] = None
    preferred_contact: Optional[PreferredContactEnum] = None


class HCPResponse(HCPBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HCPWithMetrics(HCPResponse):
    total_interactions: int = 0
    last_interaction_date: Optional[str] = None
    top_products: List[str] = []
    compliance_rate: float = 0.0
    open_follow_ups: int = 0
