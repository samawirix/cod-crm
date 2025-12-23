"""
Transaction Model for Financial Analytics
Tracks revenue and expense transactions
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class Transaction(Base):
    """Financial transaction model for revenue and expense tracking"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Transaction details
    type = Column(String(50), nullable=False)  # 'revenue' or 'expense'
    category = Column(String(100), nullable=False)  # 'order_revenue', 'shipping', 'marketing', etc.
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    
    # References (stored as integers, no ORM relationship to avoid circular import issues)
    order_id = Column(Integer, nullable=True)  # Reference to orders.id
    
    # Metadata
    transaction_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_by = Column(Integer, nullable=True)  # Reference to users.id
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Transaction {self.type} {self.category}: {self.amount}>"
