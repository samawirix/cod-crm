"""
Cost Settings Pydantic Schemas

Request and response schemas for cost settings API.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CostSettingsUpdate(BaseModel):
    """Schema for updating cost settings."""
    default_shipping_cost: Optional[float] = None
    packaging_cost: Optional[float] = None
    return_shipping_cost: Optional[float] = None
    agent_confirmation_fee: Optional[float] = None
    agent_delivery_fee: Optional[float] = None
    agent_return_penalty: Optional[float] = None
    payment_gateway_fee_percent: Optional[float] = None
    other_fixed_fees: Optional[float] = None
    cod_collection_fee_percent: Optional[float] = None
    company_name: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None


class CostSettingsResponse(BaseModel):
    """Schema for cost settings response."""
    id: int
    default_shipping_cost: float
    packaging_cost: float
    return_shipping_cost: float
    agent_confirmation_fee: float
    agent_delivery_fee: float
    agent_return_penalty: float
    payment_gateway_fee_percent: float
    other_fixed_fees: float
    cod_collection_fee_percent: float
    company_name: str
    company_phone: str
    company_address: Optional[str]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
