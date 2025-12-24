"""
Simple Leads API - CRUD Operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.user import User
from app.models.blacklist import Blacklist
from app.schemas.lead import CreateLeadSchema, UpdateLeadSchema, LeadResponseSchema
from pydantic import BaseModel, EmailStr

# Create router
router = APIRouter(
    tags=["leads"]
)


# ============== SCHEMAS ==============

class LeadCreate(BaseModel):
    """Schema for creating a lead"""
    # Accept either 'name' (single field) OR 'first_name'/'last_name' (separate fields)
    name: Optional[str] = None  # If provided, will be split into first/last
    first_name: Optional[str] = None  # Can be provided directly
    last_name: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    alternate_phone: Optional[str] = None
    company: Optional[str] = None
    
    # Location
    city: Optional[str] = None
    address: Optional[str] = None
    
    # Product Information
    product_interest: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    
    # Lead Classification
    source: str = "OTHER"
    status: str = "NEW"
    assigned_to: Optional[int] = None


class LeadResponse(BaseModel):
    """Schema for lead response"""
    id: int
    first_name: str
    last_name: Optional[str] = None
    full_name: str
    phone: str
    email: Optional[str] = None
    alternate_phone: Optional[str] = None
    company: Optional[str] = None
    
    # Location
    city: Optional[str] = None
    address: Optional[str] = None
    
    # Product Information
    product_interest: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    total_amount: float = 0.0
    
    # Lead Classification
    source: str
    status: str
    assigned_to: Optional[int] = None
    lead_score: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LeadUpdate(BaseModel):
    """Schema for updating a lead"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None  # Allow any string, not just valid emails
    alternate_phone: Optional[str] = None
    company: Optional[str] = None
    
    # Location
    city: Optional[str] = None
    address: Optional[str] = None
    
    # Product Information
    product_interest: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    
    # Lead Classification
    source: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    
    # Additional fields frontend might send
    notes: Optional[str] = None


class LeadsListResponse(BaseModel):
    """Schema for paginated leads list"""
    total: int
    leads: List[LeadResponse]
    page: int
    page_size: int


# ============== SIMPLE AUTH ==============

def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user


# ============== ENDPOINTS ==============

