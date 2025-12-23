"""
Service Layer Exceptions

Custom exceptions for business logic and service operations.
"""


class ServiceException(Exception):
    """Base exception for service layer errors."""
    
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class LeadNotFoundException(ServiceException):
    """Raised when a lead is not found."""
    pass


class PermissionDeniedException(ServiceException):
    """Raised when a user doesn't have permission for an operation."""
    pass


class InvalidDataException(ServiceException):
    """Raised when input data is invalid."""
    pass


class DatabaseException(ServiceException):
    """Raised when a database operation fails."""
    pass


class DuplicateLeadException(ServiceException):
    """Raised when attempting to create a duplicate lead."""
    pass


class UserNotFoundException(ServiceException):
    """Raised when a user is not found."""
    pass


class ValidationException(ServiceException):
    """Raised when data validation fails."""
    pass

