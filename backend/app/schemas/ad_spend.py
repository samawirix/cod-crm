"""
Ad Spend Pydantic Schemas

Request and response schemas for ad spend API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import date, datetime


class AdSpendCreate(BaseModel):
    """Schema for creating a new ad spend entry."""
    date: date
    platform: str = Field(default="FACEBOOK", description="Advertising platform")
    amount: float = Field(..., ge=0, description="Amount spent in MAD")
    leads_generated: Optional[int] = Field(default=0, ge=0, description="Number of leads generated")
    notes: Optional[str] = Field(default=None, max_length=255)


class AdSpendUpdate(BaseModel):
    """Schema for updating an ad spend entry."""
    platform: Optional[str] = None
    amount: Optional[float] = Field(default=None, ge=0)
    leads_generated: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None


class AdSpendResponse(BaseModel):
    """Schema for ad spend response."""
    id: int
    date: date
    platform: str
    amount: float
    leads_generated: int
    cost_per_lead: float
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdSpendSummary(BaseModel):
    """Schema for ad spend summary."""
    total_spend: float
    total_leads: int
    avg_cost_per_lead: float
    spend_by_platform: Dict[str, float]
    period: Dict[str, str]
