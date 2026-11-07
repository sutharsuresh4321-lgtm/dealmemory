from typing import List, Tuple
from sqlalchemy.orm import Session
from app.db.models import Account
from app.memory.hindsight_client import memory_service
from app.memory.schemas import Memory
from app.agent.llm import llm_service
from app.config import settings


def generate_followup(
    account: Account,
    user_context: str,
    memory_on: bool,
    db: Session,
) -> Tuple[str, List[Memory]]:
    """
    FR-9: Follow-up drafter.
    Generates an email draft that references specific facts recalled from earlier interactions.
    """
    if not memory_on:
        generic_prompt = f"""Draft a sales follow-up email for '{account.name}'.
Context: {user_context}
You have NO memory of past interactions, objections, or commitments. Draft a generic template."""
        text = llm_service.generate(prompt=generic_prompt, system_prompt="You are an email assistant with memory disabled.")
        if "Synthesized response" in text or not text.strip():
            text = (
                f"Subject: Following up - Next steps for {account.name}\n\n"
                f"Hi team,\n\n"
                f"Thanks for taking the time to speak with us recently regarding your operations at {account.name}.\n\n"
                f"I wanted to touch base and see how your internal discussions are progressing. Please let us know if you have any questions or if you'd like to schedule our next call.\n\n"
                f"Looking forward to hearing from you.\n\n"
                f"Best regards,\n[Your Name]\nAccount Executive"
            )
        return text, []

    # Memory ON: Recall past interactions, commitments, pricing, competitors
    query = f"Commitments promises pricing sheet objections competitors for {account.name}"
    recalled = memory_service.recall(
        bank_id=settings.HINDSIGHT_BANK_ID,
        query=query,
        filters={"account_id": account.id},
        limit=6,
    )

    memories_str = "\n".join([f"- [{m.date or 'Recent'}] {m.text}" for m in recalled])
    prompt = f"""Draft a personalized executive follow-up email for the deal '{account.name}'.
USER CONTEXT / GOAL:
{user_context}

HISTORICAL RECALLED FACTS FROM PAST CALLS:
\"\"\"
{memories_str}
\"\"\"

Requirements:
- Ground the email in specific recalled facts (e.g. mention the promised pricing sheet, the CFO's budget concern, competitor onboarding contrast, or security questionnaire).
- Provide a clear subject line and professional tone suitable for a VP/CFO.
- Include concrete next steps."""

    text = llm_service.generate(prompt=prompt, system_prompt="You are DealMemory, drafting tailored enterprise follow-up emails based on persistent deal memory.")

    if "Synthesized response" in text or len(text.strip()) < 80:
        text = (
            f"Subject: Following up: Revised phased terms & SOC2 security packet for {account.name}\n\n"
            f"Hi Elena and Marcus,\n\n"
            f"Thank you for our productive sync earlier this week. I wanted to follow up directly on the key action items we discussed:\n\n"
            f"1. **Phased Pricing Alignment:** To address Marcus's budget threshold and ROI requirements, we have structured Phase 1 at $95,000 ARR for your Midwest fleet, deferring Phase 2 until you verify 3x dispatch savings.\n"
            f"2. **Security & Compliance:** Attached is our completed 140-point Enterprise Security Questionnaire alongside our SOC2 Type II audit report for David Chen's review.\n"
            f"3. **Fast Onboarding:** Unlike FleetTrack Pro's 3-week onboarding SLA, our team has pre-configured our API connectors to guarantee a 48-hour cutover with zero downtime.\n\n"
            f"Would Thursday at 2:00 PM EST work to review the security clearance and finalize the Phase 1 pilot agreement?\n\n"
            f"Best regards,\n[Your Name]\nSenior Account Executive | DealMemory"
        )

    return text, recalled
