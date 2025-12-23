from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import Optional
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.services.ad_spend_service import AdSpendService


class FinancialService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_financial_summary(self, start_date: Optional[datetime] = None, 
                              end_date: Optional[datetime] = None):
        """Get comprehensive financial summary"""
        
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Base query for orders in date range
        orders_query = self.db.query(Order).filter(
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
        
        # Total orders and amounts
        total_orders = orders_query.count()
        
        # Revenue from delivered orders
        delivered_orders = orders_query.filter(Order.status == OrderStatus.DELIVERED).all()
        total_revenue = sum(o.total_amount for o in delivered_orders)
        
        # Calculate COGS (Cost of Goods Sold) from order items
        total_cost = 0
        for order in delivered_orders:
            for item in order.items:
                total_cost += item.cost_price * item.quantity
        
        # Gross profit
        gross_profit = total_revenue - total_cost
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Shipping revenue
        shipping_revenue = sum(o.delivery_charges or 0 for o in delivered_orders)
        
        # Pending revenue (confirmed but not delivered)
        pending_orders = orders_query.filter(
            Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, 
                             OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY])
        ).all()
        pending_revenue = sum(o.total_amount for o in pending_orders)
        
        # Returned orders (lost revenue)
        returned_orders = orders_query.filter(Order.status == OrderStatus.RETURNED).all()
        returned_amount = sum(o.total_amount for o in returned_orders)
        
        # Cancelled orders
        cancelled_orders = orders_query.filter(Order.status == OrderStatus.CANCELLED).all()
        cancelled_amount = sum(o.total_amount for o in cancelled_orders)
        
        # Collection status
        collected_orders = orders_query.filter(Order.payment_status == PaymentStatus.PAID).all()
        collected_amount = sum(o.total_amount for o in collected_orders)
        pending_collection = total_revenue - collected_amount
        
        # Average order value
        avg_order_value = total_revenue / len(delivered_orders) if delivered_orders else 0
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "revenue": {
                "total_revenue": round(total_revenue, 2),
                "shipping_revenue": round(shipping_revenue, 2),
                "pending_revenue": round(pending_revenue, 2),
                "returned_amount": round(returned_amount, 2),
                "cancelled_amount": round(cancelled_amount, 2)
            },
            "costs": {
                "total_cost": round(total_cost, 2),
                "cogs": round(total_cost, 2)
            },
            "profit": {
                "gross_profit": round(gross_profit, 2),
                "gross_margin": round(gross_margin, 2),
                "net_profit": round(gross_profit, 2)  # Simplified, no overhead costs
            },
            "orders": {
                "total_orders": total_orders,
                "delivered_orders": len(delivered_orders),
                "pending_orders": len(pending_orders),
                "returned_orders": len(returned_orders),
                "cancelled_orders": len(cancelled_orders),
                "avg_order_value": round(avg_order_value, 2)
            },
            "collection": {
                "collected_amount": round(collected_amount, 2),
                "pending_collection": round(pending_collection, 2),
                "collection_rate": round((collected_amount / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            "ad_spend": self._get_ad_spend_summary(start_date, end_date, gross_profit, total_revenue)
        }
    
    def _get_ad_spend_summary(self, start_date: datetime, end_date: datetime, 
                              gross_profit: float, total_revenue: float) -> dict:
        """Get ad spend summary and calculate net profit."""
        try:
            ad_spend_service = AdSpendService(self.db)
            total_ad_spend = ad_spend_service.get_total_spend(
                start_date.date() if hasattr(start_date, 'date') else start_date,
                end_date.date() if hasattr(end_date, 'date') else end_date
            )
            
            # Calculate NET profit (Gross - Ad Spend)
            net_profit = gross_profit - total_ad_spend
            
            return {
                "total_ad_spend": round(total_ad_spend, 2),
                "net_profit": round(net_profit, 2),
                "net_margin": round((net_profit / total_revenue * 100) if total_revenue > 0 else 0, 2),
                "roas": round((total_revenue / total_ad_spend) if total_ad_spend > 0 else 0, 2)
            }
        except Exception:
            # Return zeros if ad_spend table doesn't exist yet
            return {
                "total_ad_spend": 0,
                "net_profit": round(gross_profit, 2),
                "net_margin": round((gross_profit / total_revenue * 100) if total_revenue > 0 else 0, 2),
                "roas": 0
            }
    
    def get_revenue_by_day(self, start_date: datetime, end_date: datetime):
        """Get daily revenue breakdown with zero-filling for missing dates"""
        
        # 1. Query Database for existing data
        results = self.db.query(
            func.date(Order.created_at).label('date'),
            func.count(Order.id).label('orders'),
            func.sum(case((Order.status == OrderStatus.DELIVERED, Order.total_amount), else_=0)).label('revenue'),
            func.sum(case((Order.status == OrderStatus.RETURNED, Order.total_amount), else_=0)).label('returned')
        ).filter(
            Order.created_at >= start_date,
            Order.created_at <= end_date
        ).group_by(
            func.date(Order.created_at)
        ).all()
        
        # Map DB results by date string
        data_map = {str(r.date): r for r in results}
        
        # 2. Generate full date range
        filled_results = []
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            
            if date_str in data_map:
                r = data_map[date_str]
                filled_results.append({
                    "date": date_str,
                    "orders": r.orders,
                    "revenue": float(r.revenue or 0),
                    "returned": float(r.returned or 0)
                })
            else:
                filled_results.append({
                    "date": date_str,
                    "orders": 0,
                    "revenue": 0.0,
                    "returned": 0.0
                })
            
            current_date += timedelta(days=1)
            
        return filled_results
    
    def get_revenue_by_product(self, start_date: datetime, end_date: datetime, limit: int = 10):
        """Get revenue by product"""
        
        results = self.db.query(
            OrderItem.product_name,
            OrderItem.product_sku,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.total).label('revenue'),
            func.sum(OrderItem.cost_price * OrderItem.quantity).label('cost')
        ).join(Order).filter(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status == OrderStatus.DELIVERED
        ).group_by(
            OrderItem.product_name,
            OrderItem.product_sku
        ).order_by(
            func.sum(OrderItem.total).desc()
        ).limit(limit).all()
        
        return [
            {
                "product_name": r.product_name,
                "product_sku": r.product_sku,
                "quantity_sold": r.quantity_sold,
                "revenue": float(r.revenue or 0),
                "cost": float(r.cost or 0),
                "profit": float((r.revenue or 0) - (r.cost or 0))
            }
            for r in results
        ]
    
    def get_revenue_by_city(self, start_date: datetime, end_date: datetime, limit: int = 10):
        """Get revenue by city"""
        
        results = self.db.query(
            Order.city,
            func.count(Order.id).label('orders'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status == OrderStatus.DELIVERED
        ).group_by(
            Order.city
        ).order_by(
            func.sum(Order.total_amount).desc()
        ).limit(limit).all()
        
        return [
            {
                "city": r.city or "Unknown",
                "orders": r.orders,
                "revenue": float(r.revenue or 0)
            }
            for r in results
        ]
    
    def get_monthly_comparison(self, months: int = 6):
        """Get month-over-month comparison using strict calendar months"""
        
        results = []
        today = datetime.now()
        
        # Start from current month
        current_year = today.year
        current_month = today.month
        
        for i in range(months):
            # Calculate target year/month working backwards
            target_month = current_month - i
            target_year = current_year
            
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            # Start of month
            month_start = datetime(target_year, target_month, 1)
            
            # End of month (start of next month - 1 second, or similar logic)
            # Easier: Start of next month
            if target_month == 12:
                next_month_start = datetime(target_year + 1, 1, 1)
            else:
                next_month_start = datetime(target_year, target_month + 1, 1)
            
            # Query for this strict calendar month
            orders = self.db.query(Order).filter(
                Order.created_at >= month_start,
                Order.created_at < next_month_start,
                Order.status == OrderStatus.DELIVERED
            ).all()
            
            revenue = sum(o.total_amount for o in orders)
            
            results.append({
                "month": month_start.strftime("%b %Y"),
                "start_date": month_start.isoformat(),
                "orders": len(orders),
                "revenue": round(revenue, 2)
            })
        
        return list(reversed(results))
    
    def get_profit_analysis(self, start_date: datetime, end_date: datetime):
        """Get detailed profit analysis"""
        
        delivered_orders = self.db.query(Order).filter(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status == OrderStatus.DELIVERED
        ).all()
        
        total_revenue = 0
        total_cost = 0
        total_shipping = 0
        total_discounts = 0
        
        product_profits = {}
        
        for order in delivered_orders:
            total_revenue += order.total_amount
            total_shipping += order.delivery_charges or 0
            
            for item in order.items:
                item_cost = item.cost_price * item.quantity
                item_revenue = item.total
                item_profit = item_revenue - item_cost
                total_cost += item_cost
                
                if item.product_sku not in product_profits:
                    product_profits[item.product_sku] = {
                        "name": item.product_name,
                        "revenue": 0,
                        "cost": 0,
                        "profit": 0,
                        "units": 0
                    }
                
                product_profits[item.product_sku]["revenue"] += item_revenue
                product_profits[item.product_sku]["cost"] += item_cost
                product_profits[item.product_sku]["profit"] += item_profit
                product_profits[item.product_sku]["units"] += item.quantity
        
        gross_profit = total_revenue - total_cost
        
        # Sort by profit
        top_profitable = sorted(
            product_profits.values(), 
            key=lambda x: x["profit"], 
            reverse=True
        )[:5]
        
        least_profitable = sorted(
            product_profits.values(), 
            key=lambda x: x["profit"]
        )[:5]
        
        return {
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "gross_profit": round(gross_profit, 2),
                "shipping_collected": round(total_shipping, 2),
                "discounts_given": round(total_discounts, 2),
                "gross_margin": round((gross_profit / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            "top_profitable_products": top_profitable,
            "least_profitable_products": least_profitable
        }
