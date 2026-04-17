from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from core.database import get_db
from models.next_best_action import NextBestAction
from schemas.action import NextBestActionResponse, NextBestActionUpdate

router = APIRouter(prefix="/api/actions", tags=["Next Best Actions"])


@router.get("/", response_model=List[NextBestActionResponse])
def list_all_actions(
    status: str = None,
    priority: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(NextBestAction)
    if status:
        query = query.filter(NextBestAction.status == status)
    if priority:
        query = query.filter(NextBestAction.priority == priority)
    return query.order_by(desc(NextBestAction.created_at)).offset(skip).limit(limit).all()


@router.get("/hcp/{hcp_id}", response_model=List[NextBestActionResponse])
def get_actions_for_hcp(
    hcp_id: str,
    status: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(NextBestAction).filter(NextBestAction.hcp_id == hcp_id)
    if status:
        query = query.filter(NextBestAction.status == status)
    return query.order_by(desc(NextBestAction.created_at)).all()


@router.put("/{action_id}", response_model=NextBestActionResponse)
def update_action(action_id: str, update: NextBestActionUpdate, db: Session = Depends(get_db)):
    action = db.query(NextBestAction).filter(NextBestAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    action.status = update.status
    db.commit()
    db.refresh(action)
    return action
