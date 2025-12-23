"""
Tests for LeadService

This module contains comprehensive tests for the lead service operations.
Run with: pytest tests/test_lead_service.py
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.models import Lead, LeadSource, LeadStatus, User
from app.services import LeadService
from app.services.exceptions import (
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException
)


# Fixtures

@pytest.fixture
async def db_session():
    """Create a test database session."""
    # Use in-memory SQLite for testing (for PostgreSQL-specific features, use test DB)
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )
    
    async with engine.begin() as conn:
        from app.models.base import Base
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        hashed_password="hashed_password",
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_superuser(db_session: AsyncSession):
    """Create a test superuser."""
    user = User(
        username="admin",
        email="admin@example.com",
        full_name="Admin User",
        hashed_password="hashed_password",
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def lead_data():
    """Sample lead data for testing."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "company": "Example Corp",
        "source": LeadSource.WEBSITE,
        "tags": ["test", "demo"]
    }


# Tests

@pytest.mark.asyncio
async def test_create_lead(db_session: AsyncSession, test_user, lead_data):
    """Test creating a new lead."""
    lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    assert lead.id is not None
    assert lead.first_name == "John"
    assert lead.last_name == "Doe"
    assert lead.email == "john.doe@example.com"
    assert lead.status == LeadStatus.NEW
    assert lead.lead_score > 0  # Auto-calculated
    assert len(lead.notes) > 0  # Creation note added


@pytest.mark.asyncio
async def test_create_lead_missing_required_fields(db_session: AsyncSession):
    """Test creating a lead with missing required fields."""
    with pytest.raises(InvalidDataException):
        await LeadService.create_lead(
            db=db_session,
            lead_data={"first_name": "John"},  # Missing required fields
            user_id=1
        )


@pytest.mark.asyncio
async def test_get_lead_by_id(db_session: AsyncSession, test_user, lead_data):
    """Test retrieving a lead by ID."""
    # Create lead
    created_lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    # Retrieve lead
    lead = await LeadService.get_lead_by_id(
        db=db_session,
        lead_id=created_lead.id
    )
    
    assert lead.id == created_lead.id
    assert lead.email == lead_data["email"]


@pytest.mark.asyncio
async def test_get_lead_by_id_not_found(db_session: AsyncSession):
    """Test retrieving a non-existent lead."""
    with pytest.raises(LeadNotFoundException):
        await LeadService.get_lead_by_id(
            db=db_session,
            lead_id=99999
        )


@pytest.mark.asyncio
async def test_update_lead(db_session: AsyncSession, test_user, lead_data):
    """Test updating a lead."""
    # Create lead
    lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    # Update lead
    update_data = {
        "status": LeadStatus.CONTACTED,
        "lead_score": 85,
        "notes": [{
            "content": "Follow-up call completed",
            "type": "call"
        }]
    }
    
    updated_lead = await LeadService.update_lead(
        db=db_session,
        lead_id=lead.id,
        lead_data=update_data,
        user_id=test_user.id
    )
    
    assert updated_lead.status == LeadStatus.CONTACTED
    assert updated_lead.lead_score == 85
    assert len(updated_lead.notes) > 1  # Original + new + change tracking


@pytest.mark.asyncio
async def test_get_leads_with_filtering(db_session: AsyncSession, test_user):
    """Test retrieving leads with various filters."""
    # Create multiple leads
    lead_data_list = [
        {
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice@example.com",
            "phone": "+1111111111",
            "source": LeadSource.WEBSITE,
            "lead_score": 80
        },
        {
            "first_name": "Bob",
            "last_name": "Jones",
            "email": "bob@example.com",
            "phone": "+2222222222",
            "source": LeadSource.REFERRAL,
            "lead_score": 90
        },
        {
            "first_name": "Charlie",
            "last_name": "Brown",
            "email": "charlie@example.com",
            "phone": "+3333333333",
            "source": LeadSource.FACEBOOK,
            "lead_score": 50
        }
    ]
    
    for data in lead_data_list:
        await LeadService.create_lead(
            db=db_session,
            lead_data=data,
            user_id=test_user.id
        )
    
    # Test search
    leads, total = await LeadService.get_leads(
        db=db_session,
        search="alice"
    )
    assert total >= 1
    assert any(lead.first_name == "Alice" for lead in leads)
    
    # Test filter by source
    leads, total = await LeadService.get_leads(
        db=db_session,
        source=LeadSource.REFERRAL
    )
    assert total >= 1
    assert all(lead.source == LeadSource.REFERRAL for lead in leads)
    
    # Test hot leads filter
    leads, total = await LeadService.get_leads(
        db=db_session,
        is_hot_leads_only=True
    )
    assert all(lead.lead_score > 70 for lead in leads)


