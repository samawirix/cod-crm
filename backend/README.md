# CRM Backend Service

Complete backend implementation for a Customer Relationship Management (CRM) system with advanced lead management capabilities.

## 🌟 Features

### Lead Management
- ✅ **CRUD Operations** - Create, read, update, delete leads
- ✅ **Advanced Filtering** - Filter by status, source, score, dates, tags, and more
- ✅ **Full-Text Search** - Search across name, email, phone, company
- ✅ **Auto Lead Scoring** - Intelligent scoring based on source, email domain, tags, etc.
- ✅ **Bulk Operations** - Bulk status updates and assignments
- ✅ **Permission System** - Role-based access control
- ✅ **Audit Trail** - Automatic change tracking in notes
- ✅ **Pagination & Sorting** - Efficient data retrieval
- ✅ **Statistics & Analytics** - Comprehensive lead metrics

### Data Validation
- ✅ Email format validation
- ✅ Phone number validation (international format)
- ✅ Lead score range validation (0-100)
- ✅ Conversion probability validation (0.0-1.0)
- ✅ Required field validation

### Database Features
- ✅ **Async/Await** - Full async support with SQLAlchemy 2.0
- ✅ **Transaction Management** - Automatic commit/rollback
- ✅ **Optimized Indexes** - Performance-tuned queries
- ✅ **Relationship Loading** - Efficient data fetching
- ✅ **JSON Fields** - Flexible data storage for notes and tags

## 📁 Project Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py           # SQLAlchemy base
│   │   ├── lead.py           # Lead model with validations
│   │   ├── user.py           # User model
│   │   └── README.md         # Models documentation
│   ├── services/
│   │   ├── __init__.py
│   │   ├── lead_service.py   # Lead business logic
│   │   ├── exceptions.py     # Custom exceptions
│   │   ├── example_usage.py  # Usage examples
│   │   └── README.md         # Service documentation
│   ├── __init__.py
│   └── database.py           # Database configuration
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Pytest configuration
│   └── test_lead_service.py  # Comprehensive tests
├── requirements.txt          # Dependencies
├── QUICK_REFERENCE.md        # Quick reference guide
└── README.md                 # This file
```

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

### Basic Usage

```python
from app.services import LeadService
from app.models import LeadSource, LeadStatus

# Create a lead
lead = await LeadService.create_lead(
    db=db,
    lead_data={
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "source": LeadSource.WEBSITE
    },
    user_id=1
)

# Search leads
leads, total = await LeadService.get_leads(
    db=db,
    search="john",
    is_hot_leads_only=True
)

# Update lead
await LeadService.update_lead(
    db=db,
    lead_id=lead.id,
    lead_data={
        "status": LeadStatus.CONTACTED,
        "lead_score": 85
    },
    user_id=1
)
```

## 📊 Data Models

### Lead Model

**Enums:**
- `LeadStatus`: NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST, CALLBACK
- `LeadSource`: WEBSITE, FACEBOOK, INSTAGRAM, WHATSAPP, REFERRAL, OTHER

**Fields:**
- Basic: first_name, last_name, email, phone, company
- Classification: source, status
- Assignment: assigned_to (User FK)
- Scoring: lead_score (0-100), conversion_probability (0.0-1.0)
- Tracking: last_contact_date, next_follow_up, call_attempts
- Flexible: notes (JSON), tags (JSON)
- Timestamps: created_at, updated_at

**Properties:**
- `days_since_created` - Days since lead creation
- `days_since_last_contact` - Days since last contact
- `is_hot_lead` - True if score > 70
- `full_name` - Combined first and last name

**Methods:**
- `add_note(content, created_by, note_type)`
- `add_tag(tag)`
- `remove_tag(tag)`
- `increment_call_attempts()`
- `update_score(new_score)`
- `to_dict()` - Serialize to dictionary

## 🔧 Service Methods

### LeadService

| Method | Purpose |
|--------|---------|
| `get_leads()` | List leads with filtering, pagination, sorting |
| `get_lead_by_id()` | Get single lead with permission check |
| `create_lead()` | Create new lead with auto-scoring |
| `update_lead()` | Update lead with change tracking |
| `delete_lead()` | Soft delete (archive) or hard delete |
| `bulk_update_status()` | Update status for multiple leads |
| `assign_leads()` | Bulk assign leads to agent |
| `get_lead_statistics()` | Get comprehensive statistics |

### Filtering Options

```python
leads, total = await LeadService.get_leads(
    db=db,
    status=LeadStatus.NEW,           # Filter by status
    source=LeadSource.WEBSITE,       # Filter by source
    assigned_to=5,                   # Filter by agent
    date_range_start=start_date,     # Created after
    date_range_end=end_date,         # Created before
    lead_score_min=70,               # Min score
    lead_score_max=100,              # Max score
    search="john",                   # Search term
    is_hot_leads_only=True,          # Hot leads only
    tags=["enterprise", "tech"],     # Filter by tags
    skip=0,                          # Pagination offset
    limit=50,                        # Page size
    sort_by="lead_score",            # Sort field
    sort_order="desc"                # asc/desc
)
```

## 🎨 Auto Lead Scoring

Leads are automatically scored (0-100) based on:

- **Base Score**: 50 points
- **Source Quality**:
  - REFERRAL: +20
  - WEBSITE: +15
  - FACEBOOK/INSTAGRAM: +10
  - WHATSAPP: +5
- **Company**: +10 if provided
- **Email Domain**: +10 for business email
- **High-Value Tags**: +15 for enterprise/hot/urgent

**Example:**
- Referral + business email + company + "enterprise" tag = 50+20+10+10+15 = 105 (capped at 100) 🔥

## ⚡ Performance Features

### Optimized Indexes

- Single indexes: `status`, `assigned_to`, `lead_score`, `created_at`
- Composite indexes:
  - `(status, created_at)` - For status-based date filtering
  - `(assigned_to, lead_score)` - For agent performance queries
  - `(lead_score, status)` - For hot lead prioritization

### Async Operations

All database operations use async/await for optimal performance:

```python
# Concurrent operations
async with db_config.get_session() as db:
    leads, stats = await asyncio.gather(
        LeadService.get_leads(db, is_hot_leads_only=True),
        LeadService.get_lead_statistics(db)
    )
