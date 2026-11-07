import pytest
from app.db.session import init_db, SessionLocal
from app.db.seed import load_seed_data
from app.db.models import Account
from app.agent.compare import run_compare


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()
    with SessionLocal() as db:
        load_seed_data(db, force=False)


def test_compare_brief():
    with SessionLocal() as db:
        account = db.query(Account).filter(Account.id == "acc-apex-logistics").first()
        assert account is not None
        result = run_compare(account, "brief", None, db)
        assert result["account_id"] == "acc-apex-logistics"
        assert result["kind"] == "brief"
        assert "memory_off" in result
        assert "memory_on" in result
        assert len(result["memory_off"]["output"]) > 50
        assert len(result["memory_on"]["output"]) > 50


def test_compare_coach():
    with SessionLocal() as db:
        account = db.query(Account).filter(Account.id == "acc-apex-logistics").first()
        result = run_compare(account, "coach", "CFO thinks $140k ARR is too expensive", db)
        assert result["kind"] == "coach"
        assert "memory_off" in result
        assert "memory_on" in result
        # Objection coach with memory should cite past deals
        assert "CloudScale" in result["memory_on"]["output"] or "past" in result["memory_on"]["output"].lower()
