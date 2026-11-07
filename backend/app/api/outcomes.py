import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db.models import Account, Outcome
from app.memory.hindsight_client import memory_service
from app.config import settings

router = APIRouter(prefix="/outcomes", tags=["outcomes"])


class LogOutcomeRequest(BaseModel):
    account_id: str
    result: str = Field(..., description="won or lost")
    reason: str = Field(..., min_length=5)
    tactics: Optional[str] = None
    date: Optional[str] = None


@router.post("")
def log_outcome(payload: LogOutcomeRequest, db: Session = Depends(get_db)):
    """
    FR-15: Log deal won or lost with reason and tactics.
    FR-16: Retain outcomes and trigger reflect step for cross-deal insights.
    """
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    outcome_date = (
        datetime.fromisoformat(payload.date.replace("Z", "+00:00"))
        if payload.date
        else datetime.now(timezone.utc)
    )

    out_id = f"out_{uuid.uuid4().hex[:10]}"
    outcome = Outcome(
        id=out_id,
        account_id=account.id,
        result=payload.result.lower(),
        reason=payload.reason,
        tactics=payload.tactics,
        date=outcome_date,
    )
    db.add(outcome)

    # Update account stage
    account.stage = "Closed Won" if payload.result.lower() == "won" else "Closed Lost"
    db.commit()

    # Retain outcome into Hindsight
    bank_id = settings.HINDSIGHT_BANK_ID
    doc_id = memory_service.retain(
        bank_id=bank_id,
        content=(
            f"Deal outcome for {account.name}: {payload.result.upper()}.\n"
            f"Reason: {payload.reason}\n"
            f"Tactics used: {payload.tactics or 'N/A'}"
        ),
        metadata={
            "account_id": account.id,
            "type": "outcome",
            "result": payload.result.lower(),
            "date": outcome_date.strftime("%Y-%m-%d"),
            "source": "Deal Outcome Log",
        },
        tags=[f"account:{account.id}", "type:outcome", f"result:{payload.result.lower()}"],
    )

    # FR-16: Run reflection step to produce updated cross-deal insights
    reflection_insight = memory_service.reflect(
        bank_id=bank_id,
        query="What objection responses, pricing tactics, and compliance collateral correlate with winning deals?",
    )

    return {
        "id": out_id,
        "account_id": account.id,
        "result": payload.result.lower(),
        "reason": payload.reason,
        "tactics": payload.tactics,
        "retained_doc_id": doc_id,
        "reflection_insight": reflection_insight,
    }
