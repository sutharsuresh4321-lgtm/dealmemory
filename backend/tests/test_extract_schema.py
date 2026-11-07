import pytest
from app.agent.extract import extract_deal_facts, clean_json_response
from app.memory.schemas import ExtractedFacts


def test_clean_json_response():
    markdown_wrapped = "```json\n{\"sentiment\": \"positive\"}\n```"
    cleaned = clean_json_response(markdown_wrapped)
    assert cleaned == "{\"sentiment\": \"positive\"}"


def test_extract_deal_facts_schema():
    raw_text = (
        "Sync call with CFO Marcus Vance at Apex Logistics. Marcus mentioned $140,000 ARR is 18% over "
        "their Q3 budget. They are also talking to FleetTrack Pro who offered a 15% discount. "
        "AE promised to share a revised phased tier pricing sheet by Friday."
    )
    facts: ExtractedFacts = extract_deal_facts(raw_text)
    assert isinstance(facts, ExtractedFacts)
    assert len(facts.objections) > 0 or len(facts.pricing) > 0
    assert facts.sentiment in ["positive", "neutral", "negative"]
