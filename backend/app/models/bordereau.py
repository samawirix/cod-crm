from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum

class BordereauStatus(str, enum.Enum):
    DRAFT = "DRAFT"           # Being created
    READY = "READY"           # Ready for pickup
    PICKED_UP = "PICKED_UP"   # Courier collected
    CLOSED = "CLOSED"         # All delivered/returned

class Bordereau(Base):
    __tablename__ = "bordereaux"

    id = Column(Integer, primary_key=True, index=True)
    
    # Reference
    bordereau_number = Column(String(20), unique=True, index=True)
    
    # Courier
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=False)
    
    # Summary
    total_orders = Column(Integer, default=0)
    total_cod_amount = Column(Float, default=0)
    total_shipping = Column(Float, default=0)
    
    # Status
    status = Column(String(20), default=BordereauStatus.DRAFT.value)
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow)
    pickup_date = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Created by
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    courier = relationship("Courier", back_populates="bordereaux")
    shipments = relationship("Shipment", back_populates="bordereau")
