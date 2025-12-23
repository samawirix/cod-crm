# CRM API - Quick Start Guide

Complete guide to using the CRM Lead Management API.

---

## 🚀 Quick Start

### 1. Installation

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Access Documentation

- **Swagger UI (Interactive):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **API Root:** http://localhost:8000/

---

## 🔐 Authentication

All API requests require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer user_1" http://localhost:8000/api/v1/leads
```

**Demo Token Format:** `Bearer user_<id>`  
Example: `Bearer user_1` for user ID 1

---

## 📖 Common Use Cases

### 1. Create a New Lead

```bash
curl -X POST "http://localhost:8000/api/v1/leads" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "source": "WEBSITE"
  }'
```

### 2. Get All Leads

```bash
curl -X GET "http://localhost:8000/api/v1/leads" \
  -H "Authorization: Bearer user_1"
```

### 3. Search Leads

```bash
curl -X GET "http://localhost:8000/api/v1/leads?search=john&status=NEW&score_min=70" \
  -H "Authorization: Bearer user_1"
```

### 4. Update a Lead

```bash
curl -X PUT "http://localhost:8000/api/v1/leads/123" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONTACTED",
    "lead_score": 85
  }'
```

### 5. Assign Leads to Agent

```bash
curl -X POST "http://localhost:8000/api/v1/leads/assign" \
  -H "Authorization: Bearer user_1" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_ids": [1, 2, 3],
    "agent_id": 5
  }'
```

### 6. Get Statistics

```bash
curl -X GET "http://localhost:8000/api/v1/leads/stats" \
  -H "Authorization: Bearer user_1"
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/leads` | Get all leads with filtering |
| GET | `/api/v1/leads/{id}` | Get specific lead |
| POST | `/api/v1/leads` | Create new lead |
| PUT | `/api/v1/leads/{id}` | Update lead |
| DELETE | `/api/v1/leads/{id}` | Delete/archive lead |
| POST | `/api/v1/leads/bulk-update` | Bulk update status |
| POST | `/api/v1/leads/assign` | Assign leads to agent |
| GET | `/api/v1/leads/stats` | Get statistics |

---

## 🔧 Using Interactive Documentation

1. Start the server: `uvicorn main:app --reload`
2. Open browser: http://localhost:8000/docs
3. Click "Authorize" button
4. Enter: `user_1` (without "Bearer" prefix)
5. Try any endpoint using the "Try it out" button

---

## 🧪 Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run API tests only
pytest tests/test_api_leads.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

---

## 📚 Documentation

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[API_SUMMARY.md](API_SUMMARY.md)** - Implementation summary
- **[README.md](README.md)** - Project overview
- **Interactive Docs** - http://localhost:8000/docs

---

## 🎯 Example Workflow

### Complete Lead Lifecycle

```python
import httpx

base_url = "http://localhost:8000"
headers = {"Authorization": "Bearer user_1"}

async with httpx.AsyncClient() as client:
    # 1. Create lead
    response = await client.post(
        f"{base_url}/api/v1/leads",
        json={
            "first_name": "Alice",
            "last_name": "Johnson",
            "email": "alice@example.com",
            "phone": "+1555123456",
            "source": "REFERRAL"
        },
        headers=headers
    )
    lead = response.json()
    lead_id = lead["id"]
    
    # 2. Assign to agent
    await client.post(
        f"{base_url}/api/v1/leads/assign",
        json={"lead_ids": [lead_id], "agent_id": 5},
        headers=headers
    )
    
    # 3. Update status
    await client.put(
        f"{base_url}/api/v1/leads/{lead_id}",
        json={
            "status": "CONTACTED",
            "notes": [{
                "content": "Initial call completed",
                "type": "call"
            }]
        },
        headers=headers
    )
    
    # 4. Get statistics
    response = await client.get(
        f"{base_url}/api/v1/leads/stats",
        headers=headers
    )
    stats = response.json()
    print(f"Conversion rate: {stats['conversion_rate']}%")
```

---

## 🐍 Python Client Example

```python
import requests

