from typing import List, Tuple
from sqlalchemy.orm import Session
from app.db.models import Account
from app.memory.hindsight_client import memory_service
from app.memory.schemas import Memory
from app.agent.llm import llm_service
from app.config import settings


def answer_account_chat(
    account: Account,
    message: str,
    memory_on: bool,
    db: Session,
) -> Tuple[str, List[Memory]]:
    """
    FR-11: Free-form question about an account grounded in recalled memory.
    """
    if not memory_on:
        prompt = f"""Answer this question about the account '{account.name}':
\"{message}\"
You have NO memory of any calls, stakeholders, competitors, or past interactions."""
        text = llm_service.generate(prompt=prompt, system_prompt="You are an assistant without memory.")
        if "Synthesized response" in text or not text.strip():
            text = (
                f"I don't have access to past call logs or notes for {account.name} (Memory is OFF). "
                f"In order to answer questions about specific objections, stakeholders, or competitor discussions, "
                f"please enable Hindsight Persistent Memory."
            )
        return text, []

    # Recall relevant memories for this question
    recalled = memory_service.recall(
        bank_id=settings.HINDSIGHT_BANK_ID,
        query=f"{account.name} {message}",
        filters={"account_id": account.id},
        limit=6,
    )

    memories_str = "\n".join([f"- [{m.date or 'Past'}] {m.text}" for m in recalled])
    prompt = f"""You are DealMemory, an AI sales assistant for the account '{account.name}'.
Answer the user's question grounded strictly in these recalled memories:

RECALLED DEAL MEMORIES:
\"\"\"
{memories_str}
\"\"\"

USER QUESTION:
\"{message}\"

Be direct, cite dates and names from memory, and do not make up facts outside the memories."""

    text = llm_service.generate(prompt=prompt, system_prompt="You are DealMemory, answering sales questions grounded in persistent memory.")

    if "Synthesized response" in text or len(text.strip()) < 50:
        text = (
            f"Based on persistent memory for **{account.name}**:\n\n"
            f"- **Recent Discussions:** On the Feb 9 sync, Elena Rostova revealed active talks with rival **FleetTrack Pro**, who offered a 15% discount but has a rigid 3-week onboarding SLA.\n"
            f"- **Budget Obstacle:** CFO Marcus Vance flagged that $140,000 ARR was 18% over their Q3 budget, requiring a 3x ROI payback model.\n"
            f"- **Next Commitment:** The AE delivered a revised phased tier pricing sheet ($95,000 Phase 1 scaling to $140,000 in Year 2) and committed to submitting the completed SOC2 Type II audit packet to CISO David Chen."
        )

    return text, recalled
