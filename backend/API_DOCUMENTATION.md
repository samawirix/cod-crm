## API Documentation - Leads Endpoints

Complete REST API documentation for the CRM Lead Management System.

---

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

**Demo Format:** `Bearer user_<id>`  
Example: `Bearer user_1` for user ID 1

---

## Endpoints

### 1. Get All Leads

Retrieve leads with advanced filtering, pagination, and sorting.

```http
GET /api/v1/leads
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by lead status (NEW, CONTACTED, QUALIFIED, etc.) |
| `source` | string | No | Filter by lead source (WEBSITE, FACEBOOK, etc.) |
| `assigned_to` | integer | No | Filter by assigned user ID |
| `search` | string | No | Search in name, email, phone, company |
| `date_from` | datetime | No | Filter leads created after this date |
| `date_to` | datetime | No | Filter leads created before this date |
| `score_min` | integer | No | Minimum lead score (0-100) |
| `score_max` | integer | No | Maximum lead score (0-100) |
| `is_hot_leads_only` | boolean | No | Show only hot leads (score > 70) |
| `tags` | array[string] | No | Filter by tags |
| `skip` | integer | No | Number of records to skip (default: 0) |
| `limit` | integer | No | Maximum records to return (default: 50, max: 100) |
| `sort_by` | string | No | Field to sort by (default: created_at) |
| `sort_order` | string | No | Sort order: asc or desc (default: desc) |

#### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/leads?status=NEW&score_min=70&limit=20&sort_by=lead_score&sort_order=desc" \
  -H "Authorization: Bearer user_1"
```

#### Example Response

```json
{
  "total": 150,
  "leads": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "company": "Example Corp",
      "source": "WEBSITE",
      "status": "NEW",
      "assigned_to": 5,
      "lead_score": 75,
      "conversion_probability": 0.6,
      "last_contact_date": null,
      "next_follow_up": null,
      "call_attempts": 0,
      "notes": [],
      "tags": ["interested"],
      "created_at": "2025-10-18T10:00:00",
      "updated_at": "2025-10-18T10:00:00",
      "days_since_created": 0,
      "days_since_last_contact": null,
      "is_hot_lead": true
    }
  ],
  "page_info": {
    "total": 150,
    "skip": 0,
    "limit": 50,
    "has_more": true
  }
}
```

---

### 2. Get Lead by ID

Retrieve full details of a specific lead including complete history.

```http
GET /api/v1/leads/{lead_id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lead_id` | integer | Yes | ID of the lead |

#### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/leads/123" \
  -H "Authorization: Bearer user_1"
```

#### Example Response

```json
{
  "id": 123,
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "company": "Example Corp",
  "source": "WEBSITE",
  "status": "CONTACTED",
  "assigned_to": 5,
  "lead_score": 85,
  "conversion_probability": 0.7,
  "last_contact_date": "2025-10-18T14:00:00",
  "next_follow_up": "2025-10-20T10:00:00",
  "call_attempts": 2,
  "notes": [
    {
      "content": "Initial contact made",
      "created_at": "2025-10-18T14:00:00",
      "created_by": 5,
      "type": "call"
    }
  ],
  "tags": ["interested", "high-priority"],
  "created_at": "2025-10-18T10:00:00",
  "updated_at": "2025-10-18T14:30:00",
  "days_since_created": 0,
  "days_since_last_contact": 0,
  "is_hot_lead": true
}
```

---

### 3. Create Lead

Create a new lead with automatic lead scoring.

```http
POST /api/v1/leads
```

#### Request Body

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+9876543210",
  "company": "Tech Corp",
  "source": "REFERRAL",
  "status": "NEW",
  "assigned_to": 5,
  "tags": ["enterprise", "tech-industry"],
  "notes": [
    {
      "content": "Referred by existing client",
      "type": "general"
    }
  ]
}
```

#### Required Fields

- `first_name` (string, 1-100 chars)
- `last_name` (string, 1-100 chars)
- `email` (valid email)
- `phone` (7-15 digits, optional +)

#### Optional Fields