@router.get("/", response_model=LeadsListResponse)
def get_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    exclude_blacklist: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all leads with optional filtering.
    Set exclude_blacklist=true to filter out leads with blacklisted phone numbers.
    """
    print(f"📋 GET /leads - skip={skip}, limit={limit}, status={status}, source={source}, date_from={date_from}")
    
    try:
        query = db.query(Lead)
        
        # Exclude blacklisted phone numbers if requested
        if exclude_blacklist:
            blacklisted_phones = db.query(Blacklist.phone).subquery()
            query = query.filter(~Lead.phone.in_(blacklisted_phones))
        
        # Apply filters
        if status:
            try:
                status_enum = LeadStatus[status.upper()]
                query = query.filter(Lead.status == status_enum)
            except KeyError:
                pass
        
        if source:
            try:
                source_enum = LeadSource[source.upper()]
                query = query.filter(Lead.source == source_enum)
            except KeyError:
                pass
                
        # Apply date filters if provided (Otherwise ALL TIME)
        if date_from:
            try:
                start_dt = datetime.strptime(date_from, "%Y-%m-%d")
                query = query.filter(Lead.created_at >= start_dt)
            except ValueError:
                pass
                
        if date_to:
            try:
                # Add one day to include the end date fully
                end_dt = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                query = query.filter(Lead.created_at <= end_dt)
            except ValueError:
                pass
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
        
        print(f"✅ Returning {len(leads)} leads (total: {total})")
        
        # Manual Mapping to debug/fix Pydantic issues
        data = []
        for l in leads:
            data.append({
                "id": l.id,
                "first_name": l.first_name,
                "last_name": l.last_name,
                "full_name": l.full_name, # Hybrid property
                "phone": l.phone,
                "email": l.email,
                "alternate_phone": l.alternate_phone,
                "company": l.company,
                "city": l.city,
                "address": l.address,
                "product_interest": l.product_interest,
                "quantity": l.quantity,
                "unit_price": l.unit_price,
                "total_amount": l.total_amount,
                "source": l.source.value if l.source else "OTHER",
                "status": l.status.value if l.status else "NEW",
                "assigned_to": l.assigned_to,
                "lead_score": l.lead_score,
                "created_at": l.created_at,
                "updated_at": l.updated_at
            })
            
        return {
            "total": total,
            "leads": data,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "page_size": limit
        }
        
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"CRITICAL ERROR IN GET_LEADS: {e}")
        try:
            with open("/tmp/debug_error.log", "w") as f:
                f.write(error_msg)
        except:
            pass
        raise


@router.get("/health", include_in_schema=False)
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "leads"}


@router.get("/queue", response_model=LeadsListResponse)
def get_call_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    priority: str = Query("newest", pattern="^(newest|highest_amount|highest_score)$"),
    filter_type: str = Query("all", pattern="^(all|new_only|callback_only|focus_mode)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get leads for call queue - only actionable leads.
    
    filter_type options:
    - all: NEW and CALLBACK leads
    - new_only: Only NEW leads
    - callback_only: Only CALLBACK leads
    - focus_mode: NEW, BUSY, NO_ANSWER (excludes blacklisted phones)
    
    Sorted by priority: newest, highest_amount, or highest_score
    """
    print(f"📞 Getting call queue (priority={priority}, filter={filter_type})")
    
    # Get blacklisted phones subquery for exclusion
    blacklisted_phones = db.query(Blacklist.phone).subquery()
    
    # Base query with blacklist exclusion
    query = db.query(Lead).filter(~Lead.phone.in_(blacklisted_phones))
    
    # Apply status filter
    if filter_type == "new_only":
        query = query.filter(Lead.status == LeadStatus.NEW)
    elif filter_type == "callback_only":
        query = query.filter(Lead.status == LeadStatus.CALLBACK)
    elif filter_type == "focus_mode":
        # Focus Mode: NEW, BUSY, NO_ANSWER - the "ready to call" statuses
        query = query.filter(Lead.status.in_([
            LeadStatus.NEW, 
            LeadStatus.BUSY, 
            LeadStatus.NO_ANSWER
        ]))
    else:  # all
        query = query.filter(Lead.status.in_([LeadStatus.NEW, LeadStatus.CALLBACK]))
    
    # Apply sorting
    if priority == "highest_amount":
        query = query.order_by(Lead.total_amount.desc())
    elif priority == "highest_score":
        query = query.order_by(Lead.lead_score.desc())
    else:  # newest (default)
        query = query.order_by(Lead.created_at.desc())
    
    total = query.count()
    leads = query.offset(skip).limit(limit).all()
    
    print(f"✅ Call queue: {len(leads)} leads ready (total: {total})")
    
    # Build response with proper schema
    lead_responses = []
    for lead in leads:
        lead_responses.append(LeadResponse(
            id=lead.id,
            first_name=lead.first_name,
            last_name=lead.last_name,
            full_name=lead.full_name,
            phone=lead.phone,
            email=lead.email,
            alternate_phone=lead.alternate_phone,
            company=lead.company,
            city=lead.city,
            address=lead.address,
            product_interest=lead.product_interest,
            quantity=lead.quantity,
            unit_price=lead.unit_price,
            total_amount=lead.total_amount,
            source=lead.source.value if lead.source else "OTHER",
            status=lead.status.value if lead.status else "NEW",
            assigned_to=lead.assigned_to,
            lead_score=lead.lead_score,
            created_at=lead.created_at,
            updated_at=lead.updated_at
        ))
    
    return LeadsListResponse(
        total=total,
        leads=lead_responses,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single lead by ID
    """
    print(f"📋 GET /leads/{lead_id}")
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")
    
    print(f"✅ Found lead: {lead.full_name}")
    
    return lead


@router.post("/", response_model=LeadResponse, status_code=201)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new lead
    """
    # Split name into first_name and last_name
    # Frontend sends 'name', we split: "John Doe" -> first_name="John", last_name="Doe"
    if lead_data.name:
        name_parts = lead_data.name.strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
    else:
        first_name = lead_data.first_name or "Unknown"
        last_name = lead_data.last_name or ""
    
    print(f"📝 POST /leads - Creating: {first_name} {last_name}")
    
    # Convert string enums to actual enums
    try:
        source_enum = LeadSource[lead_data.source.upper()]
    except KeyError:
        source_enum = LeadSource.OTHER
    
    try:
        status_enum = LeadStatus[lead_data.status.upper()]
    except KeyError:
        status_enum = LeadStatus.NEW
    
    # Create new lead - use empty strings for fields that have NOT NULL constraint in DB
    # For email, generate a unique placeholder if not provided (DB has UNIQUE constraint)
    import uuid
    lead_email = lead_data.email if lead_data.email else f"no-email-{uuid.uuid4().hex[:12]}@placeholder.local"
    
    new_lead = Lead(
        first_name=first_name,
        last_name=last_name,  # DB has NOT NULL
        phone=lead_data.phone,
        email=lead_email,  # DB has NOT NULL + UNIQUE
        alternate_phone=lead_data.alternate_phone or "",
        company=lead_data.company or "",
        
        # Location
        city=lead_data.city or "",
        address=lead_data.address or "",
        
        # Product Information
        product_interest=lead_data.product_interest or "",
        quantity=lead_data.quantity,
        unit_price=lead_data.unit_price,
        
        # Lead Classification
        source=source_enum,
        status=status_enum,
        assigned_to=lead_data.assigned_to,
        lead_score=50,  # Default score
        conversion_probability=0.0
    )
    
    try:
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)
        
        print(f"✅ Lead created successfully - ID: {new_lead.id}")
        
        return new_lead
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating lead: {str(e)}")
        
        # Check for duplicate email - make it unique and retry
        if "UNIQUE constraint" in str(e) and "email" in str(e):
            import uuid
            # If email was provided and is duplicate, add a unique suffix
            if lead_data.email:
                unique_suffix = uuid.uuid4().hex[:8]
                new_lead.email = f"{lead_data.email.split('@')[0]}+{unique_suffix}@{lead_data.email.split('@')[1]}"
                print(f"⚠️ Email already exists, using modified email: {new_lead.email}")
            else:
                new_lead.email = f"no-email-{uuid.uuid4().hex[:12]}@placeholder.local"
            
            try:
                db.add(new_lead)
                db.commit()
                db.refresh(new_lead)
                print(f"✅ Lead created with modified email - ID: {new_lead.id}")
                return new_lead
            except Exception as e2:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to create lead: {str(e2)}"
                )
        
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing lead
    """
    print(f"📝 PUT /leads/{lead_id}")
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")
    
    # Update fields only if provided
    if lead_data.first_name is not None:
        lead.first_name = lead_data.first_name
    if lead_data.last_name is not None:
        lead.last_name = lead_data.last_name
    if lead_data.phone is not None:
        lead.phone = lead_data.phone
    if lead_data.email is not None:
        lead.email = lead_data.email
    if lead_data.alternate_phone is not None:
        lead.alternate_phone = lead_data.alternate_phone
    if lead_data.company is not None:
        lead.company = lead_data.company
    
    # Location
    if lead_data.city is not None:
        lead.city = lead_data.city
    if lead_data.address is not None:
        lead.address = lead_data.address
    
    # Product Information
    if lead_data.product_interest is not None:
        lead.product_interest = lead_data.product_interest
    if lead_data.quantity is not None:
        lead.quantity = lead_data.quantity
    if lead_data.unit_price is not None:
        lead.unit_price = lead_data.unit_price
    
    # Lead Classification
    if lead_data.source is not None:
        try:
            lead.source = LeadSource[lead_data.source.upper()]
        except KeyError:
            pass
    
    if lead_data.status is not None:
        try:
            lead.status = LeadStatus[lead_data.status.upper()]
        except KeyError:
            pass
    
    if lead_data.assigned_to is not None:
        lead.assigned_to = lead_data.assigned_to
    
    lead.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(lead)
        
        print(f"✅ Lead {lead_id} updated successfully")
        
        return lead
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a lead
    """
    print(f"🗑️ DELETE /leads/{lead_id}")
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")
    
    try:
        db.delete(lead)
        db.commit()
        
        print(f"✅ Lead {lead_id} deleted successfully")
        
        return {"message": "Lead deleted successfully", "lead_id": lead_id}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting lead: {str(e)}")