@pytest.mark.asyncio
async def test_get_leads_pagination(db_session: AsyncSession, test_user):
    """Test pagination in get_leads."""
    # Create 15 leads
    for i in range(15):
        await LeadService.create_lead(
            db=db_session,
            lead_data={
                "first_name": f"User{i}",
                "last_name": "Test",
                "email": f"user{i}@example.com",
                "phone": f"+100000000{i:02d}"
            },
            user_id=test_user.id
        )
    
    # Test pagination
    page1, total = await LeadService.get_leads(
        db=db_session,
        skip=0,
        limit=10
    )
    
    assert len(page1) == 10
    assert total == 15
    
    page2, _ = await LeadService.get_leads(
        db=db_session,
        skip=10,
        limit=10
    )
    
    assert len(page2) == 5


@pytest.mark.asyncio
async def test_bulk_update_status(db_session: AsyncSession, test_user):
    """Test bulk status update."""
    # Create multiple leads
    lead_ids = []
    for i in range(5):
        lead = await LeadService.create_lead(
            db=db_session,
            lead_data={
                "first_name": f"User{i}",
                "last_name": "Test",
                "email": f"user{i}@example.com",
                "phone": f"+100000000{i:02d}"
            },
            user_id=test_user.id
        )
        lead_ids.append(lead.id)
    
    # Bulk update
    updated_leads = await LeadService.bulk_update_status(
        db=db_session,
        lead_ids=lead_ids,
        new_status=LeadStatus.CONTACTED,
        user_id=test_user.id
    )
    
    assert len(updated_leads) == 5
    assert all(lead.status == LeadStatus.CONTACTED for lead in updated_leads)


@pytest.mark.asyncio
async def test_assign_leads(db_session: AsyncSession, test_user):
    """Test bulk lead assignment."""
    # Create leads
    lead_ids = []
    for i in range(3):
        lead = await LeadService.create_lead(
            db=db_session,
            lead_data={
                "first_name": f"User{i}",
                "last_name": "Test",
                "email": f"user{i}@example.com",
                "phone": f"+100000000{i:02d}"
            },
            user_id=test_user.id
        )
        lead_ids.append(lead.id)
    
    # Assign leads
    assigned_leads = await LeadService.assign_leads(
        db=db_session,
        lead_ids=lead_ids,
        agent_user_id=test_user.id,
        assigned_by_user_id=test_user.id
    )
    
    assert len(assigned_leads) == 3
    assert all(lead.assigned_to == test_user.id for lead in assigned_leads)


@pytest.mark.asyncio
async def test_delete_lead_soft(db_session: AsyncSession, test_user, lead_data):
    """Test soft delete (archive) of a lead."""
    # Create lead
    lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    # Soft delete
    success = await LeadService.delete_lead(
        db=db_session,
        lead_id=lead.id,
        user_id=test_user.id,
        hard_delete=False
    )
    
    assert success is True
    
    # Verify it's archived
    archived_lead = await LeadService.get_lead_by_id(
        db=db_session,
        lead_id=lead.id
    )
    assert archived_lead.status == LeadStatus.LOST
    assert "archived" in archived_lead.tags


@pytest.mark.asyncio
async def test_get_lead_statistics(db_session: AsyncSession, test_user):
    """Test getting lead statistics."""
    # Create leads with different statuses
    statuses = [
        LeadStatus.NEW,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.WON,
        LeadStatus.WON
    ]
    
    for i, status in enumerate(statuses):
        lead_data = {
            "first_name": f"User{i}",
            "last_name": "Test",
            "email": f"user{i}@example.com",
            "phone": f"+100000000{i:02d}",
            "status": status
        }
        await LeadService.create_lead(
            db=db_session,
            lead_data=lead_data,
            user_id=test_user.id
        )
    
    # Get statistics
    stats = await LeadService.get_lead_statistics(db=db_session)
    
    assert stats["total_leads"] == 5
    assert "leads_by_status" in stats
    assert "leads_by_source" in stats
    assert "average_lead_score" in stats
    assert stats["conversion_rate"] == 40.0  # 2 won out of 5


