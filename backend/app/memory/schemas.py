from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class Memory(BaseModel):
    id: str
    text: str
    source: str = "hindsight"
    type: Optional[str] = None
    account_id: Optional[str] = None
    date: Optional[str] = None
    relevance: float = 1.0
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RetainRequest(BaseModel):
    bank_id: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    document_id: Optional[str] = None


class RecallRequest(BaseModel):
    bank_id: str
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: int = 8
    tags: Optional[List[str]] = None


class ExtractedFacts(BaseModel):
    objections: List[str] = Field(default_factory=list, description="Customer objections or concerns")
    competitors: List[str] = Field(default_factory=list, description="Mentioned competitors or alternative vendors")
    stakeholders: List[str] = Field(default_factory=list, description="Key decision makers, influencers, or participants")
    commitments: List[str] = Field(default_factory=list, description="Promises, action items, or agreed next steps")
    pricing: List[str] = Field(default_factory=list, description="Budget, price points, discounts, or ROI numbers")
    sentiment: str = Field(default="neutral", description="Overall prospect sentiment: positive, neutral, or negative")
    summary: str = Field(default="", description="1-2 sentence core factual summary")
