from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.models.lead import Lead
from app.models.call_note import CallNote
from app.schemas.analytics import (
    DashboardStatsResponse,
    RevenueOverTimeResponse,
    RevenueDataPoint,
    LeadsBySourceResponse,
    StatusDistributionResponse,
    ConversionFunnelResponse,
)

router = APIRouter()

def get_date_range(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
):
    """Get date range for filtering, defaults to last 30 days"""
    if date_to:
        end_date = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)  # Include full day
    else:
        end_date = datetime.utcnow()
    
    if date_from:
        start_date = datetime.strptime(date_from, "%Y-%m-%d")
    else:
        start_date = end_date - timedelta(days=30)
    
    print(f"📅 Date range: {start_date} to {end_date}")
    return start_date, end_date

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get main dashboard KPI statistics
    """
    print(f"📊 Calculating dashboard stats (from: {date_from}, to: {date_to})")
    
    start_date, end_date = get_date_range(date_from, date_to)
    
    # Filter leads by date range
    leads_query = db.query(Lead).filter(
        Lead.created_at >= start_date,
        Lead.created_at <= end_date
    )
    
    # Total leads
    total_leads = leads_query.count()
    
    # Total revenue (sum of all lead amounts)
    total_revenue = db.query(func.sum(Lead.total_amount)).filter(
        Lead.created_at >= start_date,
        Lead.created_at <= end_date
    ).scalar() or 0.0
    
    # Won deals
    won_leads = leads_query.filter(Lead.status == "WON").count()
    
    # Qualified leads
    qualified_leads = leads_query.filter(Lead.status == "QUALIFIED").count()
    
    # Confirmed leads
    confirmed_leads = leads_query.filter(Lead.status == "CONFIRMED").count()
    
    # Active deals (QUALIFIED + CONFIRMED)
    active_deals = qualified_leads + confirmed_leads
    
    # Average deal size
    if total_leads > 0:
        average_deal_size = total_revenue / total_leads
    else:
        average_deal_size = 0.0
    
    # Win rate (won / total leads)
    if total_leads > 0:
        win_rate = (won_leads / total_leads) * 100
    else:
        win_rate = 0.0
    
    # Conversion rate (qualified or better / total leads)
    converted_leads = leads_query.filter(
        Lead.status.in_(["QUALIFIED", "CONFIRMED", "WON"])
    ).count()
    if total_leads > 0:
        conversion_rate = (converted_leads / total_leads) * 100
    else:
        conversion_rate = 0.0
    
    # Call statistics
    call_notes_query = db.query(CallNote).filter(
        CallNote.created_at >= start_date,
        CallNote.created_at <= end_date
    )
    total_calls = call_notes_query.count()
    answered_calls = call_notes_query.filter(CallNote.outcome == "ANSWERED").count()
    
    if total_calls > 0:
        contact_rate = (answered_calls / total_calls) * 100
    else:
        contact_rate = 0.0
    
    print(f"✅ Dashboard stats calculated:")
    print(f"   Total Revenue: {total_revenue:.2f} MAD")
    print(f"   Total Leads: {total_leads}")
    print(f"   Conversion Rate: {conversion_rate:.1f}%")
    print(f"   Win Rate: {win_rate:.1f}%")
    
    return DashboardStatsResponse(
        total_revenue=float(total_revenue),
        total_leads=total_leads,
        conversion_rate=round(conversion_rate, 1),
        average_deal_size=round(average_deal_size, 2),
        win_rate=round(win_rate, 1),
        active_deals=active_deals,
        total_calls=total_calls,
        contact_rate=round(contact_rate, 1),
    )

@router.get("/revenue-over-time", response_model=RevenueOverTimeResponse)
def get_revenue_over_time(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get revenue data points over time (daily aggregation)
    """
    print(f"📈 Calculating revenue over time")
    
    start_date, end_date = get_date_range(date_from, date_to)
    
    # Group by date and sum revenue
    results = db.query(
        func.date(Lead.created_at).label('date'),
        func.sum(Lead.total_amount).label('revenue'),
        func.count(Lead.id).label('leads')
    ).filter(
        Lead.created_at >= start_date,
        Lead.created_at <= end_date
    ).group_by(
        func.date(Lead.created_at)
    ).order_by(
        func.date(Lead.created_at)
    ).all()
    
    data_points = [
        RevenueDataPoint(
            date=str(row.date),
            revenue=float(row.revenue or 0),
            leads=row.leads
        )
        for row in results
    ]
    
    print(f"✅ Revenue over time: {len(data_points)} data points")
    
    return RevenueOverTimeResponse(data_points=data_points)

