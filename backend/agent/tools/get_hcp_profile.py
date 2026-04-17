from typing import Optional
from langchain_core.tools import tool
from pydantic import BaseModel
from core.database import SessionLocal
from models.hcp import HCP
from models.interaction import Interaction
from sqlalchemy import desc


class GetHCPProfileInput(BaseModel):
    hcp_id: str
    include_history: bool = True
    history_limit: int = 10


@tool("get_hcp_profile", args_schema=GetHCPProfileInput)
def get_hcp_profile_tool(
    hcp_id: str,
    include_history: bool = True,
    history_limit: int = 10,
) -> dict:
    """Retrieves comprehensive HCP profile including interaction history and engagement metrics."""
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return {"success": False, "error": f"HCP {hcp_id} not found"}

        profile = {
            "id": hcp.id,
            "name": hcp.name,
            "specialty": hcp.specialty,
            "institution": hcp.institution,
            "email": hcp.email,
            "phone": hcp.phone,
            "territory": hcp.territory,
            "tier": hcp.tier,
            "preferred_contact": hcp.preferred_contact,
        }

        if include_history:
            interactions = (
                db.query(Interaction)
                .filter(Interaction.hcp_id == hcp_id, Interaction.is_deleted == False)
                .order_by(desc(Interaction.interaction_date))
                .limit(history_limit)
                .all()
            )

            history = []
            all_products = []
            compliant_count = 0
            for inter in interactions:
                history.append({
                    "id": inter.id,
                    "date": str(inter.interaction_date),
                    "type": inter.interaction_type,
                    "products": inter.products_discussed or [],
                    "ai_summary": inter.ai_summary,
                    "compliance_status": inter.compliance_status,
                    "follow_up_required": inter.follow_up_required,
                })
                all_products.extend(inter.products_discussed or [])
                if inter.compliance_status == "compliant":
                    compliant_count += 1

            # Compute metrics
            total = len(interactions)
            product_freq = {}
            for p in all_products:
                product_freq[p] = product_freq.get(p, 0) + 1
            top_products = sorted(product_freq, key=product_freq.get, reverse=True)[:3]

            profile["interaction_history"] = history
            profile["metrics"] = {
                "total_interactions": total,
                "compliance_rate": round((compliant_count / total * 100) if total > 0 else 0, 1),
                "top_products": top_products,
                "last_interaction_date": history[0]["date"] if history else None,
                "open_follow_ups": sum(1 for i in history if i["follow_up_required"]),
            }

        return {"success": True, "profile": profile, "message": f"Profile retrieved for {hcp.name}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()
