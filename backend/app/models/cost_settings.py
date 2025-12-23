"""
System Cost Settings Model (Singleton)

Stores all operational costs for profit calculation.
Only ONE row should exist in this table.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime

from app.core.database import Base


class SystemCostSettings(Base):
    """
    Singleton model - only ONE row should exist.
    Stores all operational costs for profit calculation.
    """
    __tablename__ = "system_cost_settings"
    
    id = Column(Integer, primary_key=True, default=1)
    
    # Shipping & Logistics
    default_shipping_cost = Column(Float, default=35.0)  # Cost paid to courier
    packaging_cost = Column(Float, default=3.0)  # Box, tape, materials
    return_shipping_cost = Column(Float, default=35.0)  # Cost when order returns
    
    # Agent Commissions
    agent_confirmation_fee = Column(Float, default=5.0)  # Per confirmed order
    agent_delivery_fee = Column(Float, default=10.0)  # Bonus per delivered
    agent_return_penalty = Column(Float, default=0.0)  # Optional penalty
    
    # Other Costs
    payment_gateway_fee_percent = Column(Float, default=0.0)  # % of COD
    other_fixed_fees = Column(Float, default=0.0)  # Misc fees per order
    
    # COD Fees (some couriers charge % of COD amount)
    cod_collection_fee_percent = Column(Float, default=0.0)  # % of collected amount
    
    # Metadata
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    
    # Business Info (for labels/invoices)
    company_name = Column(String(255), default="COD Express")
    company_phone = Column(String(50), default="+212 600 000 000")
    company_address = Column(String(500), nullable=True)

    @classmethod
    def get_settings(cls, db):
        """Get or create the singleton settings row"""
        settings = db.query(cls).first()
        if not settings:
            settings = cls(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings
    
    def __repr__(self):
        return f"<SystemCostSettings shipping={self.default_shipping_cost} MAD>"