- `company` (string, max 255 chars)
- `source` (enum: WEBSITE, FACEBOOK, INSTAGRAM, WHATSAPP, REFERRAL, OTHER)
- `status` (enum: NEW, CONTACTED, QUALIFIED, etc.)
- `assigned_to` (integer, user ID)
- `lead_score` (integer, 0-100) - auto-calculated if not provided
- `conversion_probability` (float, 0.0-1.0)
- `tags` (array of strings)
- `notes` (array of note objects)

#### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/leads" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+9876543210",
    "source": "REFERRAL"
  }'
```

#### Example Response (201 Created)

```json
{
  "id": 124,
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+9876543210",
  "company": null,
  "source": "REFERRAL",
  "status": "NEW",
  "assigned_to": null,
  "lead_score": 70,
  "conversion_probability": 0.0,
  "last_contact_date": null,
  "next_follow_up": null,
  "call_attempts": 0,
  "notes": [
    {
      "content": "Lead created by user 1",
      "created_at": "2025-10-18T15:00:00",
      "created_by": 1,
      "type": "system"
    }
  ],
  "tags": [],
  "created_at": "2025-10-18T15:00:00",
  "updated_at": "2025-10-18T15:00:00",
  "days_since_created": 0,
  "days_since_last_contact": null,
  "is_hot_lead": false
}
```

---

### 4. Update Lead

Update lead information with automatic change tracking.

```http
PUT /api/v1/leads/{lead_id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lead_id` | integer | Yes | ID of the lead |

#### Request Body (Partial Update)

```json
{
  "status": "CONTACTED",
  "lead_score": 90,
  "last_contact_date": "2025-10-18T16:00:00",
  "next_follow_up": "2025-10-20T10:00:00",
  "notes": [
    {
      "content": "Follow-up call completed. Very interested in premium plan.",
      "type": "call"
    }
  ],
  "tags": ["hot-lead", "enterprise"]
}
```

#### Example Request

```bash
curl -X PUT "http://localhost:8000/api/v1/leads/123" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONTACTED",
    "lead_score": 90
  }'
