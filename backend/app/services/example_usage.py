"""
Example usage of LeadService

This module demonstrates how to use the LeadService for common CRM operations.
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import LeadService
from app.services.exceptions import (
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException
)
from app.models import LeadSource, LeadStatus


async def example_create_lead(db: AsyncSession, user_id: int) -> None:
    """Example: Create a new lead"""
    
    lead_data = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "company": "Example Corp",
        "source": LeadSource.WEBSITE,
        "tags": ["interested", "tech-industry"],
    }
    
    try:
        lead = await LeadService.create_lead(
            db=db,
            lead_data=lead_data,
            user_id=user_id
        )
        
        print(f"✅ Created lead: {lead.full_name}")
        print(f"   ID: {lead.id}")
        print(f"   Score: {lead.lead_score}")
        print(f"   Email: {lead.email}")
        
    except InvalidDataException as e:
        print(f"❌ Invalid data: {e.message}")


async def example_search_leads(db: AsyncSession) -> None:
    """Example: Search and filter leads"""
    
    # Search by name/email
    leads, total = await LeadService.get_leads(
        db=db,
        search="john",
        skip=0,
        limit=10
    )
    
    print(f"\n📊 Search results: {total} leads found")
    for lead in leads:
        print(f"   - {lead.full_name} ({lead.email})")
    
    # Get hot leads
    hot_leads, total = await LeadService.get_leads(
        db=db,
        is_hot_leads_only=True,
        sort_by="lead_score",
        sort_order="desc"
    )
    
    print(f"\n🔥 Hot leads: {total} found")
    for lead in hot_leads:
        print(f"   - {lead.full_name}: Score {lead.lead_score}")


async def example_filter_by_status(db: AsyncSession) -> None:
    """Example: Filter leads by status and date range"""
    
    # Get new leads from last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    leads, total = await LeadService.get_leads(
        db=db,
        status=LeadStatus.NEW,
        date_range_start=seven_days_ago,
        sort_by="created_at",
        sort_order="desc"
    )
    
    print(f"\n📅 New leads (last 7 days): {total}")
    for lead in leads:
        print(f"   - {lead.full_name} (Created: {lead.created_at})")


async def example_update_lead(
    db: AsyncSession,
    lead_id: int,
    user_id: int
) -> None:
    """Example: Update a lead"""
    
    try:
        # Update lead status and add notes
        update_data = {
            "status": LeadStatus.CONTACTED,
            "last_contact_date": datetime.utcnow(),
            "next_follow_up": datetime.utcnow() + timedelta(days=2),
            "lead_score": 85,
            "call_attempts": 1,
            "notes": [{
                "content": "Initial contact made. Customer is interested in our premium plan.",
                "type": "call"
            }]
        }
        
        lead = await LeadService.update_lead(
            db=db,
            lead_id=lead_id,
            lead_data=update_data,
            user_id=user_id
        )
        
        print(f"\n✅ Updated lead {lead.id}:")
        print(f"   Status: {lead.status.value}")
        print(f"   Score: {lead.lead_score}")
        print(f"   Notes count: {len(lead.notes)}")
        
    except LeadNotFoundException:
        print(f"❌ Lead {lead_id} not found")


async def example_bulk_operations(db: AsyncSession, user_id: int) -> None:
    """Example: Bulk update and assignment"""
    
    # Get unassigned leads
    unassigned_leads, total = await LeadService.get_leads(
        db=db,
        assigned_to=None,
        status=LeadStatus.NEW,
        limit=10
    )
    
    if not unassigned_leads:
        print("\n📋 No unassigned leads found")
        return
    
    lead_ids = [lead.id for lead in unassigned_leads]
    
    # Bulk assign leads
    assigned = await LeadService.assign_leads(
        db=db,
        lead_ids=lead_ids,
        agent_user_id=user_id,
        assigned_by_user_id=user_id
    )
    
    print(f"\n👤 Assigned {len(assigned)} leads to user {user_id}")
    
    # Bulk update status
    updated = await LeadService.bulk_update_status(
        db=db,
        lead_ids=lead_ids,
        new_status=LeadStatus.CONTACTED,
        user_id=user_id
    )
    
    print(f"✅ Updated {len(updated)} leads to CONTACTED status")


async def example_get_statistics(
    db: AsyncSession,
    assigned_to: Optional[int] = None
) -> None:
    """Example: Get lead statistics"""
    
    # Get overall statistics
    stats = await LeadService.get_lead_statistics(db=db)
    
    print("\n📊 Lead Statistics:")
    print(f"   Total leads: {stats['total_leads']}")
    print(f"   Average score: {stats['average_lead_score']}")
    print(f"   Hot leads: {stats['hot_leads_count']}")
    print(f"   Conversion rate: {stats['conversion_rate']}%")
    
    print("\n   By Status:")
    for status, count in stats['leads_by_status'].items():
        print(f"      {status}: {count}")
    
    print("\n   By Source:")
    for source, count in stats['leads_by_source'].items():
        print(f"      {source}: {count}")
    
    # Get statistics for specific agent
    if assigned_to:
        agent_stats = await LeadService.get_lead_statistics(
            db=db,
            assigned_to=assigned_to
        )
        
        print(f"\n👤 Agent {assigned_to} Statistics:")
        print(f"   Assigned leads: {agent_stats['total_leads']}")
        print(f"   Average score: {agent_stats['average_lead_score']}")
        print(f"   Conversion rate: {agent_stats['conversion_rate']}%")


async def example_advanced_filtering(db: AsyncSession) -> None:
    """Example: Advanced filtering with multiple criteria"""
    
    # High-value leads needing follow-up
    leads, total = await LeadService.get_leads(
        db=db,
        lead_score_min=70,
        status=LeadStatus.QUALIFIED,
        tags=["enterprise", "high-value"],
        sort_by="lead_score",
        sort_order="desc",
        limit=20
    )
    
    print(f"\n🎯 High-value qualified leads: {total}")
    for lead in leads:
        print(f"   - {lead.full_name}: Score {lead.lead_score}")
        if lead.next_follow_up:
            print(f"     Follow-up: {lead.next_follow_up}")


async def example_permission_check(
    db: AsyncSession,
    lead_id: int,
    user_id: int
) -> None:
    """Example: Get lead with permission check"""
    
    try:
        lead = await LeadService.get_lead_by_id(
            db=db,
            lead_id=lead_id,
            user_id=user_id,
            check_assignment=True
        )
        
        print(f"\n✅ Access granted to lead {lead.id}")
        print(f"   Assigned to: {lead.assigned_to}")
        
    except PermissionDeniedException:
        print(f"❌ User {user_id} cannot access lead {lead_id}")
    except LeadNotFoundException:
        print(f"❌ Lead {lead_id} not found")


async def example_soft_delete(
    db: AsyncSession,
    lead_id: int,
    user_id: int
) -> None:
    """Example: Archive (soft delete) a lead"""
    
    try:
        success = await LeadService.delete_lead(
            db=db,
            lead_id=lead_id,
            user_id=user_id,
            hard_delete=False  # Soft delete
        )
        
        if success:
            print(f"\n🗄️  Lead {lead_id} archived successfully")
            
            # Verify it's archived
            lead = await LeadService.get_lead_by_id(db, lead_id)
            print(f"   Status: {lead.status.value}")
            print(f"   Tags: {lead.tags}")
        
    except PermissionDeniedException as e:
        print(f"❌ {e.message}")


async def example_lead_lifecycle(db: AsyncSession, user_id: int) -> None:
    """Example: Complete lead lifecycle from creation to conversion"""
    
    print("\n" + "="*50)
    print("LEAD LIFECYCLE EXAMPLE")
    print("="*50)
    
    # Step 1: Create lead
    print("\n1️⃣  Creating new lead...")
    lead_data = {
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@techstart.com",
        "phone": "+1555123456",
        "company": "TechStart Inc",
        "source": LeadSource.REFERRAL,
        "tags": ["enterprise", "tech-industry"]
    }
    
    lead = await LeadService.create_lead(
        db=db,
        lead_data=lead_data,
        user_id=user_id
    )
    print(f"   ✅ Created: {lead.full_name} (ID: {lead.id}, Score: {lead.lead_score})")
    
    # Step 2: Assign to agent
    print("\n2️⃣  Assigning to sales agent...")
    await LeadService.assign_leads(
        db=db,
        lead_ids=[lead.id],
        agent_user_id=user_id,
        assigned_by_user_id=user_id
    )
    print(f"   ✅ Assigned to user {user_id}")
    
    # Step 3: First contact
    print("\n3️⃣  Recording first contact...")
    await LeadService.update_lead(
        db=db,
        lead_id=lead.id,
        lead_data={
            "status": LeadStatus.CONTACTED,
            "last_contact_date": datetime.utcnow(),
            "call_attempts": 1,
            "lead_score": 75,
            "notes": [{
                "content": "Initial call - interested in enterprise plan",
                "type": "call"
            }]
        },
        user_id=user_id
    )
    print("   ✅ Status updated to CONTACTED")
    
    # Step 4: Qualify lead
    print("\n4️⃣  Qualifying lead...")
    await LeadService.update_lead(
        db=db,
        lead_id=lead.id,
        lead_data={
            "status": LeadStatus.QUALIFIED,
            "lead_score": 85,
            "conversion_probability": 0.7,
            "next_follow_up": datetime.utcnow() + timedelta(days=2),
            "notes": [{
                "content": "Budget confirmed, decision maker identified",
                "type": "meeting"
            }]
        },
        user_id=user_id
    )
    print("   ✅ Lead qualified (Score: 85, Hot lead!)")
    
    # Step 5: Send proposal
    print("\n5️⃣  Sending proposal...")
    await LeadService.update_lead(
        db=db,
        lead_id=lead.id,
        lead_data={
            "status": LeadStatus.PROPOSAL,
            "lead_score": 90,
            "conversion_probability": 0.8,
            "notes": [{
                "content": "Proposal sent for enterprise plan - $50K annually",
                "type": "email"
            }]
        },
        user_id=user_id
    )
    print("   ✅ Proposal sent")
    
    # Step 6: Win the deal
    print("\n6️⃣  Closing the deal...")
    lead = await LeadService.update_lead(
        db=db,
        lead_id=lead.id,
        lead_data={
            "status": LeadStatus.WON,
            "lead_score": 100,
            "conversion_probability": 1.0,
            "notes": [{
                "content": "Deal closed! Annual contract signed.",
                "type": "meeting"
            }]
        },
        user_id=user_id
    )
    print("   🎉 Deal WON!")
    
    # Summary
    print(f"\n📋 Final Lead Summary:")
    print(f"   Name: {lead.full_name}")
    print(f"   Company: {lead.company}")
    print(f"   Status: {lead.status.value}")
    print(f"   Score: {lead.lead_score}")
    print(f"   Days since created: {lead.days_since_created}")
    print(f"   Total notes: {len(lead.notes)}")
    print(f"   Tags: {', '.join(lead.tags)}")
    
    print("\n" + "="*50)


# Main example runner
async def run_all_examples(db: AsyncSession, user_id: int = 1) -> None:
    """Run all examples"""
    
    print("🚀 Running Lead Service Examples...")
    
    try:
        # Basic operations
        await example_create_lead(db, user_id)
        await example_search_leads(db)
        await example_filter_by_status(db)
        
        # Get a lead ID for update examples
        leads, _ = await LeadService.get_leads(db, limit=1)
        if leads:
            lead_id = leads[0].id
            await example_update_lead(db, lead_id, user_id)
            await example_permission_check(db, lead_id, user_id)
        
        # Bulk operations
        await example_bulk_operations(db, user_id)
        
        # Statistics
        await example_get_statistics(db, assigned_to=user_id)
        
        # Advanced
        await example_advanced_filtering(db)
        
        # Lifecycle
        await example_lead_lifecycle(db, user_id)
        
        print("\n✅ All examples completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        raise

