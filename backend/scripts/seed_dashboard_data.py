#!/usr/bin/env python3
"""
Seed Dashboard Data

Create sample leads for dashboard testing.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from random import choice, randint

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DatabaseConfig
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.user import User
from app.services.auth_service import AuthService
from sqlalchemy.future import select


async def seed_dashboard_data():
    """Create sample leads for dashboard testing."""
    
    # Initialize database
    db_config = DatabaseConfig(
        database_url="sqlite+aiosqlite:///./crm_dev.db",
        echo=False,
        use_null_pool=True
    )
    
    await db_config.create_tables()
    
    async with db_config.async_session_maker() as session:
        # Get admin user
        query = select(User).where(User.email == "admin@cod-crm.com")
        result = await session.execute(query)
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("❌ Admin user not found. Please login first to create the user.")
            return
        
        print(f"✅ Found admin user: {admin_user.email}")
        
        # Check if leads already exist
        leads_query = select(Lead)
        leads_result = await session.execute(leads_query)
        existing_leads = leads_result.scalars().all()
        
        if len(existing_leads) > 0:
            print(f"✅ Found {len(existing_leads)} existing leads. Skipping seed.")
            return
        
        # Create sample leads
        sample_leads = [
            {
                "name": "Ahmed Hassan",
                "email": "ahmed@example.com",
                "phone": "+212600000001",
                "status": LeadStatus.NEW,
                "source": LeadSource.WEBSITE,
                "lead_score": 85,
                "notes": [{"content": "Interested in premium package", "type": "NOTE"}]
            },
            {
                "name": "Fatima Alami",
                "email": "fatima@example.com", 
                "phone": "+212600000002",
                "status": LeadStatus.CONTACTED,
                "source": LeadSource.FACEBOOK,
                "lead_score": 70,
                "notes": [{"content": "Called twice, very interested", "type": "CALL"}]
            },
            {
                "name": "Omar Benali",
                "email": "omar@example.com",
                "phone": "+212600000003", 
                "status": LeadStatus.QUALIFIED,
                "source": LeadSource.INSTAGRAM,
                "lead_score": 90,
                "notes": [{"content": "Budget confirmed, ready to proceed", "type": "MEETING"}]
            },
            {
                "name": "Aicha Mansouri",
                "email": "aicha@example.com",
                "phone": "+212600000004",
                "status": LeadStatus.PROPOSAL,
                "source": LeadSource.WHATSAPP,
                "lead_score": 75,
                "notes": [{"content": "Proposal sent, waiting for response", "type": "EMAIL"}]
            },
            {
                "name": "Youssef Idrissi",
                "email": "youssef@example.com",
                "phone": "+212600000005",
                "status": LeadStatus.NEGOTIATION,
                "source": LeadSource.REFERRAL,
                "lead_score": 80,
                "notes": [{"content": "Negotiating price, very close", "type": "CALL"}]
            },
            {
                "name": "Khadija Tazi",
                "email": "khadija@example.com",
                "phone": "+212600000006",
                "status": LeadStatus.WON,
                "source": LeadSource.WEBSITE,
                "lead_score": 95,
                "notes": [{"content": "Deal closed! Payment received", "type": "STATUS_CHANGE"}]
            },
            {
                "name": "Hassan Alaoui",
                "email": "hassan@example.com",
                "phone": "+212600000007",
                "status": LeadStatus.WON,
                "source": LeadSource.FACEBOOK,
                "lead_score": 88,
                "notes": [{"content": "Great customer, signed contract", "type": "MEETING"}]
            },
            {
                "name": "Naima Berrada",
                "email": "naima@example.com",
                "phone": "+212600000008",
                "status": LeadStatus.LOST,
                "source": LeadSource.INSTAGRAM,
                "lead_score": 45,
                "notes": [{"content": "Budget too low, not interested", "type": "CALL"}]
            },
            {
                "name": "Karim El Fassi",
                "email": "karim@example.com",
                "phone": "+212600000009",
                "status": LeadStatus.CALLBACK,
                "source": LeadSource.WHATSAPP,
                "lead_score": 60,
                "notes": [{"content": "Call back next week", "type": "CALL"}]
            },
            {
                "name": "Zineb Chraibi",
                "email": "zineb@example.com",
                "phone": "+212600000010",
                "status": LeadStatus.NEW,
                "source": LeadSource.WEBSITE,
                "lead_score": 70,
                "notes": [{"content": "New inquiry from website", "type": "NOTE"}]
            }
        ]
        
        # Create leads with different dates
        base_date = datetime.now() - timedelta(days=30)
        
        for i, lead_data in enumerate(sample_leads):
            # Spread leads over the last 30 days
            days_ago = randint(0, 30)
            created_at = base_date + timedelta(days=days_ago)
            
            lead = Lead(
                name=lead_data["name"],
                email=lead_data["email"],
                phone=lead_data["phone"],
                status=lead_data["status"],
                source=lead_data["source"],
                lead_score=lead_data["lead_score"],
                notes=lead_data["notes"],
                created_by=admin_user.id,
                created_at=created_at,
                last_modified=created_at
            )
            
            session.add(lead)
        
        await session.commit()
        print(f"✅ Created {len(sample_leads)} sample leads")
        print("📊 Dashboard should now show data!")


if __name__ == "__main__":
    asyncio.run(seed_dashboard_data())
