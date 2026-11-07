from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from app.db.session import get_db
from app.db.models import Account, Contact, Interaction
from app.api.schemas import CreateAccountRequest

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("", response_model=Dict[str, Any])
def create_account(payload: CreateAccountRequest, db: Session = Depends(get_db)):
    """
    Create a new account/deal so users can add their own custom deals.
    """
    acc_id = f"acc-{uuid.uuid4().hex[:8]}"
    new_acc = Account(
        id=acc_id,
        name=payload.name,
        industry=payload.industry,
        stage=payload.stage,
        value=payload.value,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_acc)

    if payload.contact_name:
        con_id = f"con-{uuid.uuid4().hex[:8]}"
        contact = Contact(
            id=con_id,
            account_id=acc_id,
            name=payload.contact_name,
            role=payload.contact_role or "Primary Contact",
            notes="Added during account creation",
        )
        db.add(contact)

    db.commit()
    db.refresh(new_acc)

    return {
        "id": new_acc.id,
        "name": new_acc.name,
        "industry": new_acc.industry,
        "stage": new_acc.stage,
        "value": new_acc.value,
        "contacts": [{"name": payload.contact_name, "role": payload.contact_role}],
        "interaction_count": 0,
    }


@router.get("", response_model=List[Dict[str, Any]])
def list_accounts(db: Session = Depends(get_db)):
    """
    FR-1: List accounts with name, industry, deal stage, deal value, and primary contacts.
    """
    accounts = db.query(Account).order_by(Account.name).all()
    results = []
    for acc in accounts:
        contacts = [
            {"id": c.id, "name": c.name, "role": c.role, "notes": c.notes}
            for c in acc.contacts
        ]
        results.append({
            "id": acc.id,
            "name": acc.name,
            "industry": acc.industry,
            "stage": acc.stage,
            "value": acc.value,
            "created_at": acc.created_at.isoformat() if acc.created_at else None,
            "contacts": contacts,
            "interaction_count": len(acc.interactions),
        })
    return results


@router.get("/{account_id}")
def get_account_detail(account_id: str, db: Session = Depends(get_db)):
    """
    FR-2: Show account detail page with chronological interaction timeline.
    """
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    contacts = [
        {"id": c.id, "name": c.name, "role": c.role, "notes": c.notes}
        for c in acc.contacts
    ]
    interactions = [
        {
            "id": i.id,
            "account_id": i.account_id,
            "type": i.type,
            "date": i.date.isoformat(),
            "raw_text": i.raw_text,
            "extracted_json": i.extracted_json,
            "retained": i.retained,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in acc.interactions
    ]
    outcomes = [
        {
            "id": o.id,
            "result": o.result,
            "reason": o.reason,
            "tactics": o.tactics,
            "date": o.date.isoformat(),
        }
        for o in acc.outcomes
    ]

    return {
        "id": acc.id,
        "name": acc.name,
        "industry": acc.industry,
        "stage": acc.stage,
        "value": acc.value,
        "created_at": acc.created_at.isoformat() if acc.created_at else None,
        "contacts": contacts,
        "interactions": interactions,
        "outcomes": outcomes,
    }
