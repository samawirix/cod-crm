from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ShipmentTracking(Base):
    __tablename__ = "shipment_tracking"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    
    status = Column(String(30), nullable=False)
    location = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    updated_by = Column(String(100), nullable=True)  # Agent name or system
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    shipment = relationship("Shipment", back_populates="tracking_history")
