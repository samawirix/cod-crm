from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CallNoteBase(BaseModel):
    lead_id: int = Field(..., description="ID of the lead being called")
    call_outcome: str = Field(..., description="Outcome of the call")
    interest_level: Optional[str] = Field(None, description="Customer interest level")
    next_status: Optional[str] = Field(None, description="Next status for the lead")
    notes: Optional[str] = Field(None, description="Call notes")
    call_duration: Optional[float] = Field(None, description="Call duration in minutes")
    callback_scheduled: Optional[datetime] = Field(None, description="When to callback")

class CallNoteCreate(CallNoteBase):
    """Schema for creating a call note"""
    pass

class CallNoteResponse(BaseModel):
    """Schema for call note response"""
    id: int
    lead_id: int
    user_id: int
    call_outcome: str
    interest_level: Optional[str] = None
    next_status: Optional[str] = None
    notes: Optional[str] = None
    call_duration: Optional[float] = None
    callback_scheduled: Optional[datetime] = None
    created_at: datetime
    
    # Enriched fields
    lead_name: Optional[str] = None
    agent_name: Optional[str] = None
    lead_phone: Optional[str] = None
    
    class Config:
        from_attributes = True

class CallHistoryResponse(BaseModel):
    """Schema for call history list response"""
    total: int
    call_notes: list[CallNoteResponse]

class TodayStatsResponse(BaseModel):
    """Schema for today's statistics"""
    total_calls: int
    answered_calls: int
    callbacks_scheduled: int
    contact_rate: float
    qualified_leads: int
    conversion_rate: float

