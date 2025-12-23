# Lead Service Documentation

## Overview

The `LeadService` class provides comprehensive business logic for lead management in the CRM system. All methods are asynchronous and include proper error handling and transaction management.

## Methods

### 1. get_leads()

Retrieve leads with advanced filtering, pagination, and sorting.

#### Parameters:
- `db` (AsyncSession): Database session
- `status` (LeadStatus, optional): Filter by lead status
- `source` (LeadSource, optional): Filter by lead source
- `assigned_to` (int, optional): Filter by assigned user ID
- `date_range_start` (datetime, optional): Filter leads created after this date
- `date_range_end` (datetime, optional): Filter leads created before this date
- `lead_score_min` (int, optional): Minimum lead score
- `lead_score_max` (int, optional): Maximum lead score
- `search` (str, optional): Search term for name, email, phone, or company
- `is_hot_leads_only` (bool): Filter only hot leads (score > 70)
- `tags` (List[str], optional): Filter by tags
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Maximum records to return (default: 100)
- `sort_by` (str): Field to sort by (default: "created_at")
- `sort_order` (str): "asc" or "desc" (default: "desc")

#### Returns:
Tuple of (list of leads, total count)

#### Example:
```python
from app.services import LeadService
from app.models import LeadStatus, LeadSource
from datetime import datetime, timedelta

# Get all hot leads assigned to user 5
leads, total = await LeadService.get_leads(
    db=db,
    assigned_to=5,
    is_hot_leads_only=True,
    skip=0,
    limit=50,
    sort_by="lead_score",
    sort_order="desc"
)

# Search for leads by name or email
leads, total = await LeadService.get_leads(
    db=db,
    search="john",
    skip=0,
    limit=20
)

# Get leads created in the last 7 days
seven_days_ago = datetime.utcnow() - timedelta(days=7)
leads, total = await LeadService.get_leads(
    db=db,
    date_range_start=seven_days_ago,
    status=LeadStatus.NEW,
    sort_by="created_at",
    sort_order="desc"
)

# Filter by tags
leads, total = await LeadService.get_leads(
    db=db,
    tags=["enterprise", "high-priority"],
    lead_score_min=70
)
```

---

### 2. get_lead_by_id()

Get a single lead by ID with optional permission checking.

#### Parameters:
- `db` (AsyncSession): Database session
- `lead_id` (int): ID of the lead
- `user_id` (int, optional): ID of the requesting user
- `check_assignment` (bool): Verify user is assigned to the lead (default: False)

#### Returns:
Lead object

#### Raises:
- `LeadNotFoundException`: If lead doesn't exist
- `PermissionDeniedException`: If user doesn't have permission

#### Example:
```python
# Get lead without permission check
lead = await LeadService.get_lead_by_id(
    db=db,
    lead_id=123
)

# Get lead with permission check
try:
    lead = await LeadService.get_lead_by_id(
        db=db,
        lead_id=123,
        user_id=5,
        check_assignment=True
    )
except PermissionDeniedException:
    print("User not authorized")
```

---

### 3. create_lead()

Create a new lead with automatic lead scoring.

#### Parameters:
- `db` (AsyncSession): Database session
- `lead_data` (Dict[str, Any]): Lead data
- `user_id` (int, optional): ID of the user creating the lead

#### Required Fields in lead_data:
- `first_name` (str)
- `last_name` (str)
- `email` (str)
- `phone` (str)

#### Optional Fields:
- `company` (str)
- `source` (LeadSource)
- `status` (LeadStatus)
- `assigned_to` (int)
- `lead_score` (int): If not provided, auto-calculated
- `conversion_probability` (float)
- `tags` (List[str])
- `notes` (List[Dict])

#### Returns:
Created lead object

#### Example:
```python
from app.models import LeadSource, LeadStatus

lead_data = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "source": LeadSource.WEBSITE,
    "status": LeadStatus.NEW,
    "tags": ["enterprise", "tech"],
    "assigned_to": 5
}

lead = await LeadService.create_lead(
    db=db,
    lead_data=lead_data,
    user_id=1
)

print(f"Created lead {lead.id} with score {lead.lead_score}")
```

