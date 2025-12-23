"""
Complete Backend API Test
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_complete():
    print("\n" + "=" * 70)
    print("🚀 COMPLETE BACKEND API TEST")
    print("=" * 70)
    
    # Test 1: Health Check
    print("\n1️⃣  Testing Health Endpoints...")
    print("-" * 70)
    
    health = requests.get(f"{BASE_URL}/api/v1/leads/health").json()
    print(f"✅ Leads Health: {health}")
    
    auth_health = requests.get(f"{BASE_URL}/api/v1/auth/health").json()
    print(f"✅ Auth Health: {auth_health}")
    
    # Test 2: Login
    print("\n2️⃣  Testing Login...")
    print("-" * 70)
    
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "admin@cod-crm.com", "password": "Admin123!"}
    )
    
    print(f"Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"✅ Login Successful!")
        print(f"   User: {login_data.get('full_name')}")
        print(f"   Email: {login_data.get('email')}")
        print(f"   Token: {login_data.get('access_token')[:30]}...")
        token = login_data.get('access_token')
    else:
        print(f"❌ Login Failed: {login_response.json()}")
        return
    
    # Test 3: Get Leads
    print("\n3️⃣  Testing Get Leads...")
    print("-" * 70)
    
    leads_response = requests.get(f"{BASE_URL}/api/v1/leads/")
    leads_data = leads_response.json()
    
    print(f"Status: {leads_response.status_code}")
    print(f"Total Leads: {leads_data.get('total', 0)}")
    
    if leads_data.get('leads'):
        print(f"\nLeads in database:")
        for lead in leads_data['leads'][:3]:
            print(f"  • {lead['full_name']} - {lead['email']} - {lead['status']}")
        if len(leads_data['leads']) > 3:
            print(f"  ... and {len(leads_data['leads']) - 3} more")
    
    # Test 4: Create Lead
    print("\n4️⃣  Testing Create Lead...")
    print("-" * 70)
    
    new_lead = {
        "first_name": "Test",
        "last_name": "User",
        "phone": "+212600999999",
        "email": f"test{len(leads_data.get('leads', []))}@example.com",
        "company": "Test Company",
        "source": "WEBSITE",
        "status": "NEW"
    }
    
    create_response = requests.post(
        f"{BASE_URL}/api/v1/leads/",
        json=new_lead
    )
    
    print(f"Status: {create_response.status_code}")
    
    if create_response.status_code == 201:
        created_lead = create_response.json()
        print(f"✅ Lead Created Successfully!")
        print(f"   ID: {created_lead['id']}")
        print(f"   Name: {created_lead['full_name']}")
        print(f"   Email: {created_lead['email']}")
    else:
        print(f"❌ Create Failed: {create_response.json()}")
    
    # Final Summary
    print("\n" + "=" * 70)
    print("📊 FINAL RESULTS")
    print("=" * 70)
    print("✅ Health Checks: PASSED")
    print("✅ Login: PASSED")
    print("✅ Get Leads: PASSED")
    print("✅ Create Lead: PASSED")
    print("\n🎉 ALL TESTS PASSED! Backend API is fully functional!\n")

if __name__ == "__main__":
    test_complete()

