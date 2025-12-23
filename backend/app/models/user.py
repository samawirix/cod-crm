"""
User Model for CRM System

This module defines the User model for system users/sales representatives.
"""

from datetime import datetime
from typing import List
import enum

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"           # Full access
    MANAGER = "manager"       # Can manage agents, view reports
    AGENT = "agent"           # Can handle leads and calls
    FULFILLMENT = "fulfillment"  # Can manage orders and shipping
    VIEWER = "viewer"         # Read-only access


class User(Base):
    """
    User model representing system users (sales representatives, managers, etc.)
    """
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    username = Column(String(100), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    
    # Role & Permissions
    role = Column(String(50), default=UserRole.AGENT.value)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False)
    
    # Stats
    leads_assigned = Column(Integer, default=0)
    leads_converted = Column(Integer, default=0)
    calls_made = Column(Integer, default=0)
    orders_created = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    last_login = Column(DateTime, nullable=True)
    
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
    call_notes = relationship("CallNote", back_populates="agent")
    
    def __repr__(self) -> str:
        """String representation of the User."""
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
    
    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN.value or self.is_superuser
    
    @property
    def is_manager(self):
        return self.role in [UserRole.ADMIN.value, UserRole.MANAGER.value] or self.is_superuser
    
    @property
    def can_manage_users(self):
        return self.role in [UserRole.ADMIN.value, UserRole.MANAGER.value] or self.is_superuser
    
    @property
    def can_view_reports(self):
        return self.role in [UserRole.ADMIN.value, UserRole.MANAGER.value] or self.is_superuser
    
    @property
    def conversion_rate(self):
        if self.leads_assigned and self.leads_assigned > 0:
            return round((self.leads_converted / self.leads_assigned) * 100, 2)
        return 0.0
