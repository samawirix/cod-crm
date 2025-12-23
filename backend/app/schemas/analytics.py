from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import date

class DashboardStatsResponse(BaseModel):
    """Dashboard KPI statistics"""
    total_revenue: float
    total_leads: int
    conversion_rate: float
    average_deal_size: float
    win_rate: float
    active_deals: int
    total_calls: int
    contact_rate: float

class RevenueDataPoint(BaseModel):
    """Single data point for revenue chart"""
    date: str
    revenue: float
    leads: int

class RevenueOverTimeResponse(BaseModel):
    """Revenue over time data"""
    data_points: List[RevenueDataPoint]

class LeadsBySourceResponse(BaseModel):
    """Leads grouped by source"""
    sources: Dict[str, int]  # {"FACEBOOK": 15, "INSTAGRAM": 10, ...}

class StatusDistributionResponse(BaseModel):
    """Lead status distribution"""
    statuses: Dict[str, int]  # {"NEW": 20, "QUALIFIED": 10, ...}

class ConversionFunnelResponse(BaseModel):
    """Sales funnel data"""
    total_leads: int
    contacted: int
    qualified: int
    confirmed: int
    won: int
    conversion_rate: float
