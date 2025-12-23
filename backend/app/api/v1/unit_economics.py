"""
Unit Economics API Router

Endpoints for unit economics metrics (CPL, CPO, CPD, ROAS).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.services.unit_economics_service import UnitEconomicsService

router = APIRouter(prefix="/unit-economics", tags=["Unit Economics"])


# Simple auth helper
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user


@router.get("/summary")
async def get_unit_economics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete unit economics summary with CPL, CPO, CPD, ROAS"""
    service = UnitEconomicsService(db)
    return service.get_unit_economics_summary(start_date, end_date)


@router.get("/cpl")
async def get_cost_per_lead(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Cost Per Lead metric"""
    service = UnitEconomicsService(db)
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    return service.calculate_cpl(start_date, end_date, platform)


@router.get("/cpo")
async def get_cost_per_order(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Cost Per Order metric"""
    service = UnitEconomicsService(db)
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    return service.calculate_cpo(start_date, end_date, platform)


@router.get("/cpd")
async def get_cost_per_delivered(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Cost Per Delivered metric (most critical)"""
    service = UnitEconomicsService(db)
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    return service.calculate_cpd(start_date, end_date, platform)


@router.get("/roas")
async def get_return_on_ad_spend(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Return on Ad Spend metric"""
    service = UnitEconomicsService(db)
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    return service.calculate_roas(start_date, end_date, platform)


@router.get("/daily-profit/{target_date}")
async def get_daily_profit(
    target_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get real net profit for a specific day"""
    service = UnitEconomicsService(db)
    return service.calculate_daily_net_profit(target_date)


@router.get("/order/{order_id}/profit")
async def get_order_profit(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed profit breakdown for a specific order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    service = UnitEconomicsService(db)
    return service.calculate_order_profit(order)
