from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Courier(Base):
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)  # AMANA, CTM, etc.
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    
    # Pricing
    base_rate = Column(Float, default=0)  # Base shipping cost
    cod_fee_percent = Column(Float, default=0)  # COD collection fee %
    
    # Performance tracking
    total_shipments = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    returned_count = Column(Integer, default=0)
    avg_delivery_days = Column(Float, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shipments = relationship("Shipment", back_populates="courier")
    bordereaux = relationship("Bordereau", back_populates="courier")
