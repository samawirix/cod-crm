"""
Unit Economics Service

Calculates unit economics metrics for COD business:
- CPL (Cost Per Lead)
- CPO (Cost Per Order)
- CPD (Cost Per Delivered)
- Real Net Profit
- ROAS (Return on Ad Spend)
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Optional, Dict, Any, List

from app.models.ad_spend import DailyAdSpend
from app.models.lead import Lead
from app.models.order import Order, OrderStatus
from app.models.cost_settings import SystemCostSettings


class UnitEconomicsService:
    """
    Calculates unit economics metrics for COD business.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._settings = None
    
    @property
    def settings(self) -> SystemCostSettings:
        """Lazy load cost settings"""
        if self._settings is None:
            self._settings = SystemCostSettings.get_settings(self.db)
        return self._settings
    
    def get_ad_spend_for_period(
        self,
        start_date: date,
        end_date: date,
        platform: Optional[str] = None
    ) -> float:
        """Get total ad spend for a date range"""
        query = self.db.query(func.coalesce(func.sum(DailyAdSpend.amount), 0))
        query = query.filter(
            DailyAdSpend.date >= start_date,
            DailyAdSpend.date <= end_date
        )
        if platform:
            query = query.filter(DailyAdSpend.platform == platform)
        
        return float(query.scalar() or 0)
    
    def get_leads_count_for_period(
        self,
        start_date: date,
        end_date: date
    ) -> int:
        """Count leads created in date range"""
        return self.db.query(Lead).filter(
            func.date(Lead.created_at) >= start_date,
            func.date(Lead.created_at) <= end_date
        ).count()
    
    def get_orders_count_for_period(
        self,
        start_date: date,
        end_date: date,
        status: Optional[str] = None
    ) -> int:
        """Count orders created in date range, optionally by status"""
        query = self.db.query(Order).filter(
            func.date(Order.created_at) >= start_date,
            func.date(Order.created_at) <= end_date
        )
        if status:
            try:
                status_enum = OrderStatus(status)
                query = query.filter(Order.status == status_enum)
            except ValueError:
                pass
        return query.count()
    
    def calculate_cpl(
        self,
        start_date: date,
        end_date: date,
        platform: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate Cost Per Lead (CPL)
        Formula: Total Ad Spend / Number of Leads
        """
        ad_spend = self.get_ad_spend_for_period(start_date, end_date, platform)
        leads_count = self.get_leads_count_for_period(start_date, end_date)
        
        cpl = round(ad_spend / leads_count, 2) if leads_count > 0 else 0
        
        return {
            "metric": "CPL",
            "value": cpl,
            "ad_spend": round(ad_spend, 2),
            "leads_count": leads_count,
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "status": "good" if cpl < 30 else "warning" if cpl < 50 else "bad"
        }
    
    def calculate_cpo(
        self,
        start_date: date,
        end_date: date,
        platform: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate Cost Per Order (CPO)
        Formula: Total Ad Spend / Number of Orders Created
        """
        ad_spend = self.get_ad_spend_for_period(start_date, end_date, platform)
        orders_count = self.get_orders_count_for_period(start_date, end_date)
        
        cpo = round(ad_spend / orders_count, 2) if orders_count > 0 else 0
        
        return {
            "metric": "CPO",
            "value": cpo,
            "ad_spend": round(ad_spend, 2),
            "orders_count": orders_count,
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "status": "good" if cpo < 80 else "warning" if cpo < 120 else "bad"
        }
    
    def calculate_cpd(
        self,
        start_date: date,
        end_date: date,
        platform: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate Cost Per Delivered (CPD) - THE MOST CRITICAL METRIC
        Formula: Total Ad Spend / Number of Delivered Orders
        """
        ad_spend = self.get_ad_spend_for_period(start_date, end_date, platform)
        delivered_count = self.get_orders_count_for_period(start_date, end_date, status="DELIVERED")
        
        cpd = round(ad_spend / delivered_count, 2) if delivered_count > 0 else 0
        
        # Also get total orders for conversion rate
        total_orders = self.get_orders_count_for_period(start_date, end_date)
        delivery_rate = round((delivered_count / total_orders * 100), 1) if total_orders > 0 else 0
        
        return {
            "metric": "CPD",
            "value": cpd,
            "ad_spend": round(ad_spend, 2),
            "delivered_count": delivered_count,
            "total_orders": total_orders,
            "delivery_rate": delivery_rate,
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "status": "good" if cpd < 100 else "warning" if cpd < 150 else "bad"
        }
    
    def calculate_roas(
        self,
        start_date: date,
        end_date: date,
        platform: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate Return on Ad Spend (ROAS)
        Formula: Revenue from Delivered Orders / Ad Spend
        """
        ad_spend = self.get_ad_spend_for_period(start_date, end_date, platform)
        
        # Get revenue from delivered orders in period
        revenue = self.db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            func.date(Order.created_at) >= start_date,
            func.date(Order.created_at) <= end_date,
            Order.status == OrderStatus.DELIVERED
        ).scalar()
        
        revenue = float(revenue or 0)
        roas = round(revenue / ad_spend, 2) if ad_spend > 0 else 0
        
        return {
            "metric": "ROAS",
            "value": roas,
            "revenue": round(revenue, 2),
            "ad_spend": round(ad_spend, 2),
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "status": "good" if roas > 3 else "warning" if roas > 2 else "bad"
        }
    
    def calculate_order_profit(self, order: Order) -> Dict[str, Any]:
        """
        Calculate REAL profit for an order based on status.
        Applies dynamic cost deductions based on order status.
        """
        # Base calculation
        revenue = float(order.total_amount or 0)
        
        # Get COGS from order items
        cogs = sum(
            float(item.cost_price or 0) * item.quantity 
            for item in order.items
        ) if order.items else 0
        
        # Initialize cost breakdown
        costs = {
            "cogs": round(cogs, 2),
            "shipping": 0,
            "packaging": 0,
            "agent_confirmation": 0,
            "agent_delivery": 0,
            "cod_fees": 0,
            "other_fees": 0,
            "return_cost": 0,
        }
        
        gross_profit = revenue - cogs
        total_deductions = 0
        
        # Apply costs based on status
        status = order.status.value if hasattr(order.status, 'value') else str(order.status)
        
        if status in ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"]:
            # Agent confirmation fee applies once confirmed
            costs["agent_confirmation"] = self.settings.agent_confirmation_fee
            total_deductions += costs["agent_confirmation"]
        
        if status in ["SHIPPED", "DELIVERED", "RETURNED"]:
            # Packaging cost applies once shipped
            costs["packaging"] = self.settings.packaging_cost
            total_deductions += costs["packaging"]
        
        if status == "DELIVERED":
            # Full costs for delivered orders
            costs["shipping"] = self.settings.default_shipping_cost
            costs["agent_delivery"] = self.settings.agent_delivery_fee
            costs["other_fees"] = self.settings.other_fixed_fees
            
            # COD collection fee (percentage of collected amount)
            if self.settings.cod_collection_fee_percent > 0:
                costs["cod_fees"] = round(revenue * self.settings.cod_collection_fee_percent / 100, 2)
            
            total_deductions += (
                costs["shipping"] + 
                costs["agent_delivery"] + 
                costs["other_fees"] + 
                costs["cod_fees"]
            )
        
        if status == "RETURNED":
            # Returned = We LOSE money!
            costs["shipping"] = self.settings.default_shipping_cost  # Original shipping
            costs["return_cost"] = self.settings.return_shipping_cost  # Return shipping
            
            total_deductions += costs["shipping"] + costs["return_cost"]
            gross_profit = 0 - cogs  # We lost the product cost
        
        if status == "CANCELLED":
            gross_profit = 0
        
        # Calculate final profit
        net_profit = gross_profit - total_deductions
        margin = round((net_profit / revenue * 100), 2) if revenue > 0 else 0
        
        return {
            "order_id": order.id,
            "order_number": order.order_number,
            "status": status,
            "revenue": round(revenue, 2),
            "gross_profit": round(gross_profit, 2),
            "costs": costs,
            "total_deductions": round(total_deductions, 2),
            "net_profit": round(net_profit, 2),
            "margin_percent": margin,
            "is_profitable": net_profit > 0
        }
    
    def calculate_daily_net_profit(
        self,
        target_date: date
    ) -> Dict[str, Any]:
        """
        Calculate REAL net profit for a specific day.
        """
        # Get all orders delivered on this date
        delivered_orders = self.db.query(Order).filter(
            func.date(Order.updated_at) == target_date,
            Order.status == OrderStatus.DELIVERED
        ).all()
        
        # Calculate totals
        total_revenue = 0
        total_cogs = 0
        total_deductions = 0
        total_net_profit = 0
        
        for order in delivered_orders:
            profit_breakdown = self.calculate_order_profit(order)
            total_revenue += profit_breakdown["revenue"]
            total_cogs += profit_breakdown["costs"]["cogs"]
            total_deductions += profit_breakdown["total_deductions"]
            total_net_profit += profit_breakdown["net_profit"]
        
        # Get ad spend for the day
        ad_spend = self.get_ad_spend_for_period(target_date, target_date)
        
        # Final net profit after ad spend
        real_net_profit = total_net_profit - ad_spend
        
        return {
            "date": target_date.isoformat(),
            "delivered_orders": len(delivered_orders),
            "total_revenue": round(total_revenue, 2),
            "total_cogs": round(total_cogs, 2),
            "total_deductions": round(total_deductions, 2),
            "gross_profit": round(total_net_profit, 2),
            "ad_spend": round(ad_spend, 2),
            "real_net_profit": round(real_net_profit, 2),
            "is_profitable": real_net_profit > 0
        }
    
    def get_unit_economics_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get complete unit economics summary"""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "cpl": self.calculate_cpl(start_date, end_date),
            "cpo": self.calculate_cpo(start_date, end_date),
            "cpd": self.calculate_cpd(start_date, end_date),
            "roas": self.calculate_roas(start_date, end_date),
            "settings": {
                "shipping_cost": self.settings.default_shipping_cost,
                "packaging_cost": self.settings.packaging_cost,
                "agent_confirmation_fee": self.settings.agent_confirmation_fee,
                "agent_delivery_fee": self.settings.agent_delivery_fee
            }
        }
