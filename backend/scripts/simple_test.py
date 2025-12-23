#!/usr/bin/env python3
"""
Simple Lead API Test

Quick test of all lead endpoints.
"""

import asyncio
import httpx
import json

API_BASE_URL = "http://localhost:8000"

async def test_api():
    """Test all lead endpoints."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("🚀 Testing Lead API Endpoints")
        print("=" * 50)
        
        # 1. Register/Login
        print("\n1. 🔐 Authentication")
        try:
            # Try to register
            response = await client.post(
                f"{API_BASE_URL}/api/v1/auth/register",
                json={
                    "username": "testuser",
                    "email": "test@example.com",
                    "full_name": "Test User",
                    "password": "Test123!"
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                token = data["access_token"]
                print("✅ User registered and logged in")
            else:
                # Try login
                response = await client.post(
                    f"{API_BASE_URL}/api/v1/auth/login",
                    json={
                        "email": "test@example.com",
                        "password": "Test123!"
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    print("✅ User logged in")
                else:
                    print(f"❌ Auth failed: {response.status_code}")
                    return
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 2. Create a lead
        print("\n2. 📝 Create Lead")
        try:
            lead_data = {
                "first_name": "Ahmed",
                "last_name": "Hassan",
                "email": "ahmed@example.com",
                "phone": "+212600000000",
                "company": "Test Corp",
                "source": "WEBSITE",
                "status": "NEW",
                "lead_score": 85,
                "notes": [{"content": "Test lead", "type": "NOTE"}],
                "tags": ["test", "demo"]
            }
            
            response = await client.post(
                f"{API_BASE_URL}/api/v1/leads",
                json=lead_data,
                headers=headers
            )
            
            if response.status_code == 201:
                lead = response.json()
                lead_id = lead["id"]
                print(f"✅ Lead created: ID {lead_id}")
            else:
                print(f"❌ Create failed: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"❌ Create error: {e}")
            return
        
        # 3. Get all leads
        print("\n3. 📋 Get All Leads")
        try:
            response = await client.get(
                f"{API_BASE_URL}/api/v1/leads",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Got {len(data.get('leads', []))} leads (total: {data.get('total', 0)})")
            else:
                print(f"❌ Get leads failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Get leads error: {e}")
        
        # 4. Get lead by ID
        print("\n4. 🔍 Get Lead by ID")
        try:
            response = await client.get(
                f"{API_BASE_URL}/api/v1/leads/{lead_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                lead = response.json()
                print(f"✅ Got lead: {lead['full_name']} ({lead['status']})")
            else:
                print(f"❌ Get lead failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Get lead error: {e}")
        
        # 5. Update lead
        print("\n5. ✏️ Update Lead")
        try:
            update_data = {
                "status": "CONTACTED",
                "lead_score": 90,
                "notes": ["Updated via test", "Status changed"]
            }
            
            response = await client.put(
                f"{API_BASE_URL}/api/v1/leads/{lead_id}",
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                lead = response.json()
                print(f"✅ Lead updated: {lead['status']} (score: {lead['lead_score']})")
            else:
                print(f"❌ Update failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Update error: {e}")
        
        # 6. Test filters
        print("\n6. 🔍 Test Filters")
        try:
            response = await client.get(
                f"{API_BASE_URL}/api/v1/leads?status=CONTACTED&limit=5",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Filter test: {len(data.get('leads', []))} leads with status CONTACTED")
            else:
                print(f"❌ Filter failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Filter error: {e}")
        
        # 7. Bulk update
        print("\n7. 📦 Bulk Update")
        try:
            bulk_data = {
                "lead_ids": [lead_id],
                "updates": {
                    "status": "QUALIFIED",
                    "notes": ["Bulk updated"]
                }
            }
            
            response = await client.post(
                f"{API_BASE_URL}/api/v1/leads/bulk-update",
                json=bulk_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Bulk update: {data.get('updated_count', 0)} leads updated")
            else:
                print(f"❌ Bulk update failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Bulk update error: {e}")
        
        # 8. Assign leads
        print("\n8. 👤 Assign Leads")
        try:
            assign_data = {
                "lead_ids": [lead_id],
                "agent_id": 1  # Assign to user 1
            }
            
            response = await client.post(
                f"{API_BASE_URL}/api/v1/leads/assign",
                json=assign_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Assignment: {data.get('assigned_count', 0)} leads assigned")
            else:
                print(f"❌ Assignment failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Assignment error: {e}")
        
        # 9. Delete lead
        print("\n9. 🗑️ Delete Lead")
        try:
            response = await client.delete(
                f"{API_BASE_URL}/api/v1/leads/{lead_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Lead deleted: {data.get('message', 'Success')}")
            else:
                print(f"❌ Delete failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Delete error: {e}")
        
        # 10. Test CORS
        print("\n10. 🌐 Test CORS")
        try:
            response = await client.options(
                f"{API_BASE_URL}/api/v1/leads",
                headers={
                    "Origin": "http://localhost:8080",
                    "Access-Control-Request-Method": "GET"
                }
            )
            
            if response.status_code == 200:
                print("✅ CORS preflight successful")
            else:
                print(f"❌ CORS failed: {response.status_code}")
        except Exception as e:
            print(f"❌ CORS error: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Test completed!")

if __name__ == "__main__":
    asyncio.run(test_api())
