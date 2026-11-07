from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.db.models import Account, Interaction
from app.memory.hindsight_client import memory_service
from app.config import settings

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/{account_id}")
def get_account_memories(
    account_id: str,
    query: str = Query(default="deal notes objections competitors commitments", description="Query to recall memories"),
    limit: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    FR-14 & API Spec: GET /api/memory/{account_id}
    Returns memories retained in Hindsight for a specific account.
    """
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    memories = memory_service.recall(
        bank_id=settings.HINDSIGHT_BANK_ID,
        query=f"{account.name} {query}",
        filters={"account_id": account_id},
        limit=limit,
    )

    # If memory bank is still being seeded, supplement with local interaction facts
    results = [m.model_dump() for m in memories]
    if len(results) < 3:
        for inter in account.interactions[:5]:
            results.append({
                "id": inter.id,
                "text": inter.raw_text,
                "source": "Account Timeline",
                "type": inter.type,
                "account_id": account.id,
                "date": inter.date.strftime("%Y-%m-%d"),
                "relevance": 0.85,
                "tags": [f"account:{account.id}", f"type:{inter.type}"],
                "metadata": {"account_id": account.id, "type": inter.type},
            })

    return {
        "account_id": account_id,
        "account_name": account.name,
        "total_memories": len(results),
        "memories": results,
    }
