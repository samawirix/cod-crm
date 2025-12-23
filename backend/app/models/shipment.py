from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum

class ShipmentStatus(str, enum.Enum):
    PENDING = "PENDING"           # Order confirmed, waiting for pickup
    PICKED_UP = "PICKED_UP"       # Courier picked up
    IN_TRANSIT = "IN_TRANSIT"     # On the way
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"  # Last mile
    DELIVERED = "DELIVERED"       # Successfully delivered
    FAILED_ATTEMPT = "FAILED_ATTEMPT"  # Delivery attempt failed
    RETURNED = "RETURNED"         # Returned to sender
    CANCELLED = "CANCELLED"       # Cancelled

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Tracking
    tracking_number = Column(String(50), unique=True, index=True)
    
    # References
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    bordereau_id = Column(Integer, ForeignKey("bordereaux.id"), nullable=True)
    
    # Customer info (denormalized for courier)
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    customer_city = Column(String(50))
    customer_address = Column(Text)
    
    # Package info
    weight = Column(Float, default=0.5)  # kg
    package_count = Column(Integer, default=1)
    
    # Financial
    cod_amount = Column(Float, default=0)  # Amount to collect
    shipping_cost = Column(Float, default=0)
    collected_amount = Column(Float, default=0)  # Amount actually collected
    
    # Status
    status = Column(String(30), default=ShipmentStatus.PENDING.value)
    status_notes = Column(Text, nullable=True)
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow)
    picked_up_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    
    # Delivery attempts
    delivery_attempts = Column(Integer, default=0)
    last_attempt_date = Column(DateTime, nullable=True)
    last_attempt_notes = Column(Text, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="shipment")
    courier = relationship("Courier", back_populates="shipments")
    bordereau = relationship("Bordereau", back_populates="shipments")
    tracking_history = relationship("ShipmentTracking", back_populates="shipment", order_by="ShipmentTracking.created_at.desc()")
