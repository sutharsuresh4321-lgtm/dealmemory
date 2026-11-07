from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.seed import load_seed_data
from app.memory.hindsight_client import memory_service
from app.config import settings

router = APIRouter(prefix="/seed", tags=["seed"])


@router.post("")
def reload_seed_data(db: Session = Depends(get_db)):
    """
    POST /api/seed: Reload seed data into SQLite and retain to Hindsight.
    """
    load_seed_data(db, force=True)

    # Retain core interactions and outcomes to Hindsight
    from app.db.models import Interaction, Outcome, Account
    bank_id = settings.HINDSIGHT_BANK_ID
    memory_service.ensure_bank(bank_id)

    retained_count = 0
    accounts = db.query(Account).all()
    for acc in accounts:
        for inter in acc.interactions:
            memory_service.retain(
                bank_id=bank_id,
                content=f"[{inter.type.upper()} with {acc.name} on {inter.date.strftime('%Y-%m-%d')}]: {inter.raw_text}",
                metadata={
                    "account_id": acc.id,
                    "type": inter.type,
                    "date": inter.date.strftime("%Y-%m-%d"),
                    "source": f"{acc.name} Seed History",
                },
                tags=[f"account:{acc.id}", f"type:{inter.type}"],
            )
            retained_count += 1

        for out in acc.outcomes:
            memory_service.retain(
                bank_id=bank_id,
                content=f"Deal Outcome for {acc.name}: {out.result.upper()}. Reason: {out.reason}. Tactics: {out.tactics}",
                metadata={
                    "account_id": acc.id,
                    "type": "outcome",
                    "result": out.result,
                    "date": out.date.strftime("%Y-%m-%d"),
                    "source": "Seed Outcome",
                },
                tags=[f"account:{acc.id}", "type:outcome", f"result:{out.result}"],
            )
            retained_count += 1

    return {
        "status": "success",
        "accounts_seeded": len(accounts),
        "memories_retained": retained_count,
        "bank_id": bank_id,
    }
