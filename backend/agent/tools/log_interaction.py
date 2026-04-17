import uuid
from datetime import date, datetime
from typing import Optional, List
from langchain_core.tools import tool
from pydantic import BaseModel
from core.database import SessionLocal
from models.interaction import Interaction
from models.next_best_action import NextBestAction
from services.groq_service import groq_service


class LogInteractionInput(BaseModel):
    hcp_id: str
    rep_id: str = "rep_001"
    interaction_type: str = "detail_visit"
    raw_conversation: str
    products_discussed: Optional[List[str]] = []
    samples_provided: Optional[List[dict]] = []
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    interaction_date: Optional[str] = None


@tool("log_interaction", args_schema=LogInteractionInput)
def log_interaction_tool(
    hcp_id: str,
    rep_id: str = "rep_001",
    interaction_type: str = "detail_visit",
    raw_conversation: str = "",
    products_discussed: Optional[List[str]] = None,
    samples_provided: Optional[List[dict]] = None,
    follow_up_required: bool = False,
    follow_up_date: Optional[str] = None,
    interaction_date: Optional[str] = None,
) -> dict:
    """Captures and persists a new HCP interaction with AI enrichment and compliance check."""
    db = SessionLocal()
    try:
        # Step 1: Extract structured data from raw conversation
        extracted = {}
        if raw_conversation:
            try:
                extracted = groq_service.extract_interaction_data(raw_conversation)
            except Exception:
                extracted = {}

        # Step 2: Prepare interaction data
        interaction_date_obj = date.today()
        if interaction_date:
            try:
                interaction_date_obj = date.fromisoformat(interaction_date)
            except ValueError:
                pass

        follow_up_date_obj = None
        if follow_up_date:
            try:
                follow_up_date_obj = date.fromisoformat(follow_up_date)
            except ValueError:
                pass

        # Merge extracted products with provided
        all_products = list(set((products_discussed or []) + extracted.get("products_mentioned", [])))

        # Step 3: Run compliance check
        interaction_data_for_compliance = {
            "interaction_type": interaction_type,
            "products_discussed": all_products,
            "samples_provided": samples_provided or [],
            "key_messages": extracted.get("key_messages_delivered", ""),
            "raw_conversation": raw_conversation,
        }
        compliance_result = groq_service.check_compliance(interaction_data_for_compliance)

        # Step 4: Create interaction record
        interaction = Interaction(
            id=str(uuid.uuid4()),
            hcp_id=hcp_id,
            rep_id=rep_id,
            interaction_date=interaction_date_obj,
            interaction_type=interaction_type,
            products_discussed=all_products,
            samples_provided=samples_provided or [],
            key_messages_delivered=extracted.get("key_messages_delivered", ""),
            hcp_feedback=extracted.get("hcp_feedback", ""),
            follow_up_required=follow_up_required,
            follow_up_date=follow_up_date_obj,
            follow_up_notes=extracted.get("follow_up_commitments", ""),
            ai_summary=extracted.get("ai_summary", ""),
            ai_entities=extracted.get("entities", {}),
            compliance_status=compliance_result.get("status", "pending"),
            compliance_notes=compliance_result.get("notes", ""),
        )

        db.add(interaction)
        db.commit()
        db.refresh(interaction)

        return {
            "success": True,
            "interaction_id": interaction.id,
            "ai_summary": interaction.ai_summary,
            "compliance_status": interaction.compliance_status,
            "compliance_notes": interaction.compliance_notes,
            "compliance_flags": compliance_result.get("flags", []),
            "products_discussed": all_products,
            "key_messages": interaction.key_messages_delivered,
            "hcp_feedback": interaction.hcp_feedback,
            "message": f"Interaction logged successfully with ID: {interaction.id}",
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e), "message": f"Failed to log interaction: {str(e)}"}
    finally:
        db.close()
