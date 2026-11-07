import json
import os
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import Account, Contact, Interaction, Outcome

SEED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/seed"))


def load_seed_data(db: Session, force: bool = False):
    """
    Populates 6-8 realistic accounts, contacts, interactions, and outcomes per FR-3 and SRS Section 11.
    """
    existing_count = db.query(Account).count()
    if existing_count > 0 and not force:
        return

    if force:
        db.query(Outcome).delete()
        db.query(Interaction).delete()
        db.query(Contact).delete()
        db.query(Account).delete()
        db.commit()

    accounts_file = os.path.join(SEED_DIR, "accounts.json")
    contacts_file = os.path.join(SEED_DIR, "contacts.json")
    interactions_file = os.path.join(SEED_DIR, "interactions.json")
    outcomes_file = os.path.join(SEED_DIR, "outcomes.json")

    if not os.path.exists(accounts_file):
        return

    with open(accounts_file, "r", encoding="utf-8") as f:
        accounts_data = json.load(f)
    with open(contacts_file, "r", encoding="utf-8") as f:
        contacts_data = json.load(f)
    with open(interactions_file, "r", encoding="utf-8") as f:
        interactions_data = json.load(f)
    with open(outcomes_file, "r", encoding="utf-8") as f:
        outcomes_data = json.load(f)

    for a in accounts_data:
        acc = Account(
            id=a["id"],
            name=a["name"],
            industry=a["industry"],
            stage=a["stage"],
            value=float(a["value"]),
            created_at=datetime.fromisoformat(a.get("created_at", datetime.now(timezone.utc).isoformat())),
        )
        db.add(acc)

    for c in contacts_data:
        con = Contact(
            id=c["id"],
            account_id=c["account_id"],
            name=c["name"],
            role=c["role"],
            notes=c.get("notes"),
        )
        db.add(con)

    for i in interactions_data:
        inter = Interaction(
            id=i["id"],
            account_id=i["account_id"],
            type=i["type"],
            date=datetime.fromisoformat(i["date"]),
            raw_text=i["raw_text"],
            extracted_json=json.dumps(i.get("extracted_json", {})),
            retained=i.get("retained", True),
        )
        db.add(inter)

    for o in outcomes_data:
        out = Outcome(
            id=o["id"],
            account_id=o["account_id"],
            result=o["result"],
            reason=o["reason"],
            tactics=o.get("tactics"),
            date=datetime.fromisoformat(o["date"]),
        )
        db.add(out)

    db.commit()