```

#### Example Response

```json
{
  "id": 123,
  "status": "CONTACTED",
  "lead_score": 90,
  "notes": [
    {
      "content": "Updated: status: NEW → CONTACTED; lead_score: 75 → 90",
      "created_at": "2025-10-18T16:00:00",
      "created_by": 1,
      "type": "system"
    }
  ],
  "updated_at": "2025-10-18T16:00:00"
}
```

---

### 5. Delete Lead

Delete or archive a lead.

```http
DELETE /api/v1/leads/{lead_id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lead_id` | integer | Yes | ID of the lead |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hard_delete` | boolean | No | Permanently delete (requires superuser, default: false) |

#### Behavior

**Soft Delete (Default):**
- Changes status to LOST
- Adds "archived" tag
- Preserves all data

**Hard Delete (hard_delete=true):**
- Permanently removes from database
- Requires superuser permission
- Cannot be undone

#### Example Request

```bash
# Soft delete
curl -X DELETE "http://localhost:8000/api/v1/leads/123" \
  -H "Authorization: Bearer user_1"

# Hard delete (superuser only)
curl -X DELETE "http://localhost:8000/api/v1/leads/123?hard_delete=true" \
  -H "Authorization: Bearer user_1"
```

#### Example Response

```json
{
  "message": "Lead archived successfully",
  "lead_id": 123
}
```

---

### 6. Bulk Update Lead Status

Update status for multiple leads at once.

```http
POST /api/v1/leads/bulk-update
```

#### Request Body

```json
{
  "lead_ids": [101, 102, 103, 104, 105],
  "new_status": "CONTACTED"
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/leads/bulk-update" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_ids": [101, 102, 103],
    "new_status": "CONTACTED"
  }'
```

#### Example Response

```json
{
  "updated_count": 3,
  "lead_ids": [101, 102, 103]
}
```

---

### 7. Assign Leads to Agent

Bulk assign leads to a sales agent.

```http
POST /api/v1/leads/assign
```

#### Request Body

```json
{
  "lead_ids": [101, 102, 103, 104],
  "agent_id": 10
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/leads/assign" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_ids": [101, 102, 103],
    "agent_id": 10
  }'
```

#### Example Response

```json
{
  "assigned_count": 3,
  "lead_ids": [101, 102, 103],
  "agent_id": 10
}
```

---

### 8. Get Lead Statistics

Get comprehensive lead statistics and analytics.

```http
GET /api/v1/leads/stats
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date_from` | datetime | No | Statistics from this date |
| `date_to` | datetime | No | Statistics until this date |
| `assigned_to` | integer | No | Filter by assigned user (for agent-specific stats) |

#### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/leads/stats?assigned_to=5" \
  -H "Authorization: Bearer user_1"
```

#### Example Response

```json
{
  "total_leads": 150,
  "average_lead_score": 68.5,
  "hot_leads_count": 45,
  "conversion_rate": 15.5,
  "leads_by_status": {
    "NEW": 30,
    "CONTACTED": 40,
    "QUALIFIED": 25,
    "PROPOSAL": 15,
    "NEGOTIATION": 10,
    "WON": 23,
    "LOST": 5,
    "CALLBACK": 2
  },
  "leads_by_source": {
    "WEBSITE": 50,
    "FACEBOOK": 30,
    "INSTAGRAM": 20,
    "WHATSAPP": 15,
    "REFERRAL": 40,
    "OTHER": 5
  }
}
```

---

## Error Responses

### 400 Bad Request

Invalid input data or validation error.

```json
{
  "detail": "Missing required fields: first_name, last_name, email, phone"
}
```

### 401 Unauthorized

Missing or invalid authentication.

```json
{
  "detail": "Missing authorization header"
}
```

### 403 Forbidden

Insufficient permissions.

```json
{
  "detail": "User does not have permission to access this resource"
}
```

### 404 Not Found

Resource not found.

```json
{
  "detail": "Lead with ID 999 not found"
}
```

### 422 Unprocessable Entity

Validation error.

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### 500 Internal Server Error

Server error.

```json
{
  "detail": "Internal server error",
  "error": "Database connection failed"
}
```

---

## Lead Status Values

- `NEW` - New lead, not yet contacted
- `CONTACTED` - Initial contact made
- `QUALIFIED` - Lead has been qualified
- `PROPOSAL` - Proposal sent
- `NEGOTIATION` - In negotiation phase
- `WON` - Successfully converted
- `LOST` - Lost opportunity
- `CALLBACK` - Scheduled for callback

## Lead Source Values

- `WEBSITE` - Lead from company website
- `FACEBOOK` - Lead from Facebook
- `INSTAGRAM` - Lead from Instagram
- `WHATSAPP` - Lead from WhatsApp
- `REFERRAL` - Lead from referral
- `OTHER` - Other sources

---

## Pagination

For endpoints that return lists (e.g., GET /api/v1/leads), use:

- `skip`: Number of records to skip (offset)
- `limit`: Maximum records to return (page size)

The response includes `page_info` with:

```json
{
  "page_info": {
    "total": 150,
    "skip": 0,
    "limit": 50,
    "has_more": true
  }
}
```

---

## Interactive Documentation

When the server is running, access interactive API documentation at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Rate Limiting

Not currently implemented. In production, consider implementing rate limiting to prevent abuse.

---

## CORS

CORS is enabled for all origins in development. In production, configure specific allowed origins in `main.py`:

```python
allow_origins=["https://your-frontend-domain.com"]
```

---

## Running the Server

```bash
# Development
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Example Workflow

### 1. Create a Lead
```bash
curl -X POST "http://localhost:8000/api/v1/leads" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@techcorp.com",
    "phone": "+1555123456",
    "source": "REFERRAL"
  }'
```

### 2. Assign to Agent
```bash
curl -X POST "http://localhost:8000/api/v1/leads/assign" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_ids": [124],
    "agent_id": 5
  }'
```

### 3. Update After Contact
```bash
curl -X PUT "http://localhost:8000/api/v1/leads/124" \
  -H "Authorization: Bearer user_5" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONTACTED",
    "notes": [{
      "content": "Initial call completed, sending proposal",
      "type": "call"
    }]
  }'
```

### 4. Get Hot Leads
```bash
curl -X GET "http://localhost:8000/api/v1/leads?is_hot_leads_only=true&assigned_to=5" \
  -H "Authorization: Bearer user_5"
```

### 5. Get Statistics
```bash
curl -X GET "http://localhost:8000/api/v1/leads/stats?assigned_to=5" \
  -H "Authorization: Bearer user_5"
```

---

**Last Updated:** October 18, 2025  
**API Version:** 1.0.0

