import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from app.db.session import get_db
from app.db.models import Account, Interaction
from app.memory.hindsight_client import memory_service
from app.memory.schemas import ExtractedFacts
from app.agent.extract import extract_deal_facts
from app.config import settings

router = APIRouter(prefix="/interactions", tags=["interactions"])


class LogInteractionRequest(BaseModel):
    account_id: str
    type: str = Field(default="call", description="call, email, note, meeting")
    raw_text: str = Field(..., min_length=5)
    date: Optional[str] = None


class LogInteractionResponse(BaseModel):
    id: str
    account_id: str
    type: str
    date: str
    raw_text: str
    extracted_facts: ExtractedFacts
    retained: bool
    retained_doc_id: Optional[str] = None
    retained_memories: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("", response_model=LogInteractionResponse)
def log_interaction(
    payload: LogInteractionRequest,
    db: Session = Depends(get_db),
):
    """
    FR-4: Log a call, email, or note by pasting text, selecting an account and date.
    FR-5: Extract structured facts (objections, competitors, stakeholders, commitments, pricing, sentiment) using LLM.
    FR-6: Retain raw text and extracted facts to Hindsight, tagged with account_id, type, and date.
    FR-7: Return confirmation and what was retained for UI Memory Panel.
    """
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    interaction_date = (
        datetime.fromisoformat(payload.date.replace("Z", "+00:00"))
        if payload.date
        else datetime.now(timezone.utc)
    )

    # FR-5 & FR-18: Extract structured facts using LLM with retry & fallback
    extracted: ExtractedFacts = extract_deal_facts(payload.raw_text)

    # Save interaction to SQLite
    inter_id = f"inter_{uuid.uuid4().hex[:10]}"
    interaction = Interaction(
        id=inter_id,
        account_id=account.id,
        type=payload.type,
        date=interaction_date,
        raw_text=payload.raw_text,
        extracted_json=extracted.model_dump_json(),
        retained=True,
    )
    db.add(interaction)
    db.commit()

    # FR-6: Retain raw text and extracted facts to Hindsight
    bank_id = settings.HINDSIGHT_BANK_ID
    memory_service.ensure_bank(bank_id)

    retained_doc_id = None
    retained_items = []

    # 1. Retain raw interaction text
    doc_id = memory_service.retain(
        bank_id=bank_id,
        content=f"[{payload.type.upper()} with {account.name} on {interaction_date.strftime('%Y-%m-%d')}]: {payload.raw_text}",
        metadata={
            "account_id": account.id,
            "type": payload.type,
            "date": interaction_date.strftime("%Y-%m-%d"),
            "interaction_id": inter_id,
            "source": f"{account.name} Interaction Log",
        },
        tags=[f"account:{account.id}", f"type:{payload.type}", "source:interaction"],
    )
    retained_doc_id = doc_id
    retained_items.append({
        "id": doc_id,
        "type": payload.type,
        "text": payload.raw_text,
        "date": interaction_date.strftime("%Y-%m-%d"),
    })

    # 2. Retain discrete high-value extracted facts into Hindsight
    if extracted.objections:
        for obj in extracted.objections:
            obj_doc = memory_service.retain(
                bank_id=bank_id,
                content=f"Customer objection for {account.name}: {obj}",
                metadata={
                    "account_id": account.id,
                    "type": "objection",
                    "date": interaction_date.strftime("%Y-%m-%d"),
                    "source": "Fact Extraction",
                },
                tags=[f"account:{account.id}", "type:objection", "tag:objection"],
            )
            retained_items.append({
                "id": obj_doc,
                "type": "objection",
                "text": obj,
                "date": interaction_date.strftime("%Y-%m-%d"),
            })

    if extracted.competitors:
        for comp in extracted.competitors:
            comp_doc = memory_service.retain(
                bank_id=bank_id,
                content=f"Competitor mentioned during {account.name} sales cycle: {comp}",
                metadata={
                    "account_id": account.id,
                    "type": "competitor",
                    "date": interaction_date.strftime("%Y-%m-%d"),
                    "source": "Fact Extraction",
                },
                tags=[f"account:{account.id}", "type:competitor", "tag:competitor"],
            )
            retained_items.append({
                "id": comp_doc,
                "type": "competitor",
                "text": comp,
                "date": interaction_date.strftime("%Y-%m-%d"),
            })

    if extracted.commitments:
        for comm in extracted.commitments:
            comm_doc = memory_service.retain(
                bank_id=bank_id,
                content=f"Sales commitment / action item for {account.name}: {comm}",
                metadata={
                    "account_id": account.id,
                    "type": "commitment",
                    "date": interaction_date.strftime("%Y-%m-%d"),
                    "source": "Fact Extraction",
                },
                tags=[f"account:{account.id}", "type:commitment", "tag:commitment"],
            )
            retained_items.append({
                "id": comm_doc,
                "type": "commitment",
                "text": comm,
                "date": interaction_date.strftime("%Y-%m-%d"),
            })

    return LogInteractionResponse(
        id=inter_id,
        account_id=account.id,
        type=payload.type,
        date=interaction_date.isoformat(),
        raw_text=payload.raw_text,
        extracted_facts=extracted,
        retained=True,
        retained_doc_id=retained_doc_id,
        retained_memories=retained_items,
    )
