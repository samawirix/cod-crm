"""
Ad Spend Service

Business logic for managing advertising spend and calculating ROI metrics.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Optional, List

from app.models.ad_spend import DailyAdSpend


class AdSpendService:
    """Service class for ad spend operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_ad_spend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        platform: Optional[str] = None
    ) -> List[DailyAdSpend]:
        """Get ad spend records with optional filters."""
        query = self.db.query(DailyAdSpend)
        
        if start_date:
            query = query.filter(DailyAdSpend.date >= start_date)
        if end_date:
            query = query.filter(DailyAdSpend.date <= end_date)
        if platform:
            query = query.filter(DailyAdSpend.platform == platform)
        
        return query.order_by(DailyAdSpend.date.desc()).all()
    
    def create_ad_spend(self, data: dict, user_id: int = None) -> DailyAdSpend:
        """Create or update ad spend entry (upsert by date+platform)."""
        # Check if entry exists for this date & platform
        existing = self.db.query(DailyAdSpend).filter(
            DailyAdSpend.date == data['date'],
            DailyAdSpend.platform == data.get('platform', 'FACEBOOK')
        ).first()
        
        if existing:
            # Update existing
            for key, value in data.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        # Create new
        ad_spend = DailyAdSpend(**data, created_by=user_id)
        self.db.add(ad_spend)
        self.db.commit()
        self.db.refresh(ad_spend)
        return ad_spend
    
    def delete_ad_spend(self, spend_id: int) -> bool:
        """Delete an ad spend entry."""
        record = self.db.query(DailyAdSpend).filter(DailyAdSpend.id == spend_id).first()
        if record:
            self.db.delete(record)
            self.db.commit()
            return True
        return False
    
    def get_total_spend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> float:
        """Get total ad spend for a period."""
        query = self.db.query(func.sum(DailyAdSpend.amount))
        
        if start_date:
            query = query.filter(DailyAdSpend.date >= start_date)
        if end_date:
            query = query.filter(DailyAdSpend.date <= end_date)
        
        result = query.scalar()
        return float(result) if result else 0.0
    
    def get_spend_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> dict:
        """Get comprehensive ad spend summary."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        records = self.get_ad_spend(start_date, end_date)
        
        total_spend = sum(r.amount for r in records)
        total_leads = sum(r.leads_generated for r in records)
        
        # Spend by platform
        spend_by_platform = {}
        for r in records:
            platform = r.platform or 'OTHER'
            if platform not in spend_by_platform:
                spend_by_platform[platform] = 0
            spend_by_platform[platform] += r.amount
        
        return {
            "total_spend": round(total_spend, 2),
            "total_leads": total_leads,
            "avg_cost_per_lead": round(total_spend / total_leads, 2) if total_leads > 0 else 0,
            "spend_by_platform": spend_by_platform,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        }
