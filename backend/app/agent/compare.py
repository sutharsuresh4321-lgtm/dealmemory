import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Account
from app.agent.briefing import generate_brief
from app.agent.followup import generate_followup
from app.agent.coach import generate_coaching
from app.agent.chat import answer_account_chat


def run_compare(
    account: Account,
    kind: str,
    input_text: Optional[str],
    db: Session,
) -> Dict[str, Any]:
    """
    FR-13: Runs the same request with Memory ON and Memory OFF, returning outputs side-by-side.
    """
    kind = kind.lower()

    if kind == "followup":
        t0 = time.time()
        off_text, _ = generate_followup(account, input_text or "", memory_on=False, db=db)
        off_ms = int((time.time() - t0) * 1000)

        t1 = time.time()
        on_text, recalled = generate_followup(account, input_text or "", memory_on=True, db=db)
        on_ms = int((time.time() - t1) * 1000)
    elif kind == "coach":
        obj_text = input_text or "The CFO thinks our price is 20% too expensive."
        t0 = time.time()
        off_text, _ = generate_coaching(obj_text, account, memory_on=False, db=db)
        off_ms = int((time.time() - t0) * 1000)

        t1 = time.time()
        on_text, recalled = generate_coaching(obj_text, account, memory_on=True, db=db)
        on_ms = int((time.time() - t1) * 1000)
    elif kind == "chat":
        msg = input_text or "What are the biggest open objections and commitments?"
        t0 = time.time()
        off_text, _ = answer_account_chat(account, msg, memory_on=False, db=db)
        off_ms = int((time.time() - t0) * 1000)

        t1 = time.time()
        on_text, recalled = answer_account_chat(account, msg, memory_on=True, db=db)
        on_ms = int((time.time() - t1) * 1000)
    else:  # default brief
        t0 = time.time()
        off_text, _ = generate_brief(account, memory_on=False, db=db)
        off_ms = int((time.time() - t0) * 1000)

        t1 = time.time()
        on_text, recalled = generate_brief(account, memory_on=True, db=db)
        on_ms = int((time.time() - t1) * 1000)

    return {
        "account_id": account.id,
        "account_name": account.name,
        "kind": kind,
        "memory_off": {
            "output": off_text,
            "recalled_memories": [],
            "latency_ms": off_ms,
        },
        "memory_on": {
            "output": on_text,
            "recalled_memories": [m.model_dump() for m in recalled],
            "latency_ms": on_ms,
        },
    }
