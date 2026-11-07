from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CreateAccountRequest(BaseModel):
    name: str = Field(..., min_length=2)
    industry: str = Field(default="Technology")
    stage: str = Field(default="Discovery")
    value: float = Field(default=50000.0)
    contact_name: Optional[str] = "Key Stakeholder"
    contact_role: Optional[str] = "Decision Maker"
