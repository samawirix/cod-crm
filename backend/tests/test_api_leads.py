"""
Tests for Leads API Endpoints

Comprehensive tests for all lead API endpoints.
Run with: pytest tests/test_api_leads.py -v
"""

import pytest
from datetime import datetime
from httpx import AsyncClient
from fastapi import status

from main import app
from app.models import User, Lead, LeadSource, LeadStatus
from app.api.dependencies import set_database_config
from app.database import get_testing_config


# Fixtures

@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def setup_db():
    """Setup test database."""
    db_config = get_testing_config()
    await db_config.create_tables()
    set_database_config(db_config)
    
    yield db_config
    
    await db_config.drop_tables()
    await db_config.close()


@pytest.fixture
async def auth_headers(setup_db):
    """Create authentication headers for test user."""
    # Create test user in database
    async with setup_db.async_session_maker() as session:
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            hashed_password="hashed",
            is_active=True,
            is_superuser=False
        )
        session.add(user)
        await session.commit()
    
    return {"Authorization": "Bearer user_1"}


@pytest.fixture
async def sample_lead(setup_db):
    """Create a sample lead for testing."""
    async with setup_db.async_session_maker() as session:
        lead = Lead(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="+1234567890",
            company="Test Corp",
            source=LeadSource.WEBSITE,
            status=LeadStatus.NEW,
            lead_score=75,
            conversion_probability=0.7,
            tags=["test"],
            notes=[]
        )
        session.add(lead)
        await session.commit()
        await session.refresh(lead)
        return lead.id


# Tests

