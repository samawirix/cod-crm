"""
Leads API Endpoints

FastAPI router for lead management endpoints.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.lead import LeadSource, LeadStatus
from app.services import LeadService
from app.services.exceptions import (
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException,
    DatabaseException
)
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
from app.api.dependencies import get_db, get_current_user


# Create router
router = APIRouter(
    prefix="/api/v1/leads",
    tags=["leads"],
    responses={
        401: {"model": ErrorResponseSchema, "description": "Unauthorized"},
        403: {"model": ErrorResponseSchema, "description": "Forbidden"},
        404: {"model": ErrorResponseSchema, "description": "Not Found"},
        500: {"model": ErrorResponseSchema, "description": "Internal Server Error"}
    }
)


@router.get(
    "",
    response_model=LeadListResponseSchema,
    summary="Get all leads",
    description="Retrieve leads with advanced filtering, pagination, and sorting"
)
async def get_leads(
    status: Optional[LeadStatus] = Query(None, description="Filter by lead status"),
    source: Optional[LeadSource] = Query(None, description="Filter by lead source"),
    assigned_to: Optional[int] = Query(None, description="Filter by assigned user ID"),
    search: Optional[str] = Query(None, description="Search in name, email, phone, company"),
    date_from: Optional[datetime] = Query(None, description="Filter leads created after this date"),
    date_to: Optional[datetime] = Query(None, description="Filter leads created before this date"),
    score_min: Optional[int] = Query(None, ge=0, le=100, description="Minimum lead score"),
    score_max: Optional[int] = Query(None, ge=0, le=100, description="Maximum lead score"),
    is_hot_leads_only: bool = Query(False, description="Show only hot leads (score > 70)"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order (asc/desc)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadListResponseSchema:
    """
    Get leads with advanced filtering and pagination.
    
    **Features:**
    - Filter by status, source, assigned user
    - Search across multiple fields
    - Date range filtering
    - Lead score range filtering
    - Hot leads filter
    - Tag-based filtering
    - Flexible sorting
    - Pagination support
    
    **Example Request:**
    ```
    GET /api/v1/leads?status=NEW&score_min=70&skip=0&limit=20&sort_by=lead_score&sort_order=desc
    ```
    
    **Example Response:**
    ```json
    {
        "total": 45,
        "leads": [
            {
                "id": 1,
                "first_name": "Ahmed",
                "last_name": "Hassan",
                "full_name": "Ahmed Hassan",
                "email": "ahmed.hassan@example.com",
                "phone": "+212600000000",
                "company": "TechCorp Morocco",
                "source": "WEBSITE",
                "status": "NEW",
                "assigned_to": null,
                "lead_score": 75,
                "conversion_probability": 0.0,
                "last_contact_date": null,
                "next_follow_up": null,
                "call_attempts": 0,
                "notes": [],
                "tags": ["enterprise", "tech"],
                "created_at": "2025-10-18T10:00:00",
                "updated_at": "2025-10-18T10:00:00",
                "days_since_created": 0,
                "days_since_last_contact": null,
                "is_hot_lead": true
            }
        ],
        "page_info": {
            "total": 45,
            "skip": 0,
            "limit": 20,
            "has_more": true
        }
    }
    ```
    """
    try:
        leads, total = await LeadService.get_leads(
            db=db,
            status=status,
            source=source,
            assigned_to=assigned_to,
            date_range_start=date_from,
            date_range_end=date_to,
            lead_score_min=score_min,
            lead_score_max=score_max,
            search=search,
            is_hot_leads_only=is_hot_leads_only,
            tags=tags,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Convert leads to response schema
        lead_responses = [LeadResponseSchema.from_lead(lead) for lead in leads]
        
        # Build page info
        page_info = PageInfo(
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(leads)) < total
        )
        
        # Example Response:
        # {
        #   "total": 150,
        #   "leads": [
        #     {
        #       "id": 1,
        #       "full_name": "John Doe",
        #       "email": "john@example.com",
        #       "status": "NEW",
        #       "lead_score": 75,
        #       "is_hot_lead": true,
        #       ...
        #     }
        #   ],
        #   "page_info": {
        #     "total": 150,
        #     "skip": 0,
        #     "limit": 50,
        #     "has_more": true
        #   }
        # }
        
        return LeadListResponseSchema(
            total=total,
            leads=lead_responses,
            page_info=page_info
        )
        
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/{lead_id}",
    response_model=LeadResponseSchema,
    summary="Get lead by ID",
    description="Retrieve full details of a specific lead including history"
)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadResponseSchema:
    """
    Get a specific lead by ID.
    
    **Returns:**
    - Full lead details including:
      - Basic information
      - Assignment details
      - Lead score and conversion probability
      - Complete note history
      - Tags
      - Timestamps and calculated fields
    
    **Example Request:**
    ```
    GET /api/v1/leads/123
    ```
    
    **Example Response:**
    ```json
    {
        "id": 123,
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "full_name": "Ahmed Hassan",
        "email": "ahmed@example.com",
        "phone": "+212600000000",
        "company": "TechCorp",
        "source": "WEBSITE",
        "status": "CONTACTED",
        "assigned_to": 5,
        "lead_score": 85,
        "conversion_probability": 0.7,
        "last_contact_date": "2025-10-18T14:00:00",
        "next_follow_up": "2025-10-20T10:00:00",
        "call_attempts": 2,
        "notes": [
            {
                "content": "Initial contact made",
                "created_at": "2025-10-18T14:00:00",
                "created_by": 5,
                "type": "call"
            }
        ],
        "tags": ["interested", "high-priority"],
        "created_at": "2025-10-18T10:00:00",
        "updated_at": "2025-10-18T14:30:00",
        "days_since_created": 0,
        "days_since_last_contact": 0,
        "is_hot_lead": true
    }
    ```
    """
    try:
        lead = await LeadService.get_lead_by_id(
            db=db,
            lead_id=lead_id,
            user_id=current_user.id,
            check_assignment=False  # Allow all authenticated users to view
        )
        
        # Example Response:
        # {
        #   "id": 123,
        #   "first_name": "John",
        #   "last_name": "Doe",
        #   "full_name": "John Doe",
        #   "email": "john@example.com",
        #   "phone": "+1234567890",
        #   "company": "Example Corp",
        #   "source": "WEBSITE",
        #   "status": "CONTACTED",
        #   "assigned_to": 5,
        #   "lead_score": 85,
        #   "conversion_probability": 0.7,
        #   "last_contact_date": "2025-10-18T14:00:00",
        #   "next_follow_up": "2025-10-20T10:00:00",
        #   "call_attempts": 2,
        #   "notes": [...],
        #   "tags": ["interested", "high-priority"],
        #   "created_at": "2025-10-18T10:00:00",
        #   "updated_at": "2025-10-18T14:30:00",
        #   "days_since_created": 0,
        #   "days_since_last_contact": 0,
        #   "is_hot_lead": true
        # }
        
        return LeadResponseSchema.from_lead(lead)
        
    except LeadNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except PermissionDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post(
    "",
    response_model=LeadResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
    description="Create a new lead with automatic lead scoring"
)
async def create_lead(
    lead_data: CreateLeadSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadResponseSchema:
    """
    Create a new lead.
    
    **Features:**
    - Automatic lead scoring based on source, email, company, tags
    - Email and phone validation
    - Automatic creation note
    - Optional assignment to user
    
    **Example Request:**
    ```json
    {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "company": "Example Corp",
        "source": "WEBSITE",
        "tags": ["interested", "tech-industry"]
    }
    ```
    """
    try:
        # Convert Pydantic model to dict
        lead_dict = lead_data.model_dump(exclude_unset=True)
        
        # Create lead
        lead = await LeadService.create_lead(
            db=db,
            lead_data=lead_dict,
            user_id=current_user.id
        )
        
        # Example Response (201 Created):
        # {
        #   "id": 124,
        #   "first_name": "Jane",
        #   "last_name": "Smith",
        #   "full_name": "Jane Smith",
        #   "email": "jane@example.com",
        #   "phone": "+9876543210",
        #   "company": null,
        #   "source": "REFERRAL",
        #   "status": "NEW",
        #   "assigned_to": null,
        #   "lead_score": 70,  # Auto-calculated based on source, email, etc.
        #   "conversion_probability": 0.0,
        #   "is_hot_lead": false,
        #   "created_at": "2025-10-18T15:00:00",
        #   "updated_at": "2025-10-18T15:00:00"
        # }
        
        return LeadResponseSchema.from_lead(lead)
        
    except InvalidDataException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.put(
    "/{lead_id}",
    response_model=LeadResponseSchema,
    summary="Update a lead",
    description="Update lead information with automatic change tracking"
)
async def update_lead(
    lead_id: int,
    lead_data: UpdateLeadSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadResponseSchema:
    """
    Update an existing lead.
    
    **Features:**
    - Partial updates supported (only send fields to update)
    - Automatic change tracking in notes
    - Updates last_modified timestamp
    - Validates all fields
    
    **Example Request:**
    ```json
    {
        "status": "CONTACTED",
        "lead_score": 85,
        "notes": [
            {
                "content": "Follow-up call completed",
                "type": "call"
            }
        ]
    }
    ```
    """
    try:
        # Convert Pydantic model to dict, excluding unset values
        update_dict = lead_data.model_dump(exclude_unset=True)
        
        # Update lead
        lead = await LeadService.update_lead(
            db=db,
            lead_id=lead_id,
            lead_data=update_dict,
            user_id=current_user.id
        )
        
        # Example Response:
        # {
        #   "id": 123,
        #   "status": "CONTACTED",  # Updated field
        #   "lead_score": 90,  # Updated field
        #   "notes": [
        #     {
        #       "content": "Updated: status: NEW → CONTACTED; lead_score: 75 → 90",
        #       "created_at": "2025-10-18T16:00:00",
        #       "created_by": 1,
        #       "type": "system"  # Auto-added change tracking note
        #     }
        #   ],
        #   "updated_at": "2025-10-18T16:00:00"  # Auto-updated
        # }
        
        return LeadResponseSchema.from_lead(lead)
        
    except LeadNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except InvalidDataException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete(
    "/{lead_id}",
    response_model=DeleteLeadResponseSchema,
    summary="Delete a lead",
    description="Delete (archive) a lead"
)
async def delete_lead(
    lead_id: int,
    hard_delete: bool = Query(False, description="Permanently delete (requires superuser)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> DeleteLeadResponseSchema:
    """
    Delete or archive a lead.
    
    **Default behavior (soft delete):**
    - Changes status to LOST
    - Adds "archived" tag
    - Preserves all data
    
    **Hard delete:**
    - Permanently removes from database
    - Requires superuser permission
    - Cannot be undone
    
    **Example:**
    ```
    DELETE /api/v1/leads/123
    DELETE /api/v1/leads/123?hard_delete=true  # Superuser only
    ```
    """
    try:
        # Check superuser for hard delete
        if hard_delete and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hard delete requires superuser permission"
            )
        
        # Delete lead
        success = await LeadService.delete_lead(
            db=db,
            lead_id=lead_id,
            user_id=current_user.id,
            hard_delete=hard_delete
        )
        
        if success:
            action = "deleted permanently" if hard_delete else "archived"
            
            # Example Response:
            # {
            #   "message": "Lead archived successfully",
            #   "lead_id": 123
            # }
            # Note: Soft delete changes status to LOST and adds "archived" tag
            
            return DeleteLeadResponseSchema(
                message=f"Lead {action} successfully",
                lead_id=lead_id
            )
        
    except LeadNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except PermissionDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post(
    "/bulk-update",
    response_model=BulkOperationResponseSchema,
    summary="Bulk update lead status",
    description="Update status for multiple leads at once"
)
async def bulk_update_leads(
    bulk_data: BulkUpdateStatusSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> BulkOperationResponseSchema:
    """
    Update status for multiple leads.
    
    **Features:**
    - Update multiple leads in one operation
    - Adds bulk update note to each lead
    - Atomic operation (all or nothing)
    
    **Example Request:**
    ```json
    {
        "lead_ids": [1, 2, 3, 4, 5],
        "new_status": "CONTACTED"
    }
    ```
    """
    try:
        updated_leads = await LeadService.bulk_update_status(
            db=db,
            lead_ids=bulk_data.lead_ids,
            new_status=bulk_data.new_status,
            user_id=current_user.id
        )
        
        # Example Response:
        # {
        #   "updated_count": 3,
        #   "lead_ids": [101, 102, 103]
        # }
        # Note: Each lead gets a bulk update note added
        
        return BulkOperationResponseSchema(
            updated_count=len(updated_leads),
            lead_ids=[lead.id for lead in updated_leads]
        )
        
    except LeadNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except InvalidDataException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post(
    "/assign",
    response_model=AssignLeadsResponseSchema,
    summary="Assign leads to agent",
    description="Bulk assign leads to a sales agent"
)
async def assign_leads(
    assign_data: AssignLeadsSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AssignLeadsResponseSchema:
    """
    Assign multiple leads to a sales agent.
    
    **Features:**
    - Assign multiple leads at once
    - Validates agent exists
    - Adds assignment note to each lead
    - Tracks who performed the assignment
    
    **Example Request:**
    ```json
    {
        "lead_ids": [1, 2, 3, 4],
        "agent_id": 5
    }
    ```
    """
    try:
        assigned_leads = await LeadService.assign_leads(
            db=db,
            lead_ids=assign_data.lead_ids,
            agent_user_id=assign_data.agent_id,
            assigned_by_user_id=current_user.id
        )
        
        # Example Response:
        # {
        #   "assigned_count": 3,
        #   "lead_ids": [101, 102, 103],
        #   "agent_id": 10
        # }
        # Note: Each lead gets an assignment note added
        
        return AssignLeadsResponseSchema(
            assigned_count=len(assigned_leads),
            lead_ids=[lead.id for lead in assigned_leads],
            agent_id=assign_data.agent_id
        )
        
    except LeadNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except InvalidDataException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/stats",
    response_model=LeadStatisticsSchema,
    summary="Get lead statistics",
    description="Get comprehensive lead statistics and analytics"
)
async def get_lead_statistics(
    date_from: Optional[datetime] = Query(None, description="Statistics from this date"),
    date_to: Optional[datetime] = Query(None, description="Statistics until this date"),
    assigned_to: Optional[int] = Query(None, description="Filter by assigned user"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadStatisticsSchema:
    """
    Get lead statistics and analytics.
    
    **Returns:**
    - Total leads count
    - Average lead score
    - Hot leads count
    - Conversion rate
    - Breakdown by status
    - Breakdown by source
    
    **Filters:**
    - Date range
    - Assigned user (for agent-specific stats)
    
    **Example:**
    ```
    GET /api/v1/leads/stats
    GET /api/v1/leads/stats?assigned_to=5&date_from=2025-10-01
    ```
    """
    try:
        stats = await LeadService.get_lead_statistics(
            db=db,
            assigned_to=assigned_to,
            date_range_start=date_from,
            date_range_end=date_to
        )
        
        # Example Response:
        # {
        #   "total_leads": 150,
        #   "average_lead_score": 68.5,
        #   "hot_leads_count": 45,
        #   "conversion_rate": 15.5,  # Percentage (15.5%)
        #   "leads_by_status": {
        #     "NEW": 30,
        #     "CONTACTED": 40,
        #     "QUALIFIED": 25,
        #     "PROPOSAL": 15,
        #     "NEGOTIATION": 10,
        #     "WON": 23,
        #     "LOST": 5,
        #     "CALLBACK": 2
        #   },
        #   "leads_by_source": {
        #     "WEBSITE": 50,
        #     "FACEBOOK": 30,
        #     "INSTAGRAM": 20,
        #     "WHATSAPP": 15,
        #     "REFERRAL": 40,
        #     "OTHER": 5
        #   }
        # }
        
        return LeadStatisticsSchema(**stats)
        
    except DatabaseException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# Health check endpoint
@router.get(
    "/health",
    tags=["health"],
    summary="Health check",
    description="Check if the leads API is operational"
)
async def health_check():
    """
    Simple health check endpoint.
    
    Returns basic API status.
    """
    return {
        "status": "healthy",
        "service": "leads-api",
        "version": "1.0.0"
    }

