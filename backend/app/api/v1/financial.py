from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_db
from app.services.financial_service import FinancialService
from app.models.user import User

router = APIRouter(prefix="/financial", tags=["Financial"])


# Simple auth helper - matches other routers pattern
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="No user found")
    return user


@router.get("/summary")
async def get_financial_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get comprehensive financial summary"""
    service = FinancialService(db)
    return service.get_financial_summary(start_date, end_date)


@router.get("/revenue-by-day")
async def get_revenue_by_day(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get daily revenue breakdown"""
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    service = FinancialService(db)
    return service.get_revenue_by_day(start_date, end_date)


@router.get("/revenue-by-product")
async def get_revenue_by_product(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get revenue by product"""
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    service = FinancialService(db)
    return service.get_revenue_by_product(start_date, end_date, limit)


@router.get("/revenue-by-city")
async def get_revenue_by_city(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get revenue by city"""
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    service = FinancialService(db)
    return service.get_revenue_by_city(start_date, end_date, limit)


@router.get("/monthly-comparison")
async def get_monthly_comparison(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get month-over-month comparison"""
    service = FinancialService(db)
    return service.get_monthly_comparison(months)


@router.get("/profit-analysis")
async def get_profit_analysis(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed profit analysis"""
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    service = FinancialService(db)
    return service.get_profit_analysis(start_date, end_date)
