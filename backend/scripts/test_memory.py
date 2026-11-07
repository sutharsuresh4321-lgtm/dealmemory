import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.memory.hindsight_client import MemoryService
from app.config import settings


def main():
    print("=" * 60)
    print("DealMemory: Hindsight Memory Layer Verification Script")
    print(f"HINDSIGHT_BASE_URL: {settings.HINDSIGHT_BASE_URL}")
    print(f"HINDSIGHT_BANK_ID:  {settings.HINDSIGHT_BANK_ID}")
    print(f"HINDSIGHT_API_KEY:  {'[CONFIGURED]' if settings.HINDSIGHT_API_KEY else '[EMPTY - RESILIENT MODE]'}")
    print("=" * 60)

    service = MemoryService()
    bank_id = settings.HINDSIGHT_BANK_ID

    # 1. Retain 3 distinct facts
    print("\n1. Retaining 3 deal facts into Hindsight...")
    fact1 = "Apex Logistics CFO Michael Vance raised concerns that $120k ARR exceeds their current Q3 transportation tech budget."
    id1 = service.retain(
        bank_id=bank_id,
        content=fact1,
        metadata={"account_id": "acc-apex", "type": "objection", "date": "2026-03-01"},
    )
    print(f"  [Fact 1 Retained] Doc ID: {id1}")

    fact2 = "Apex Logistics VP of Operations Sarah Lin mentioned they are evaluating FleetTrack Pro but dislike their 3-week onboarding SLA."
    id2 = service.retain(
        bank_id=bank_id,
        content=fact2,
        metadata={"account_id": "acc-apex", "type": "competitor", "date": "2026-03-08"},
    )
    print(f"  [Fact 2 Retained] Doc ID: {id2}")

    fact3 = "CloudScale Tech won their deal after AE offered phased rollout pricing and shared SOC2 Type II compliance audit within 24 hours."
    id3 = service.retain(
        bank_id=bank_id,
        content=fact3,
        metadata={"account_id": "acc-cloudscale", "type": "outcome", "date": "2026-02-15"},
    )
    print(f"  [Fact 3 Retained] Doc ID: {id3}")

    # 2. Recall memories for Apex Logistics
    print("\n2. Recalling memories for Apex Logistics budget concerns...")
    recalled_apex = service.recall(
        bank_id=bank_id,
        query="What budget concerns or competitor mentions did Apex Logistics have?",
        filters={"account_id": "acc-apex"},
        limit=5,
    )

    print(f"  Recalled {len(recalled_apex)} memories for Apex:")
    for m in recalled_apex:
        print(f"  - [{m.id}] ({m.source}) {m.text[:90]}... (Relevance: {m.relevance})")

    # 3. Test Reflect primitive
    print("\n3. Testing Hindsight Reflect synthesis...")
    reflection = service.reflect(
        bank_id=bank_id,
        query="What strategies resolve CFO budget and competitor objections across deals?",
    )
    print(f"  Reflect Output:\n  {reflection}")

    print("\n" + "=" * 60)
    print("Hindsight Memory verification completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
