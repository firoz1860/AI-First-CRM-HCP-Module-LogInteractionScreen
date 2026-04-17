from typing import Optional
from datetime import date
from langchain_core.tools import tool
from pydantic import BaseModel
from core.database import SessionLocal
from models.interaction import Interaction
from services.groq_service import groq_service


class EditInteractionInput(BaseModel):
    interaction_id: str
    modification_request: str
    updated_fields: Optional[dict] = None


@tool("edit_interaction", args_schema=EditInteractionInput)
def edit_interaction_tool(
    interaction_id: str,
    modification_request: str,
    updated_fields: Optional[dict] = None,
) -> dict:
    """Modifies a previously logged interaction using natural language or explicit field updates."""
    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return {"success": False, "error": f"Interaction {interaction_id} not found"}

        # Build current record dict
        current_record = {
            "id": interaction.id,
            "interaction_date": str(interaction.interaction_date),
            "interaction_type": interaction.interaction_type,
            "products_discussed": interaction.products_discussed,
            "samples_provided": interaction.samples_provided,
            "key_messages_delivered": interaction.key_messages_delivered,
            "hcp_feedback": interaction.hcp_feedback,
            "follow_up_required": interaction.follow_up_required,
            "follow_up_date": str(interaction.follow_up_date) if interaction.follow_up_date else None,
            "follow_up_notes": interaction.follow_up_notes,
        }

        # Get LLM-computed diff
        if modification_request:
            diff = groq_service.compute_interaction_diff(current_record, modification_request)
        else:
            diff = updated_fields or {}

        # Merge explicit updates
        if updated_fields:
            diff.update(updated_fields)

        # Apply diff to interaction
        text_fields_changed = False
        for field, value in diff.items():
            if hasattr(interaction, field) and field not in ("id", "hcp_id", "created_at"):
                if field in ("interaction_date", "follow_up_date") and isinstance(value, str):
                    try:
                        value = date.fromisoformat(value)
                    except ValueError:
                        continue
                if field in ("key_messages_delivered", "hcp_feedback", "products_discussed"):
                    text_fields_changed = True
                setattr(interaction, field, value)

        # Re-run AI enrichment if text fields changed
        if text_fields_changed:
            context = f"Key messages: {interaction.key_messages_delivered}. Feedback: {interaction.hcp_feedback}"
            try:
                extracted = groq_service.extract_interaction_data(context)
                if extracted.get("ai_summary"):
                    interaction.ai_summary = extracted["ai_summary"]
            except Exception:
                pass

        db.commit()
        db.refresh(interaction)

        return {
            "success": True,
            "interaction_id": interaction.id,
            "updated_fields": list(diff.keys()),
            "ai_summary": interaction.ai_summary,
            "message": f"Interaction {interaction_id} updated successfully. Changed: {', '.join(diff.keys())}",
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e), "message": f"Failed to edit interaction: {str(e)}"}
    finally:
        db.close()
