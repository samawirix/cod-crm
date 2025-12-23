"""
Blacklist model for phone numbers that should be excluded from calls.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLEnum
from enum import Enum
from app.core.database import Base


class BlacklistReason(str, Enum):
    WRONG_NUMBER = "WRONG_NUMBER"
    DO_NOT_CALL = "DO_NOT_CALL"
    FRAUD = "FRAUD"
    SPAM = "SPAM"
    DUPLICATE = "DUPLICATE"
    OTHER = "OTHER"


class Blacklist(Base):
    """
    Phone numbers that should be excluded from call queues.
    Agents should never waste time calling these numbers.
    """
    __tablename__ = "blacklist"

    id = Column(Integer, primary_key=True, index=True)
    
    # Phone number - normalized format
    phone = Column(String(20), unique=True, index=True, nullable=False)
    
    # Reason for blacklisting
    reason = Column(SQLEnum(BlacklistReason), default=BlacklistReason.OTHER)
    
    # Notes about why this was blacklisted
    notes = Column(Text, nullable=True)
    
    # Who added this to blacklist
    added_by = Column(String(100), nullable=True)
    
    # Audit timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Blacklist(phone='{self.phone}', reason='{self.reason}')>"
