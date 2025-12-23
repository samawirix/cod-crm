"""
LeadNote Model

Model for tracking individual notes/interactions with leads.
Separate from the embedded notes JSON field in Lead model.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON

from app.core.database import Base


class NoteType(str, PyEnum):
    """Enumeration for note types"""
    CALL = "CALL"
    EMAIL = "EMAIL"
    MEETING = "MEETING"
    STATUS_CHANGE = "STATUS_CHANGE"
    NOTE = "NOTE"


class LeadNote(Base):
    """
    LeadNote model for tracking interactions and notes with leads.
    
    Provides a structured way to track all interactions with leads,
    including calls, emails, meetings, and general notes.
    """
    
    __tablename__ = "lead_notes"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    lead_id = Column(
        Integer,
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Note Information
    note_type = Column(
        String(50),
        nullable=False,
        default=NoteType.NOTE.value,
        index=True
    )
    content = Column(Text, nullable=False)
    
    # Metadata - stores type-specific information
    # For CALL: {duration: int, outcome: str, next_action: str}
    # For EMAIL: {subject: str, direction: "inbound/outbound"}
    # For MEETING: {duration: int, location: str, attendees: []}
    # For STATUS_CHANGE: {old_status: str, new_status: str}
    note_metadata = Column(JSON, nullable=True, default=dict)
    
    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )
    last_modified = Column(
        DateTime,
        nullable=True,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    lead = relationship(
        "Lead",
        back_populates="structured_notes",
        foreign_keys=[lead_id]
    )
    user = relationship(
        "User",
        back_populates="lead_notes",
        foreign_keys=[user_id]
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_lead_note_lead_created', 'lead_id', 'created_at'),
        Index('idx_lead_note_user_created', 'user_id', 'created_at'),
        Index('idx_lead_note_type', 'note_type'),
    )
    
    def __repr__(self) -> str:
        """String representation of the LeadNote."""
        return (
            f"<LeadNote(id={self.id}, "
            f"lead_id={self.lead_id}, "
            f"type={self.note_type}, "
            f"user_id={self.user_id})>"
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the LeadNote to a dictionary.
        
        Returns:
            Dictionary representation of the note
        """
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'user_id': self.user_id,
            'note_type': self.note_type,
            'content': self.content,
            'metadata': self.note_metadata or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_modified': self.last_modified.isoformat() if self.last_modified else None,
        }

