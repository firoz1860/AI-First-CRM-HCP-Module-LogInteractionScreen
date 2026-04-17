from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


class PriorityEnum(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ActionStatusEnum(str, Enum):
    pending = "pending"
    completed = "completed"
    dismissed = "dismissed"


class NextBestActionResponse(BaseModel):
    id: str
    hcp_id: str
    interaction_id: Optional[str] = None
    action_type: Optional[str] = None
    action_description: Optional[str] = None
    priority: Optional[PriorityEnum] = PriorityEnum.medium
    due_date: Optional[date] = None
    status: Optional[ActionStatusEnum] = ActionStatusEnum.pending
    rationale: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NextBestActionUpdate(BaseModel):
    status: ActionStatusEnum
