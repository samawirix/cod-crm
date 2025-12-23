# CRM Backend - Quick Reference Guide

## 🚀 Quick Start

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Database Setup

```python
from app.database import get_development_config

# Initialize database
db_config = get_development_config()
await db_config.create_tables()
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── base.py          # SQLAlchemy base
│   │   ├── lead.py          # Lead model
│   │   ├── user.py          # User model
│   │   └── README.md        # Models documentation
│   ├── services/
│   │   ├── lead_service.py  # Lead business logic
│   │   ├── exceptions.py    # Custom exceptions
│   │   ├── example_usage.py # Usage examples
│   │   └── README.md        # Service documentation
│   └── database.py          # Database configuration
├── requirements.txt
└── QUICK_REFERENCE.md       # This file
```

---

## 🎯 Common Tasks

### 1. Create a Lead

```python
from app.services import LeadService
from app.models import LeadSource

lead_data = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "source": LeadSource.WEBSITE
}

lead = await LeadService.create_lead(db, lead_data, user_id=1)
```

### 2. Search Leads

```python
# Search by name/email
leads, total = await LeadService.get_leads(
    db=db,
    search="john",
    limit=20
)

# Filter hot leads
leads, total = await LeadService.get_leads(
    db=db,
    is_hot_leads_only=True,
    sort_by="lead_score",
    sort_order="desc"
)
```

### 3. Update Lead

```python
from app.models import LeadStatus

update_data = {
    "status": LeadStatus.CONTACTED,
    "lead_score": 85,
    "notes": [{
        "content": "Called customer, very interested",
        "type": "call"
    }]
}

lead = await LeadService.update_lead(db, lead_id=123, lead_data=update_data, user_id=1)
```

### 4. Bulk Assign Leads

```python
assigned = await LeadService.assign_leads(
    db=db,
    lead_ids=[101, 102, 103],
    agent_user_id=5,
    assigned_by_user_id=1
)
```

### 5. Get Statistics

```python
stats = await LeadService.get_lead_statistics(db=db)

print(f"Total: {stats['total_leads']}")
print(f"Conversion rate: {stats['conversion_rate']}%")
print(f"Hot leads: {stats['hot_leads_count']}")
```

---

## 📊 Lead Model Reference

### Enums

**LeadStatus:**
- NEW
- CONTACTED
- QUALIFIED
- PROPOSAL
- NEGOTIATION
- WON
- LOST
- CALLBACK

**LeadSource:**
- WEBSITE
- FACEBOOK
- INSTAGRAM
- WHATSAPP
- REFERRAL
- OTHER

### Key Fields

```python
lead.id                      # Primary key
lead.full_name               # First + last name
lead.email                   # Email (validated)
lead.phone                   # Phone (validated)
lead.status                  # Lead status
lead.source                  # Lead source
lead.assigned_to             # User ID
lead.lead_score              # 0-100
lead.conversion_probability  # 0.0-1.0
lead.last_contact_date       # DateTime
lead.next_follow_up          # DateTime
lead.call_attempts           # Integer
lead.notes                   # JSON array
lead.tags                    # JSON array
```

### Properties

```python
lead.days_since_created       # Days since creation
lead.days_since_last_contact  # Days since last contact
lead.is_hot_lead             # True if score > 70
```

### Helper Methods

```python
lead.add_note(content, created_by, note_type)
lead.add_tag(tag)
lead.remove_tag(tag)
lead.increment_call_attempts()
lead.update_score(new_score)
lead.to_dict()  # Convert to dictionary
```

---

## 🔧 Service Methods

### LeadService Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `get_leads()` | List/filter leads | `(List[Lead], int)` |
| `get_lead_by_id()` | Get single lead | `Lead` |
| `create_lead()` | Create new lead | `Lead` |
| `update_lead()` | Update lead | `Lead` |
| `delete_lead()` | Archive/delete lead | `bool` |
| `bulk_update_status()` | Update multiple statuses | `List[Lead]` |
| `assign_leads()` | Bulk assignment | `List[Lead]` |
| `get_lead_statistics()` | Get statistics | `Dict` |

### Filtering Options for get_leads()

```python
leads, total = await LeadService.get_leads(
    db=db,
    status=LeadStatus.NEW,              # Filter by status
    source=LeadSource.WEBSITE,          # Filter by source
    assigned_to=5,                      # Filter by agent
    date_range_start=start_date,        # Created after
    date_range_end=end_date,            # Created before
    lead_score_min=70,                  # Min score
    lead_score_max=100,                 # Max score
    search="john",                      # Search term
    is_hot_leads_only=True,             # Hot leads only
    tags=["enterprise", "tech"],        # Filter by tags
    skip=0,                             # Pagination offset
    limit=50,                           # Page size
    sort_by="lead_score",               # Sort field
    sort_order="desc"                   # asc/desc
)
```

