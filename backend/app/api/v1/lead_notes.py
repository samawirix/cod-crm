"""
Lead Notes API Endpoints

FastAPI router for managing notes on leads.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.lead import Lead
from app.models.lead_note import LeadNote, NoteType
from app.schemas.lead_note import (
    CreateLeadNoteSchema,
    UpdateLeadNoteSchema,
    LeadNoteResponseSchema,
    LeadNotesListResponseSchema,
    DeleteNoteResponseSchema,
    UserInfoSchema
)
from app.schemas.lead import ErrorResponseSchema
from app.api.dependencies import get_db, get_current_user


# Create router
router = APIRouter(
    prefix="/api/v1",
    tags=["lead-notes"],
    responses={
        401: {"model": ErrorResponseSchema, "description": "Unauthorized"},
        403: {"model": ErrorResponseSchema, "description": "Forbidden"},
        404: {"model": ErrorResponseSchema, "description": "Not Found"},
    }
)


def calculate_time_ago(dt: datetime) -> str:
    """
    Calculate human-readable time difference.
    
    Args:
        dt: Datetime to calculate from
        
    Returns:
        Human-readable string like "2 hours ago"
    """
    if not dt:
        return ""
    
    # Make dt timezone-aware if it isn't
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    elif seconds < 31536000:
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months != 1 else ''} ago"
    else:
        years = int(seconds / 31536000)
        return f"{years} year{'s' if years != 1 else ''} ago"


@router.post(
    "/leads/{lead_id}/notes",
    response_model=LeadNoteResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Add note to lead",
    description="Create a new note for a specific lead with automatic user and timestamp tracking"
)
async def create_lead_note(
    lead_id: int = Path(..., description="ID of the lead"),
    note_data: CreateLeadNoteSchema = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadNoteResponseSchema:
    """
    Add a note to a lead.
    
    **Features:**
    - Auto-tracks user ID and timestamp
    - Supports different note types (CALL, EMAIL, MEETING, etc.)
    - Optional metadata for type-specific information
    
    **Example Request:**
    ```json
    {
        "note_type": "CALL",
        "content": "Follow-up call completed. Customer very interested.",
        "metadata": {
            "duration": 15,
            "outcome": "positive",
            "next_action": "send proposal"
        }
    }
    ```
    """
    try:
        # Verify lead exists
        lead_query = select(Lead).where(Lead.id == lead_id)
        lead_result = await db.execute(lead_query)
        lead = lead_result.scalar_one_or_none()
        
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lead with ID {lead_id} not found"
            )
        
        # Create note
        note = LeadNote(
            lead_id=lead_id,
            user_id=current_user.id,
            note_type=note_data.note_type.value,
            content=note_data.content,
            note_metadata=note_data.metadata or {}
        )
        
        db.add(note)
        await db.commit()
        await db.refresh(note)
        
        # Load user relationship
        await db.refresh(note, ['user'])
        
        # Build response
        response = LeadNoteResponseSchema(
            id=note.id,
            lead_id=note.lead_id,
            user_id=note.user_id,
            note_type=note.note_type,
            content=note.content,
            metadata=note.note_metadata or {},
            created_at=note.created_at,
            last_modified=note.last_modified,
            user=UserInfoSchema(
                id=current_user.id,
                username=current_user.username,
                full_name=current_user.full_name
            ) if note.user else None,
            time_ago=calculate_time_ago(note.created_at)
        )
        
        return response
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get(
    "/leads/{lead_id}/notes",
    response_model=LeadNotesListResponseSchema,
    summary="Get all notes for a lead",
    description="Retrieve all notes for a specific lead with user info and formatted timestamps"
)
async def get_lead_notes(
    lead_id: int = Path(..., description="ID of the lead"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadNotesListResponseSchema:
    """
    Get all notes for a lead.
    
    **Features:**
    - Includes user information for each note
    - Human-readable timestamps (e.g., "2 hours ago")
    - Sorted by created_at descending (newest first)
    
    **Example Response:**
    ```json
    {
        "total": 5,
        "notes": [
            {
                "id": 1,
                "content": "Follow-up call completed",
                "note_type": "CALL",
                "created_at": "2025-10-18T10:00:00",
                "time_ago": "2 hours ago",
                "user": {
                    "id": 5,
                    "username": "agent1",
                    "full_name": "Agent One"
                }
            }
        ]
    }
    ```
    """
    try:
        # Verify lead exists
        lead_query = select(Lead).where(Lead.id == lead_id)
        lead_result = await db.execute(lead_query)
        lead = lead_result.scalar_one_or_none()
        
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lead with ID {lead_id} not found"
            )
        
        # Get all notes for the lead
        query = select(LeadNote).where(
            LeadNote.lead_id == lead_id
        ).options(
            selectinload(LeadNote.user)
        ).order_by(
            LeadNote.created_at.desc()
        )
        
        result = await db.execute(query)
        notes = result.scalars().all()
        
        # Build response with user info and time_ago
        note_responses = []
        for note in notes:
            note_response = LeadNoteResponseSchema(
                id=note.id,
                lead_id=note.lead_id,
                user_id=note.user_id,
                note_type=note.note_type,
                content=note.content,
                metadata=note.note_metadata or {},
                created_at=note.created_at,
                last_modified=note.last_modified,
                user=UserInfoSchema(
                    id=note.user.id,
                    username=note.user.username,
                    full_name=note.user.full_name
                ) if note.user else None,
                time_ago=calculate_time_ago(note.created_at)
            )
            note_responses.append(note_response)
        
        return LeadNotesListResponseSchema(
            total=len(note_responses),
            notes=note_responses
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notes: {str(e)}"
        )


@router.put(
    "/lead_notes/{note_id}",
    response_model=LeadNoteResponseSchema,
    summary="Update a note",
    description="Update note content with automatic last_modified tracking"
)
async def update_lead_note(
    note_id: int = Path(..., description="ID of the note"),
    note_data: UpdateLeadNoteSchema = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LeadNoteResponseSchema:
    """
    Update an existing note.
    
    **Features:**
    - Updates content and/or metadata
    - Auto-tracks last_modified timestamp
    - Only owner or admin can update
    
    **Example Request:**
    ```json
    {
        "content": "Updated: Follow-up call rescheduled to next week",
        "metadata": {
            "rescheduled": true,
            "new_date": "2025-10-25"
        }
    }
    ```
    """
    try:
        # Get note
        query = select(LeadNote).where(
            LeadNote.id == note_id
        ).options(
            selectinload(LeadNote.user)
        )
        result = await db.execute(query)
        note = result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found"
            )
        
        # Check permissions (only owner or superuser can update)
        if note.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own notes"
            )
        
        # Update fields
        if note_data.content is not None:
            note.content = note_data.content
        
        if note_data.metadata is not None:
            note.note_metadata = note_data.metadata
        
        # Set last_modified
        note.last_modified = datetime.utcnow()
        
        await db.commit()
        await db.refresh(note)
        await db.refresh(note, ['user'])
        
        # Build response
        response = LeadNoteResponseSchema(
            id=note.id,
            lead_id=note.lead_id,
            user_id=note.user_id,
            note_type=note.note_type,
            content=note.content,
            metadata=note.note_metadata or {},
            created_at=note.created_at,
            last_modified=note.last_modified,
            user=UserInfoSchema(
                id=note.user.id,
                username=note.user.username,
                full_name=note.user.full_name
            ) if note.user else None,
            time_ago=calculate_time_ago(note.created_at)
        )
        
        return response
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}"
        )


@router.delete(
    "/lead_notes/{note_id}",
    response_model=DeleteNoteResponseSchema,
    summary="Delete a note",
    description="Delete a note with permission checking"
)
async def delete_lead_note(
    note_id: int = Path(..., description="ID of the note"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> DeleteNoteResponseSchema:
    """
    Delete a note.
    
    **Permissions:**
    - Only the note creator or a superuser can delete
    
    **Example:**
    ```
    DELETE /api/v1/lead_notes/123
    ```
    """
    try:
        # Get note
        query = select(LeadNote).where(LeadNote.id == note_id)
        result = await db.execute(query)
        note = result.scalar_one_or_none()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {note_id} not found"
            )
        
        # Check permissions (only owner or superuser can delete)
        if note.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own notes"
            )
        
        # Delete note
        await db.delete(note)
        await db.commit()
        
        return DeleteNoteResponseSchema(
            message="Note deleted successfully",
            note_id=note_id
        )
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}"
        )

