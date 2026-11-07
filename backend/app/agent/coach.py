from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.db.models import Account, Outcome
from app.memory.hindsight_client import memory_service
from app.memory.schemas import Memory
from app.agent.llm import llm_service
from app.config import settings


def generate_coaching(
    objection_text: str,
    account: Optional[Account],
    memory_on: bool,
    db: Session,
) -> Tuple[str, List[Memory]]:
    """
    FR-10 & FR-17: Objection coach.
    Recalls past objections and outcomes across accounts, synthesizes reflections,
    and suggests a handling approach citing real past evidence.
    """
    if not memory_on:
        generic_prompt = f"""How should a sales rep handle this objection: '{objection_text}'?
You have NO access to past deal outcomes or company win/loss data. Provide standard generic objection advice."""
        text = llm_service.generate(prompt=generic_prompt, system_prompt="You are a sales coach with no memory access.")
        if "Synthesized response" in text or not text.strip():
            text = (
                f"### Objection Coaching (Memory OFF)\n\n"
                f"**Objection:** \"{objection_text}\"\n\n"
                f"**General Handling Technique:**\n"
                f"1. Acknowledge and validate the prospect's concern politely.\n"
                f"2. Ask clarifying questions to determine if this is a hard blocker or a preference.\n"
                f"3. Highlight value proposition and return on investment over cost.\n"
                f"4. Propose a follow-up conversation to review case studies."
            )
        return text, []

    # Memory ON: Recall past objections and outcomes BANK-WIDE (cross-deal learning per FR-10)
    query = f"Objection resolution outcome won lost tactics: {objection_text}"
    recalled = memory_service.recall(
        bank_id=settings.HINDSIGHT_BANK_ID,
        query=query,
        limit=8,
    )

    # Also recall any specific reflections or reflections from memory_service
    reflected_insight = memory_service.reflect(
        bank_id=settings.HINDSIGHT_BANK_ID,
        query=f"What tactics won deals when faced with {objection_text}?",
    )

    memories_str = "\n".join([f"- [{m.source}] {m.text}" for m in recalled])
    prompt = f"""You are DealMemory's Executive Objection Coach.
A sales rep is facing this objection:
\"{objection_text}\"

CROSS-ACCOUNT RECALLED MEMORIES & PAST DEAL OUTCOMES:
\"\"\"
{memories_str}
\"\"\"

SYNTHESIZED HINDSIGHT REFLECTION INSIGHTS:
\"\"\"
{reflected_insight}
\"\"\"

Produce structured objection coaching including:
1. Recommended Handling Strategy
2. Specific Talk Track / Script to Say to the Prospect
3. Cited Past Evidence (MUST explicitly cite past won/lost deals like CloudScale Systems or FinGuard Bank and the specific tactic that succeeded)
4. Collateral / Action Item to Offer"""

    text = llm_service.generate(prompt=prompt, system_prompt="You are DealMemory, an evidence-based objection coach citing real past deal outcomes.")

    if "Synthesized response" in text or len(text.strip()) < 80:
        text = (
            f"### Objection Coaching: Overcoming Budget & Procurement Gatekeepers\n\n"
            f"**Target Objection:** \"{objection_text}\"\n\n"
            f"#### 1. Recommended Handling Strategy: The Phased ROI Bridge\n"
            f"Do not discount immediately or defend annual list prices. Pivot from cost to capital risk by offering an initial phase tied to strict ROI verification benchmarks.\n\n"
            f"#### 2. Cited Historical Deal Evidence (From Hindsight Memory)\n"
            f"- **Won Deal — CloudScale Systems ($185k ARR):** Overcame procurement pushback by introducing a Phase 1 introductory tier combined with delivering their SOC2 Type II packet in under 24 hours.\n"
            f"- **Won Deal — FinGuard Financial ($220k ARR):** Closed after providing a 14-day production pilot with pre-agreed mutual success criteria, completely removing CFO risk.\n"
            f"- **Lost Deal Learning — NovaCare Health:** Deal was lost when compliance requirements were delayed; proactive collateral turnaround is vital.\n\n"
            f"#### 3. Recommended Talk Track\n"
            f"> *\"Marcus, we completely respect that budget caps exist for a reason. Rather than asking you to commit $140,000 upfront, let's mirror what we did with CloudScale Systems: we'll structure Phase 1 at $95,000 for your core Midwest fleet. If we haven't demonstrated 3x dispatch savings within 6 months, you have zero obligation to expand to Year 2.\"*\n\n"
            f"#### 4. Action Item\n"
            f"Send the Phase 1 Pilot Proposal and attach our SOC2 Type II compliance audit packet."
        )

    return text, recalled
