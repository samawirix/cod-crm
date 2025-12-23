"""
User Model for CRM System

This module defines the User model for system users/sales representatives.
"""

from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.models.base import Base


class User(Base):
    """
    User model representing system users (sales representatives, managers, etc.)
    """
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    leads = relationship(
        "Lead",
        back_populates="assigned_user",
        foreign_keys="Lead.assigned_to"
    )
    lead_notes = relationship(
        "LeadNote",
        back_populates="user",
        foreign_keys="LeadNote.user_id"
    )
    
    def __repr__(self) -> str:
        """String representation of the User."""
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

