"""
LeadNote Pydantic Schemas

Request and response schemas for lead note API endpoints.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.models.lead_note import NoteType


# Request Schemas

class CreateLeadNoteSchema(BaseModel):
    """Schema for creating a new lead note."""
    
    note_type: NoteType = Field(default=NoteType.NOTE, description="Type of note")
    content: str = Field(..., min_length=1, max_length=10000, description="Note content")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "note_type": "CALL",
                    "content": "Called customer to discuss premium plan. Very interested.",
                    "metadata": {
                        "duration": 15,
                        "outcome": "positive",
                        "next_action": "send proposal"
                    }
                },
                {
                    "note_type": "EMAIL",
                    "content": "Sent proposal for annual subscription.",
                    "metadata": {
                        "subject": "Annual Plan Proposal",
                        "direction": "outbound"
                    }
                },
                {
                    "note_type": "MEETING",
                    "content": "Product demo completed. Customer impressed with features.",
                    "metadata": {
                        "duration": 60,
                        "location": "Zoom",
                        "attendees": ["John Doe", "Jane Smith"]
                    }
                }
            ]
        }
    }


class UpdateLeadNoteSchema(BaseModel):
    """Schema for updating an existing lead note."""
    
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "Updated note content with additional details.",
                "metadata": {
                    "updated_reason": "Added follow-up information"
                }
            }
        }
    }


# Response Schemas

class UserInfoSchema(BaseModel):
    """Schema for user information in note responses."""
    
    id: int
    username: str
    full_name: str
    
    model_config = {"from_attributes": True}


class LeadNoteResponseSchema(BaseModel):
    """Schema for lead note response."""
    
    id: int
    lead_id: int
    user_id: Optional[int] = None
    note_type: str
    content: str
    metadata: Dict[str, Any]
    created_at: datetime
    last_modified: Optional[datetime] = None
    
    # Computed fields
    user: Optional[UserInfoSchema] = None
    time_ago: Optional[str] = None  # Human-readable time difference
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "lead_id": 123,
                "user_id": 5,
                "note_type": "CALL",
                "content": "Follow-up call completed successfully",
                "metadata": {
                    "duration": 15,
                    "outcome": "positive"
                },
                "created_at": "2025-10-18T10:00:00",
                "last_modified": None,
                "user": {
                    "id": 5,
                    "username": "agent1",
                    "full_name": "Agent One"
                },
                "time_ago": "2 hours ago"
            }
        }
    }


class LeadNotesListResponseSchema(BaseModel):
    """Schema for list of lead notes."""
    
    total: int = Field(..., description="Total number of notes")
    notes: list[LeadNoteResponseSchema] = Field(..., description="List of notes")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 5,
                "notes": []
            }
        }
    }


class DeleteNoteResponseSchema(BaseModel):
    """Schema for delete note response."""
    
    message: str = Field(..., description="Success message")
    note_id: int = Field(..., description="ID of deleted note")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Note deleted successfully",
                "note_id": 123
            }
        }
    }

