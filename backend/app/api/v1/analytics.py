# Analytics API endpoints for Sales tracking
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User

router = APIRouter()


@router.get("/sales-by-type")
def get_sales_by_type(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get revenue breakdown by sale type (normal, cross-sell, upsell)"""
    
    # Default to last 30 days
    if not end_date:
        end_dt = datetime.now()
    else:
        end_dt = datetime.fromisoformat(end_date)
    
    if not start_date:
        start_dt = end_dt - timedelta(days=30)
    else:
        start_dt = datetime.fromisoformat(start_date)
    
    # Query order items grouped by sale_type
    results = db.query(
        OrderItem.sale_type,
        func.count(OrderItem.id).label('count'),
        func.sum(OrderItem.total).label('revenue'),
        func.sum(OrderItem.quantity).label('quantity')
    ).join(Order).filter(
        Order.created_at >= start_dt,
        Order.created_at <= end_dt,
        Order.status != 'CANCELLED'
    ).group_by(OrderItem.sale_type).all()
    
    # Calculate totals
    total_revenue = sum(r.revenue or 0 for r in results)
    total_count = sum(r.count or 0 for r in results)
    
    # Format response
    breakdown = {}
    for r in results:
        sale_type = r.sale_type or 'normal'
        breakdown[sale_type] = {
            'count': r.count or 0,
            'revenue': round(r.revenue or 0, 2),
            'quantity': r.quantity or 0,
            'percentage': round((r.revenue or 0) / total_revenue * 100, 1) if total_revenue > 0 else 0
        }
    
    # Ensure all types exist
    for sale_type in ['normal', 'cross-sell', 'upsell']:
        if sale_type not in breakdown:
            breakdown[sale_type] = {'count': 0, 'revenue': 0, 'quantity': 0, 'percentage': 0}
    
    return {
        'period': {
            'start': start_dt.isoformat(),
            'end': end_dt.isoformat()
        },
        'total_revenue': round(total_revenue, 2),
        'total_items': total_count,
        'breakdown': breakdown
    }


@router.get("/sales-trend")
def get_sales_trend(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db)
):
    """Get daily sales trend by sale type"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Group by date
    date_trunc = func.date(Order.created_at)
    
    results = db.query(
        date_trunc.label('date'),
        OrderItem.sale_type,
        func.sum(OrderItem.total).label('revenue'),
        func.count(OrderItem.id).label('count')
    ).join(Order).filter(
        Order.created_at >= start_date,
        Order.created_at <= end_date,
        Order.status != 'CANCELLED'
    ).group_by(date_trunc, OrderItem.sale_type).order_by(date_trunc).all()
    
    # Organize by date
    trend = {}
    for r in results:
        date_str = str(r.date) if r.date else None
        if not date_str:
            continue
        if date_str not in trend:
            trend[date_str] = {'date': date_str, 'normal': 0, 'cross-sell': 0, 'upsell': 0, 'total': 0}
        
        sale_type = r.sale_type or 'normal'
        trend[date_str][sale_type] = round(r.revenue or 0, 2)
        trend[date_str]['total'] += round(r.revenue or 0, 2)
    
    return {
        'period': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
        'data': list(trend.values())
    }


@router.get("/agent-performance")
def get_agent_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get agent performance for cross-sell and upsell"""
    
    # Default to last 30 days
    if not end_date:
        end_dt = datetime.now()
    else:
        end_dt = datetime.fromisoformat(end_date)
    
    if not start_date:
        start_dt = end_dt - timedelta(days=30)
    else:
        start_dt = datetime.fromisoformat(start_date)
    
    # Get orders per agent with sale type breakdown
    try:
        results = db.query(
            Order.confirmed_by.label('agent_name'),
            func.count(func.distinct(Order.id)).label('total_orders'),
            func.sum(case((OrderItem.sale_type == 'cross-sell', OrderItem.total), else_=0)).label('cross_sell_revenue'),
            func.sum(case((OrderItem.sale_type == 'upsell', OrderItem.total), else_=0)).label('upsell_revenue'),
            func.sum(OrderItem.total).label('total_revenue'),
            func.count(case((OrderItem.sale_type == 'cross-sell', 1))).label('cross_sell_count'),
            func.count(case((OrderItem.sale_type == 'upsell', 1))).label('upsell_count'),
        ).join(OrderItem, Order.id == OrderItem.order_id
        ).filter(
            Order.created_at >= start_dt,
            Order.created_at <= end_dt,
            Order.status != 'CANCELLED',
            Order.confirmed_by.isnot(None)
        ).group_by(Order.confirmed_by
        ).order_by(func.sum(case((OrderItem.sale_type == 'cross-sell', OrderItem.total), else_=0)).desc()
        ).limit(limit).all()
    except Exception as e:
        print(f"Agent query error: {e}")
        results = []
    
    agents = []
    for idx, r in enumerate(results):
        cross_sell_rate = round(r.cross_sell_count / r.total_orders * 100, 1) if r.total_orders > 0 else 0
        agents.append({
            'agent_id': idx + 1,
            'agent_name': r.agent_name or f'Agent #{idx + 1}',
            'total_orders': r.total_orders or 0,
            'total_revenue': round(r.total_revenue or 0, 2),
            'cross_sell_revenue': round(r.cross_sell_revenue or 0, 2),
            'upsell_revenue': round(r.upsell_revenue or 0, 2),
            'cross_sell_count': r.cross_sell_count or 0,
            'upsell_count': r.upsell_count or 0,
            'cross_sell_rate': cross_sell_rate
        })
    
    return {
        'period': {'start': start_dt.isoformat(), 'end': end_dt.isoformat()},
        'agents': agents
    }


@router.get("/product-pairs")
def get_product_pairs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get most common product pairs (cross-sell combinations)"""
    
    # Get all orders with cross-sell items
    cross_sell_orders = db.query(OrderItem.order_id).filter(
        OrderItem.sale_type == 'cross-sell'
    ).distinct().all()
    
    order_ids = [o.order_id for o in cross_sell_orders]
    
    if not order_ids:
        return {'pairs': []}
    
    # Get items from those orders
    results = db.query(
        OrderItem.product_name,
        OrderItem.sale_type,
        OrderItem.order_id
    ).filter(
        OrderItem.order_id.in_(order_ids)
    ).all()
    
    # Build pairs
    orders_items = {}
    for r in results:
        if r.order_id not in orders_items:
            orders_items[r.order_id] = {'main': [], 'cross_sell': []}
        if r.sale_type == 'cross-sell':
            orders_items[r.order_id]['cross_sell'].append(r.product_name)
        else:
            orders_items[r.order_id]['main'].append(r.product_name)
    
    # Count pairs
    pair_counts = {}
    for order_id, items in orders_items.items():
        for main in items['main']:
            for cross in items['cross_sell']:
                pair_key = f"{main}|{cross}"
                if pair_key not in pair_counts:
                    pair_counts[pair_key] = {'main_product': main, 'cross_sell_product': cross, 'count': 0}
                pair_counts[pair_key]['count'] += 1
    
    # Sort and limit
    pairs = sorted(pair_counts.values(), key=lambda x: x['count'], reverse=True)[:limit]
    
    return {'pairs': pairs}
