from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.call_note import CallNote
from app.models.lead import Lead
from app.models.user import User
from app.schemas.call_note import (
    CallNoteCreate, 
    CallNoteResponse, 
    CallHistoryResponse,
    TodayStatsResponse
)

router = APIRouter()

def get_current_user(db: Session = Depends(get_db)):
    """Get current user - returns first user for now"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user

@router.post("/", response_model=CallNoteResponse, status_code=201)
def create_call_note(
    call_data: CallNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new call note and update lead information
    """
    print(f"📞 Creating call note for lead {call_data.lead_id}")
    print(f"   Outcome: {call_data.call_outcome}")
    print(f"   Interest Level: {call_data.interest_level}")
    print(f"   Next Status: {call_data.next_status}")
    
    # Get the lead
    lead = db.query(Lead).filter(Lead.id == call_data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create call note
    call_note = CallNote(
        lead_id=call_data.lead_id,
        user_id=current_user.id,
        call_outcome=call_data.call_outcome.upper(),
        interest_level=call_data.interest_level.upper() if call_data.interest_level else None,
        next_status=call_data.next_status.upper() if call_data.next_status else None,
        notes=call_data.notes,
        call_duration=call_data.call_duration,
        callback_scheduled=call_data.callback_scheduled
    )
    
    # Update lead fields
    lead.last_call_date = datetime.utcnow()
    lead.call_attempts = (lead.call_attempts or 0) + 1
    
    # Update lead status if next_status provided
    if call_data.next_status:
        lead.status = call_data.next_status.upper()
        print(f"   Updated lead status to: {lead.status}")
    
    try:
        db.add(call_note)
        db.commit()
        db.refresh(call_note)
        
        print(f"✅ Call note created - ID: {call_note.id}")
        print(f"   Lead attempts now: {lead.call_attempts}")
        
        # Prepare enriched response
        response = CallNoteResponse(
            id=call_note.id,
            lead_id=call_note.lead_id,
            user_id=call_note.user_id,
            call_outcome=call_note.call_outcome,
            interest_level=call_note.interest_level,
            next_status=call_note.next_status,
            notes=call_note.notes,
            call_duration=call_note.call_duration,
            callback_scheduled=call_note.callback_scheduled,
            created_at=call_note.created_at,
            lead_name=f"{lead.first_name} {lead.last_name or ''}".strip(),
            agent_name=current_user.full_name,
            lead_phone=lead.phone
        )
        
        return response
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating call note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=CallHistoryResponse)
def get_call_history(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(25, ge=1, le=100, description="Number of records to return"),
    lead_id: Optional[int] = Query(None, description="Filter by lead ID"),
    outcome: Optional[str] = Query(None, description="Filter by call outcome"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get call history with optional filters
    """
    print(f"📋 Fetching call history (skip={skip}, limit={limit})")
    
    query = db.query(CallNote)
    
    # Apply filters
    if lead_id:
        query = query.filter(CallNote.lead_id == lead_id)
        print(f"   Filtering by lead_id: {lead_id}")
    
    if outcome:
        query = query.filter(CallNote.call_outcome == outcome.upper())
        print(f"   Filtering by outcome: {outcome}")
    
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(CallNote.created_at >= date_from_obj)
            print(f"   Filtering from date: {date_from}")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(CallNote.created_at < date_to_obj)
            print(f"   Filtering to date: {date_to}")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    call_notes = query.order_by(CallNote.created_at.desc()).offset(skip).limit(limit).all()
    
    print(f"✅ Found {total} call notes, returning {len(call_notes)}")
    
    # Enrich with lead and agent names
    enriched_notes = []
    for note in call_notes:
        lead = db.query(Lead).filter(Lead.id == note.lead_id).first()
        agent = db.query(User).filter(User.id == note.user_id).first()
        
        enriched_notes.append(CallNoteResponse(
            id=note.id,
            lead_id=note.lead_id,
            user_id=note.user_id,
            call_outcome=note.call_outcome,
            interest_level=note.interest_level,
            next_status=note.next_status,
            notes=note.notes,
            call_duration=note.call_duration,
            callback_scheduled=note.callback_scheduled,
            created_at=note.created_at,
            lead_name=f"{lead.first_name} {lead.last_name or ''}".strip() if lead else "Unknown",
            agent_name=agent.full_name if agent else "Unknown",
            lead_phone=lead.phone if lead else None
        ))
    
    return CallHistoryResponse(total=total, call_notes=enriched_notes)

@router.get("/stats/today", response_model=TodayStatsResponse)
def get_today_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get today's call center statistics
    """
    print("📊 Calculating today's stats...")
    
    # Get start of today (midnight)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total calls today
    total_calls = db.query(CallNote).filter(
        CallNote.created_at >= today_start
    ).count()
    
    # Answered calls (successful contacts)
    answered_calls = db.query(CallNote).filter(
        CallNote.created_at >= today_start,
        CallNote.call_outcome == "ANSWERED"
    ).count()
    
    # Callbacks scheduled
    callbacks = db.query(CallNote).filter(
        CallNote.created_at >= today_start,
        CallNote.callback_scheduled.isnot(None)
    ).count()
    
    # Contact rate (percentage of answered calls)
    contact_rate = (answered_calls / total_calls * 100) if total_calls > 0 else 0.0
    
    # Qualified leads today
    qualified = db.query(CallNote).filter(
        CallNote.created_at >= today_start,
        CallNote.next_status == "QUALIFIED"
    ).count()
    
    # Conversion rate (percentage of qualified from answered)
    conversion_rate = (qualified / answered_calls * 100) if answered_calls > 0 else 0.0
    
    stats = TodayStatsResponse(
        total_calls=total_calls,
        answered_calls=answered_calls,
        callbacks_scheduled=callbacks,
        contact_rate=round(contact_rate, 1),
        qualified_leads=qualified,
        conversion_rate=round(conversion_rate, 1)
    )
    
    print(f"✅ Stats calculated:")
    print(f"   Total calls: {total_calls}")
    print(f"   Answered: {answered_calls}")
    print(f"   Contact rate: {contact_rate:.1f}%")
    print(f"   Qualified: {qualified}")
    print(f"   Conversion rate: {conversion_rate:.1f}%")
    
    return stats

