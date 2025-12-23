from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.courier import Courier
from app.models.shipment import Shipment, ShipmentStatus
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

class CourierCreate(BaseModel):
    name: str
    code: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    base_rate: float = 0
    cod_fee_percent: float = 0

class CourierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    base_rate: Optional[float] = None
    cod_fee_percent: Optional[float] = None
    is_active: Optional[bool] = None

# ═══════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/")
async def get_couriers(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all couriers with performance stats"""
    query = db.query(Courier)
    if not include_inactive:
        query = query.filter(Courier.is_active == True)
    
    couriers = query.order_by(Courier.name).all()
    
    result = []
    for c in couriers:
        # Calculate performance
        total = c.total_shipments or 0
        delivered = c.delivered_count or 0
        returned = c.returned_count or 0
        success_rate = round((delivered / total * 100), 1) if total > 0 else 0
        
        result.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "contact_name": c.contact_name,
            "contact_phone": c.contact_phone,
            "contact_email": c.contact_email,
            "address": c.address,
            "base_rate": c.base_rate,
            "cod_fee_percent": c.cod_fee_percent,
            "is_active": c.is_active,
            "total_shipments": total,
            "delivered_count": delivered,
            "returned_count": returned,
            "success_rate": success_rate,
            "avg_delivery_days": c.avg_delivery_days or 0,
        })
    
    return {"couriers": result, "total": len(result)}

@router.post("/")
async def create_courier(
    courier_data: CourierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new courier"""
    # Check if code exists
    existing = db.query(Courier).filter(Courier.code == courier_data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Courier code already exists")
    
    courier = Courier(
        name=courier_data.name,
        code=courier_data.code.upper(),
        contact_name=courier_data.contact_name,
        contact_phone=courier_data.contact_phone,
        contact_email=courier_data.contact_email,
        address=courier_data.address,
        base_rate=courier_data.base_rate,
        cod_fee_percent=courier_data.cod_fee_percent,
    )
    db.add(courier)
    db.commit()
    db.refresh(courier)
    
    return {"success": True, "courier_id": courier.id, "message": f"Courier {courier.name} created"}

@router.put("/{courier_id}")
async def update_courier(
    courier_id: int,
    courier_data: CourierUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a courier"""
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    
    for field, value in courier_data.dict(exclude_unset=True).items():
        setattr(courier, field, value)
    
    db.commit()
    return {"success": True, "message": "Courier updated"}

@router.delete("/{courier_id}")
async def delete_courier(
    courier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Soft delete a courier (deactivate)"""
    courier = db.query(Courier).filter(Courier.id == courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    
    courier.is_active = False
    db.commit()
    return {"success": True, "message": "Courier deactivated"}

@router.get("/stats")
async def get_courier_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get overall courier statistics"""
    # Shipment status counts
    pending = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.PENDING.value).scalar() or 0
    picked_up = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.PICKED_UP.value).scalar() or 0
    in_transit = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.IN_TRANSIT.value).scalar() or 0
    out_for_delivery = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.OUT_FOR_DELIVERY.value).scalar() or 0
    delivered = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.DELIVERED.value).scalar() or 0
    returned = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.RETURNED.value).scalar() or 0
    failed = db.query(func.count(Shipment.id)).filter(Shipment.status == ShipmentStatus.FAILED_ATTEMPT.value).scalar() or 0
    
    # COD amounts
    total_cod = db.query(func.sum(Shipment.cod_amount)).scalar() or 0
    collected_cod = db.query(func.sum(Shipment.collected_amount)).filter(Shipment.status == ShipmentStatus.DELIVERED.value).scalar() or 0
    pending_cod = db.query(func.sum(Shipment.cod_amount)).filter(Shipment.status.in_([
        ShipmentStatus.PENDING.value, ShipmentStatus.PICKED_UP.value, 
        ShipmentStatus.IN_TRANSIT.value, ShipmentStatus.OUT_FOR_DELIVERY.value
    ])).scalar() or 0
    
    # Active couriers
    active_couriers = db.query(func.count(Courier.id)).filter(Courier.is_active == True).scalar() or 0
    
    return {
        "shipment_counts": {
            "pending": pending,
            "picked_up": picked_up,
            "in_transit": in_transit,
            "out_for_delivery": out_for_delivery,
            "delivered": delivered,
            "returned": returned,
            "failed_attempts": failed,
        },
        "cod_amounts": {
            "total": total_cod,
            "collected": collected_cod,
            "pending": pending_cod,
        },
        "active_couriers": active_couriers,
    }
