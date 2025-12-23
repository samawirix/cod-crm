"""
Lead Service

This module provides business logic for lead management operations.
Includes CRUD operations, filtering, bulk updates, and assignment functionality.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import and_, or_, desc, asc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.user import User
from app.services.exceptions import (
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException,
    DatabaseException
)


class LeadService:
    """
    Service class for lead management operations.
    
    Provides methods for creating, reading, updating, and deleting leads,
    as well as bulk operations and advanced filtering.
    """
    
    @staticmethod
    async def get_leads(
        db: AsyncSession,
        status: Optional[LeadStatus] = None,
        source: Optional[LeadSource] = None,
        assigned_to: Optional[int] = None,
        date_range_start: Optional[datetime] = None,
        date_range_end: Optional[datetime] = None,
        lead_score_min: Optional[int] = None,
        lead_score_max: Optional[int] = None,
        search: Optional[str] = None,
        is_hot_leads_only: bool = False,
        tags: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Lead], int]:
        """
        Get leads with advanced filtering, pagination, and sorting.
        
        Args:
            db: Database session
            status: Filter by lead status
            source: Filter by lead source
            assigned_to: Filter by assigned user ID
            date_range_start: Filter leads created after this date
            date_range_end: Filter leads created before this date
            lead_score_min: Minimum lead score
            lead_score_max: Maximum lead score
            search: Search term for name, email, or phone
            is_hot_leads_only: Filter only hot leads (score > 70)
            tags: Filter by tags (any match)
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')
            
        Returns:
            Tuple of (list of leads, total count)
            
        Raises:
            DatabaseException: If database operation fails
        """
        try:
            # Build base query
            query = select(Lead).options(selectinload(Lead.assigned_user))
            count_query = select(func.count(Lead.id))
            
            # Build filters
            filters = []
            
            # Status filter
            if status is not None:
                filters.append(Lead.status == status)
            
            # Source filter
            if source is not None:
                filters.append(Lead.source == source)
            
            # Assigned to filter
            if assigned_to is not None:
                filters.append(Lead.assigned_to == assigned_to)
            
            # Date range filters
            if date_range_start is not None:
                filters.append(Lead.created_at >= date_range_start)
            
            if date_range_end is not None:
                filters.append(Lead.created_at <= date_range_end)
            
            # Lead score filters
            if lead_score_min is not None:
                filters.append(Lead.lead_score >= lead_score_min)
            
            if lead_score_max is not None:
                filters.append(Lead.lead_score <= lead_score_max)
            
            # Hot leads filter
            if is_hot_leads_only:
                filters.append(Lead.lead_score > 70)
            
            # Search filter (name, email, phone)
            if search:
                search_term = f"%{search}%"
                search_filters = or_(
                    Lead.first_name.ilike(search_term),
                    Lead.last_name.ilike(search_term),
                    Lead.email.ilike(search_term),
                    Lead.phone.ilike(search_term),
                    Lead.company.ilike(search_term)
                )
                filters.append(search_filters)
            
            # Tags filter (PostgreSQL JSON operations)
            if tags and len(tags) > 0:
                # Check if any of the provided tags exist in the lead's tags
                tag_filters = []
                for tag in tags:
                    tag_filters.append(
                        Lead.tags.contains([tag.lower().strip()])
                    )
                filters.append(or_(*tag_filters))
            
            # Apply all filters
            if filters:
                query = query.where(and_(*filters))
                count_query = count_query.where(and_(*filters))
            
            # Get total count
            count_result = await db.execute(count_query)
            total_count = count_result.scalar_one()
            
            # Apply sorting
            sort_column = getattr(Lead, sort_by, Lead.created_at)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Apply pagination
            query = query.offset(skip).limit(limit)
            
            # Execute query
            result = await db.execute(query)
            leads = result.scalars().all()
            
            return list(leads), total_count
            
        except Exception as e:
            raise DatabaseException(f"Failed to retrieve leads: {str(e)}")
    
    @staticmethod
    async def get_lead_by_id(
        db: AsyncSession,
        lead_id: int,
        user_id: Optional[int] = None,
        check_assignment: bool = False
    ) -> Lead:
        """
        Get a lead by ID with optional permission checking.
        
        Args:
            db: Database session
            lead_id: ID of the lead to retrieve
            user_id: ID of the user requesting the lead
            check_assignment: If True, verify user is assigned to the lead
            
        Returns:
            Lead object
            
        Raises:
            LeadNotFoundException: If lead doesn't exist
            PermissionDeniedException: If user doesn't have permission
            DatabaseException: If database operation fails
        """
        try:
            query = select(Lead).options(
                selectinload(Lead.assigned_user)
            ).where(Lead.id == lead_id)
            
            result = await db.execute(query)
            lead = result.scalar_one_or_none()
            
            if not lead:
                raise LeadNotFoundException(f"Lead with ID {lead_id} not found")
            
            # Check permissions if required
            if check_assignment and user_id:
                if lead.assigned_to != user_id:
                    # Check if user is superuser
                    user_query = select(User).where(User.id == user_id)
                    user_result = await db.execute(user_query)
                    user = user_result.scalar_one_or_none()
                    
                    if not user or not user.is_superuser:
                        raise PermissionDeniedException(
                            f"User {user_id} does not have permission to access lead {lead_id}"
                        )
            
            return lead
            
        except (LeadNotFoundException, PermissionDeniedException):
            raise
        except Exception as e:
            raise DatabaseException(f"Failed to retrieve lead: {str(e)}")
    
    @staticmethod
    async def create_lead(
        db: AsyncSession,
        lead_data: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> Lead:
        """
        Create a new lead with auto-scoring.
        
        Args:
            db: Database session
            lead_data: Dictionary containing lead data
            user_id: ID of the user creating the lead
            
        Returns:
            Created lead object
            
        Raises:
            InvalidDataException: If lead data is invalid
            DatabaseException: If database operation fails
        """
        try:
            # Extract data
            first_name = lead_data.get("first_name")
            last_name = lead_data.get("last_name")
            email = lead_data.get("email")
            phone = lead_data.get("phone")
            
            # Validate required fields
            if not all([first_name, last_name, email, phone]):
                raise InvalidDataException(
                    "Missing required fields: first_name, last_name, email, phone"
                )
            
            # Auto-calculate lead score if not provided
            lead_score = lead_data.get("lead_score")
            if lead_score is None:
                lead_score = LeadService._calculate_lead_score(lead_data)
            
            # Create lead object
            lead = Lead(
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone,
                company=lead_data.get("company"),
                source=lead_data.get("source", LeadSource.OTHER),
                status=lead_data.get("status", LeadStatus.NEW),
                assigned_to=lead_data.get("assigned_to"),
                lead_score=lead_score,
                conversion_probability=lead_data.get("conversion_probability", 0.0),
                last_contact_date=lead_data.get("last_contact_date"),
                next_follow_up=lead_data.get("next_follow_up"),
                call_attempts=lead_data.get("call_attempts", 0),
                notes=lead_data.get("notes", []),
                tags=lead_data.get("tags", [])
            )
            
            # Add creation note
            if user_id:
                lead.add_note(
                    content=f"Lead created by user {user_id}",
                    created_by=user_id,
                    note_type="system"
                )
            
            # Save to database
            db.add(lead)
            await db.commit()
            await db.refresh(lead)
            
            # Load relationship
            await db.refresh(lead, ['assigned_user'])
            
            return lead
            
        except InvalidDataException:
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise DatabaseException(f"Failed to create lead: {str(e)}")
    
    @staticmethod
    async def update_lead(
        db: AsyncSession,
        lead_id: int,
        lead_data: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> Lead:
        """
        Update an existing lead with change tracking.
        
        Args:
            db: Database session
            lead_id: ID of the lead to update
            lead_data: Dictionary containing updated data
            user_id: ID of the user updating the lead
            
        Returns:
            Updated lead object
            
        Raises:
            LeadNotFoundException: If lead doesn't exist
            InvalidDataException: If lead data is invalid
            DatabaseException: If database operation fails
        """
        try:
            # Get existing lead
            lead = await LeadService.get_lead_by_id(db, lead_id)
            
            # Track changes for notes
            changes = []
            
            # Update fields and track changes
            updatable_fields = [
                'first_name', 'last_name', 'email', 'phone', 'company',
                'source', 'status', 'assigned_to', 'lead_score',
                'conversion_probability', 'last_contact_date', 'next_follow_up',
                'call_attempts'
            ]
            
            for field in updatable_fields:
                if field in lead_data:
                    old_value = getattr(lead, field)
                    new_value = lead_data[field]
                    
                    if old_value != new_value:
                        changes.append(f"{field}: {old_value} → {new_value}")
                        setattr(lead, field, new_value)
            
            # Handle tags separately
            if 'tags' in lead_data:
                old_tags = set(lead.tags or [])
                new_tags = set(lead_data['tags'] or [])
                if old_tags != new_tags:
                    added_tags = new_tags - old_tags
                    removed_tags = old_tags - new_tags
                    if added_tags:
                        changes.append(f"Added tags: {', '.join(added_tags)}")
                    if removed_tags:
                        changes.append(f"Removed tags: {', '.join(removed_tags)}")
                    lead.tags = list(new_tags)
            
            # Handle notes - append new notes
            if 'notes' in lead_data and lead_data['notes']:
                if isinstance(lead_data['notes'], list):
                    for note in lead_data['notes']:
                        if isinstance(note, dict):
                            lead.add_note(
                                content=note.get('content', ''),
                                created_by=note.get('created_by', user_id),
                                note_type=note.get('type', 'general')
                            )
                        elif isinstance(note, str):
                            lead.add_note(
                                content=note,
                                created_by=user_id,
                                note_type='general'
                            )
            
            # Add change tracking note if there were changes
            if changes and user_id:
                change_summary = "Updated: " + "; ".join(changes)
                lead.add_note(
                    content=change_summary,
                    created_by=user_id,
                    note_type="system"
                )
            
            # Update timestamp
            lead.updated_at = datetime.utcnow()
            
            # Commit changes
            await db.commit()
            await db.refresh(lead)
            await db.refresh(lead, ['assigned_user'])
            
            return lead
            
        except (LeadNotFoundException, InvalidDataException):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise DatabaseException(f"Failed to update lead: {str(e)}")
    
    @staticmethod
    async def delete_lead(
        db: AsyncSession,
        lead_id: int,
        user_id: Optional[int] = None,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete or archive a lead (soft delete by default).
        
        Args:
            db: Database session
            lead_id: ID of the lead to delete
            user_id: ID of the user deleting the lead
            hard_delete: If True, permanently delete; if False, archive (soft delete)
            
        Returns:
            True if successful
            
        Raises:
            LeadNotFoundException: If lead doesn't exist
            PermissionDeniedException: If user doesn't have permission
            DatabaseException: If database operation fails
        """
        try:
            # Get the lead
            lead = await LeadService.get_lead_by_id(db, lead_id)
            
            # Check permissions (only superuser or assigned user can delete)
            if user_id:
                user_query = select(User).where(User.id == user_id)
                user_result = await db.execute(user_query)
                user = user_result.scalar_one_or_none()
                
                if not user:
                    raise PermissionDeniedException("User not found")
                
                if not user.is_superuser and lead.assigned_to != user_id:
                    raise PermissionDeniedException(
                        f"User {user_id} does not have permission to delete lead {lead_id}"
                    )
            
            if hard_delete:
                # Permanently delete
                await db.delete(lead)
            else:
                # Soft delete - change status to LOST and add note
                lead.status = LeadStatus.LOST
                lead.add_note(
                    content=f"Lead archived by user {user_id}",
                    created_by=user_id,
                    note_type="system"
                )
                lead.add_tag("archived")
            
            await db.commit()
            return True
            
        except (LeadNotFoundException, PermissionDeniedException):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise DatabaseException(f"Failed to delete lead: {str(e)}")
    
    @staticmethod
    async def bulk_update_status(
        db: AsyncSession,
        lead_ids: List[int],
        new_status: LeadStatus,
        user_id: Optional[int] = None
    ) -> List[Lead]:
        """
        Update status for multiple leads at once.
        
        Args:
            db: Database session
            lead_ids: List of lead IDs to update
            new_status: New status to set
            user_id: ID of the user performing the update
            
        Returns:
            List of updated leads
            
        Raises:
            InvalidDataException: If input data is invalid
            DatabaseException: If database operation fails
        """
        try:
            if not lead_ids:
                raise InvalidDataException("No lead IDs provided")
            
            # Get all leads
            query = select(Lead).where(Lead.id.in_(lead_ids))
            result = await db.execute(query)
            leads = result.scalars().all()
            
            if not leads:
                raise LeadNotFoundException("No leads found with provided IDs")
            
            updated_leads = []
            
            # Update each lead
            for lead in leads:
                old_status = lead.status
                lead.status = new_status
                lead.updated_at = datetime.utcnow()
                
                # Add bulk update note
                lead.add_note(
                    content=f"Status bulk updated from {old_status.value} to {new_status.value}",
                    created_by=user_id,
                    note_type="system"
                )
                
                updated_leads.append(lead)
            
            await db.commit()
            
            # Refresh all leads
            for lead in updated_leads:
                await db.refresh(lead)
            
            return updated_leads
            
        except (InvalidDataException, LeadNotFoundException):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise DatabaseException(f"Failed to bulk update status: {str(e)}")
    
    @staticmethod
    async def assign_leads(
        db: AsyncSession,
        lead_ids: List[int],
        agent_user_id: int,
        assigned_by_user_id: Optional[int] = None
    ) -> List[Lead]:
        """
        Assign multiple leads to a sales agent.
        
        Args:
            db: Database session
            lead_ids: List of lead IDs to assign
            agent_user_id: ID of the user to assign leads to
            assigned_by_user_id: ID of the user performing the assignment
            
        Returns:
            List of assigned leads
            
        Raises:
            InvalidDataException: If input data is invalid
            DatabaseException: If database operation fails
        """
        try:
            if not lead_ids:
                raise InvalidDataException("No lead IDs provided")
            
            # Verify agent exists
            agent_query = select(User).where(User.id == agent_user_id)
            agent_result = await db.execute(agent_query)
            agent = agent_result.scalar_one_or_none()
            
            if not agent:
                raise InvalidDataException(f"User with ID {agent_user_id} not found")
            
            # Get all leads
            query = select(Lead).where(Lead.id.in_(lead_ids))
            result = await db.execute(query)
            leads = result.scalars().all()
            
            if not leads:
                raise LeadNotFoundException("No leads found with provided IDs")
            
            assigned_leads = []
            
            # Assign each lead
            for lead in leads:
                old_assigned_to = lead.assigned_to
                lead.assigned_to = agent_user_id
                lead.updated_at = datetime.utcnow()
                
                # Add assignment note
                if old_assigned_to:
                    note_content = (
                        f"Lead reassigned from user {old_assigned_to} to user {agent_user_id}"
                    )
                else:
                    note_content = f"Lead assigned to user {agent_user_id}"
                
                if assigned_by_user_id:
                    note_content += f" by user {assigned_by_user_id}"
                
                lead.add_note(
                    content=note_content,
                    created_by=assigned_by_user_id,
                    note_type="system"
                )
                
                assigned_leads.append(lead)
            
            await db.commit()
            
            # Refresh all leads with relationships
            for lead in assigned_leads:
                await db.refresh(lead)
                await db.refresh(lead, ['assigned_user'])
            
            return assigned_leads
            
        except (InvalidDataException, LeadNotFoundException):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise DatabaseException(f"Failed to assign leads: {str(e)}")
    
    @staticmethod
    def _calculate_lead_score(lead_data: Dict[str, Any]) -> int:
        """
        Calculate lead score based on available data.
        
        This is a simple scoring algorithm that can be customized.
        
        Args:
            lead_data: Dictionary containing lead data
            
        Returns:
            Calculated lead score (0-100)
        """
        score = 50  # Base score
        
        # Source scoring
        source = lead_data.get("source")
        source_scores = {
            LeadSource.REFERRAL: 20,
            LeadSource.WEBSITE: 15,
            LeadSource.FACEBOOK: 10,
            LeadSource.INSTAGRAM: 10,
            LeadSource.WHATSAPP: 5,
            LeadSource.OTHER: 0
        }
        score += source_scores.get(source, 0)
        
        # Company presence adds points
        if lead_data.get("company"):
            score += 10
        
        # Email domain scoring (business email > personal email)
        email = lead_data.get("email", "")
        if email:
            personal_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
            domain = email.split('@')[-1].lower()
            if domain not in personal_domains:
                score += 10
        
        # Tags scoring (certain tags indicate higher value)
        tags = lead_data.get("tags", [])
        high_value_tags = ['enterprise', 'hot', 'urgent', 'high-value']
        if any(tag.lower() in high_value_tags for tag in tags):
            score += 15
        
        # Ensure score is within valid range
        return max(0, min(100, score))
    
    @staticmethod
    async def get_lead_statistics(
        db: AsyncSession,
        assigned_to: Optional[int] = None,
        date_range_start: Optional[datetime] = None,
        date_range_end: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get statistics about leads.
        
        Args:
            db: Database session
            assigned_to: Filter by assigned user
            date_range_start: Start date for statistics
            date_range_end: End date for statistics
            
        Returns:
            Dictionary containing various statistics
            
        Raises:
            DatabaseException: If database operation fails
        """
        try:
            filters = []
            
            if assigned_to is not None:
                filters.append(Lead.assigned_to == assigned_to)
            
            if date_range_start is not None:
                filters.append(Lead.created_at >= date_range_start)
            
            if date_range_end is not None:
                filters.append(Lead.created_at <= date_range_end)
            
            # Build base query
            base_query = select(Lead)
            if filters:
                base_query = base_query.where(and_(*filters))
            
            # Total leads
            count_query = select(func.count(Lead.id))
            if filters:
                count_query = count_query.where(and_(*filters))
            
            result = await db.execute(count_query)
            total_leads = result.scalar_one()
            
            # Leads by status
            status_query = select(
                Lead.status,
                func.count(Lead.id)
            ).group_by(Lead.status)
            if filters:
                status_query = status_query.where(and_(*filters))
            
            result = await db.execute(status_query)
            leads_by_status = {row[0].value: row[1] for row in result.all()}
            
            # Leads by source
            source_query = select(
                Lead.source,
                func.count(Lead.id)
            ).group_by(Lead.source)
            if filters:
                source_query = source_query.where(and_(*filters))
            
            result = await db.execute(source_query)
            leads_by_source = {row[0].value: row[1] for row in result.all()}
            
            # Average lead score
            avg_score_query = select(func.avg(Lead.lead_score))
            if filters:
                avg_score_query = avg_score_query.where(and_(*filters))
            
            result = await db.execute(avg_score_query)
            avg_lead_score = result.scalar_one() or 0
            
            # Hot leads count
            hot_leads_query = select(func.count(Lead.id)).where(Lead.lead_score > 70)
            if filters:
                hot_leads_query = hot_leads_query.where(and_(*filters))
            
            result = await db.execute(hot_leads_query)
            hot_leads_count = result.scalar_one()
            
            return {
                'total_leads': total_leads,
                'leads_by_status': leads_by_status,
                'leads_by_source': leads_by_source,
                'average_lead_score': round(float(avg_lead_score), 2),
                'hot_leads_count': hot_leads_count,
                'conversion_rate': round(
                    (leads_by_status.get('WON', 0) / total_leads * 100)
                    if total_leads > 0 else 0,
                    2
                )
            }
            
        except Exception as e:
            raise DatabaseException(f"Failed to retrieve statistics: {str(e)}")