@pytest.mark.asyncio
async def test_lead_score_calculation():
    """Test lead score auto-calculation."""
    # Referral lead with business email and company
    lead_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@business.com",
        "phone": "+1234567890",
        "company": "Business Inc",
        "source": LeadSource.REFERRAL,
        "tags": ["enterprise"]
    }
    
    score = LeadService._calculate_lead_score(lead_data)
    
    # 50 (base) + 20 (referral) + 10 (company) + 10 (business email) + 15 (enterprise tag)
    assert score == 105  # Capped at 100
    assert score <= 100


@pytest.mark.asyncio
async def test_permission_check(db_session: AsyncSession, test_user, test_superuser, lead_data):
    """Test permission checking."""
    # Create another user
    other_user = User(
        username="otheruser",
        email="other@example.com",
        full_name="Other User",
        hashed_password="hashed",
        is_active=True,
        is_superuser=False
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)
    
    # Create lead assigned to test_user
    lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    await LeadService.assign_leads(
        db=db_session,
        lead_ids=[lead.id],
        agent_user_id=test_user.id,
        assigned_by_user_id=test_user.id
    )
    
    # Test: assigned user can access
    retrieved = await LeadService.get_lead_by_id(
        db=db_session,
        lead_id=lead.id,
        user_id=test_user.id,
        check_assignment=True
    )
    assert retrieved.id == lead.id
    
    # Test: other user cannot access
    with pytest.raises(PermissionDeniedException):
        await LeadService.get_lead_by_id(
            db=db_session,
            lead_id=lead.id,
            user_id=other_user.id,
            check_assignment=True
        )
    
    # Test: superuser can access
    retrieved = await LeadService.get_lead_by_id(
        db=db_session,
        lead_id=lead.id,
        user_id=test_superuser.id,
        check_assignment=True
    )
    assert retrieved.id == lead.id


@pytest.mark.asyncio
async def test_lead_notes_tracking(db_session: AsyncSession, test_user, lead_data):
    """Test that notes are properly tracked."""
    # Create lead
    lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    initial_notes_count = len(lead.notes)
    
    # Update with new note
    await LeadService.update_lead(
        db=db_session,
        lead_id=lead.id,
        lead_data={
            "lead_score": 90,
            "notes": [{
                "content": "Test note",
                "type": "general"
            }]
        },
        user_id=test_user.id
    )
    
    # Refresh and check
    updated_lead = await LeadService.get_lead_by_id(db_session, lead.id)
    
    # Should have: initial creation note + new note + change tracking note
    assert len(updated_lead.notes) > initial_notes_count


@pytest.mark.asyncio
async def test_lead_properties(db_session: AsyncSession, test_user, lead_data):
    """Test lead model properties."""
    # Create lead
    lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data,
        user_id=test_user.id
    )
    
    # Test days_since_created
    assert lead.days_since_created == 0  # Just created
    
    # Test is_hot_lead
    lead_data_hot = lead_data.copy()
    lead_data_hot["email"] = "hot@example.com"
    lead_data_hot["lead_score"] = 85
    
    hot_lead = await LeadService.create_lead(
        db=db_session,
        lead_data=lead_data_hot,
        user_id=test_user.id
    )
    
    assert hot_lead.is_hot_lead is True
    
    # Test days_since_last_contact
    assert lead.days_since_last_contact is None  # Never contacted
    
    # Update with contact
    await LeadService.update_lead(
        db=db_session,
        lead_id=lead.id,
        lead_data={"last_contact_date": datetime.utcnow()},
        user_id=test_user.id
    )
    
    updated_lead = await LeadService.get_lead_by_id(db_session, lead.id)
    assert updated_lead.days_since_last_contact == 0


# Run tests with: pytest tests/test_lead_service.py -v

