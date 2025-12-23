"""
Analytics Service for COD CRM Dashboard
Provides comprehensive analytics and reporting functionality
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.lead import Lead, LeadStatus


class AnalyticsService:
    """Service class for analytics and dashboard data"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Calculate comprehensive dashboard statistics for the given date range
        
        Args:
            date_from: Start date for analysis (defaults to 30 days ago)
            date_to: End date for analysis (defaults to today)
            
        Returns:
            Dictionary containing all dashboard statistics
        """
        # Set default date range if not provided
        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            date_from = date_to - timedelta(days=30)
        
        # Base query with date filter
        base_query = self.db.query(Lead).filter(
            and_(
                Lead.created_at >= date_from,
                Lead.created_at <= date_to
            )
        )
        
        # Total leads in period
        total_leads = base_query.count()
        
        # Confirmed orders (confirmed or later stages)
        confirmed_orders = base_query.filter(
            Lead.status.in_([
                LeadStatus.CONFIRMED,
                LeadStatus.SHIPPED,
                LeadStatus.DELIVERED
            ])
        ).count()
        
        # Delivered orders
        delivered_orders = base_query.filter(Lead.status == LeadStatus.DELIVERED).count()
        
        # Returned orders
        returned_orders = base_query.filter(Lead.status == LeadStatus.RETURNED).count()
        
        # Calculate rates
        confirmation_rate = (confirmed_orders / total_leads * 100) if total_leads > 0 else 0
        delivery_rate = (delivered_orders / confirmed_orders * 100) if confirmed_orders > 0 else 0
        return_rate = (returned_orders / delivered_orders * 100) if delivered_orders > 0 else 0
        
        # Calculate net profit (30% margin on delivered orders)
        delivered_amount = base_query.filter(Lead.status == LeadStatus.DELIVERED).with_entities(
            func.sum(Lead.amount)
        ).scalar() or Decimal('0')
        net_profit = delivered_amount * Decimal('0.3')  # 30% margin
        
        return {
            "total_leads": total_leads,
            "confirmed_orders": confirmed_orders,
            "delivered_orders": delivered_orders,
            "returned_orders": returned_orders,
            "confirmation_rate": round(float(confirmation_rate), 1),
            "delivery_rate": round(float(delivery_rate), 1),
            "return_rate": round(float(return_rate), 1),
            "net_profit": float(net_profit)
        }
    
    def get_funnel_data(self, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> Dict[str, int]:
        """
        Get current funnel data showing leads at each stage
        
        Args:
            date_from: Start date for analysis (defaults to 30 days ago)
            date_to: End date for analysis (defaults to today)
            
        Returns:
            Dictionary with counts for each status
        """
        # Set default date range if not provided
        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            date_from = date_to - timedelta(days=30)
        
        # Base query with date filter
        base_query = self.db.query(Lead).filter(
            and_(
                Lead.created_at >= date_from,
                Lead.created_at <= date_to
            )
        )
        
        funnel_data = {}
        for status in LeadStatus:
            count = base_query.filter(Lead.status == status).count()
            funnel_data[status.value] = count
        
        return funnel_data
    
    def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent lead activity for dashboard
        
        Args:
            limit: Maximum number of recent activities to return
            
        Returns:
            List of recent lead activities
        """
        recent_leads = self.db.query(Lead).order_by(Lead.created_at.desc()).limit(limit).all()
        
        activities = []
        for lead in recent_leads:
            activities.append({
                "id": str(lead.id),
                "customer_name": lead.customer_name,
                "city": lead.city,
                "product_name": lead.product_name,
                "status": lead.status.value,
                "created_at": lead.created_at.isoformat() + "Z",
                "amount": float(lead.amount)
            })
        
        return activities
    
    def calculate_percentage_change(self, current: float, previous: float) -> float:
        """
        Calculate percentage change between two values
        
        Args:
            current: Current period value
            previous: Previous period value
            
        Returns:
            Percentage change (positive or negative)
        """
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        
        return round(((current - previous) / previous) * 100, 1)
    
    def get_percentage_changes(self, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> Dict[str, float]:
        """
        Calculate percentage changes compared to previous period
        
        Args:
            date_from: Start date for current period
            date_to: End date for current period
            
        Returns:
            Dictionary with percentage changes for key metrics
        """
        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            date_from = date_to - timedelta(days=30)
        
        # Calculate period length
        period_length = date_to - date_from
        
        # Previous period dates
        prev_date_to = date_from
        prev_date_from = prev_date_to - period_length
        
        # Current period stats
        current_stats = self.get_dashboard_stats(date_from, date_to)
        
        # Previous period stats
        prev_stats = self.get_dashboard_stats(prev_date_from, prev_date_to)
        
        return {
            "total_leads": self.calculate_percentage_change(
                current_stats["total_leads"], 
                prev_stats["total_leads"]
            ),
            "confirmed_orders": self.calculate_percentage_change(
                current_stats["confirmed_orders"], 
                prev_stats["confirmed_orders"]
            ),
            "delivered_orders": self.calculate_percentage_change(
                current_stats["delivered_orders"], 
                prev_stats["delivered_orders"]
            ),
            "net_profit": self.calculate_percentage_change(
                current_stats["net_profit"], 
                prev_stats["net_profit"]
            )
        }
    
    def get_city_analytics(self, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get analytics by city
        
        Args:
            date_from: Start date for analysis
            date_to: End date for analysis
            limit: Maximum number of cities to return
            
        Returns:
            List of city analytics sorted by lead count
        """
        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            date_from = date_to - timedelta(days=30)
        
        city_stats = self.db.query(
            Lead.city,
            func.count(Lead.id).label('total_leads'),
            func.sum(Lead.amount).label('total_amount'),
            func.avg(Lead.amount).label('avg_amount')
        ).filter(
            and_(
                Lead.created_at >= date_from,
                Lead.created_at <= date_to
            )
        ).group_by(Lead.city).order_by(func.count(Lead.id).desc()).limit(limit).all()
        
        return [
            {
                "city": stat.city,
                "total_leads": stat.total_leads,
                "total_amount": float(stat.total_amount or 0),
                "avg_amount": float(stat.avg_amount or 0)
            }
            for stat in city_stats
        ]
    
    def get_product_analytics(self, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get analytics by product
        
        Args:
            date_from: Start date for analysis
            date_to: End date for analysis
            limit: Maximum number of products to return
            
        Returns:
            List of product analytics sorted by lead count
        """
        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            date_from = date_to - timedelta(days=30)
        
        product_stats = self.db.query(
            Lead.product_name,
            func.count(Lead.id).label('total_leads'),
            func.sum(Lead.amount).label('total_amount'),
            func.avg(Lead.amount).label('avg_amount')
        ).filter(
            and_(
                Lead.created_at >= date_from,
                Lead.created_at <= date_to
            )
        ).group_by(Lead.product_name).order_by(func.count(Lead.id).desc()).limit(limit).all()
        
        return [
            {
                "product_name": stat.product_name,
                "total_leads": stat.total_leads,
                "total_amount": float(stat.total_amount or 0),
                "avg_amount": float(stat.avg_amount or 0)
            }
            for stat in product_stats
        ]
