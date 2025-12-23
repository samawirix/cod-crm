"""
Daily Ad Spend Model for COD CRM System

Tracks advertising spend across platforms for ROI/ROAS calculations.
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from datetime import datetime, date
import enum

from app.core.database import Base


class AdPlatform(str, enum.Enum):
    """Enumeration for advertising platforms"""
    FACEBOOK = "FACEBOOK"
    INSTAGRAM = "INSTAGRAM"
    TIKTOK = "TIKTOK"
    GOOGLE = "GOOGLE"
    SNAPCHAT = "SNAPCHAT"
    OTHER = "OTHER"


class DailyAdSpend(Base):
    """
    Model for tracking daily advertising spend by platform.
    Used to calculate Net Profit and ROAS.
    """
    __tablename__ = "daily_ad_spend"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    platform = Column(String(50), default=AdPlatform.FACEBOOK.value)
    amount = Column(Float, nullable=False, default=0)
    leads_generated = Column(Integer, default=0)  # For cost per lead calculation
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, nullable=True)
    
    @property
    def cost_per_lead(self) -> float:
        """Calculate cost per lead"""
        if self.leads_generated and self.leads_generated > 0:
            return round(self.amount / self.leads_generated, 2)
        return 0.0
    
    def __repr__(self):
        return f"<DailyAdSpend(date={self.date}, platform={self.platform}, amount={self.amount})>"
