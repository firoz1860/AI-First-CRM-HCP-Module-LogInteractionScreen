from typing import Optional
from langchain_core.tools import tool
from pydantic import BaseModel
from core.database import SessionLocal
from models.interaction import Interaction
from services.groq_service import groq_service


class CheckComplianceInput(BaseModel):
    interaction_data: dict
    hcp_id: str
    territory: Optional[str] = None


@tool("check_compliance", args_schema=CheckComplianceInput)
def check_compliance_tool(
    interaction_data: dict,
    hcp_id: str,
    territory: Optional[str] = None,
) -> dict:
    """Validates interaction data against pharmaceutical compliance rules."""
    db = SessionLocal()
    try:
        # Rule-based checks
        flags = []
        samples = interaction_data.get("samples_provided", [])
        for sample in samples:
            qty = int(sample.get("quantity", 0))
            if qty > 6:
                flags.append(f"Excessive samples: {sample.get('product', 'Unknown')} - {qty} units (max 6)")

        # LLM-based compliance check
        compliance_result = groq_service.check_compliance(interaction_data)

        # Merge rule-based flags
        all_flags = flags + compliance_result.get("flags", [])
        status = "compliant" if not all_flags else "flagged"
        if compliance_result.get("status") == "flagged":
            status = "flagged"
        elif compliance_result.get("status") == "pending" and not all_flags:
            status = "pending"

        # Update interaction if ID provided
        interaction_id = interaction_data.get("id")
        if interaction_id:
            interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
            if interaction:
                interaction.compliance_status = status
                interaction.compliance_notes = compliance_result.get("notes", "")
                db.commit()

        return {
            "success": True,
            "status": status,
            "flags": all_flags,
            "recommendations": compliance_result.get("recommendations", []),
            "notes": compliance_result.get("notes", "Compliance review completed"),
            "message": f"Compliance check complete: {status}",
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e), "status": "pending"}
    finally:
        db.close()
