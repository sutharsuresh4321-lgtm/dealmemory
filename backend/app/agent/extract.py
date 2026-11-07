import json
import logging
import re
from typing import Tuple
from app.agent.llm import llm_service
from app.memory.schemas import ExtractedFacts

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are an expert sales intelligence extractor.
Analyze the following sales call notes, transcript, or email and extract structured factual insights.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "objections": ["list of specific objections or friction points raised"],
  "competitors": ["list of competitors or rival solutions mentioned"],
  "stakeholders": ["list of people, their titles, and sentiments mentioned"],
  "commitments": ["action items or promises made by either the AE or prospect"],
  "pricing": ["pricing numbers, ARR quotes, budget amounts, discount requests"],
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "1-2 sentence core factual summary of what happened"
}
Do not include commentary outside the JSON block.
"""


def clean_json_response(raw: str) -> str:
    """
    Strips markdown code blocks, backticks, or trailing garbage to ensure clean JSON.
    """
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
        raw = re.sub(r"```$", "", raw).strip()
    return raw


def extract_deal_facts(raw_text: str, retries: int = 2) -> ExtractedFacts:
    """
    Extracts structured facts from raw interaction text using LLM with retry logic
    and plain-text fallback per FR-18.
    """
    current_attempt = 0
    prompt = f"Sales Interaction Notes:\n\"\"\"\n{raw_text}\n\"\"\"\n\nExtract the structured facts in JSON format."

    while current_attempt <= retries:
        try:
            raw_output = llm_service.generate(
                prompt=prompt,
                system_prompt=EXTRACTION_SYSTEM_PROMPT,
                json_mode=True,
                temperature=0.1,
            )
            cleaned = clean_json_response(raw_output)
            data = json.loads(cleaned)
            facts = ExtractedFacts(**data)
            logger.info("Successfully extracted deal facts with schema validation.")
            return facts
        except Exception as e:
            current_attempt += 1
            logger.warning(f"Fact extraction parsing attempt {current_attempt} failed: {e}")
            if current_attempt <= retries:
                prompt += "\n\nNotice: Your previous output had formatting errors. Respond ONLY with raw valid JSON."

    # FR-18 Fallback: plain-text heuristic extraction if retries exhausted
    logger.info("Falling back to plain-text / heuristic extraction per FR-18.")
    fallback_json = llm_service._heuristic_json_extract(raw_text)
    try:
        data = json.loads(fallback_json)
        return ExtractedFacts(**data)
    except Exception:
        return ExtractedFacts(
            summary=raw_text[:200],
            sentiment="neutral",
            commitments=["Review and follow up on meeting notes"],
        )
