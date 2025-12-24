from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db

router = APIRouter()

# ═══════════════════════════════════════════════════════════
# AUTH HELPER
# ═══════════════════════════════════════════════════════════

def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    from app.models.user import User
    user = db.query(User).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="No user found")
    return user

# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float

class CallCreate(BaseModel):
    lead_id: int
    outcome: str
    duration: int = 0
    notes: Optional[str] = None
    order_items: Optional[List[OrderItemCreate]] = None
    city: Optional[str] = None
    address: Optional[str] = None
    callback_date: Optional[datetime] = None

class CallResponse(BaseModel):
    id: int
    lead_id: int
    outcome: str
    duration: int
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ═══════════════════════════════════════════════════════════
# STATUS MAPPING
# ═══════════════════════════════════════════════════════════

OUTCOME_TO_LEAD_STATUS = {
    'CONFIRMED': 'CONFIRMED',
    'INTERESTED': 'QUALIFIED',
    'NOT_INTERESTED': 'LOST',
    'WRONG_NUMBER': 'LOST',
    'CALLBACK': 'CALLBACK',
    'NO_ANSWER': 'NO_ANSWER',
}

# ═══════════════════════════════════════════════════════════
# CREATE CALL + ORDER
# ═══════════════════════════════════════════════════════════

@router.post("/", response_model=dict)
@router.post("/log", response_model=dict)  # Alias for frontend compatibility
async def create_call(
    call_data: CallCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Log a call and optionally create an order if confirmed.
    - Updates lead status based on outcome
    - Creates order with items if CONFIRMED
    - Deducts stock from inventory
    - Schedules callback if CALLBACK
    """
    from app.models.lead import Lead
    from app.models.order import Order
    from app.models.order_item import OrderItem
    from app.models.product import Product
    
    # Get the lead
    lead = db.query(Lead).filter(Lead.id == call_data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create CallNote record
    try:
        from app.models.call_note import CallNote
        call_note = CallNote(
            lead_id=call_data.lead_id,
            user_id=current_user.id,
            outcome=call_data.outcome,
            duration=call_data.duration,
            notes=call_data.notes,
            callback_scheduled=call_data.callback_date,
            created_at=datetime.utcnow()
        )
        db.add(call_note)
    except Exception as e:
        print(f"CallNote creation failed: {e}")
        # Continue even if CallNote model doesn't exist
    
    # Update lead status
    new_status = OUTCOME_TO_LEAD_STATUS.get(call_data.outcome, lead.status)
    lead.status = new_status
    
    # Update lead city/address if provided
    if call_data.city:
        lead.city = call_data.city
    if call_data.address:
        lead.address = call_data.address
    
    # If callback, set callback date
    if call_data.outcome == 'CALLBACK' and call_data.callback_date:
        if hasattr(lead, 'callback_date'):
            lead.callback_date = call_data.callback_date
    
    # Increment call count
    if hasattr(lead, 'call_count'):
        lead.call_count = (lead.call_count or 0) + 1
    
    order_id = None
    order_number = None
    
    # ═══════════════════════════════════════════════════════
    # CREATE ORDER IF CONFIRMED
    # ═══════════════════════════════════════════════════════
    if call_data.outcome == 'CONFIRMED' and call_data.order_items and len(call_data.order_items) > 0:
        try:
            # Calculate totals
            subtotal = sum(item.quantity * item.unit_price for item in call_data.order_items)
            
            # Calculate shipping based on city
            shipping_rates = {
                'Casablanca': 0, 'Rabat': 0, 'Kenitra': 10,
                'Marrakech': 15, 'Fès': 20, 'Meknès': 20,
                'Tanger': 25, 'Tétouan': 25, 'Agadir': 30,
                'Oujda': 35, 'Other': 40
            }
            shipping_cost = shipping_rates.get(call_data.city, 40)
            total = subtotal + shipping_cost
            
            # Generate order number
            last_order = db.query(Order).order_by(desc(Order.id)).first()
            next_num = (last_order.id + 1) if last_order else 1
            order_number = f"ORD-{next_num:05d}"
            
            # Create order - get customer name from first_name + last_name
            customer_name = f"{getattr(lead, 'first_name', '')} {getattr(lead, 'last_name', '')}".strip() or f"Lead {lead.id}"
            
            new_order = Order(
                order_number=order_number,
                lead_id=lead.id,
                customer_name=customer_name,
                customer_phone=lead.phone,
                city=call_data.city or lead.city or "",
                delivery_address=call_data.address or lead.address or "",
                status='CONFIRMED',
                payment_status='PENDING',
                subtotal=subtotal,
                delivery_charges=shipping_cost,
                total_amount=total,
                is_confirmed=True,
                confirmed_by=current_user.id,
                created_at=datetime.utcnow(),
                confirmed_at=datetime.utcnow()
            )
            db.add(new_order)
            db.flush()  # Get the order ID
            order_id = new_order.id
            
            # Create order items and deduct stock
            for item in call_data.order_items:
                order_item = OrderItem(
                    order_id=new_order.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.quantity * item.unit_price
                )
                db.add(order_item)
                
                # Deduct stock
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    if hasattr(product, 'stock'):
                        product.stock = max(0, (product.stock or 0) - item.quantity)
                    elif hasattr(product, 'stock_quantity'):
                        product.stock_quantity = max(0, (product.stock_quantity or 0) - item.quantity)
            
            # Link order to lead
            if hasattr(lead, 'order_id'):
                lead.order_id = new_order.id
                
        except Exception as e:
            print(f"Order creation error: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")
    
    # Commit all changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "success": True,
        "message": f"Call logged with outcome: {call_data.outcome}",
        "lead_status": new_status,
        "order_created": order_id is not None,
        "order_id": order_id,
        "order_number": order_number
    }

# ═══════════════════════════════════════════════════════════
# GET CALL HISTORY FOR A LEAD
# ═══════════════════════════════════════════════════════════

@router.get("/history/{lead_id}")
async def get_call_history(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all calls for a specific lead"""
    try:
        from app.models.call_note import CallNote
        from app.models.user import User
        
        calls = db.query(CallNote).filter(
            CallNote.lead_id == lead_id
        ).order_by(desc(CallNote.created_at)).all()
        
        result = []
        for call in calls:
            agent = db.query(User).filter(User.id == call.user_id).first()
            result.append({
                "id": call.id,
                "outcome": call.outcome,
                "duration": call.duration,
                "notes": call.notes,
                "agent_name": agent.full_name if agent else "Unknown",
                "created_at": call.created_at.isoformat() if call.created_at else None,
                "callback_scheduled": call.callback_scheduled.isoformat() if hasattr(call, 'callback_scheduled') and call.callback_scheduled else None
            })
        
        return {"calls": result, "total": len(result)}
    except Exception as e:
        return {"calls": [], "total": 0, "error": str(e)}

# ═══════════════════════════════════════════════════════════
# GET ALL RECENT CALLS (FOR HISTORY TAB)
# ═══════════════════════════════════════════════════════════

@router.get("/history")
async def get_all_call_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get recent call history across all leads"""
    try:
        from sqlalchemy import text
        from app.models.lead import Lead
        from app.models.user import User
        
        # Use raw SQL to get call notes (more reliable)
        query = text("""
            SELECT cn.id, cn.lead_id, cn.user_id, cn.outcome, cn.duration, cn.notes, cn.created_at
            FROM call_notes cn
            ORDER BY cn.created_at DESC
            LIMIT :limit
        """)
        rows = db.execute(query, {"limit": limit}).fetchall()
        
        result = []
        for row in rows:
            call_id, lead_id, user_id, outcome, duration, notes, created_at = row
            
            # Get lead info
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            lead_name = "Unknown"
            lead_phone = ""
            if lead:
                lead_name = f"{getattr(lead, 'first_name', '')} {getattr(lead, 'last_name', '')}".strip() or f"Lead {lead_id}"
                lead_phone = lead.phone or ""
            
            # Get agent info
            agent = db.query(User).filter(User.id == user_id).first() if user_id else None
            agent_name = getattr(agent, 'full_name', 'Unknown') if agent else "Unknown"
            
            result.append({
                "id": call_id or len(result) + 1,
                "lead_id": lead_id,
                "lead_name": lead_name,
                "lead_phone": lead_phone,
                "outcome": outcome or "UNKNOWN",
                "duration": duration or 0,
                "notes": notes or "",
                "agent_name": agent_name,
                "created_at": created_at.isoformat() if hasattr(created_at, 'isoformat') else str(created_at) if created_at else None,
            })
        
        return {"calls": result, "total": len(result)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"calls": [], "total": 0, "error": str(e)}

# ═══════════════════════════════════════════════════════════
# GET CALLBACKS SCHEDULED FOR TODAY/UPCOMING
# ═══════════════════════════════════════════════════════════

@router.get("/callbacks")
async def get_scheduled_callbacks(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get leads with scheduled callbacks"""
    from app.models.lead import Lead, LeadStatus
    
    # Helper to get status string
    def get_status_str(status_val):
        if status_val is None:
            return 'NEW'
        if hasattr(status_val, 'value'):
            return str(status_val.value).upper().strip()
        return str(status_val).upper().strip()
    
    try:
        # Get all leads and filter for CALLBACK status
        all_leads = db.query(Lead).order_by(desc(Lead.updated_at)).all()
        
        callbacks = []
        for lead in all_leads:
            if get_status_str(lead.status) == 'CALLBACK':
                callbacks.append(lead)
        
        callbacks = callbacks[:limit]
        
        result = []
        for lead in callbacks:
            name = f"{getattr(lead, 'first_name', '')} {getattr(lead, 'last_name', '')}".strip() or f"Lead {lead.id}"
            
            # Get source as string
            source_val = getattr(lead, 'source', None)
            source_str = source_val.value if hasattr(source_val, 'value') else (str(source_val) if source_val else "")
            
            result.append({
                "id": lead.id,
                "name": name,
                "phone": lead.phone or "",
                "city": getattr(lead, 'city', '') or "",
                "product_interest": getattr(lead, 'product_interest', '') or "",
                "status": get_status_str(lead.status),
                "source": source_str,
                "callback_time": lead.callback_time.isoformat() if hasattr(lead, 'callback_time') and lead.callback_time else None,
                "callback_notes": getattr(lead, 'callback_notes', '') or "",
                "notes": getattr(lead, 'notes', '') or "",
                "call_count": getattr(lead, 'call_count', 0) or 0,
                "created_at": lead.created_at.isoformat() if lead.created_at else ""
            })
        
        return {"callbacks": result, "total": len(result)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"callbacks": [], "total": 0, "error": str(e)}

# ═══════════════════════════════════════════════════════════
# STATS ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.get("/stats")
async def get_call_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get call center statistics"""
    try:
        from sqlalchemy import text
        from app.models.lead import Lead, LeadStatus
        
        # Helper to get status string
        def get_status_str(status_val):
            if status_val is None:
                return 'NEW'
            if hasattr(status_val, 'value'):
                return str(status_val.value).upper().strip()
            return str(status_val).upper().strip()
        
        # Use raw SQL for reliable counting
        total_calls = db.execute(text("SELECT COUNT(*) FROM call_notes")).scalar() or 0
        answered = db.execute(text("SELECT COUNT(*) FROM call_notes WHERE outcome != 'NO_ANSWER'")).scalar() or 0
        confirmed = db.execute(text("SELECT COUNT(*) FROM call_notes WHERE outcome = 'CONFIRMED'")).scalar() or 0
        
        # Count callbacks by iterating (handles enum properly)
        all_leads = db.query(Lead).all()
        callbacks_needed = sum(1 for lead in all_leads if get_status_str(lead.status) == 'CALLBACK')
        
        # Contact rate
        contact_rate = round((answered / total_calls * 100), 1) if total_calls > 0 else 0
        
        return {
            "total_calls": total_calls,
            "answered": answered,
            "confirmed": confirmed,
            "callbacks_needed": callbacks_needed,
            "contact_rate": contact_rate
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "total_calls": 0,
            "answered": 0,
            "confirmed": 0,
            "callbacks_needed": 0,
            "contact_rate": 0,
            "error": str(e)
        }

# ═══════════════════════════════════════════════════════════
# FOCUS QUEUE
# ═══════════════════════════════════════════════════════════

@router.get("/focus-queue")
async def get_focus_queue(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get leads that need to be called - Focus Mode
    
    Returns a balanced mix of NEW leads (newest first) and CALLBACK leads.
    Prioritizes: NEW (newest) > CALLBACK > NO_ANSWER > QUALIFIED > Others
    """
    from app.models.lead import Lead, LeadStatus
    from sqlalchemy import or_, case
    
    # Helper to get status string from enum or string
    def get_status_str(status_val):
        if status_val is None:
            return 'NEW'
        if hasattr(status_val, 'value'):
            return str(status_val.value).upper().strip()
        return str(status_val).upper().strip()
    
    # Statuses that SHOULD be in the queue (leads that need calling)
    callable_statuses = [
        LeadStatus.NEW,
        LeadStatus.QUALIFIED,
        LeadStatus.CALLBACK,
        LeadStatus.CONTACTED if hasattr(LeadStatus, 'CONTACTED') else None,
    ]
    # Filter out None values
    callable_statuses = [s for s in callable_statuses if s is not None]
    
    # Also try string-based filtering for flexibility
    excluded_statuses_str = ['CONFIRMED', 'WON', 'LOST', 'DELIVERED', 'NOT_INTERESTED']
    
    # Get all leads and filter
    all_leads = db.query(Lead).order_by(desc(Lead.created_at)).all()
    
    # Filter leads that need calling
    leads_to_call = []
    for lead in all_leads:
        status_str = get_status_str(lead.status)
        if status_str not in [s.upper() for s in excluded_statuses_str]:
            leads_to_call.append(lead)
    
    # Sort: NEW leads (newest first), then CALLBACK, then others
    # This ensures just-created leads appear at the top
    def sort_priority(lead):
        status = get_status_str(lead.status)
        # Use negative timestamp so newest leads come first within each category
        created_ts = -(lead.created_at.timestamp() if lead.created_at else 0)
        
        if status == 'NEW':
            return (0, created_ts)  # NEW leads first, newest at top
        elif status == 'CALLBACK':
            return (1, created_ts)  # CALLBACK second
        elif status == 'NO_ANSWER':
            return (2, created_ts)
        elif status == 'QUALIFIED':
            return (3, created_ts)
        elif status == 'CONTACTED':
            return (4, created_ts)
        else:
            return (5, created_ts)
    
    leads_to_call.sort(key=sort_priority)
    leads_to_call = leads_to_call[:limit]
    
    # Build response
    result = []
    for lead in leads_to_call:
        name = f"{getattr(lead, 'first_name', '')} {getattr(lead, 'last_name', '')}".strip() or f"Lead {lead.id}"
        
        # Get call count
        call_count = getattr(lead, 'call_count', 0) or 0
        
        # Get source as string
        source_val = getattr(lead, 'source', None)
        source_str = source_val.value if hasattr(source_val, 'value') else (str(source_val) if source_val else "")
        
        # Calculate trust level
        returned = getattr(lead, 'returned_orders', 0) or 0
        delivered = getattr(lead, 'delivered_orders', 0) or 0
        
        result.append({
            "id": lead.id,
            "name": name,
            "phone": lead.phone or "",
            "city": getattr(lead, 'city', '') or "",
            "address": getattr(lead, 'address', '') or "",
            "product_interest": getattr(lead, 'product_interest', '') or "",
            "status": get_status_str(lead.status),
            "source": source_str,
            "call_count": call_count,
            "delivered_orders": delivered,
            "returned_orders": returned,
            "notes": getattr(lead, 'notes', '') or "",
            "created_at": lead.created_at.isoformat() if lead.created_at else ""
        })
    
    return {"total": len(result), "leads": result}
