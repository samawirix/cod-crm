from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_db
from app.services.financial_service import FinancialService
from app.models.user import User
from app.models import Transaction

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


@router.get("/dashboard")
async def get_financial_dashboard(
    days: int = Query(30, description="Number of days to include"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get financial dashboard data from transactions table"""
    
    # Date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Total Revenue
    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "revenue",
        Transaction.transaction_date >= start_date
    ).scalar() or 0
    
    # Total Expenses
    total_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense",
        Transaction.transaction_date >= start_date
    ).scalar() or 0
    
    # Net Profit
    net_profit = total_revenue - total_expenses
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Revenue by category
    revenue_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.type == "revenue",
        Transaction.transaction_date >= start_date
    ).group_by(Transaction.category).all()
    
    # Expenses by category
    expenses_by_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.type == "expense",
        Transaction.transaction_date >= start_date
    ).group_by(Transaction.category).all()
    
    # Transaction counts
    revenue_count = db.query(Transaction).filter(
        Transaction.type == "revenue",
        Transaction.transaction_date >= start_date
    ).count()
    
    expense_count = db.query(Transaction).filter(
        Transaction.type == "expense",
        Transaction.transaction_date >= start_date
    ).count()
    
    return {
        "summary": {
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "net_profit": float(net_profit),
            "profit_margin": round(float(profit_margin), 2),
            "revenue_transactions": revenue_count,
            "expense_transactions": expense_count,
            "total_transactions": revenue_count + expense_count
        },
        "revenue_by_category": [
            {"category": cat, "amount": float(amt)} 
            for cat, amt in revenue_by_category
        ],
        "expenses_by_category": [
            {"category": cat, "amount": float(amt)} 
            for cat, amt in expenses_by_category
        ],
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        }
    }