---

## 🎨 Auto Lead Scoring

Leads are automatically scored 0-100 based on:

- **Base:** 50 points
- **Source:**
  - REFERRAL: +20
  - WEBSITE: +15
  - FACEBOOK/INSTAGRAM: +10
  - WHATSAPP: +5
- **Company:** +10 if provided
- **Email domain:** +10 for business email
- **High-value tags:** +15 for enterprise/hot/urgent

---

## ⚠️ Error Handling

```python
from app.services.exceptions import (
    LeadNotFoundException,
    PermissionDeniedException,
    InvalidDataException,
    DatabaseException
)

try:
    lead = await LeadService.get_lead_by_id(db, lead_id=999)
except LeadNotFoundException:
    # Handle not found
    pass
except PermissionDeniedException:
    # Handle permission error
    pass
except DatabaseException:
    # Handle database error
    pass
```

---

## 🔐 Permission Checking

```python
# Check if user can access lead
lead = await LeadService.get_lead_by_id(
    db=db,
    lead_id=123,
    user_id=5,
    check_assignment=True  # Verify assignment
)

# Delete requires superuser or assigned user
await LeadService.delete_lead(
    db=db,
    lead_id=123,
    user_id=5
)
```

---

## 🔄 Transaction Management

All write operations use automatic transaction management:

- ✅ Auto-commit on success
- ✅ Auto-rollback on error
- ✅ Session refresh after operations
- ✅ Relationship loading

---

## 📝 Complete Example

```python
from app.database import get_development_config
from app.services import LeadService
from app.models import LeadSource, LeadStatus

# Setup
db_config = get_development_config()

async def main():
    async with db_config.get_session() as db:
        # Create lead
        lead = await LeadService.create_lead(
            db=db,
            lead_data={
                "first_name": "Jane",
                "last_name": "Smith",
                "email": "jane@example.com",
                "phone": "+1234567890",
                "source": LeadSource.REFERRAL
            },
            user_id=1
        )
        
        # Assign to agent
        await LeadService.assign_leads(
            db=db,
            lead_ids=[lead.id],
            agent_user_id=5,
            assigned_by_user_id=1
        )
        
        # Update status
        lead = await LeadService.update_lead(
            db=db,
            lead_id=lead.id,
            lead_data={
                "status": LeadStatus.CONTACTED,
                "notes": [{
                    "content": "Initial call completed",
                    "type": "call"
                }]
            },
            user_id=5
        )
        
        # Check if hot lead
        if lead.is_hot_lead:
            print(f"🔥 Hot lead: {lead.full_name}")
        
        # Get statistics
        stats = await LeadService.get_lead_statistics(db=db)
        print(f"Total leads: {stats['total_leads']}")
        print(f"Conversion rate: {stats['conversion_rate']}%")

# Run
import asyncio
asyncio.run(main())
```

---

## 🧪 Testing

```python
from app.database import get_testing_config

# Use test database
db_config = get_testing_config()

async def test_create_lead():
    async with db_config.get_session() as db:
        lead = await LeadService.create_lead(
            db=db,
            lead_data={...},
            user_id=1
        )
        assert lead.id is not None
        assert lead.lead_score > 0
```

---

## 📚 Additional Resources

- **Models Documentation:** `app/models/README.md`
- **Service Documentation:** `app/services/README.md`
- **Example Usage:** `app/services/example_usage.py`

---

## 🛠️ Database Connection URLs

### Development
```
postgresql+asyncpg://user:password@localhost:5432/crm_dev
```

### Production
```
postgresql+asyncpg://user:password@hostname:5432/crm_prod
```

### Testing
```
postgresql+asyncpg://user:password@localhost:5432/crm_test
```

---

## 💡 Tips

1. **Always use async/await** with database sessions
2. **Check permissions** for sensitive operations
3. **Use bulk operations** for multiple records
4. **Add meaningful notes** for audit trail
5. **Handle exceptions** appropriately
6. **Use transactions** via the service layer
7. **Filter hot leads** with `is_hot_leads_only=True`
8. **Sort by score** for prioritization

---

## 🔗 Common Queries

### Get unassigned new leads
```python
leads, total = await LeadService.get_leads(
    db=db,
    status=LeadStatus.NEW,
    assigned_to=None
)
```

### Get overdue follow-ups
```python
from datetime import datetime

leads, total = await LeadService.get_leads(
    db=db,
    # Use raw SQL filter for next_follow_up < now
)
```

### Get top performers
```python
leads, total = await LeadService.get_leads(
    db=db,
    status=LeadStatus.WON,
    sort_by="created_at",
    sort_order="desc",
    limit=10
)
```

