"""
Lead Pydantic Schemas

Request and response schemas for lead API endpoints.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

from app.models.lead import LeadSource, LeadStatus


# Request Schemas

class CreateLeadSchema(BaseModel):
    """Schema for creating a new lead."""
    
    first_name: str = Field(..., min_length=1, max_length=100, description="Lead's first name")
    last_name: Optional[str] = Field(None, max_length=100, description="Lead's last name")
    email: Optional[EmailStr] = Field(None, description="Lead's email address")
    phone: str = Field(..., min_length=7, max_length=20, description="Lead's phone number")
    alternate_phone: Optional[str] = Field(None, max_length=20, description="Lead's alternate phone")
    company: Optional[str] = Field(None, max_length=255, description="Lead's company")
    
    # Location
    city: Optional[str] = Field(None, max_length=100, description="Lead's city")
    address: Optional[str] = Field(None, description="Lead's address")
    
    # Product Information
    product_interest: Optional[str] = Field(None, max_length=255, description="Product of interest")
    quantity: Optional[int] = Field(1, ge=1, description="Quantity")
    unit_price: Optional[float] = Field(0.0, ge=0.0, description="Unit price")
    
    # Lead Classification
    source: LeadSource = Field(default=LeadSource.OTHER, description="Lead source")
    status: Optional[LeadStatus] = Field(default=LeadStatus.NEW, description="Lead status")
    assigned_to: Optional[int] = Field(None, description="Assigned user ID")
    lead_score: Optional[int] = Field(None, ge=0, le=100, description="Lead score (0-100)")
    conversion_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Conversion probability")
    tags: Optional[List[str]] = Field(default_factory=list, description="Lead tags")
    notes: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Initial notes")
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format."""
        # Remove common formatting
        cleaned = re.sub(r'[\s\-\(\)\.]', '', v)
        
        # Check format
        if not re.match(r'^\+?[0-9]{7,15}$', cleaned):
            raise ValueError('Phone must be 7-15 digits, optionally starting with +')
        
        return cleaned
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "company": "Example Corp",
                "source": "WEBSITE",
                "tags": ["interested", "tech-industry"]
            }
        }
    }


