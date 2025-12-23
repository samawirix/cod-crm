"""
Schemas Package

Pydantic schemas for request/response validation.
"""

from app.schemas.lead import (
    CreateLeadSchema,
    UpdateLeadSchema,
    BulkUpdateStatusSchema,
    AssignLeadsSchema,
    LeadResponseSchema,
    LeadListResponseSchema,
    LeadStatisticsSchema,
    BulkOperationResponseSchema,
    AssignLeadsResponseSchema,
    DeleteLeadResponseSchema,
    ErrorResponseSchema,
    PageInfo
)
from app.schemas.lead_note import (
    CreateLeadNoteSchema,
    UpdateLeadNoteSchema,
    LeadNoteResponseSchema,
    LeadNotesListResponseSchema,
    DeleteNoteResponseSchema,
    UserInfoSchema
)

__all__ = [
    'CreateLeadSchema',
    'UpdateLeadSchema',
    'BulkUpdateStatusSchema',
    'AssignLeadsSchema',
    'LeadResponseSchema',
    'LeadListResponseSchema',
    'LeadStatisticsSchema',
    'BulkOperationResponseSchema',
    'AssignLeadsResponseSchema',
    'DeleteLeadResponseSchema',
    'ErrorResponseSchema',
    'PageInfo',
    'CreateLeadNoteSchema',
    'UpdateLeadNoteSchema',
    'LeadNoteResponseSchema',
    'LeadNotesListResponseSchema',
    'DeleteNoteResponseSchema',
    'UserInfoSchema',
]

