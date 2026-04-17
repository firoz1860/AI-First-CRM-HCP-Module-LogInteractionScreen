from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import date
import uuid
from core.database import get_db
from models.interaction import Interaction
from models.hcp import HCP
from schemas.interaction import InteractionCreate, InteractionUpdate, InteractionResponse
from services.groq_service import groq_service

router = APIRouter(prefix="/api/interactions", tags=["Interactions"])


def enrich_response(interaction: Interaction, db: Session) -> dict:
    data = {
        "id": interaction.id,
        "hcp_id": interaction.hcp_id,
        "rep_id": interaction.rep_id,
        "interaction_date": interaction.interaction_date,
        "interaction_type": interaction.interaction_type,
        "products_discussed": interaction.products_discussed or [],
        "samples_provided": interaction.samples_provided or [],
        "key_messages_delivered": interaction.key_messages_delivered,
        "hcp_feedback": interaction.hcp_feedback,
        "follow_up_required": interaction.follow_up_required,
        "follow_up_date": interaction.follow_up_date,
        "follow_up_notes": interaction.follow_up_notes,
        "ai_summary": interaction.ai_summary,
        "ai_entities": interaction.ai_entities or {},
        "compliance_status": interaction.compliance_status,
        "compliance_notes": interaction.compliance_notes,
        "created_at": interaction.created_at,
        "updated_at": interaction.updated_at,
        "hcp_name": None,
        "hcp_specialty": None,
    }
    hcp = db.query(HCP).filter(HCP.id == interaction.hcp_id).first()
    if hcp:
        data["hcp_name"] = hcp.name
        data["hcp_specialty"] = hcp.specialty
    return data


@router.get("/", response_model=List[InteractionResponse])
def list_interactions(
    hcp_id: Optional[str] = Query(None),
    interaction_type: Optional[str] = Query(None),
    compliance_status: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Interaction).filter(Interaction.is_deleted == False)
    if hcp_id:
        query = query.filter(Interaction.hcp_id == hcp_id)
    if interaction_type:
        query = query.filter(Interaction.interaction_type == interaction_type)
    if compliance_status:
        query = query.filter(Interaction.compliance_status == compliance_status)
    if from_date:
        query = query.filter(Interaction.interaction_date >= from_date)
    if to_date:
        query = query.filter(Interaction.interaction_date <= to_date)

    interactions = query.order_by(desc(Interaction.interaction_date)).offset(skip).limit(limit).all()
    return [InteractionResponse(**enrich_response(i, db)) for i in interactions]


@router.post("/", response_model=InteractionResponse, status_code=201)
def create_interaction(interaction_in: InteractionCreate, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == interaction_in.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    # AI enrichment
    ai_summary = ""
    ai_entities = {}
    compliance_status = "pending"
    compliance_notes = ""

    raw_text = interaction_in.raw_conversation or ""
    if not raw_text and interaction_in.key_messages_delivered:
        raw_text = interaction_in.key_messages_delivered

    if raw_text:
        try:
            extracted = groq_service.extract_interaction_data(raw_text)
            ai_summary = extracted.get("ai_summary", "")
            ai_entities = extracted.get("entities", {})
            if not interaction_in.key_messages_delivered:
                interaction_in.key_messages_delivered = extracted.get("key_messages_delivered", "")
            if not interaction_in.hcp_feedback:
                interaction_in.hcp_feedback = extracted.get("hcp_feedback", "")
        except Exception:
            pass

        try:
            compliance_data = {
                "interaction_type": interaction_in.interaction_type,
                "products_discussed": interaction_in.products_discussed,
                "samples_provided": interaction_in.samples_provided,
                "key_messages": interaction_in.key_messages_delivered,
            }
            compliance_result = groq_service.check_compliance(compliance_data)
            compliance_status = compliance_result.get("status", "pending")
            compliance_notes = compliance_result.get("notes", "")
        except Exception:
            pass

    interaction = Interaction(
        id=str(uuid.uuid4()),
        hcp_id=interaction_in.hcp_id,
        rep_id=interaction_in.rep_id or "rep_001",
        interaction_date=interaction_in.interaction_date,
        interaction_type=interaction_in.interaction_type,
        products_discussed=interaction_in.products_discussed or [],
        samples_provided=interaction_in.samples_provided or [],
        key_messages_delivered=interaction_in.key_messages_delivered,
        hcp_feedback=interaction_in.hcp_feedback,
        follow_up_required=interaction_in.follow_up_required,
        follow_up_date=interaction_in.follow_up_date,
        follow_up_notes=interaction_in.follow_up_notes,
        ai_summary=ai_summary,
        ai_entities=ai_entities,
        compliance_status=compliance_status,
        compliance_notes=compliance_notes,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return InteractionResponse(**enrich_response(interaction, db))


@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: str, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id, Interaction.is_deleted == False
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return InteractionResponse(**enrich_response(interaction, db))


@router.put("/{interaction_id}", response_model=InteractionResponse)
def update_interaction(interaction_id: str, update_in: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id, Interaction.is_deleted == False
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    update_data = update_in.model_dump(exclude_none=True, exclude={"modification_request"})

    if update_in.modification_request:
        current = {
            "interaction_type": interaction.interaction_type,
            "products_discussed": interaction.products_discussed,
            "key_messages_delivered": interaction.key_messages_delivered,
            "hcp_feedback": interaction.hcp_feedback,
            "follow_up_required": interaction.follow_up_required,
            "follow_up_date": str(interaction.follow_up_date) if interaction.follow_up_date else None,
            "follow_up_notes": interaction.follow_up_notes,
        }
        try:
            diff = groq_service.compute_interaction_diff(current, update_in.modification_request)
            update_data.update(diff)
        except Exception:
            pass

    for field, value in update_data.items():
        if hasattr(interaction, field):
            setattr(interaction, field, value)

    db.commit()
    db.refresh(interaction)
    return InteractionResponse(**enrich_response(interaction, db))


@router.delete("/{interaction_id}", status_code=204)
def delete_interaction(interaction_id: str, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    interaction.is_deleted = True
    db.commit()