@pytest.mark.asyncio
async def test_get_leads_success(client, auth_headers, sample_lead):
    """Test GET /api/v1/leads endpoint."""
    response = await client.get(
        "/api/v1/leads",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert "total" in data
    assert "leads" in data
    assert "page_info" in data
    assert data["total"] >= 1
    assert len(data["leads"]) >= 1


@pytest.mark.asyncio
async def test_get_leads_with_filters(client, auth_headers, sample_lead):
    """Test GET /api/v1/leads with filters."""
    response = await client.get(
        "/api/v1/leads",
        params={
            "status": "NEW",
            "score_min": 70,
            "limit": 10
        },
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # All returned leads should match filters
    for lead in data["leads"]:
        assert lead["status"] == "NEW"
        assert lead["lead_score"] >= 70


@pytest.mark.asyncio
async def test_get_leads_search(client, auth_headers, sample_lead):
    """Test GET /api/v1/leads with search."""
    response = await client.get(
        "/api/v1/leads",
        params={"search": "john"},
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_leads_pagination(client, auth_headers, setup_db):
    """Test pagination."""
    # Create multiple leads
    async with setup_db.async_session_maker() as session:
        for i in range(15):
            lead = Lead(
                first_name=f"User{i}",
                last_name="Test",
                email=f"user{i}@test.com",
                phone=f"+100000000{i:02d}",
                source=LeadSource.WEBSITE,
                status=LeadStatus.NEW
            )
            session.add(lead)
        await session.commit()
    
    # Test pagination
    response = await client.get(
        "/api/v1/leads",
        params={"skip": 0, "limit": 10},
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert len(data["leads"]) == 10
    assert data["page_info"]["has_more"] is True


@pytest.mark.asyncio
async def test_get_leads_unauthorized(client):
    """Test GET /api/v1/leads without authentication."""
    response = await client.get("/api/v1/leads")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_lead_by_id(client, auth_headers, sample_lead):
    """Test GET /api/v1/leads/{lead_id}."""
    response = await client.get(
        f"/api/v1/leads/{sample_lead}",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["id"] == sample_lead
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert "is_hot_lead" in data
    assert "days_since_created" in data


@pytest.mark.asyncio
async def test_get_lead_not_found(client, auth_headers):
    """Test GET /api/v1/leads/{lead_id} with non-existent ID."""
    response = await client.get(
        "/api/v1/leads/99999",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_lead_success(client, auth_headers):
    """Test POST /api/v1/leads."""
    lead_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "phone": "+9876543210",
        "company": "New Corp",
        "source": "REFERRAL",
        "tags": ["new", "interested"]
    }
    
    response = await client.post(
        "/api/v1/leads",
        json=lead_data,
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Smith"
    assert data["email"] == "jane@example.com"
    assert data["lead_score"] > 0  # Auto-calculated
    assert "id" in data


@pytest.mark.asyncio
async def test_create_lead_validation_error(client, auth_headers):
    """Test POST /api/v1/leads with invalid data."""
    lead_data = {
        "first_name": "Jane",
        # Missing required fields
    }
    
    response = await client.post(
        "/api/v1/leads",
        json=lead_data,
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_update_lead_success(client, auth_headers, sample_lead):
    """Test PUT /api/v1/leads/{lead_id}."""
    update_data = {
        "status": "CONTACTED",
        "lead_score": 90,
        "notes": [
            {
                "content": "Follow-up completed",
                "type": "call"
            }
        ]
    }
    
    response = await client.put(
        f"/api/v1/leads/{sample_lead}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["status"] == "CONTACTED"
    assert data["lead_score"] == 90
    assert len(data["notes"]) > 0


@pytest.mark.asyncio
async def test_update_lead_not_found(client, auth_headers):
    """Test PUT /api/v1/leads/{lead_id} with non-existent ID."""
    response = await client.put(
        "/api/v1/leads/99999",
        json={"status": "CONTACTED"},
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_lead_success(client, auth_headers, sample_lead):
    """Test DELETE /api/v1/leads/{lead_id}."""
    response = await client.delete(
        f"/api/v1/leads/{sample_lead}",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert "message" in data
    assert data["lead_id"] == sample_lead


@pytest.mark.asyncio
async def test_delete_lead_not_found(client, auth_headers):
    """Test DELETE /api/v1/leads/{lead_id} with non-existent ID."""
    response = await client.delete(
        "/api/v1/leads/99999",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_bulk_update_success(client, auth_headers, setup_db):
    """Test POST /api/v1/leads/bulk-update."""
    # Create multiple leads
    lead_ids = []
    async with setup_db.async_session_maker() as session:
        for i in range(5):
            lead = Lead(
                first_name=f"User{i}",
                last_name="Test",
                email=f"bulk{i}@test.com",
                phone=f"+200000000{i:02d}",
                source=LeadSource.WEBSITE,
                status=LeadStatus.NEW
            )
            session.add(lead)
        await session.commit()
        await session.flush()
        
        # Get IDs
        from sqlalchemy import select
        result = await session.execute(
            select(Lead.id).where(Lead.email.like("bulk%"))
        )
        lead_ids = [row[0] for row in result.all()]
    
    # Bulk update
    response = await client.post(
        "/api/v1/leads/bulk-update",
        json={
            "lead_ids": lead_ids,
            "new_status": "CONTACTED"
        },
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["updated_count"] == len(lead_ids)


@pytest.mark.asyncio
async def test_assign_leads_success(client, auth_headers, setup_db):
    """Test POST /api/v1/leads/assign."""
    # Create agent user
    async with setup_db.async_session_maker() as session:
        agent = User(
            id=10,
            username="agent",
            email="agent@test.com",
            full_name="Agent User",
            hashed_password="hashed",
            is_active=True
        )
        session.add(agent)
        
        # Create leads
        lead_ids = []
        for i in range(3):
            lead = Lead(
                first_name=f"Assign{i}",
                last_name="Test",
                email=f"assign{i}@test.com",
                phone=f"+300000000{i:02d}",
                source=LeadSource.WEBSITE
            )
            session.add(lead)
        
        await session.commit()
        await session.flush()
        
        # Get IDs
        from sqlalchemy import select
        result = await session.execute(
            select(Lead.id).where(Lead.email.like("assign%"))
        )
        lead_ids = [row[0] for row in result.all()]
    
    # Assign leads
    response = await client.post(
        "/api/v1/leads/assign",
        json={
            "lead_ids": lead_ids,
            "agent_id": 10
        },
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["assigned_count"] == len(lead_ids)
    assert data["agent_id"] == 10


@pytest.mark.asyncio
async def test_get_statistics(client, auth_headers, setup_db):
    """Test GET /api/v1/leads/stats."""
    # Create leads with various statuses
    async with setup_db.async_session_maker() as session:
        statuses = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.WON, LeadStatus.WON]
        for i, stat in enumerate(statuses):
            lead = Lead(
                first_name=f"Stats{i}",
                last_name="Test",
                email=f"stats{i}@test.com",
                phone=f"+400000000{i:02d}",
                source=LeadSource.WEBSITE,
                status=stat,
                lead_score=75
            )
            session.add(lead)
        await session.commit()
    
    response = await client.get(
        "/api/v1/leads/stats",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert "total_leads" in data
    assert "average_lead_score" in data
    assert "conversion_rate" in data
    assert "leads_by_status" in data
    assert "leads_by_source" in data
    assert data["total_leads"] >= 4


@pytest.mark.asyncio
async def test_health_check(client):
    """Test health check endpoint."""
    response = await client.get("/api/v1/leads/health")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["status"] == "healthy"


# Run tests with: pytest tests/test_api_leads.py -v