---

### 4. update_lead()

Update an existing lead with automatic change tracking.

#### Parameters:
- `db` (AsyncSession): Database session
- `lead_id` (int): ID of the lead to update
- `lead_data` (Dict[str, Any]): Updated data
- `user_id` (int, optional): ID of the user updating

#### Returns:
Updated lead object

#### Example:
```python
# Update lead status and score
update_data = {
    "status": LeadStatus.CONTACTED,
    "lead_score": 85,
    "last_contact_date": datetime.utcnow(),
    "notes": [
        {
            "content": "Had initial conversation, very interested",
            "type": "call"
        }
    ]
}

lead = await LeadService.update_lead(
    db=db,
    lead_id=123,
    lead_data=update_data,
    user_id=5
)

# System will automatically add a change tracking note
```

---

### 5. delete_lead()

Delete or archive a lead (soft delete by default).

#### Parameters:
- `db` (AsyncSession): Database session
- `lead_id` (int): ID of the lead to delete
- `user_id` (int, optional): ID of the user deleting
- `hard_delete` (bool): Permanently delete if True (default: False)

#### Returns:
True if successful

#### Example:
```python
# Soft delete (archive)
success = await LeadService.delete_lead(
    db=db,
    lead_id=123,
    user_id=5,
    hard_delete=False
)

# Hard delete (permanent)
success = await LeadService.delete_lead(
    db=db,
    lead_id=123,
    user_id=1,  # Must be superuser
    hard_delete=True
)
```

---

### 6. bulk_update_status()

Update status for multiple leads at once.

#### Parameters:
- `db` (AsyncSession): Database session
- `lead_ids` (List[int]): List of lead IDs to update
- `new_status` (LeadStatus): New status to set
- `user_id` (int, optional): ID of the user performing update

#### Returns:
List of updated leads

#### Example:
```python
from app.models import LeadStatus

# Mark multiple leads as contacted
lead_ids = [101, 102, 103, 104, 105]

updated_leads = await LeadService.bulk_update_status(
    db=db,
    lead_ids=lead_ids,
    new_status=LeadStatus.CONTACTED,
    user_id=5
)

print(f"Updated {len(updated_leads)} leads")
```

---

### 7. assign_leads()

Assign multiple leads to a sales agent.

#### Parameters:
- `db` (AsyncSession): Database session
- `lead_ids` (List[int]): List of lead IDs to assign
- `agent_user_id` (int): ID of the user to assign leads to
- `assigned_by_user_id` (int, optional): ID of the user performing assignment

#### Returns:
List of assigned leads

#### Example:
```python
# Assign leads to sales agent
lead_ids = [101, 102, 103]

assigned_leads = await LeadService.assign_leads(
    db=db,
    lead_ids=lead_ids,
    agent_user_id=10,  # Agent to assign to
    assigned_by_user_id=1  # Manager performing assignment
)

for lead in assigned_leads:
    print(f"Lead {lead.id} assigned to {lead.assigned_user.username}")
```

---

### 8. get_lead_statistics()

Get comprehensive statistics about leads.

#### Parameters:
- `db` (AsyncSession): Database session
- `assigned_to` (int, optional): Filter by assigned user
- `date_range_start` (datetime, optional): Start date
- `date_range_end` (datetime, optional): End date

#### Returns:
Dictionary containing:
- `total_leads`: Total number of leads
- `leads_by_status`: Count by status
- `leads_by_source`: Count by source
- `average_lead_score`: Average score
- `hot_leads_count`: Number of hot leads
- `conversion_rate`: Win rate percentage

#### Example:
```python
from datetime import datetime, timedelta

# Get statistics for the last 30 days
thirty_days_ago = datetime.utcnow() - timedelta(days=30)

stats = await LeadService.get_lead_statistics(
    db=db,
    date_range_start=thirty_days_ago
)

print(f"Total leads: {stats['total_leads']}")
print(f"Average score: {stats['average_lead_score']}")
print(f"Conversion rate: {stats['conversion_rate']}%")
print(f"Status breakdown: {stats['leads_by_status']}")

# Get statistics for specific agent
agent_stats = await LeadService.get_lead_statistics(
    db=db,
    assigned_to=5
)
```

