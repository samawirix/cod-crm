# Frontend Integration - Quick Start

Copy and paste this into your frontend at `~/Desktop/COD-CRM-Frontend/`

---

## 🔧 Configuration

```javascript
// config/api.js
export const API_CONFIG = {
  baseURL: 'http://localhost:8000',
  headers: {
    'Authorization': 'Bearer user_1',  // Replace with actual JWT token
    'Content-Type': 'application/json',
  }
};
```

---

## 📋 API Client Example

```javascript
// services/leadService.js

const API_BASE_URL = 'http://localhost:8000';

class LeadService {
  constructor(token = 'user_1') {
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all leads with filters
  async getLeads(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.score_min) params.append('score_min', filters.score_min);
    if (filters.skip !== undefined) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads?${params}`,
      { headers: this.headers }
    );
    
    return await response.json();
    // Returns: { total, leads[], page_info }
  }

  // Get single lead
  async getLead(leadId) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}`,
      { headers: this.headers }
    );
    
    return await response.json();
  }

  // Create new lead
  async createLead(leadData) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(leadData),
      }
    );
    
    return await response.json();
  }

  // Update lead
  async updateLead(leadId, updates) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}`,
      {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(updates),
      }
    );
    
    return await response.json();
  }

  // Delete lead
  async deleteLead(leadId) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads/${leadId}`,
      {
        method: 'DELETE',
        headers: this.headers,
      }
    );
    
    return await response.json();
  }

  // Bulk update status
  async bulkUpdateStatus(leadIds, newStatus) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads/bulk-update`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          lead_ids: leadIds,
          new_status: newStatus,
        }),
      }
    );
    
    return await response.json();
  }

  // Assign leads to agent
  async assignLeads(leadIds, agentId) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads/assign`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          lead_ids: leadIds,
          agent_id: agentId,
        }),
      }
    );
    
    return await response.json();
  }

  // Get statistics
  async getStatistics(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leads/stats?${params}`,
      { headers: this.headers }
    );
    
    return await response.json();
  }
}

export default new LeadService();
```

---

## 🎯 Usage Examples

### In Your React/Vue Component

```javascript
import leadService from './services/leadService';

// Get leads
async function loadLeads() {
  try {
    const data = await leadService.getLeads({
      status: 'NEW',
      limit: 20,
      skip: 0
    });
    
    console.log(`Total leads: ${data.total}`);
    console.log('Leads:', data.leads);
    console.log('Has more:', data.page_info.has_more);
    
  } catch (error) {
    console.error('Error loading leads:', error);
  }
}

// Create lead
async function createNewLead() {
  const newLead = {
    first_name: 'Ahmed',
    last_name: 'Hassan',
    email: 'ahmed@example.com',
    phone: '+212600000000',
    source: 'WEBSITE',
    tags: ['interested']
  };
  
  const created = await leadService.createLead(newLead);
  console.log('Created lead:', created);
}

// Update lead
async function updateLeadStatus(leadId) {
  const updated = await leadService.updateLead(leadId, {
    status: 'CONTACTED',
    lead_score: 85
  });
  console.log('Updated lead:', updated);
}

// Get statistics
async function loadStats() {
  const stats = await leadService.getStatistics();
  console.log('Total:', stats.total_leads);
  console.log('Conversion rate:', stats.conversion_rate + '%');
}
```

---

## 📦 Response Types (TypeScript)

```typescript
// types/lead.ts

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  CALLBACK = 'CALLBACK',
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  WHATSAPP = 'WHATSAPP',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  assigned_to?: number;
  lead_score: number;
  conversion_probability: number;
  last_contact_date?: string;
  next_follow_up?: string;
  call_attempts: number;
  notes: any[];
  tags: string[];
  created_at: string;
  updated_at: string;
  days_since_created?: number;
  days_since_last_contact?: number;
  is_hot_lead: boolean;
}

export interface LeadListResponse {
  total: number;
  leads: Lead[];
  page_info: {
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
  };
}

export interface LeadStatistics {
  total_leads: number;
  average_lead_score: number;
  hot_leads_count: number;
  conversion_rate: number;
  leads_by_status: Record<string, number>;
  leads_by_source: Record<string, number>;
}
```

---

## ✅ Verification Checklist

- [x] Backend running at http://localhost:8000
- [x] CORS configured for http://localhost:5173
- [x] All 8 endpoints tested and working
- [x] Authentication enabled
- [x] Example responses documented
- [x] Test script created and passed

---

## 🚀 Next Steps

1. **Copy `services/leadService.js`** to your frontend
2. **Copy `types/lead.ts`** if using TypeScript
3. **Test in your frontend:**
   ```bash
   cd ~/Desktop/COD-CRM-Frontend
   npm run dev
   ```
4. **Make API calls** using the leadService
5. **View API docs** at http://localhost:8000/docs if needed

---

**Backend Server:** ✅ Running  
**Frontend Ready:** ✅ Yes  
**Let's build!** 🚀