class CRMClient:
    def __init__(self, base_url: str, user_id: int):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer user_{user_id}"}
    
    def create_lead(self, data: dict):
        response = requests.post(
            f"{self.base_url}/api/v1/leads",
            json=data,
            headers=self.headers
        )
        return response.json()
    
    def get_leads(self, **filters):
        response = requests.get(
            f"{self.base_url}/api/v1/leads",
            params=filters,
            headers=self.headers
        )
        return response.json()
    
    def update_lead(self, lead_id: int, data: dict):
        response = requests.put(
            f"{self.base_url}/api/v1/leads/{lead_id}",
            json=data,
            headers=self.headers
        )
        return response.json()
    
    def assign_leads(self, lead_ids: list, agent_id: int):
        response = requests.post(
            f"{self.base_url}/api/v1/leads/assign",
            json={"lead_ids": lead_ids, "agent_id": agent_id},
            headers=self.headers
        )
        return response.json()
    
    def get_stats(self, **filters):
        response = requests.get(
            f"{self.base_url}/api/v1/leads/stats",
            params=filters,
            headers=self.headers
        )
        return response.json()

# Usage
client = CRMClient("http://localhost:8000", user_id=1)

# Create lead
lead = client.create_lead({
    "first_name": "Bob",
    "last_name": "Smith",
    "email": "bob@example.com",
    "phone": "+1234567890"
})

# Get hot leads
leads = client.get_leads(is_hot_leads_only=True, limit=10)

# Get statistics
stats = client.get_stats()
print(f"Total leads: {stats['total_leads']}")
```

---

## 🌐 JavaScript/TypeScript Example

```typescript
class CRMClient {
  constructor(
    private baseUrl: string,
    private userId: number
  ) {}

  private get headers() {
    return {
      'Authorization': `Bearer user_${this.userId}`,
      'Content-Type': 'application/json'
    };
  }

  async createLead(data: any) {
    const response = await fetch(`${this.baseUrl}/api/v1/leads`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getLeads(filters: any = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/api/v1/leads?${params}`,
      { headers: this.headers }
    );
    return response.json();
  }

  async updateLead(leadId: number, data: any) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/leads/${leadId}`,
      {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(data)
      }
    );
    return response.json();
  }

  async assignLeads(leadIds: number[], agentId: number) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/leads/assign`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ lead_ids: leadIds, agent_id: agentId })
      }
    );
    return response.json();
  }

  async getStats(filters: any = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/api/v1/leads/stats?${params}`,
      { headers: this.headers }
    );
    return response.json();
  }
}

// Usage
const client = new CRMClient('http://localhost:8000', 1);

// Create lead
const lead = await client.createLead({
  first_name: 'Charlie',
  last_name: 'Brown',
  email: 'charlie@example.com',
  phone: '+1234567890'
});

// Get hot leads
const { leads } = await client.getLeads({
  is_hot_leads_only: true,
  limit: 10
});

// Get statistics
const stats = await client.getStats();
console.log(`Conversion rate: ${stats.conversion_rate}%`);
```

---

## 🔍 Filtering Examples

### By Status
```bash
GET /api/v1/leads?status=NEW
```

### By Date Range
```bash
GET /api/v1/leads?date_from=2025-10-01&date_to=2025-10-31
```

### By Score Range
```bash
GET /api/v1/leads?score_min=70&score_max=100
```

### Search
```bash
GET /api/v1/leads?search=john
```

### Multiple Filters
```bash
GET /api/v1/leads?status=NEW&source=WEBSITE&score_min=70&assigned_to=5
```

### Hot Leads Only
```bash
GET /api/v1/leads?is_hot_leads_only=true
```

### With Pagination
```bash
GET /api/v1/leads?skip=0&limit=50&sort_by=lead_score&sort_order=desc
```

---

## ⚡ Performance Tips

1. **Use pagination** for large datasets
2. **Filter at the API level** instead of client-side
3. **Use specific field sorting** for better performance
4. **Limit results** with the `limit` parameter
5. **Batch operations** with bulk endpoints

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Use a different port
uvicorn main:app --port 8001
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Database connection errors
```bash
# Check database configuration in main.py
# Ensure PostgreSQL is running
```

### Authentication errors
```bash
# Ensure Authorization header is correct
# Format: "Authorization: Bearer user_1"
```

---

## 📊 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid data |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Pydantic validation failed |
| 500 | Server Error | Internal error |

---

## 🎉 Next Steps

1. ✅ Start the server
2. ✅ Open interactive docs at /docs
3. ✅ Try creating a lead
4. ✅ Test filtering and search
5. ✅ Run the test suite
6. ✅ Build your frontend integration

---

**For complete API reference, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)**

**Questions? Check the interactive docs at http://localhost:8000/docs**

