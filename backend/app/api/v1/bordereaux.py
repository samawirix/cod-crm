from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.bordereau import Bordereau, BordereauStatus
from app.models.shipment import Shipment, ShipmentStatus
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

class BordereauCreate(BaseModel):
    courier_id: int
    shipment_ids: List[int]
    notes: Optional[str] = None

class BordereauUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    pickup_date: Optional[datetime] = None

# ═══════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/")
async def get_bordereaux(
    status: Optional[str] = None,
    courier_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all bordereaux"""
    query = db.query(Bordereau)
    
    if status:
        query = query.filter(Bordereau.status == status)
    if courier_id:
        query = query.filter(Bordereau.courier_id == courier_id)
    
    bordereaux = query.order_by(desc(Bordereau.created_at)).limit(limit).all()
    
    result = []
    for b in bordereaux:
        # Count shipments in this bordereau
        shipment_count = db.query(func.count(Shipment.id)).filter(
            Shipment.bordereau_id == b.id
        ).scalar() or 0
        
        result.append({
            "id": b.id,
            "bordereau_number": b.bordereau_number,
            "courier_id": b.courier_id,
            "courier_name": b.courier.name if b.courier else "",
            "total_orders": shipment_count,
            "total_cod_amount": b.total_cod_amount,
            "total_shipping": b.total_shipping,
            "status": b.status,
            "pickup_date": b.pickup_date.isoformat() if b.pickup_date else None,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "notes": b.notes,
        })
    
    return {"bordereaux": result, "total": len(result)}

@router.post("/")
async def create_bordereau(
    data: BordereauCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new bordereau (shipping manifest)"""
    # Validate courier
    courier = db.query(Courier).filter(Courier.id == data.courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")
    
    # Get shipments
    shipments = db.query(Shipment).filter(
        Shipment.id.in_(data.shipment_ids),
        Shipment.bordereau_id == None,  # Not already in a bordereau
        Shipment.status == ShipmentStatus.PENDING.value
    ).all()
    
    if not shipments:
        raise HTTPException(status_code=400, detail="No valid shipments found")
    
    # Generate bordereau number
    last_bordereau = db.query(Bordereau).order_by(desc(Bordereau.id)).first()
    next_num = (last_bordereau.id + 1) if last_bordereau else 1
    bordereau_number = f"BOR-{datetime.now().strftime('%y%m%d')}-{next_num:04d}"
    
    # Calculate totals
    total_cod = sum(s.cod_amount or 0 for s in shipments)
    total_shipping = sum(s.shipping_cost or 0 for s in shipments)
    
    # Create bordereau
    bordereau = Bordereau(
        bordereau_number=bordereau_number,
        courier_id=courier.id,
        total_orders=len(shipments),
        total_cod_amount=total_cod,
        total_shipping=total_shipping,
        status=BordereauStatus.READY.value,
        notes=data.notes,
        created_by_id=current_user.id,
    )
    db.add(bordereau)
    db.flush()
    
    # Assign shipments to bordereau
    for shipment in shipments:
        shipment.bordereau_id = bordereau.id
        shipment.courier_id = courier.id
    
    db.commit()
    db.refresh(bordereau)
    
    return {
        "success": True,
        "bordereau_id": bordereau.id,
        "bordereau_number": bordereau_number,
        "shipment_count": len(shipments),
        "total_cod": total_cod,
        "message": f"Bordereau {bordereau_number} created with {len(shipments)} shipments"
    }

@router.get("/{bordereau_id}")
async def get_bordereau_details(
    bordereau_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bordereau with all shipments"""
    bordereau = db.query(Bordereau).filter(Bordereau.id == bordereau_id).first()
    if not bordereau:
        raise HTTPException(status_code=404, detail="Bordereau not found")
    
    shipments = db.query(Shipment).filter(Shipment.bordereau_id == bordereau_id).all()
    
    return {
        "bordereau": {
            "id": bordereau.id,
            "bordereau_number": bordereau.bordereau_number,
            "courier_name": bordereau.courier.name if bordereau.courier else "",
            "total_orders": len(shipments),
            "total_cod_amount": bordereau.total_cod_amount,
            "status": bordereau.status,
            "created_at": bordereau.created_at.isoformat() if bordereau.created_at else None,
            "pickup_date": bordereau.pickup_date.isoformat() if bordereau.pickup_date else None,
        },
        "shipments": [
            {
                "id": s.id,
                "tracking_number": s.tracking_number,
                "customer_name": s.customer_name,
                "customer_phone": s.customer_phone,
                "customer_city": s.customer_city,
                "customer_address": s.customer_address,
                "cod_amount": s.cod_amount,
                "status": s.status,
            }
            for s in shipments
        ]
    }

@router.put("/{bordereau_id}/pickup")
async def mark_bordereau_picked_up(
    bordereau_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark bordereau as picked up by courier"""
    bordereau = db.query(Bordereau).filter(Bordereau.id == bordereau_id).first()
    if not bordereau:
        raise HTTPException(status_code=404, detail="Bordereau not found")
    
    bordereau.status = BordereauStatus.PICKED_UP.value
    bordereau.pickup_date = datetime.utcnow()
    
    # Update all shipments to PICKED_UP
    shipments = db.query(Shipment).filter(Shipment.bordereau_id == bordereau_id).all()
    for s in shipments:
        s.status = ShipmentStatus.PICKED_UP.value
        s.picked_up_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Bordereau {bordereau.bordereau_number} marked as picked up",
        "shipments_updated": len(shipments)
    }
