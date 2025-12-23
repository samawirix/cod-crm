#!/usr/bin/env python3
"""
Comprehensive Lead API Test Script

Tests all lead endpoints with authentication and various scenarios.
"""

import asyncio
import httpx
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "Test123!"

class LeadAPITester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.access_token = None
        self.user_id = None
        self.created_leads = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def print_section(self, title: str):
        """Print a formatted section header."""
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
    
    def print_result(self, test_name: str, status_code: int, response_data: Any, success: bool = True):
        """Print test result with formatting."""
        status_icon = "✅" if success else "❌"
        print(f"\n{status_icon} {test_name}")
        print(f"   Status: {status_code}")
        if isinstance(response_data, dict):
            print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
        else:
            print(f"   Response: {response_data}")
    
    async def register_test_user(self) -> bool:
        """Register a test user."""
        self.print_section("1. REGISTER TEST USER")
        
        try:
            response = await self.client.post(
                f"{API_BASE_URL}/api/v1/auth/register",
                json={
                    "username": "testuser",
                    "email": TEST_USER_EMAIL,
                    "full_name": "Test User",
                    "password": TEST_USER_PASSWORD
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_id = data["user_id"]
                self.print_result("User Registration", response.status_code, data)
                return True
            else:
                # User might already exist, try to login
                return await self.login_test_user()
                
    except Exception as e:
            self.print_result("User Registration", 500, f"Error: {str(e)}", False)
        return False

    async def login_test_user(self) -> bool:
        """Login with test user."""
        self.print_section("2. LOGIN TEST USER")
        
        try:
            response = await self.client.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_id = data["user_id"]
                self.print_result("User Login", response.status_code, data)
                return True
            else:
                self.print_result("User Login", response.status_code, response.json(), False)
                return False
                
        except Exception as e:
            self.print_result("User Login", 500, f"Error: {str(e)}", False)
            return False
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def create_sample_leads(self) -> bool:
        """Create 10 sample leads with varied data."""
        self.print_section("3. CREATE SAMPLE LEADS")
    
    sample_leads = [
        {
            "first_name": "Ahmed",
            "last_name": "Hassan",
            "email": "ahmed.hassan@example.com",
                "phone": "+212600000001",
            "company": "TechCorp Morocco",
            "source": "WEBSITE",
                "status": "NEW",
                "lead_score": 85,
                "notes": ["Interested in enterprise solution", "High priority"],
            "tags": ["enterprise", "tech"]
        },
        {
            "first_name": "Fatima",
                "last_name": "Alami",
                "email": "fatima.alami@example.com",
                "phone": "+212600000002",
                "company": "Retail Plus",
                "source": "FACEBOOK",
                "status": "CONTACTED",
                "lead_score": 70,
                "notes": ["Follow up next week"],
                "tags": ["retail", "social"]
            },
            {
                "first_name": "Omar",
                "last_name": "Benali",
                "email": "omar.benali@example.com",
                "phone": "+212600000003",
                "company": "Logistics Co",
                "source": "WHATSAPP",
                "status": "QUALIFIED",
                "lead_score": 90,
                "notes": ["Ready to purchase", "Budget confirmed"],
                "tags": ["logistics", "hot"]
            },
            {
                "first_name": "Aicha",
                "last_name": "Tazi",
                "email": "aicha.tazi@example.com",
                "phone": "+212600000004",
                "company": "Fashion Store",
            "source": "INSTAGRAM",
                "status": "PROPOSAL",
                "lead_score": 75,
                "notes": ["Proposal sent", "Waiting for response"],
                "tags": ["fashion", "proposal"]
        },
        {
            "first_name": "Youssef",
            "last_name": "Idrissi",
            "email": "youssef.idrissi@example.com",
                "phone": "+212600000005",
                "company": "Restaurant Chain",
                "source": "REFERRAL",
                "status": "NEGOTIATION",
                "lead_score": 80,
                "notes": ["Price negotiation", "Close to deal"],
                "tags": ["restaurant", "negotiation"]
            },
            {
                "first_name": "Khadija",
                "last_name": "Mansouri",
                "email": "khadija.mansouri@example.com",
                "phone": "+212600000006",
                "company": "Beauty Salon",
                "source": "WEBSITE",
                "status": "WON",
                "lead_score": 95,
                "notes": ["Deal closed", "Payment received"],
                "tags": ["beauty", "won"]
            },
            {
                "first_name": "Hassan",
                "last_name": "Bennani",
                "email": "hassan.bennani@example.com",
                "phone": "+212600000007",
                "company": "Auto Parts",
                "source": "OTHER",
                "status": "LOST",
                "lead_score": 30,
                "notes": ["Budget too low", "Not interested"],
                "tags": ["auto", "lost"]
            },
            {
                "first_name": "Naima",
                "last_name": "Cherkaoui",
                "email": "naima.cherkaoui@example.com",
                "phone": "+212600000008",
                "company": "Pharmacy",
            "source": "FACEBOOK",
                "status": "CALLBACK",
                "lead_score": 60,
                "notes": ["Callback scheduled", "Interested but busy"],
                "tags": ["pharmacy", "callback"]
        },
        {
            "first_name": "Rachid",
                "last_name": "El Fassi",
                "email": "rachid.elfassi@example.com",
                "phone": "+212600000009",
                "company": "Construction",
                "source": "WHATSAPP",
                "status": "NEW",
                "lead_score": 45,
                "notes": ["Initial contact", "Needs more info"],
                "tags": ["construction", "new"]
            },
            {
                "first_name": "Zineb",
                "last_name": "Alaoui",
                "email": "zineb.alaoui@example.com",
                "phone": "+212600000010",
                "company": "Consulting Firm",
            "source": "WEBSITE",
                "status": "CONTACTED",
                "lead_score": 65,
                "notes": ["Meeting scheduled", "Potential client"],
                "tags": ["consulting", "meeting"]
        }
    ]
    
        success_count = 0
        for i, lead_data in enumerate(sample_leads, 1):
            try:
                response = await self.client.post(
                    f"{API_BASE_URL}/api/v1/leads",
                    json=lead_data,
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 201:
                    data = response.json()
                    self.created_leads.append(data)
                    self.print_result(f"Lead {i} Created", response.status_code, {
                        "id": data["id"],
                        "name": data["full_name"],
                        "status": data["status"],
                        "score": data["lead_score"]
                    })
                    success_count += 1
                else:
                    self.print_result(f"Lead {i} Creation Failed", response.status_code, response.json(), False)
                    
            except Exception as e:
                self.print_result(f"Lead {i} Creation Error", 500, f"Error: {str(e)}", False)
        
        print(f"\n📊 Created {success_count}/{len(sample_leads)} leads successfully")
        return success_count > 0
    
    async def test_get_leads(self) -> bool:
        """Test GET /api/v1/leads with various filters."""
        self.print_section("4. TEST GET /api/v1/leads")
        
        test_cases = [
            ("Basic GET", {}),
            ("Filter by status", {"status": "NEW"}),
            ("Filter by source", {"source": "WEBSITE"}),
            ("Filter by score range", {"score_min": 70, "score_max": 90}),
            ("Search by name", {"search": "Ahmed"}),
            ("Pagination", {"skip": 0, "limit": 5}),
            ("Sort by score", {"sort_by": "lead_score", "sort_order": "desc"}),
            ("Multiple filters", {"status": "CONTACTED", "source": "FACEBOOK", "limit": 3})
        ]
        
        success_count = 0
        for test_name, params in test_cases:
            try:
                response = await self.client.get(
                f"{API_BASE_URL}/api/v1/leads",
                    params=params,
                    headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                    self.print_result(test_name, response.status_code, {
                        "total": data.get("total", 0),
                        "leads_count": len(data.get("leads", [])),
                        "page_info": data.get("page_info", {})
                    })
                    success_count += 1
            else:
                    self.print_result(test_name, response.status_code, response.json(), False)
                    
        except Exception as e:
                self.print_result(test_name, 500, f"Error: {str(e)}", False)
        
        print(f"\n📊 {success_count}/{len(test_cases)} GET tests passed")
        return success_count > 0
    
    async def test_get_lead_by_id(self) -> bool:
        """Test GET /api/v1/leads/{id}."""
        self.print_section("5. TEST GET /api/v1/leads/{id}")
        
        if not self.created_leads:
            self.print_result("Get Lead by ID", 400, "No leads available for testing", False)
            return False
        
        lead_id = self.created_leads[0]["id"]
        
        try:
            response = await self.client.get(
                f"{API_BASE_URL}/api/v1/leads/{lead_id}",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_result("Get Lead by ID", response.status_code, {
                    "id": data["id"],
                    "name": data["full_name"],
                    "status": data["status"],
                    "score": data["lead_score"],
                    "notes_count": len(data.get("notes", []))
                })
                return True
            else:
                self.print_result("Get Lead by ID", response.status_code, response.json(), False)
                return False
                
        except Exception as e:
            self.print_result("Get Lead by ID", 500, f"Error: {str(e)}", False)
            return False
    
    async def test_update_lead(self) -> bool:
        """Test PUT /api/v1/leads/{id}."""
        self.print_section("6. TEST PUT /api/v1/leads/{id}")
        
        if not self.created_leads:
            self.print_result("Update Lead", 400, "No leads available for testing", False)
            return False
        
        lead_id = self.created_leads[0]["id"]
    update_data = {
            "status": "QUALIFIED",
            "lead_score": 88,
            "notes": ["Updated via API test", "Status changed to QUALIFIED"],
            "tags": ["updated", "qualified", "test"]
        }
        
        try:
            response = await self.client.put(
                f"{API_BASE_URL}/api/v1/leads/{lead_id}",
                json=update_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_result("Update Lead", response.status_code, {
                    "id": data["id"],
                    "name": data["full_name"],
                    "status": data["status"],
                    "score": data["lead_score"],
                    "updated": True
                })
                return True
            else:
                self.print_result("Update Lead", response.status_code, response.json(), False)
                return False
                
        except Exception as e:
            self.print_result("Update Lead", 500, f"Error: {str(e)}", False)
            return False
    
    async def test_bulk_update_status(self) -> bool:
        """Test POST /api/v1/leads/bulk-update."""
        self.print_section("7. TEST POST /api/v1/leads/bulk-update")
        
        if len(self.created_leads) < 3:
            self.print_result("Bulk Update", 400, "Not enough leads for bulk update", False)
            return False
        
        lead_ids = [lead["id"] for lead in self.created_leads[:3]]
    bulk_data = {
            "lead_ids": lead_ids,
            "updates": {
                "status": "PROPOSAL",
                "notes": ["Bulk updated via API test"]
            }
        }
        
        try:
            response = await self.client.post(
                f"{API_BASE_URL}/api/v1/leads/bulk-update",
                json=bulk_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_result("Bulk Update", response.status_code, {
                    "updated_count": data.get("updated_count", 0),
                    "lead_ids": lead_ids
                })
                return True
            else:
                self.print_result("Bulk Update", response.status_code, response.json(), False)
                return False
                
        except Exception as e:
            self.print_result("Bulk Update", 500, f"Error: {str(e)}", False)
            return False
    
    async def test_assign_leads(self) -> bool:
        """Test POST /api/v1/leads/assign."""
        self.print_section("8. TEST POST /api/v1/leads/assign")
        
        if len(self.created_leads) < 2:
            self.print_result("Assign Leads", 400, "Not enough leads for assignment", False)
            return False
        
        lead_ids = [lead["id"] for lead in self.created_leads[:2]]
    assign_data = {
            "lead_ids": lead_ids,
            "agent_id": self.user_id  # Assign to current user
    }
    
        try:
            response = await self.client.post(
                f"{API_BASE_URL}/api/v1/leads/assign",
                json=assign_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_result("Assign Leads", response.status_code, {
                    "assigned_count": data.get("assigned_count", 0),
                    "lead_ids": lead_ids,
                    "agent_id": self.user_id
                })
                return True
            else:
                self.print_result("Assign Leads", response.status_code, response.json(), False)
                return False
                
        except Exception as e:
            self.print_result("Assign Leads", 500, f"Error: {str(e)}", False)
            return False
    
    async def test_delete_lead(self) -> bool:
        """Test DELETE /api/v1/leads/{id}."""
        self.print_section("9. TEST DELETE /api/v1/leads/{id}")
        
        if not self.created_leads:
            self.print_result("Delete Lead", 400, "No leads available for testing", False)
            return False
        
        # Use the last lead for deletion
        lead_id = self.created_leads[-1]["id"]
        
        try:
            response = await self.client.delete(
                f"{API_BASE_URL}/api/v1/leads/{lead_id}",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_result("Delete Lead", response.status_code, {
                    "message": data.get("message", "Lead deleted"),
                    "deleted_id": lead_id
                })
                return True
            else:
                self.print_result("Delete Lead", response.status_code, response.json(), False)
                return False
                
        except Exception as e:
            self.print_result("Delete Lead", 500, f"Error: {str(e)}", False)
            return False
    
    async def test_cors(self) -> bool:
        """Test CORS configuration."""
        self.print_section("10. TEST CORS CONFIGURATION")
        
        try:
            # Test preflight request
            response = await self.client.options(
                f"{API_BASE_URL}/api/v1/leads",
                headers={
                    "Origin": "http://localhost:8080",
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "Authorization, Content-Type"
                }
            )
            
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
                "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials")
            }
            
            self.print_result("CORS Test", response.status_code, cors_headers)
            return response.status_code == 200
                
        except Exception as e:
            self.print_result("CORS Test", 500, f"Error: {str(e)}", False)
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence."""
        print("🚀 Starting Comprehensive Lead API Tests")
        print(f"📡 API Base URL: {API_BASE_URL}")
        print(f"👤 Test User: {TEST_USER_EMAIL}")
        
        tests = [
            ("User Registration/Login", self.register_test_user),
            ("Create Sample Leads", self.create_sample_leads),
            ("GET Leads with Filters", self.test_get_leads),
            ("GET Lead by ID", self.test_get_lead_by_id),
            ("Update Lead", self.test_update_lead),
            ("Bulk Update Status", self.test_bulk_update_status),
            ("Assign Leads", self.test_assign_leads),
            ("Delete Lead", self.test_delete_lead),
            ("CORS Configuration", self.test_cors)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                if result:
                    passed += 1
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
        
        # Final summary
        self.print_section("FINAL RESULTS")
        print(f"✅ Tests Passed: {passed}/{total}")
        print(f"❌ Tests Failed: {total - passed}/{total}")
        print(f"📊 Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Lead API is ready for frontend integration.")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Check the output above for details.")
        
        return passed == total

async def main():
    """Main test runner."""
    async with LeadAPITester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
        asyncio.run(main())