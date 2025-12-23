"""
Models Package

This module exports all database models for the CRM system.
"""

from app.models.base import Base
from app.models.user import User
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.lead_note import LeadNote, NoteType

__all__ = [
    'Base',
    'User',
    'Lead',
    'LeadSource',
    'LeadStatus',
    'LeadNote',
    'NoteType',
]