@router.get("/leads-by-source", response_model=LeadsBySourceResponse)
def get_leads_by_source(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get lead count grouped by source
    """
    print(f"🥧 Calculating leads by source")
    
    start_date, end_date = get_date_range(date_from, date_to)
    
    results = db.query(
        Lead.source,
        func.count(Lead.id).label('count')
    ).filter(
        Lead.created_at >= start_date,
        Lead.created_at <= end_date
    ).group_by(
        Lead.source
    ).all()
    
    sources = {row.source: row.count for row in results}
    
    print(f"✅ Leads by source: {sources}")
    
    return LeadsBySourceResponse(sources=sources)

@router.get("/status-distribution", response_model=StatusDistributionResponse)
def get_status_distribution(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get lead count grouped by status
    """
    print(f"📊 Calculating status distribution")
    
    start_date, end_date = get_date_range(date_from, date_to)
    
    results = db.query(
        Lead.status,
        func.count(Lead.id).label('count')
    ).filter(
        Lead.created_at >= start_date,
        Lead.created_at <= end_date
    ).group_by(
        Lead.status
    ).all()
    
    statuses = {row.status: row.count for row in results}
    
    print(f"✅ Status distribution: {statuses}")
    
    return StatusDistributionResponse(statuses=statuses)

@router.get("/conversion-funnel", response_model=ConversionFunnelResponse)
def get_conversion_funnel(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get sales funnel data showing conversion at each stage
    """
    print(f"🎯 Calculating conversion funnel")
    
    start_date, end_date = get_date_range(date_from, date_to)
    
    leads_query = db.query(Lead).filter(
        Lead.created_at >= start_date,
        Lead.created_at <= end_date
    )
    
    total_leads = leads_query.count()
    
    # Contacted (has call_attempts > 0 or last_call_date is not null)
    contacted = leads_query.filter(
        (Lead.call_attempts > 0) | (Lead.last_call_date.isnot(None))
    ).count()
    
    # Qualified
    qualified = leads_query.filter(Lead.status == "QUALIFIED").count()
    
    # Confirmed
    confirmed = leads_query.filter(Lead.status == "CONFIRMED").count()
    
    # Won
    won = leads_query.filter(Lead.status == "WON").count()
    
    # Overall conversion rate
    if total_leads > 0:
        conversion_rate = (won / total_leads) * 100
    else:
        conversion_rate = 0.0
    
    print(f"✅ Funnel: {total_leads} → {contacted} → {qualified} → {confirmed} → {won}")
    
    return ConversionFunnelResponse(
        total_leads=total_leads,
        contacted=contacted,
        qualified=qualified,
        confirmed=confirmed,
        won=won,
        conversion_rate=round(conversion_rate, 1),
    )


@router.get("/leads-by-day")
def get_leads_by_day(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get leads grouped by day for charts"""
    from datetime import timedelta
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00').replace('+00:00', ''))
        except:
            start = datetime.utcnow() - timedelta(days=30)
    else:
        start = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00').replace('+00:00', ''))
        except:
            end = datetime.utcnow()
    else:
        end = datetime.utcnow()
    
    # Get leads by day
    leads = db.query(Lead).filter(
        Lead.created_at >= start,
        Lead.created_at <= end
    ).all()
    
    # Group by day
    daily_data = {}
    for lead in leads:
        day = lead.created_at.strftime("%Y-%m-%d")
        if day not in daily_data:
            daily_data[day] = {"total": 0, "confirmed": 0, "delivered": 0}
        daily_data[day]["total"] += 1
        status = getattr(lead, 'status', None)
        status_str = str(status.value if hasattr(status, 'value') else status or '').upper()
        if status_str == "CONFIRMED":
            daily_data[day]["confirmed"] += 1
    
    # Format for chart
    result = []
    current = start
    while current <= end:
        day_str = current.strftime("%Y-%m-%d")
        data = daily_data.get(day_str, {"total": 0, "confirmed": 0, "delivered": 0})
        result.append({
            "date": day_str,
            "total": data["total"],
            "confirmed": data["confirmed"],
            "delivered": data.get("delivered", 0),
        })
        current += timedelta(days=1)
    
    return {"data": result}


@router.get("/agent-performance")
def get_agent_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get agent performance metrics"""
    from app.models.user import User
    from datetime import timedelta
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00').replace('+00:00', ''))
        except:
            start = datetime.utcnow() - timedelta(days=30)
    else:
        start = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00').replace('+00:00', ''))
        except:
            end = datetime.utcnow()
    else:
        end = datetime.utcnow()
    
    # Get all users (agents)
    users = db.query(User).filter(User.is_active == True).all()
    
    result = []
    for user in users:
        # Count calls
        total_calls = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.created_at >= start,
            CallNote.created_at <= end
        ).scalar() or 0
        
        confirmed_calls = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'CONFIRMED',
            CallNote.created_at >= start,
            CallNote.created_at <= end
        ).scalar() or 0
        
        result.append({
            "user_id": user.id,
            "name": user.full_name or user.email,
            "total_calls": total_calls,
            "confirmed_calls": confirmed_calls,
            "conversion_rate": round((confirmed_calls / total_calls * 100), 1) if total_calls > 0 else 0,
        })
    
    # Sort by total calls
    result.sort(key=lambda x: x["total_calls"], reverse=True)
    
    return {"agents": result}


@router.get("/call-statistics")
def get_call_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get call center statistics"""
    from datetime import timedelta
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00').replace('+00:00', ''))
        except:
            start = datetime.utcnow() - timedelta(days=30)
    else:
        start = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00').replace('+00:00', ''))
        except:
            end = datetime.utcnow()
    else:
        end = datetime.utcnow()
    
    # Total calls
    total = db.query(func.count(CallNote.id)).filter(
        CallNote.created_at >= start,
        CallNote.created_at <= end
    ).scalar() or 0
    
    # By outcome
    outcomes = {}
    for outcome in ['CONFIRMED', 'INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'NO_ANSWER', 'WRONG_NUMBER']:
        count = db.query(func.count(CallNote.id)).filter(
            CallNote.outcome == outcome,
            CallNote.created_at >= start,
            CallNote.created_at <= end
        ).scalar() or 0
        outcomes[outcome.lower()] = count
    
    # Average duration
    avg_duration = db.query(func.avg(CallNote.duration)).filter(
        CallNote.created_at >= start,
        CallNote.created_at <= end
    ).scalar() or 0
    
    return {
        "total_calls": total,
        "outcomes": outcomes,
        "avg_duration_seconds": round(float(avg_duration), 0) if avg_duration else 0,
        "answered": total - outcomes.get("no_answer", 0),
        "answer_rate": round(((total - outcomes.get("no_answer", 0)) / total * 100), 1) if total > 0 else 0,
    }

@router.get("/agent-leaderboard")
def get_agent_leaderboard(
    period: str = Query("today", regex="^(today|week|month|all)$"),
    db: Session = Depends(get_db),
):
    """Get agent leaderboard with rankings"""
    from app.models.user import User
    
    # Calculate date range
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = datetime(2020, 1, 1)  # All time
    
    # Get all active users
    users = db.query(User).filter(User.is_active == True).all()
    
    agents = []
    for user in users:
        # Total calls in period
        total_calls = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        # Calls by outcome
        confirmed = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'CONFIRMED',
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        interested = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'INTERESTED',
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        callbacks = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'CALLBACK',
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        no_answer = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'NO_ANSWER',
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        not_interested = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'NOT_INTERESTED',
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        # Average call duration
        avg_duration = db.query(func.avg(CallNote.duration)).filter(
            CallNote.user_id == user.id,
            CallNote.created_at >= start_date,
            CallNote.duration > 0
        ).scalar() or 0
        
        # Total talk time
        total_duration = db.query(func.sum(CallNote.duration)).filter(
            CallNote.user_id == user.id,
            CallNote.created_at >= start_date
        ).scalar() or 0
        
        # Calculate rates
        answered_calls = total_calls - no_answer
        confirmation_rate = round((confirmed / answered_calls * 100), 1) if answered_calls > 0 else 0
        contact_rate = round((answered_calls / total_calls * 100), 1) if total_calls > 0 else 0
        
        # Get previous period for trend calculation
        if period == "today":
            prev_start = start_date - timedelta(days=1)
            prev_end = start_date
        elif period == "week":
            prev_start = start_date - timedelta(days=7)
            prev_end = start_date
        else:
            prev_start = start_date - timedelta(days=30)
            prev_end = start_date
        
        prev_confirmed = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user.id,
            CallNote.outcome == 'CONFIRMED',
            CallNote.created_at >= prev_start,
            CallNote.created_at < prev_end
        ).scalar() or 0
        
        trend = confirmed - prev_confirmed
        
        agents.append({
            "user_id": user.id,
            "name": user.full_name or user.email.split('@')[0] if user.email else f"User {user.id}",
            "email": user.email or "",
            "role": user.role or "agent",
            "total_calls": total_calls,
            "confirmed": confirmed,
            "interested": interested,
            "callbacks": callbacks,
            "no_answer": no_answer,
            "not_interested": not_interested,
            "answered_calls": answered_calls,
            "confirmation_rate": confirmation_rate,
            "contact_rate": contact_rate,
            "avg_duration": round(float(avg_duration), 0) if avg_duration else 0,
            "total_talk_time": int(total_duration) if total_duration else 0,
            "trend": trend,
        })
    
    # Sort by confirmed calls (main ranking metric)
    agents.sort(key=lambda x: (x["confirmed"], x["confirmation_rate"]), reverse=True)
    
    # Add rankings
    for i, agent in enumerate(agents):
        agent["rank"] = i + 1
    
    # Calculate team totals
    team_total_calls = sum(a["total_calls"] for a in agents)
    team_confirmed = sum(a["confirmed"] for a in agents)
    team_answered = sum(a["answered_calls"] for a in agents)
    
    return {
        "period": period,
        "agents": agents,
        "team_stats": {
            "total_agents": len([a for a in agents if a["total_calls"] > 0]),
            "total_calls": team_total_calls,
            "total_confirmed": team_confirmed,
            "total_answered": team_answered,
            "team_confirmation_rate": round((team_confirmed / team_answered * 100), 1) if team_answered > 0 else 0,
            "team_contact_rate": round((team_answered / team_total_calls * 100), 1) if team_total_calls > 0 else 0,
        }
    }


@router.get("/agent/{user_id}/details")
def get_agent_details(
    user_id: int,
    period: str = Query("week", regex="^(today|week|month|all)$"),
    db: Session = Depends(get_db),
):
    """Get detailed stats for a specific agent"""
    from app.models.user import User
    from sqlalchemy import desc
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    
    # Calculate date range
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = datetime(2020, 1, 1)
    
    # Daily breakdown for charts
    daily_stats = []
    current = start_date
    while current <= now:
        day_start = current.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_calls = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user_id,
            CallNote.created_at >= day_start,
            CallNote.created_at < day_end
        ).scalar() or 0
        
        day_confirmed = db.query(func.count(CallNote.id)).filter(
            CallNote.user_id == user_id,
            CallNote.outcome == 'CONFIRMED',
            CallNote.created_at >= day_start,
            CallNote.created_at < day_end
        ).scalar() or 0
        
        daily_stats.append({
            "date": current.strftime("%Y-%m-%d"),
            "calls": day_calls,
            "confirmed": day_confirmed,
        })
        
        current += timedelta(days=1)
    
    # Recent calls
    recent_calls = db.query(CallNote).filter(
        CallNote.user_id == user_id,
        CallNote.created_at >= start_date
    ).order_by(desc(CallNote.created_at)).limit(20).all()
    
    recent_calls_data = []
    for call in recent_calls:
        lead = db.query(Lead).filter(Lead.id == call.lead_id).first()
        recent_calls_data.append({
            "id": call.id,
            "lead_name": lead.name if lead else "Unknown",
            "lead_phone": lead.phone if lead else "",
            "outcome": call.outcome,
            "duration": call.duration,
            "notes": call.notes,
            "created_at": call.created_at.isoformat() if call.created_at else None,
        })
    
    return {
        "agent": {
            "id": user.id,
            "name": user.full_name or user.email,
            "email": user.email,
            "role": user.role,
        },
        "daily_stats": daily_stats,
        "recent_calls": recent_calls_data,
    }


@router.get("/team-goals")
def get_team_goals(
    db: Session = Depends(get_db),
):
    """Get team goals and progress"""
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's stats
    today_calls = db.query(func.count(CallNote.id)).filter(
        CallNote.created_at >= today
    ).scalar() or 0
    
    today_confirmed = db.query(func.count(CallNote.id)).filter(
        CallNote.outcome == 'CONFIRMED',
        CallNote.created_at >= today
    ).scalar() or 0
    
    # Weekly stats
    week_start = today - timedelta(days=today.weekday())
    week_calls = db.query(func.count(CallNote.id)).filter(
        CallNote.created_at >= week_start
    ).scalar() or 0
    
    week_confirmed = db.query(func.count(CallNote.id)).filter(
        CallNote.outcome == 'CONFIRMED',
        CallNote.created_at >= week_start
    ).scalar() or 0
    
    # Default goals
    daily_call_goal = 200
    daily_confirmation_goal = 50
    weekly_call_goal = 1000
    weekly_confirmation_goal = 250
    
    return {
        "daily": {
            "call_goal": daily_call_goal,
            "call_actual": today_calls,
            "call_progress": round((today_calls / daily_call_goal * 100), 1) if daily_call_goal > 0 else 0,
            "confirmation_goal": daily_confirmation_goal,
            "confirmation_actual": today_confirmed,
            "confirmation_progress": round((today_confirmed / daily_confirmation_goal * 100), 1) if daily_confirmation_goal > 0 else 0,
        },
        "weekly": {
            "call_goal": weekly_call_goal,
            "call_actual": week_calls,
            "call_progress": round((week_calls / weekly_call_goal * 100), 1) if weekly_call_goal > 0 else 0,
            "confirmation_goal": weekly_confirmation_goal,
            "confirmation_actual": week_confirmed,
            "confirmation_progress": round((week_confirmed / weekly_confirmation_goal * 100), 1) if weekly_confirmation_goal > 0 else 0,
        }
    }
