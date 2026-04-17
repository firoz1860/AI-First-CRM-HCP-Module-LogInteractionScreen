from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from core.database import get_db
from models.hcp import HCP
from models.interaction import Interaction
from schemas.hcp import HCPCreate, HCPUpdate, HCPResponse, HCPWithMetrics
import uuid

router = APIRouter(prefix="/api/hcps", tags=["HCPs"])


@router.get("/", response_model=List[HCPWithMetrics])
def list_hcps(
    search: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    territory: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(HCP)
    if search:
        query = query.filter(
            or_(
                HCP.name.ilike(f"%{search}%"),
                HCP.institution.ilike(f"%{search}%"),
                HCP.email.ilike(f"%{search}%"),
            )
        )
    if specialty:
        query = query.filter(HCP.specialty.ilike(f"%{specialty}%"))
    if territory:
        query = query.filter(HCP.territory.ilike(f"%{territory}%"))
    if tier:
        query = query.filter(HCP.tier == tier)

    hcps = query.offset(skip).limit(limit).all()

    result = []
    for hcp in hcps:
        interactions = (
            db.query(Interaction)
            .filter(Interaction.hcp_id == hcp.id, Interaction.is_deleted == False)
            .order_by(desc(Interaction.interaction_date))
            .all()
        )
        total = len(interactions)
        all_products = []
        compliant = 0
        open_fu = 0
        for i in interactions:
            all_products.extend(i.products_discussed or [])
            if i.compliance_status == "compliant":
                compliant += 1
            if i.follow_up_required:
                open_fu += 1

        product_freq = {}
        for p in all_products:
            product_freq[p] = product_freq.get(p, 0) + 1
        top_products = sorted(product_freq, key=product_freq.get, reverse=True)[:3]

        hcp_dict = HCPResponse.model_validate(hcp).model_dump()
        hcp_dict.update({
            "total_interactions": total,
            "last_interaction_date": str(interactions[0].interaction_date) if interactions else None,
            "top_products": top_products,
            "compliance_rate": round((compliant / total * 100) if total > 0 else 0, 1),
            "open_follow_ups": open_fu,
        })
        result.append(HCPWithMetrics(**hcp_dict))

    return result


@router.post("/", response_model=HCPResponse, status_code=201)
def create_hcp(hcp_in: HCPCreate, db: Session = Depends(get_db)):
    existing = db.query(HCP).filter(HCP.email == hcp_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="HCP with this email already exists")
    hcp = HCP(id=str(uuid.uuid4()), **hcp_in.model_dump())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp


@router.get("/{hcp_id}", response_model=HCPWithMetrics)
def get_hcp(hcp_id: str, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    interactions = (
        db.query(Interaction)
        .filter(Interaction.hcp_id == hcp_id, Interaction.is_deleted == False)
        .order_by(desc(Interaction.interaction_date))
        .all()
    )
    total = len(interactions)
    all_products = []
    compliant = 0
    open_fu = 0
    for i in interactions:
        all_products.extend(i.products_discussed or [])
        if i.compliance_status == "compliant":
            compliant += 1
        if i.follow_up_required:
            open_fu += 1

    product_freq = {}
    for p in all_products:
        product_freq[p] = product_freq.get(p, 0) + 1
    top_products = sorted(product_freq, key=product_freq.get, reverse=True)[:3]

    hcp_dict = HCPResponse.model_validate(hcp).model_dump()
    hcp_dict.update({
        "total_interactions": total,
        "last_interaction_date": str(interactions[0].interaction_date) if interactions else None,
        "top_products": top_products,
        "compliance_rate": round((compliant / total * 100) if total > 0 else 0, 1),
        "open_follow_ups": open_fu,
    })
    return HCPWithMetrics(**hcp_dict)


@router.put("/{hcp_id}", response_model=HCPResponse)
def update_hcp(hcp_id: str, hcp_in: HCPUpdate, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    for field, value in hcp_in.model_dump(exclude_none=True).items():
        setattr(hcp, field, value)
    db.commit()
    db.refresh(hcp)
    return hcp