# ============== BULK OPERATIONS ==============

class BulkUpdateRequest(BaseModel):
    """Schema for bulk update operations"""
    ids: List[int]
    status: Optional[str] = None
    assigned_to: Optional[int] = None


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete operations"""
    ids: List[int]


@router.post("/bulk-update")
def bulk_update_leads(
    data: BulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk update leads - supports status and assigned_to changes.
    """
    print(f"📦 BULK UPDATE - {len(data.ids)} leads")
    
    if not data.ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided")
    
    if len(data.ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 leads per bulk update")
    
    updated_count = 0
    
    try:
        # Build update dict
        update_data = {"updated_at": datetime.utcnow()}
        
        if data.status:
            try:
                status_enum = LeadStatus[data.status.upper()]
                update_data["status"] = status_enum
            except KeyError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")
        
        if data.assigned_to is not None:
            update_data["assigned_to"] = data.assigned_to
        
        # Perform bulk update
        result = db.query(Lead).filter(Lead.id.in_(data.ids)).update(
            update_data,
            synchronize_session=False
        )
        
        db.commit()
        updated_count = result
        
        print(f"✅ Bulk updated {updated_count} leads")
        
        return {
            "success": True,
            "message": f"Successfully updated {updated_count} leads",
            "updated_count": updated_count,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Bulk update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk update failed: {str(e)}")


@router.post("/bulk-delete")
def bulk_delete_leads(
    data: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk delete leads.
    """
    print(f"🗑️ BULK DELETE - {len(data.ids)} leads")
    
    if not data.ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided")
    
    if len(data.ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 leads per bulk delete")
    
    try:
        # Perform bulk delete
        result = db.query(Lead).filter(Lead.id.in_(data.ids)).delete(
            synchronize_session=False
        )
        
        db.commit()
        
        print(f"✅ Bulk deleted {result} leads")
        
        return {
            "success": True,
            "message": f"Successfully deleted {result} leads",
            "deleted_count": result,
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Bulk delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk delete failed: {str(e)}")


# ============== CALLBACK SCHEDULING ==============

class CallbackScheduleRequest(BaseModel):
    """Schema for scheduling a callback"""
    callback_time: datetime
    callback_notes: Optional[str] = None
    status: str = "CALLBACK"


@router.post("/{lead_id}/schedule-callback")
def schedule_callback(
    lead_id: int,
    request: CallbackScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule a callback for a lead"""
    print(f"📅 Scheduling callback for lead {lead_id}")
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Update lead with callback info
    lead.callback_time = request.callback_time
    lead.callback_notes = request.callback_notes
    lead.callback_assigned_to = current_user.id
    lead.callback_completed = False
    lead.callback_reminder_sent = False
    lead.status = LeadStatus.CALLBACK
    lead.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(lead)
        
        print(f"✅ Callback scheduled for lead {lead_id} at {lead.callback_time}")
        
        return {
            "message": "Callback scheduled successfully",
            "lead_id": lead.id,
            "callback_time": lead.callback_time.isoformat() if lead.callback_time else None,
            "callback_notes": lead.callback_notes
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error scheduling callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scheduling callback: {str(e)}")


@router.get("/callbacks/due")
def get_due_callbacks(
    minutes_ahead: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get callbacks that are due within specified minutes"""
    print(f"📞 Getting due callbacks (window: {minutes_ahead} minutes)")
    
    now = datetime.utcnow()
    window_end = now + timedelta(minutes=minutes_ahead)
    
    # Get overdue callbacks (past due)
    overdue = db.query(Lead).filter(
        Lead.status == LeadStatus.CALLBACK,
        Lead.callback_time != None,
        Lead.callback_time <= now,
        Lead.callback_completed == False
    ).all()
    
    # Get upcoming callbacks (within window)
    upcoming = db.query(Lead).filter(
        Lead.status == LeadStatus.CALLBACK,
        Lead.callback_time != None,
        Lead.callback_time > now,
        Lead.callback_time <= window_end,
        Lead.callback_completed == False
    ).all()
    
    print(f"✅ Found {len(overdue)} overdue, {len(upcoming)} upcoming callbacks")
    
    return {
        "overdue": [
            {
                "id": l.id,
                "name": l.full_name,
                "phone": l.phone,
                "callback_time": l.callback_time.isoformat() if l.callback_time else None,
                "callback_notes": l.callback_notes,
                "minutes_overdue": int((now - l.callback_time).total_seconds() / 60) if l.callback_time else 0
            }
            for l in overdue
        ],
        "upcoming": [
            {
                "id": l.id,
                "name": l.full_name,
                "phone": l.phone,
                "callback_time": l.callback_time.isoformat() if l.callback_time else None,
                "callback_notes": l.callback_notes,
                "minutes_until": int((l.callback_time - now).total_seconds() / 60) if l.callback_time else 0
            }
            for l in upcoming
        ]
    }


