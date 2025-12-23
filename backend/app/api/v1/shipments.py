from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel
import random
import string

from app.core.database import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.shipment_tracking import ShipmentTracking
from app.models.order import Order
from app.models.courier import Courier
from app.models.user import User

router = APIRouter()

# ═══════════════════════════════════════════════════════════
# AUTH HELPER
# ═══════════════════════════════════════════════════════════

def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user

# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class ShipmentCreate(BaseModel):
    order_id: int
    courier_id: int

class ShipmentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    location: Optional[str] = None
    collected_amount: Optional[float] = None

class BulkShipmentCreate(BaseModel):
    order_ids: List[int]
    courier_id: int

# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════

def generate_tracking_number():
    """Generate unique tracking number"""
    prefix = "TRK"
    timestamp = datetime.now().strftime("%y%m%d")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}{timestamp}{random_part}"

# ═══════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/")
async def get_shipments(
    status: Optional[str] = None,
    courier_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get shipments with filters"""
    query = db.query(Shipment)
    
    if status:
        query = query.filter(Shipment.status == status)
    if courier_id:
        query = query.filter(Shipment.courier_id == courier_id)
    if search:
        query = query.filter(
            (Shipment.tracking_number.ilike(f"%{search}%")) |
            (Shipment.customer_name.ilike(f"%{search}%")) |
            (Shipment.customer_phone.ilike(f"%{search}%"))
        )
    
    total = query.count()
    shipments = query.order_by(desc(Shipment.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for s in shipments:
        courier_name = ""
        if s.courier:
            courier_name = s.courier.name
        
        result.append({
            "id": s.id,
            "tracking_number": s.tracking_number,
            "order_id": s.order_id,
            "courier_id": s.courier_id,
            "courier_name": courier_name,
            "customer_name": s.customer_name,
            "customer_phone": s.customer_phone,
            "customer_city": s.customer_city,
            "customer_address": s.customer_address,
            "cod_amount": s.cod_amount,
            "shipping_cost": s.shipping_cost,
            "collected_amount": s.collected_amount,
            "status": s.status,
            "status_notes": s.status_notes,
            "delivery_attempts": s.delivery_attempts,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "picked_up_at": s.picked_up_at.isoformat() if s.picked_up_at else None,
            "delivered_at": s.delivered_at.isoformat() if s.delivered_at else None,
        })
    
    return {"shipments": result, "total": total}

@router.post("/")
async def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create shipment for an order"""
    # Get order
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if shipment already exists
    existing = db.query(Shipment).filter(Shipment.order_id == data.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Shipment already exists for this order")
    
    # Get courier
    courier = db.query(Courier).filter(Courier.id == data.courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    
    # Create shipment
    shipment = Shipment(
        tracking_number=generate_tracking_number(),
        order_id=order.id,
        courier_id=courier.id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        customer_city=order.city,
        customer_address=order.delivery_address,
        cod_amount=order.total_amount,
        shipping_cost=order.delivery_charges or 0,
        status=ShipmentStatus.PENDING.value,
    )
    db.add(shipment)
    db.flush()  # Get the ID
    
    # Add tracking entry
    tracking = ShipmentTracking(
        shipment_id=shipment.id,
        status=ShipmentStatus.PENDING.value,
        notes="Shipment created, waiting for pickup",
        updated_by=current_user.full_name or current_user.email,
    )
    db.add(tracking)
    
    # Update order status
    order.status = "PROCESSING"
    
    # Update courier stats
    courier.total_shipments = (courier.total_shipments or 0) + 1
    
    db.commit()
    db.refresh(shipment)
    
    return {
        "success": True,
        "shipment_id": shipment.id,
        "tracking_number": shipment.tracking_number,
        "message": f"Shipment created with tracking: {shipment.tracking_number}"
    }

@router.post("/bulk")
async def create_bulk_shipments(
    data: BulkShipmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create shipments for multiple orders"""
    courier = db.query(Courier).filter(Courier.id == data.courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    
    created = []
    errors = []
    
    for order_id in data.order_ids:
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                errors.append({"order_id": order_id, "error": "Order not found"})
                continue
            
            existing = db.query(Shipment).filter(Shipment.order_id == order_id).first()
            if existing:
                errors.append({"order_id": order_id, "error": "Shipment already exists"})
                continue
            
            shipment = Shipment(
                tracking_number=generate_tracking_number(),
                order_id=order.id,
                courier_id=courier.id,
                customer_name=order.customer_name,
                customer_phone=order.customer_phone,
                customer_city=order.city,
                customer_address=order.delivery_address,
                cod_amount=order.total_amount,
                shipping_cost=order.delivery_charges or 0,
                status=ShipmentStatus.PENDING.value,
            )
            db.add(shipment)
            order.status = "PROCESSING"
            created.append(order_id)
            
        except Exception as e:
            errors.append({"order_id": order_id, "error": str(e)})
    
    courier.total_shipments = (courier.total_shipments or 0) + len(created)
    db.commit()
    
    return {
        "success": True,
        "created_count": len(created),
        "error_count": len(errors),
        "created": created,
        "errors": errors,
    }

@router.put("/{shipment_id}/status")
async def update_shipment_status(
    shipment_id: int,
    data: ShipmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update shipment status"""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    old_status = shipment.status
    shipment.status = data.status
    shipment.status_notes = data.notes
    
    # Update timestamps based on status
    now = datetime.utcnow()
    if data.status == ShipmentStatus.PICKED_UP.value:
        shipment.picked_up_at = now
    elif data.status == ShipmentStatus.DELIVERED.value:
        shipment.delivered_at = now
        shipment.collected_amount = data.collected_amount or shipment.cod_amount
        # Update courier stats
        if shipment.courier:
            shipment.courier.delivered_count = (shipment.courier.delivered_count or 0) + 1
        # Update order status
        if shipment.order:
            shipment.order.status = "DELIVERED"
            shipment.order.payment_status = "PAID"
            shipment.order.payment_collected = True
            shipment.order.cash_collected = data.collected_amount or shipment.cod_amount
    elif data.status == ShipmentStatus.RETURNED.value:
        shipment.returned_at = now
        if shipment.courier:
            shipment.courier.returned_count = (shipment.courier.returned_count or 0) + 1
        if shipment.order:
            shipment.order.status = "RETURNED"
            shipment.order.is_returned = True
    elif data.status == ShipmentStatus.FAILED_ATTEMPT.value:
        shipment.delivery_attempts = (shipment.delivery_attempts or 0) + 1
        shipment.last_attempt_date = now
        shipment.last_attempt_notes = data.notes
    
    # Add tracking entry
    tracking = ShipmentTracking(
        shipment_id=shipment.id,
        status=data.status,
        location=data.location,
        notes=data.notes,
        updated_by=current_user.full_name or current_user.email,
    )
    db.add(tracking)
    
    db.commit()
    
    return {"success": True, "message": f"Status updated from {old_status} to {data.status}"}

@router.get("/{shipment_id}/tracking")
async def get_shipment_tracking(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get shipment tracking history"""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    tracking = db.query(ShipmentTracking).filter(
        ShipmentTracking.shipment_id == shipment_id
    ).order_by(desc(ShipmentTracking.created_at)).all()
    
    return {
        "shipment": {
            "id": shipment.id,
            "tracking_number": shipment.tracking_number,
            "customer_name": shipment.customer_name,
            "customer_city": shipment.customer_city,
            "status": shipment.status,
            "cod_amount": shipment.cod_amount,
        },
        "history": [
            {
                "status": t.status,
                "location": t.location,
                "notes": t.notes,
                "updated_by": t.updated_by,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tracking
        ]
    }

@router.get("/track/{tracking_number}")
async def track_by_number(
    tracking_number: str,
    db: Session = Depends(get_db),
):
    """Public tracking endpoint (no auth required)"""
    shipment = db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    
    tracking = db.query(ShipmentTracking).filter(
        ShipmentTracking.shipment_id == shipment.id
    ).order_by(desc(ShipmentTracking.created_at)).all()
    
    return {
        "tracking_number": shipment.tracking_number,
        "status": shipment.status,
        "customer_city": shipment.customer_city,
        "created_at": shipment.created_at.isoformat() if shipment.created_at else None,
        "delivered_at": shipment.delivered_at.isoformat() if shipment.delivered_at else None,
        "history": [
            {
                "status": t.status,
                "location": t.location,
                "notes": t.notes,
                "date": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tracking
        ]
    }