```

## 🔐 Security & Permissions

### Permission Checking

```python
# Verify user can access lead
lead = await LeadService.get_lead_by_id(
    db=db,
    lead_id=123,
    user_id=5,
    check_assignment=True  # Raises PermissionDeniedException
)
```

### Soft Delete

By default, leads are archived (soft deleted) rather than permanently removed:

```python
# Archive lead (status → LOST, add "archived" tag)
await LeadService.delete_lead(
    db=db,
    lead_id=123,
    user_id=5,
    hard_delete=False  # Default
)
```

## 🧪 Testing

### Run Tests

```bash
pytest tests/test_lead_service.py -v
```

### Coverage Report

```bash
pytest tests/ --cov=app --cov-report=html
```

### Test Features

- ✅ 15+ comprehensive test cases
- ✅ Async test support
- ✅ In-memory database for fast testing
- ✅ Fixtures for common scenarios
- ✅ Permission testing
- ✅ Error handling validation

## 📚 Documentation

- **[Quick Reference](QUICK_REFERENCE.md)** - Common tasks and examples
- **[Models Documentation](app/models/README.md)** - Database models
- **[Service Documentation](app/services/README.md)** - Business logic
- **[Example Usage](app/services/example_usage.py)** - Code examples

## 💡 Usage Examples

### Complete Lead Lifecycle

```python
# 1. Create lead
lead = await LeadService.create_lead(
    db=db,
    lead_data={
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@techcorp.com",
        "phone": "+1987654321",
        "source": LeadSource.REFERRAL
    },
    user_id=1
)

# 2. Assign to agent
await LeadService.assign_leads(
    db=db,
    lead_ids=[lead.id],
    agent_user_id=5,
    assigned_by_user_id=1
)

# 3. Update after contact
await LeadService.update_lead(
    db=db,
    lead_id=lead.id,
    lead_data={
        "status": LeadStatus.CONTACTED,
        "notes": [{"content": "Initial call completed", "type": "call"}]
    },
    user_id=5
)

# 4. Check if hot lead
if lead.is_hot_lead:
    print(f"🔥 Priority follow-up needed!")

# 5. Get statistics
stats = await LeadService.get_lead_statistics(db=db)
print(f"Conversion rate: {stats['conversion_rate']}%")
```

### Advanced Filtering

```python
# Get high-value leads needing follow-up
leads, total = await LeadService.get_leads(
    db=db,
    lead_score_min=80,
    status=LeadStatus.QUALIFIED,
    tags=["enterprise"],
    sort_by="next_follow_up",
    sort_order="asc"
)

# Get new leads from last week
seven_days_ago = datetime.utcnow() - timedelta(days=7)
leads, total = await LeadService.get_leads(
    db=db,
    status=LeadStatus.NEW,
    date_range_start=seven_days_ago
)
```

## 🛠️ Configuration

### Environment-Specific Configs

```python
# Development
from app.database import get_development_config
db_config = get_development_config()

# Production
from app.database import get_production_config
db_config = get_production_config(
    database_url="postgresql+asyncpg://user:pass@host/db"
)

# Testing
from app.database import get_testing_config
db_config = get_testing_config()
```

## 📈 Statistics & Analytics

```python
stats = await LeadService.get_lead_statistics(
    db=db,
    assigned_to=5,  # Optional: filter by agent
    date_range_start=start_date
)

# Returns:
{
    "total_leads": 150,
    "average_lead_score": 72.5,
    "hot_leads_count": 45,
    "conversion_rate": 15.5,
    "leads_by_status": {"NEW": 30, "WON": 23, ...},
    "leads_by_source": {"WEBSITE": 50, "REFERRAL": 40, ...}
}
```

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
except InvalidDataException:
    # Handle validation error
    pass
except DatabaseException:
    # Handle database error
    pass
```

## 🔄 Transaction Management

All write operations use automatic transaction management:

- ✅ **Auto-commit** on success
- ✅ **Auto-rollback** on error
- ✅ **Session refresh** after operations
- ✅ **Relationship loading** for complete data

## 🎯 Best Practices

1. **Always use async/await** with database sessions
2. **Handle exceptions** appropriately for user-facing errors
3. **Use bulk operations** when updating multiple records
4. **Add meaningful notes** for audit trail
5. **Check permissions** for sensitive operations
6. **Validate input** before passing to service methods
7. **Use transactions** via the service layer
8. **Filter hot leads** for prioritization

## 📦 Dependencies

- **SQLAlchemy 2.0+** - Async ORM
- **asyncpg** - PostgreSQL async driver
- **pytest + pytest-asyncio** - Testing framework
- **email-validator** - Email validation
- **python-dateutil** - Date utilities

## 🤝 Contributing

This is a complete, production-ready implementation. The code is:

- ✅ Fully typed with type hints
- ✅ Comprehensively documented
- ✅ Thoroughly tested (15+ tests)
- ✅ Performance-optimized
- ✅ Security-conscious
- ✅ Following best practices

## 📝 License

MIT License - Feel free to use in your projects!

---

**Built with ❤️ for efficient lead management**

