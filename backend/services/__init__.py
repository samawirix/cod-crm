"""
Services Package

Business logic layer for the CRM application.
"""

from app.services.lead_service import LeadService
from app.services.exceptions import (
    ServiceException,
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException,
    DatabaseException,
    DuplicateLeadException,
    UserNotFoundException,
    ValidationException
)

__all__ = [
    'LeadService',
    'ServiceException',
    'LeadNotFoundException',
    'PermissionDeniedException',
    'InvalidDataException',
    'DatabaseException',
    'DuplicateLeadException',
    'UserNotFoundException',
    'ValidationException',
]

