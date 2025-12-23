# CRM Models Documentation

## Lead Model

The `Lead` model is the core model for managing potential customers in the CRM system.

### Fields

#### Basic Information
- `id`: Primary key
- `first_name`: Lead's first name (required)
- `last_name`: Lead's last name (required)
- `email`: Lead's email address (required, unique, validated)
- `phone`: Lead's phone number (required, validated)
- `company`: Lead's company name (optional)

#### Classification
- `source`: Where the lead came from (enum: WEBSITE, FACEBOOK, INSTAGRAM, WHATSAPP, REFERRAL, OTHER)
- `status`: Current status in sales pipeline (enum: NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST, CALLBACK)

#### Assignment and Scoring
- `assigned_to`: Foreign key to User model (sales representative)
- `lead_score`: Integer score from 0-100 indicating lead quality
- `conversion_probability`: Float from 0.0-1.0 indicating likelihood of conversion

#### Contact Tracking
- `last_contact_date`: DateTime of last contact with lead
- `next_follow_up`: DateTime scheduled for next follow-up
- `call_attempts`: Integer count of call attempts made

#### Flexible Data
- `notes`: JSON array storing history of notes/interactions
- `tags`: JSON array of string tags for categorization

#### Timestamps
- `created_at`: DateTime when lead was created (indexed)
- `updated_at`: DateTime when lead was last modified

### Enums

#### LeadSource
- `WEBSITE`: Lead from company website
- `FACEBOOK`: Lead from Facebook
- `INSTAGRAM`: Lead from Instagram
- `WHATSAPP`: Lead from WhatsApp
- `REFERRAL`: Lead from referral
- `OTHER`: Other sources

#### LeadStatus
- `NEW`: New lead, not yet contacted
- `CONTACTED`: Initial contact made
- `QUALIFIED`: Lead has been qualified
- `PROPOSAL`: Proposal sent
- `NEGOTIATION`: In negotiation phase
- `WON`: Successfully converted
- `LOST`: Lost opportunity
- `CALLBACK`: Scheduled for callback

### Properties

#### days_since_created
Returns the number of days since the lead was created.

```python
lead.days_since_created  # Returns: int or None
```

#### days_since_last_contact
Returns the number of days since the last contact.

```python
lead.days_since_last_contact  # Returns: int or None
```

#### is_hot_lead
Boolean property indicating if lead score > 70.

```python
lead.is_hot_lead  # Returns: bool
```

#### full_name
Returns the combined first and last name.

```python
lead.full_name  # Returns: str
```

### Validation

The model includes automatic validation for:

1. **Email Format**: RFC-compliant email validation
2. **Phone Format**: 7-15 digits, optionally starting with +
3. **Required Fields**: first_name, last_name, email, phone
4. **Lead Score Range**: Must be 0-100
5. **Conversion Probability Range**: Must be 0.0-1.0
6. **Call Attempts**: Must be non-negative

### Indexes

The following indexes are created for optimal query performance:

1. `idx_lead_status_created`: Composite index on (status, created_at)
2. `idx_lead_assigned_score`: Composite index on (assigned_to, lead_score)
3. `idx_lead_score_status`: Composite index on (lead_score, status)

Individual indexes on:
- `status`
- `assigned_to`
- `lead_score`
- `created_at`

### Relationships

- `assigned_user`: Many-to-one relationship with User model

### Helper Methods

#### add_note(content, created_by=None, note_type="general")
Add a note to the lead's history.

```python
lead.add_note(
    content="Called customer, interested in product",
    created_by=user.id,
    note_type="call"
)
```

#### add_tag(tag)
Add a tag to the lead.

```python
lead.add_tag("high-priority")
```

#### remove_tag(tag)
Remove a tag from the lead.

```python
lead.remove_tag("high-priority")
```

#### increment_call_attempts()
Increment the call attempts counter and update last_contact_date.

```python
lead.increment_call_attempts()
```

#### update_score(new_score)
Update the lead score with validation.

```python
lead.update_score(85)
```

#### to_dict()
Convert the lead to a dictionary representation.

```python
lead_dict = lead.to_dict()
```

### Usage Example

```python
from app.models import Lead, LeadSource, LeadStatus
from datetime import datetime, timedelta

# Create a new lead
lead = Lead(
    first_name="John",
    last_name="Doe",
    email="john.doe@example.com",
    phone="+1234567890",
    company="Acme Corp",
    source=LeadSource.WEBSITE,
    status=LeadStatus.NEW,
    lead_score=65,
    conversion_probability=0.7
)

# Add tags
lead.add_tag("enterprise")
lead.add_tag("tech-industry")

# Add a note
lead.add_note(
    content="Initial inquiry about enterprise plan",
    created_by=1,
    note_type="email"
)

# Track call attempt
lead.increment_call_attempts()

# Schedule follow-up
lead.next_follow_up = datetime.utcnow() + timedelta(days=2)

# Check if hot lead
if lead.is_hot_lead:
    print(f"{lead.full_name} is a hot lead!")

# Get days since creation
print(f"Lead age: {lead.days_since_created} days")

# Convert to dict
lead_data = lead.to_dict()
```

### Database Schema

```sql
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(255),
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    lead_score INTEGER NOT NULL DEFAULT 0,
    conversion_probability FLOAT NOT NULL DEFAULT 0.0,
    last_contact_date TIMESTAMP,
    next_follow_up TIMESTAMP,
    call_attempts INTEGER NOT NULL DEFAULT 0,
    notes JSON NOT NULL DEFAULT '[]',
    tags JSON NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_lead_score_range CHECK (lead_score >= 0 AND lead_score <= 100),
    CONSTRAINT check_conversion_probability_range CHECK (conversion_probability >= 0.0 AND conversion_probability <= 1.0),
    CONSTRAINT check_call_attempts_non_negative CHECK (call_attempts >= 0)
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_lead_score ON leads(lead_score);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_lead_status_created ON leads(status, created_at);
CREATE INDEX idx_lead_assigned_score ON leads(assigned_to, lead_score);
CREATE INDEX idx_lead_score_status ON leads(lead_score, status);
```