---

## Auto Lead Scoring Algorithm

The `_calculate_lead_score()` method automatically scores leads based on:

1. **Base Score**: 50 points
2. **Source Quality**:
   - REFERRAL: +20 points
   - WEBSITE: +15 points
   - FACEBOOK/INSTAGRAM: +10 points
   - WHATSAPP: +5 points
   - OTHER: 0 points
3. **Company Information**: +10 points if company provided
4. **Email Domain**: +10 points for business email (non-Gmail, Yahoo, etc.)
5. **High-Value Tags**: +15 points for tags like "enterprise", "hot", "urgent"

Final score is capped between 0-100.

### Example Scoring:
```python
# Referral lead with business email and company
# Score: 50 + 20 + 10 + 10 = 90 points (hot lead!)

# Website lead with personal email, no company
# Score: 50 + 15 = 65 points
```

---

## Error Handling

All service methods include comprehensive error handling:

```python
from app.services import (
    LeadService,
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException,
    DatabaseException
)

try:
    lead = await LeadService.get_lead_by_id(db, lead_id=999)
except LeadNotFoundException as e:
    print(f"Lead not found: {e.message}")
except PermissionDeniedException as e:
    print(f"Permission denied: {e.message}")
except DatabaseException as e:
    print(f"Database error: {e.message}")
```

---

## Transaction Management

All write operations (create, update, delete, bulk operations) use proper transaction management:

- Automatic commit on success
- Automatic rollback on error
- Session refresh after operations
- Relationship loading for complete data

---

## Complete Example: Lead Lifecycle

```python
from app.services import LeadService
from app.models import LeadSource, LeadStatus
from datetime import datetime, timedelta

async def lead_lifecycle_example(db: AsyncSession):
    # 1. Create a new lead
    lead_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@techcorp.com",
        "phone": "+1987654321",
        "company": "TechCorp Inc",
        "source": LeadSource.REFERRAL,
        "tags": ["enterprise", "tech"]
    }
    
    lead = await LeadService.create_lead(
        db=db,
        lead_data=lead_data,
        user_id=1
    )
    print(f"Created lead {lead.id} with score {lead.lead_score}")
    
    # 2. Assign to sales agent
    await LeadService.assign_leads(
        db=db,
        lead_ids=[lead.id],
        agent_user_id=5,
        assigned_by_user_id=1
    )
    
    # 3. Update after first contact
    update_data = {
        "status": LeadStatus.CONTACTED,
        "last_contact_date": datetime.utcnow(),
        "next_follow_up": datetime.utcnow() + timedelta(days=2),
        "lead_score": 90,
        "notes": [{
            "content": "Initial call completed. Very interested!",
            "type": "call"
        }]
    }
    
    lead = await LeadService.update_lead(
        db=db,
        lead_id=lead.id,
        lead_data=update_data,
        user_id=5
    )
    
    # 4. Check if hot lead
    if lead.is_hot_lead:
        print("🔥 This is a hot lead!")
    
    # 5. Update to qualified status
    await LeadService.bulk_update_status(
        db=db,
        lead_ids=[lead.id],
        new_status=LeadStatus.QUALIFIED,
        user_id=5
    )
    
    # 6. Get all hot leads for follow-up
    hot_leads, total = await LeadService.get_leads(
        db=db,
        is_hot_leads_only=True,
        assigned_to=5,
        sort_by="lead_score",
        sort_order="desc"
    )
    
    print(f"Found {total} hot leads")
    
    # 7. Get statistics
    stats = await LeadService.get_lead_statistics(
        db=db,
        assigned_to=5
    )
    
    print(f"Conversion rate: {stats['conversion_rate']}%")
```

---

## Best Practices

1. **Always use async/await** with database operations
2. **Handle exceptions** appropriately for user-facing errors
3. **Use transactions** for multiple related operations
4. **Validate input** before passing to service methods
5. **Check permissions** for sensitive operations
6. **Use bulk operations** when updating multiple records
7. **Add meaningful notes** for audit trail
8. **Refresh objects** after updates to get latest data

