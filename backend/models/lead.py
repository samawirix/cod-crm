"""
Lead Model for CRM System

This module defines the Lead model with comprehensive fields for lead management,
including scoring, tracking, and relationship management.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum as PyEnum
import re
import json

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, 
    Index, Text, Enum, CheckConstraint, event
)
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import JSON

from app.models.base import Base


class LeadSource(str, PyEnum):
    """Enumeration for lead sources"""
    WEBSITE = "WEBSITE"
    FACEBOOK = "FACEBOOK"
    INSTAGRAM = "INSTAGRAM"
    WHATSAPP = "WHATSAPP"
    REFERRAL = "REFERRAL"
    OTHER = "OTHER"


class LeadStatus(str, PyEnum):
    """Enumeration for lead status in the sales pipeline"""
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    PROPOSAL = "PROPOSAL"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"
    CALLBACK = "CALLBACK"


class Lead(Base):
    """
    Lead model representing potential customers in the CRM system.
    
    Includes comprehensive tracking of lead information, scoring,
    and relationship management with assigned sales representatives.
    """
    
    __tablename__ = "leads"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(20), nullable=False)
    company = Column(String(255), nullable=True)
    
    # Lead Classification
    source = Column(
        Enum(LeadSource),
        nullable=False,
        default=LeadSource.OTHER
    )
    status = Column(
        Enum(LeadStatus),
        nullable=False,
        default=LeadStatus.NEW,
        index=True
    )
    
    # Assignment and Scoring
    assigned_to = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    lead_score = Column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )
    conversion_probability = Column(
        Float,
        nullable=False,
        default=0.0
    )
    
    # Contact Tracking
    last_contact_date = Column(DateTime, nullable=True)
    next_follow_up = Column(DateTime, nullable=True)
    call_attempts = Column(Integer, nullable=False, default=0)
    
    # Flexible Data Storage
    notes = Column(
        JSON,
        nullable=False,
        default=list
    )
    tags = Column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    assigned_user = relationship(
        "User",
        back_populates="leads",
        foreign_keys=[assigned_to]
    )
    structured_notes = relationship(
        "LeadNote",
        back_populates="lead",
        foreign_keys="LeadNote.lead_id",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            'lead_score >= 0 AND lead_score <= 100',
            name='check_lead_score_range'
        ),
        CheckConstraint(
            'conversion_probability >= 0.0 AND conversion_probability <= 1.0',
            name='check_conversion_probability_range'
        ),
        CheckConstraint(
            'call_attempts >= 0',
            name='check_call_attempts_non_negative'
        ),
        Index('idx_lead_status_created', 'status', 'created_at'),
        Index('idx_lead_assigned_score', 'assigned_to', 'lead_score'),
        Index('idx_lead_score_status', 'lead_score', 'status'),
    )
    
    # Validation Methods
    @validates('email')
    def validate_email(self, key: str, email: str) -> str:
        """
        Validate email format.
        
        Args:
            key: The field name
            email: The email address to validate
            
        Returns:
            The validated email address
            
        Raises:
            ValueError: If email format is invalid
        """
        if not email:
            raise ValueError("Email is required")
        
        # Email regex pattern
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email.strip()):
            raise ValueError(f"Invalid email format: {email}")
        
        return email.strip().lower()
    
    @validates('phone')
    def validate_phone(self, key: str, phone: str) -> str:
        """
        Validate phone number format.
        
        Args:
            key: The field name
            phone: The phone number to validate
            
        Returns:
            The validated phone number
            
        Raises:
            ValueError: If phone format is invalid
        """
        if not phone:
            raise ValueError("Phone number is required")
        
        # Remove common formatting characters
        cleaned_phone = re.sub(r'[\s\-\(\)\.]', '', phone)
        
        # Check if it contains only digits and optional + prefix
        phone_pattern = r'^\+?[0-9]{7,15}$'
        
        if not re.match(phone_pattern, cleaned_phone):
            raise ValueError(
                f"Invalid phone format: {phone}. "
                "Phone must be 7-15 digits, optionally starting with +"
            )
        
        return cleaned_phone
    
    @validates('first_name', 'last_name')
    def validate_name(self, key: str, value: str) -> str:
        """
        Validate name fields.
        
        Args:
            key: The field name
            value: The name to validate
            
        Returns:
            The validated name
            
        Raises:
            ValueError: If name is empty or invalid
        """
        if not value or not value.strip():
            raise ValueError(f"{key.replace('_', ' ').title()} is required")
        
        return value.strip()
    
    @validates('lead_score')
    def validate_lead_score(self, key: str, score: int) -> int:
        """
        Validate lead score is within valid range.
        
        Args:
            key: The field name
            score: The score to validate
            
        Returns:
            The validated score
            
        Raises:
            ValueError: If score is out of range
        """
        if score < 0 or score > 100:
            raise ValueError("Lead score must be between 0 and 100")
        
        return score
    
    @validates('conversion_probability')
    def validate_conversion_probability(self, key: str, probability: float) -> float:
        """
        Validate conversion probability is within valid range.
        
        Args:
            key: The field name
            probability: The probability to validate
            
        Returns:
            The validated probability
            
        Raises:
            ValueError: If probability is out of range
        """
        if probability < 0.0 or probability > 1.0:
            raise ValueError("Conversion probability must be between 0.0 and 1.0")
        
        return probability
    
    @validates('tags')
    def validate_tags(self, key: str, tags: Any) -> List[str]:
        """
        Validate and normalize tags.
        
        Args:
            key: The field name
            tags: The tags to validate
            
        Returns:
            The validated tags list
        """
        if tags is None:
            return []
        
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except json.JSONDecodeError:
                tags = [tags]
        
        if not isinstance(tags, list):
            raise ValueError("Tags must be a list")
        
        # Ensure all tags are strings
        return [str(tag).strip() for tag in tags if tag]
    
    @validates('notes')
    def validate_notes(self, key: str, notes: Any) -> List[Dict[str, Any]]:
        """
        Validate and normalize notes.
        
        Args:
            key: The field name
            notes: The notes to validate
            
        Returns:
            The validated notes list
        """
        if notes is None:
            return []
        
        if isinstance(notes, str):
            try:
                notes = json.loads(notes)
            except json.JSONDecodeError:
                # Convert single string to note entry
                return [{
                    'content': notes,
                    'created_at': datetime.utcnow().isoformat(),
                    'created_by': None
                }]
        
        if not isinstance(notes, list):
            raise ValueError("Notes must be a list")
        
        return notes
    
    # Properties
    @hybrid_property
    def days_since_created(self) -> Optional[int]:
        """
        Calculate the number of days since the lead was created.
        
        Returns:
            Number of days since creation, or None if created_at is not set
        """
        if not self.created_at:
            return None
        
        delta = datetime.utcnow() - self.created_at
        return delta.days
    
    @hybrid_property
    def days_since_last_contact(self) -> Optional[int]:
        """
        Calculate the number of days since the last contact.
        
        Returns:
            Number of days since last contact, or None if never contacted
        """
        if not self.last_contact_date:
            return None
        
        delta = datetime.utcnow() - self.last_contact_date
        return delta.days
    
    @hybrid_property
    def is_hot_lead(self) -> bool:
        """
        Determine if this is a hot lead based on lead score.
        
        A hot lead has a score greater than 70.
        
        Returns:
            True if lead score > 70, False otherwise
        """
        return self.lead_score > 70
    
    @hybrid_property
    def full_name(self) -> str:
        """
        Get the full name of the lead.
        
        Returns:
            Combined first and last name
        """
        return f"{self.first_name} {self.last_name}"
    
    # Helper Methods
    def add_note(
        self,
        content: str,
        created_by: Optional[int] = None,
        note_type: str = "general"
    ) -> None:
        """
        Add a note to the lead's history.
        
        Args:
            content: The note content
            created_by: User ID of the note creator
            note_type: Type of note (general, call, email, meeting, etc.)
        """
        if not isinstance(self.notes, list):
            self.notes = []
        
        note_entry = {
            'content': content,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': created_by,
            'type': note_type
        }
        
        # Create a new list to trigger SQLAlchemy change detection
        self.notes = self.notes + [note_entry]
    
    def add_tag(self, tag: str) -> None:
        """
        Add a tag to the lead.
        
        Args:
            tag: The tag to add
        """
        if not isinstance(self.tags, list):
            self.tags = []
        
        tag = tag.strip().lower()
        
        if tag and tag not in self.tags:
            # Create a new list to trigger SQLAlchemy change detection
            self.tags = self.tags + [tag]
    
    def remove_tag(self, tag: str) -> None:
        """
        Remove a tag from the lead.
        
        Args:
            tag: The tag to remove
        """
        if not isinstance(self.tags, list):
            return
        
        tag = tag.strip().lower()
        
        if tag in self.tags:
            # Create a new list to trigger SQLAlchemy change detection
            self.tags = [t for t in self.tags if t != tag]
    
    def increment_call_attempts(self) -> None:
        """Increment the call attempts counter."""
        self.call_attempts += 1
        self.last_contact_date = datetime.utcnow()
    
    def update_score(self, new_score: int) -> None:
        """
        Update the lead score.
        
        Args:
            new_score: The new score (0-100)
        """
        if new_score < 0 or new_score > 100:
            raise ValueError("Lead score must be between 0 and 100")
        
        self.lead_score = new_score
    
    def __repr__(self) -> str:
        """String representation of the Lead."""
        return (
            f"<Lead(id={self.id}, "
            f"name='{self.full_name}', "
            f"email='{self.email}', "
            f"status={self.status.value}, "
            f"score={self.lead_score})>"
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the Lead to a dictionary.
        
        Returns:
            Dictionary representation of the lead
        """
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'source': self.source.value if self.source else None,
            'status': self.status.value if self.status else None,
            'assigned_to': self.assigned_to,
            'lead_score': self.lead_score,
            'conversion_probability': self.conversion_probability,
            'last_contact_date': self.last_contact_date.isoformat() if self.last_contact_date else None,
            'next_follow_up': self.next_follow_up.isoformat() if self.next_follow_up else None,
            'call_attempts': self.call_attempts,
            'notes': self.notes,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'days_since_created': self.days_since_created,
            'days_since_last_contact': self.days_since_last_contact,
            'is_hot_lead': self.is_hot_lead,
        }


# Event Listeners
@event.listens_for(Lead, 'before_insert')
def receive_before_insert(mapper, connection, target):
    """
    Event listener for before insert.
    Ensures default values are properly set.
    """
    if target.notes is None:
        target.notes = []
    if target.tags is None:
        target.tags = []


@event.listens_for(Lead, 'before_update')
def receive_before_update(mapper, connection, target):
    """
    Event listener for before update.
    Updates the updated_at timestamp.
    """
    target.updated_at = datetime.utcnow()

