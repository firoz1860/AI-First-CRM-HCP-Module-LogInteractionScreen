import uuid
from datetime import date, timedelta
from typing import Optional
from langchain_core.tools import tool
from pydantic import BaseModel
from core.database import SessionLocal
from models.hcp import HCP
from models.interaction import Interaction
from models.next_best_action import NextBestAction
from services.groq_service import groq_service
from sqlalchemy import desc


class SuggestNextActionInput(BaseModel):
    hcp_id: str
    interaction_id: Optional[str] = None
    context: Optional[str] = None


@tool("suggest_next_best_action", args_schema=SuggestNextActionInput)
def suggest_next_action_tool(
    hcp_id: str,
    interaction_id: Optional[str] = None,
    context: Optional[str] = None,
) -> dict:
    """Analyzes HCP history and suggests the most impactful next commercial activity."""
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return {"success": False, "error": f"HCP {hcp_id} not found"}

        profile = {
            "name": hcp.name,
            "specialty": hcp.specialty,
            "institution": hcp.institution,
            "tier": hcp.tier,
            "territory": hcp.territory,
        }

        interactions = (
            db.query(Interaction)
            .filter(Interaction.hcp_id == hcp_id, Interaction.is_deleted == False)
            .order_by(desc(Interaction.interaction_date))
            .limit(10)
            .all()
        )

        history = [
            {
                "date": str(i.interaction_date),
                "type": i.interaction_type,
                "products": i.products_discussed,
                "ai_summary": i.ai_summary,
                "hcp_feedback": i.hcp_feedback,
                "follow_up_required": i.follow_up_required,
            }
            for i in interactions
        ]

        if context:
            profile["additional_context"] = context

        # Get AI recommendation
        action_data = groq_service.suggest_next_action(profile, history)

        # Parse due_date
        due_date = date.today() + timedelta(days=30)
        if action_data.get("due_date"):
            try:
                due_date = date.fromisoformat(action_data["due_date"])
            except ValueError:
                pass

        # Save to DB
        action = NextBestAction(
            id=str(uuid.uuid4()),
            hcp_id=hcp_id,
            interaction_id=interaction_id,
            action_type=action_data.get("action_type", "follow_up"),
            action_description=action_data.get("description", ""),
            priority=action_data.get("priority", "medium"),
            due_date=due_date,
            status="pending",
            rationale=action_data.get("rationale", ""),
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        return {
            "success": True,
            "action_id": action.id,
            "action_type": action.action_type,
            "description": action.action_description,
            "priority": action.priority,
            "due_date": str(action.due_date),
            "rationale": action.rationale,
            "message": f"Next best action recommended: {action.action_type}",
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
    finally:
        db.close()
