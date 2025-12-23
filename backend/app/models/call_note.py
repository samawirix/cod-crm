from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class CallNote(Base):
    __tablename__ = "call_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Agent who made the call
    outcome = Column(String(50), nullable=False)  # CONFIRMED, NO_ANSWER, CALLBACK, etc.
    duration = Column(Integer, default=0)  # Duration in seconds
    notes = Column(Text, nullable=True)
    callback_scheduled = Column(DateTime, nullable=True)  # For callback scheduling
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships - explicitly specify foreign_keys
    lead = relationship("Lead", back_populates="call_notes")
    agent = relationship("User", back_populates="call_notes", foreign_keys=[user_id])
