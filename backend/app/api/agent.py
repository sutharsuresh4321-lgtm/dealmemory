import time
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.db.session import get_db
from app.db.models import Account, AgentRun, Outcome
from app.agent.briefing import generate_brief
from app.agent.followup import generate_followup
from app.agent.coach import generate_coaching
from app.agent.chat import answer_account_chat
from app.agent.compare import run_compare
from app.memory.schemas import Memory

router = APIRouter(prefix="/agent", tags=["agent"])


class BriefRequest(BaseModel):
    account_id: str
    memory_on: bool = True


class FollowUpRequest(BaseModel):
    account_id: str
    context: Optional[str] = "Generate a personalized follow-up email after our recent call."
    memory_on: bool = True


class CoachRequest(BaseModel):
    objection_text: str
    account_id: Optional[str] = None
    memory_on: bool = True


class ChatRequest(BaseModel):
    account_id: str
    message: str
    memory_on: bool = True


class CompareRequest(BaseModel):
    account_id: str
    kind: str = Field(default="brief", description="brief, followup, coach, or chat")
    input_text: Optional[str] = None


class AgentResponse(BaseModel):
    output: str
    recalled_memories: List[Memory] = Field(default_factory=list)
    memory_on: bool
    latency_ms: int
    account_id: Optional[str] = None
    kind: str


@router.post("/brief", response_model=AgentResponse)
def endpoint_brief(payload: BriefRequest, db: Session = Depends(get_db)):
    """
    FR-8: Pre-call brief. Recalls memories and generates a brief with history,
    open objections, stakeholders, commitments, competitors, and talking points.
    """
    t0 = time.time()
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    output_text, recalled = generate_brief(account=account, memory_on=payload.memory_on, db=db)
    latency_ms = int((time.time() - t0) * 1000)

    # Record agent run
    run = AgentRun(
        id=f"run_{uuid.uuid4().hex[:10]}",
        account_id=account.id,
        kind="brief",
        memory_on=payload.memory_on,
        recalled_ids=str([m.id for m in recalled]),
        output=output_text,
        latency_ms=latency_ms,
    )
    db.add(run)
    db.commit()

    return AgentResponse(
        output=output_text,
        recalled_memories=recalled,
        memory_on=payload.memory_on,
        latency_ms=latency_ms,
        account_id=account.id,
        kind="brief",
    )


@router.post("/followup", response_model=AgentResponse)
def endpoint_followup(payload: FollowUpRequest, db: Session = Depends(get_db)):
    """
    FR-9: Follow-up drafter. References specific facts recalled from earlier interactions.
    """
    t0 = time.time()
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    output_text, recalled = generate_followup(
        account=account,
        user_context=payload.context or "",
        memory_on=payload.memory_on,
        db=db,
    )
    latency_ms = int((time.time() - t0) * 1000)

    run = AgentRun(
        id=f"run_{uuid.uuid4().hex[:10]}",
        account_id=account.id,
        kind="followup",
        memory_on=payload.memory_on,
        recalled_ids=str([m.id for m in recalled]),
        output=output_text,
        latency_ms=latency_ms,
    )
    db.add(run)
    db.commit()

    return AgentResponse(
        output=output_text,
        recalled_memories=recalled,
        memory_on=payload.memory_on,
        latency_ms=latency_ms,
        account_id=account.id,
        kind="followup",
    )


@router.post("/coach", response_model=AgentResponse)
def endpoint_coach(payload: CoachRequest, db: Session = Depends(get_db)):
    """
    FR-10: Objection coach. Recalls past objections and outcomes across accounts,
    suggests a handling approach citing evidence.
    """
    t0 = time.time()
    account = None
    if payload.account_id:
        account = db.query(Account).filter(Account.id == payload.account_id).first()

    output_text, recalled = generate_coaching(
        objection_text=payload.objection_text,
        account=account,
        memory_on=payload.memory_on,
        db=db,
    )
    latency_ms = int((time.time() - t0) * 1000)

    run = AgentRun(
        id=f"run_{uuid.uuid4().hex[:10]}",
        account_id=payload.account_id,
        kind="coach",
        memory_on=payload.memory_on,
        recalled_ids=str([m.id for m in recalled]),
        output=output_text,
        latency_ms=latency_ms,
    )
    db.add(run)
    db.commit()

    return AgentResponse(
        output=output_text,
        recalled_memories=recalled,
        memory_on=payload.memory_on,
        latency_ms=latency_ms,
        account_id=payload.account_id,
        kind="coach",
    )


@router.post("/chat", response_model=AgentResponse)
def endpoint_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    FR-11: Chat. Free-form questions grounded in recalled memory.
    """
    t0 = time.time()
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    output_text, recalled = answer_account_chat(
        account=account,
        message=payload.message,
        memory_on=payload.memory_on,
        db=db,
    )
    latency_ms = int((time.time() - t0) * 1000)

    return AgentResponse(
        output=output_text,
        recalled_memories=recalled,
        memory_on=payload.memory_on,
        latency_ms=latency_ms,
        account_id=account.id,
        kind="chat",
    )


@router.post("/compare")
def endpoint_compare(payload: CompareRequest, db: Session = Depends(get_db)):
    """
    FR-13: Runs the same request with Memory ON and Memory OFF, returning side-by-side outputs.
    """
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    result = run_compare(
        account=account,
        kind=payload.kind,
        input_text=payload.input_text,
        db=db,
    )
    return result
