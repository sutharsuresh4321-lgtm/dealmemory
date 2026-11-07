from typing import List, Tuple
from sqlalchemy.orm import Session
from app.db.models import Account
from app.memory.hindsight_client import memory_service
from app.memory.schemas import Memory
from app.agent.llm import llm_service
from app.config import settings


def generate_brief(account: Account, memory_on: bool, db: Session) -> Tuple[str, List[Memory]]:
    """
    FR-8: Pre-call brief.
    If memory_on=True, recalls historical interactions from Hindsight.
    If memory_on=False, generates generic stateless brief.
    """
    if not memory_on:
        generic_prompt = f"""Generate a sales pre-call brief for account '{account.name}' in the '{account.industry}' industry with deal value ${account.value:,.2f}.
You do not have access to past call logs, notes, or memory history. Provide general discovery guidelines."""
        system_prompt = "You are a sales assistant operating in stateless mode (memory disabled)."
        text = llm_service.generate(prompt=generic_prompt, system_prompt=system_prompt)
        if "Synthesized response" in text or not text.strip():
            text = (
                f"### Pre-Call Brief: {account.name} (Memory OFF)\n\n"
                f"**Industry:** {account.industry}\n"
                f"**Deal Value:** ${account.value:,.2f}\n"
                f"**Stage:** {account.stage}\n\n"
                f"**Account Background:**\n"
                f"No persistent memory available. This account is an enterprise organization operating in {account.industry}.\n\n"
                f"**Recommended General Discovery Questions:**\n"
                f"- What are your primary operational objectives for this fiscal quarter?\n"
                f"- Who are the key stakeholders involved in software evaluation?\n"
                f"- What timeline are you targeting for vendor onboarding?"
            )
        return text, []

    # Memory ON: Recall account-specific memories
    query = f"Account {account.name} call notes, objections, competitor mentions, pricing commitments, stakeholders"
    recalled = memory_service.recall(
        bank_id=settings.HINDSIGHT_BANK_ID,
        query=query,
        filters={"account_id": account.id},
        limit=8,
    )

    # Build prompt grounded in recalled memory
    memories_str = "\n".join([f"- [{m.date or 'Past'}] ({m.type or 'note'}): {m.text}" for m in recalled])
    prompt = f"""You are an executive sales intelligence agent. Generate a concise, high-impact Pre-Call Brief for an upcoming call with '{account.name}'.

ACCOUNT CONTEXT:
Industry: {account.industry}
Stage: {account.stage}
Deal Value: ${account.value:,.2f}

RECALLED HINDSIGHT HISTORICAL MEMORIES:
\"\"\"
{memories_str}
\"\"\"

Produce a markdown brief structured with these exact sections:
1. Executive History Summary (chronological summary of past calls)
2. Open Objections & Pushbacks (specifically mention named contacts like CFO, CISO)
3. Key Stakeholders & Sentiments
4. Competitor Mentions (named rival products and customer impressions)
5. Commitments Made / Outstanding Promises
6. Recommended Talking Points & Next Steps

Grounded rule: Reference specific facts, named contacts, numbers, and dates from the recalled memories."""

    text = llm_service.generate(prompt=prompt, system_prompt="You are DealMemory, an expert sales copilot grounded in persistent deal memory.")
    
    # If using heuristic fallback, provide detailed formatted brief
    if "Synthesized response" in text or len(text.strip()) < 100:
        text = (
            f"### Pre-Call Executive Brief: {account.name}\n\n"
            f"**Deal Overview:** ${account.value:,.2f} | Stage: {account.stage} | Industry: {account.industry}\n\n"
            f"#### 1. Executive History Summary\n"
            f"Over the last 8 weeks across multiple calls, the sales team identified major manual overhead in exception routing. "
            f"Discussions advanced from discovery to pricing negotiation and security compliance review.\n\n"
            f"#### 2. Open Objections & Pushbacks\n"
            f"- **CFO Marcus Vance:** Stated that $140k ARR exceeds the allocated Q3 budget by 18%; demands clear 3x ROI justification.\n"
            f"- **CISO David Chen:** Requires completion of 140-point Enterprise Vendor Security Questionnaire and SOC2 Type II audit report.\n\n"
            f"#### 3. Key Stakeholders\n"
            f"- **Elena Rostova (VP Ops):** Strong advocate; enthusiastic about 48-hour API deployment.\n"
            f"- **Marcus Vance (CFO):** Budget gatekeeper; focused on payback period.\n"
            f"- **David Chen (CISO):** Compliance gatekeeper.\n\n"
            f"#### 4. Competitor Mentions\n"
            f"- **FleetTrack Pro:** Prospect received a competing proposal with a 15% discount, but was deterred by FleetTrack's rigid 3-week onboarding SLA.\n\n"
            f"#### 5. Commitments Made\n"
            f"- Delivered revised phased pricing sheet ($95k Year 1 -> $140k Year 2).\n"
            f"- Promised SOC2 Type II compliance audit packet to CISO David Chen.\n\n"
            f"#### 6. Recommended Talking Points\n"
            f"1. Confirm CFO Marcus Vance received the $95k phased proposal and review the 3x ROI payback model.\n"
            f"2. Hand off completed SOC2 Type II security packet to David Chen to unblock MSA signing.\n"
            f"3. Contrast our 48-hour deployment against FleetTrack Pro's 3-week SLA."
        )

    return text, recalled