class UpdateLeadSchema(BaseModel):
    """Schema for updating an existing lead."""
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    alternate_phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    
    # Location
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    
    # Product Information
    product_interest: Optional[str] = Field(None, max_length=255)
    quantity: Optional[int] = Field(None, ge=1)
    unit_price: Optional[float] = Field(None, ge=0.0)
    
    # Lead Classification
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assigned_to: Optional[int] = None
    lead_score: Optional[int] = Field(None, ge=0, le=100)
    conversion_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    call_attempts: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    notes: Optional[List[Dict[str, Any]]] = None
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format."""
        if v is None:
            return v
        
        cleaned = re.sub(r'[\s\-\(\)\.]', '', v)
        
        if not re.match(r'^\+?[0-9]{7,15}$', cleaned):
            raise ValueError('Phone must be 7-15 digits, optionally starting with +')
        
        return cleaned
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "CONTACTED",
                "lead_score": 85,
                "notes": [
                    {
                        "content": "Follow-up call completed",
                        "type": "call"
                    }
                ]
            }
        }
    }


class BulkUpdateLeadsSchema(BaseModel):
    """Schema for bulk updating leads."""
    
    lead_ids: List[int] = Field(..., min_length=1, description="List of lead IDs to update")
    updates: UpdateLeadSchema = Field(..., description="Updates to apply")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "lead_ids": [1, 2, 3, 4, 5],
                "updates": {
                    "status": "CONTACTED",
                    "tags": ["contacted"]
                }
            }
        }
    }


class BulkUpdateStatusSchema(BaseModel):
    """Schema for bulk status updates."""
    
    lead_ids: List[int] = Field(..., min_length=1, description="List of lead IDs")
    new_status: LeadStatus = Field(..., description="New status to set")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "lead_ids": [1, 2, 3],
                "new_status": "CONTACTED"
            }
        }
    }


class AssignLeadsSchema(BaseModel):
    """Schema for assigning leads to an agent."""
    
    lead_ids: List[int] = Field(..., min_length=1, description="List of lead IDs to assign")
    agent_id: int = Field(..., description="Agent user ID to assign leads to")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "lead_ids": [1, 2, 3, 4],
                "agent_id": 5
            }
        }
    }


# Response Schemas

class LeadNoteSchema(BaseModel):
    """Schema for a lead note."""
    
    content: str
    created_at: str
    created_by: Optional[int] = None
    type: str = "general"
    
    model_config = {"from_attributes": True}


class LeadResponseSchema(BaseModel):
    """Schema for lead response."""
    
    id: int
    first_name: str
    last_name: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: str
    alternate_phone: Optional[str] = None
    company: Optional[str] = None
    
    # Location
    city: Optional[str] = None
    address: Optional[str] = None
    
    # Product Information
    product_interest: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    total_amount: float = 0.0
    
    # Lead Classification
    source: str
    status: str
    assigned_to: Optional[int] = None
    lead_score: int
    conversion_probability: float
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    call_attempts: int
    notes: List[Dict[str, Any]]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    days_since_created: Optional[int] = None
    days_since_last_contact: Optional[int] = None
    is_hot_lead: bool
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "first_name": "John",
                "last_name": "Doe",
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "company": "Example Corp",
                "source": "WEBSITE",
                "status": "NEW",
                "assigned_to": 5,
                "lead_score": 75,
                "conversion_probability": 0.6,
                "call_attempts": 0,
                "notes": [],
                "tags": ["interested"],
                "created_at": "2025-10-18T10:00:00",
                "updated_at": "2025-10-18T10:00:00",
                "days_since_created": 0,
                "days_since_last_contact": None,
                "is_hot_lead": True
            }
        }
    }
    
    @classmethod
    def from_lead(cls, lead):
        """Create response from Lead model."""
        return cls(
            id=lead.id,
            first_name=lead.first_name,
            last_name=lead.last_name,
            full_name=lead.full_name,
            email=lead.email,
            phone=lead.phone,
            alternate_phone=lead.alternate_phone,
            company=lead.company,
            city=lead.city,
            address=lead.address,
            product_interest=lead.product_interest,
            quantity=lead.quantity or 1,
            unit_price=lead.unit_price or 0.0,
            total_amount=lead.total_amount or 0.0,
            source=lead.source.value,
            status=lead.status.value,
            assigned_to=lead.assigned_to,
            lead_score=lead.lead_score,
            conversion_probability=lead.conversion_probability,
            last_contact_date=lead.last_contact_date,
            next_follow_up=lead.next_follow_up,
            call_attempts=lead.call_attempts,
            notes=lead.notes or [],
            tags=lead.tags or [],
            created_at=lead.created_at,
            updated_at=lead.updated_at,
            days_since_created=lead.days_since_created,
            days_since_last_contact=lead.days_since_last_contact,
            is_hot_lead=lead.is_hot_lead
        )


class PageInfo(BaseModel):
    """Pagination information."""
    
    total: int = Field(..., description="Total number of records")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum records per page")
    has_more: bool = Field(..., description="Whether more records exist")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 150,
                "skip": 0,
                "limit": 50,
                "has_more": True
            }
        }
    }


class LeadListResponseSchema(BaseModel):
    """Schema for paginated lead list response."""
    
    total: int = Field(..., description="Total number of leads")
    leads: List[LeadResponseSchema] = Field(..., description="List of leads")
    page_info: PageInfo = Field(..., description="Pagination information")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 150,
                "leads": [],
                "page_info": {
                    "total": 150,
                    "skip": 0,
                    "limit": 50,
                    "has_more": True
                }
            }
        }
    }


class LeadStatisticsSchema(BaseModel):
    """Schema for lead statistics."""
    
    total_leads: int
    average_lead_score: float
    hot_leads_count: int
    conversion_rate: float
    leads_by_status: Dict[str, int]
    leads_by_source: Dict[str, int]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_leads": 150,
                "average_lead_score": 68.5,
                "hot_leads_count": 45,
                "conversion_rate": 15.5,
                "leads_by_status": {
                    "NEW": 30,
                    "CONTACTED": 40,
                    "QUALIFIED": 25,
                    "WON": 23
                },
                "leads_by_source": {
                    "WEBSITE": 50,
                    "REFERRAL": 40,
                    "FACEBOOK": 30
                }
            }
        }
    }


class BulkOperationResponseSchema(BaseModel):
    """Schema for bulk operation response."""
    
    updated_count: int = Field(..., description="Number of leads updated")
    lead_ids: List[int] = Field(..., description="IDs of updated leads")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "updated_count": 5,
                "lead_ids": [1, 2, 3, 4, 5]
            }
        }
    }


class AssignLeadsResponseSchema(BaseModel):
    """Schema for assign leads response."""
    
    assigned_count: int = Field(..., description="Number of leads assigned")
    lead_ids: List[int] = Field(..., description="IDs of assigned leads")
    agent_id: int = Field(..., description="Agent ID assigned to")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "assigned_count": 5,
                "lead_ids": [1, 2, 3, 4, 5],
                "agent_id": 10
            }
        }
    }


class DeleteLeadResponseSchema(BaseModel):
    """Schema for delete lead response."""
    
    message: str = Field(..., description="Success message")
    lead_id: int = Field(..., description="ID of deleted lead")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Lead deleted successfully",
                "lead_id": 123
            }
        }
    }


class ErrorResponseSchema(BaseModel):
    """Schema for error responses."""
    
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "detail": "Lead not found",
                "error_code": "LEAD_NOT_FOUND"
            }
        }
    }

