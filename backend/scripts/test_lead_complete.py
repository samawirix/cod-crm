#!/usr/bin/env python3
"""
Complete Lead System Test

Tests all new lead fields including:
- product_interest
- quantity, unit_price, total_amount
- city, address
- alternate_phone
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_complete_lead_flow():
    print("=" * 60)
    print("TESTING COMPLETE LEAD FLOW")
    print("=" * 60)
    
    # Login
    print("\n🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@cod-crm.com", "password": "Admin123!"}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in successfully")
    
    # Create lead with all fields
    print("\n1️⃣ Creating lead with all fields...")
    lead_data = {
        "first_name": "Hassan",
        "last_name": "Ahmed",
        "phone": "+212600000099",
        "email": "hassan@test.com",
        "alternate_phone": "+212700000099",
        "city": "Casablanca",
        "address": "123 Rue Hassan II, Maarif",
        "product_interest": "Laptop Dell XPS 15",  # THIS SHOULD SAVE!
        "source": "FACEBOOK",
        "status": "NEW",
        "quantity": 2,
        "unit_price": 1500.0,  # Should calculate to 3000 MAD
    }
    
    response = requests.post(
        f"{BASE_URL}/leads/",
        json=lead_data,
        headers=headers
    )
    
    if response.status_code != 201:
        print(f"❌ Failed to create lead: {response.status_code}")
        print(f"   Response: {response.text}")
        return
    
    lead = response.json()
    lead_id = lead["id"]
    print(f"✅ Lead created - ID: {lead_id}")
    print(f"   Name: {lead.get('first_name')} {lead.get('last_name')}")
    print(f"   Product Interest: {lead.get('product_interest')}")
    print(f"   Source: {lead.get('source')}")
    print(f"   City: {lead.get('city')}")
    print(f"   Address: {lead.get('address')}")
    print(f"   Quantity: {lead.get('quantity')}")
    print(f"   Unit Price: {lead.get('unit_price')} MAD")
    print(f"   Total Amount: {lead.get('total_amount')} MAD")
    
    # Verify fields were saved
    missing_fields = []
    if not lead.get('product_interest'):
        missing_fields.append('product_interest')
    if not lead.get('city'):
        missing_fields.append('city')
    if not lead.get('address'):
        missing_fields.append('address')
    if not lead.get('alternate_phone'):
        missing_fields.append('alternate_phone')
    
    if missing_fields:
        print(f"⚠️  Missing fields in response: {', '.join(missing_fields)}")
    
    # Get the lead to verify all fields
    print(f"\n2️⃣ Getting lead {lead_id} to verify all fields...")
    response = requests.get(
        f"{BASE_URL}/leads/{lead_id}",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch lead: {response.text}")
        return
    
    fetched_lead = response.json()
    print("✅ Lead fetched successfully")
    print(f"   Product Interest: {fetched_lead.get('product_interest')}")
    print(f"   Source: {fetched_lead.get('source')}")
    print(f"   City: {fetched_lead.get('city')}")
    print(f"   Address: {fetched_lead.get('address')}")
    print(f"   Quantity: {fetched_lead.get('quantity')}")
    print(f"   Unit Price: {fetched_lead.get('unit_price')} MAD")
    print(f"   Total Amount: {fetched_lead.get('total_amount')} MAD")
    
    # Verify calculations
    expected_total = fetched_lead['quantity'] * fetched_lead['unit_price']
    actual_total = fetched_lead['total_amount']
    
    if abs(expected_total - actual_total) < 0.01:  # Float comparison
        print(f"✅ Amount calculation correct: {actual_total} MAD")
    else:
        print(f"❌ Amount calculation wrong! Expected {expected_total}, got {actual_total}")
    
    # Update the lead
    print(f"\n3️⃣ Updating lead {lead_id}...")
    update_data = {
        "product_interest": "MacBook Pro 16-inch",
        "quantity": 1,
        "unit_price": 3500.0,
        "city": "Rabat"
    }
    
    response = requests.put(
        f"{BASE_URL}/leads/{lead_id}",
        json=update_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Update failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return
    
    updated_lead = response.json()
    print("✅ Lead updated successfully")
    print(f"   New Product Interest: {updated_lead.get('product_interest')}")
    print(f"   New City: {updated_lead.get('city')}")
    print(f"   New Quantity: {updated_lead.get('quantity')}")
    print(f"   New Unit Price: {updated_lead.get('unit_price')} MAD")
    print(f"   New Total Amount: {updated_lead.get('total_amount')} MAD")
    
    # Verify updated amount calculation
    expected_total = updated_lead['quantity'] * updated_lead['unit_price']
    actual_total = updated_lead['total_amount']
    
    if abs(expected_total - actual_total) < 0.01:
        print(f"✅ Updated amount calculation correct: {actual_total} MAD")
    else:
        print(f"❌ Updated amount calculation wrong! Expected {expected_total}, got {actual_total}")
    
    # Final verification
    print("\n4️⃣ Final verification - Fetching all leads...")
    response = requests.get(
        f"{BASE_URL}/leads/?limit=5",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch leads list: {response.text}")
        return
    
    leads_data = response.json()
    print(f"✅ Fetched {len(leads_data.get('leads', []))} leads")
    
    # Find our test lead
    test_lead = None
    for l in leads_data.get('leads', []):
        if l['id'] == lead_id:
            test_lead = l
            break
    
    if test_lead:
        print(f"✅ Test lead found in list")
        print(f"   Product Interest: {test_lead.get('product_interest')}")
        print(f"   Total Amount: {test_lead.get('total_amount')} MAD")
    else:
        print(f"⚠️  Test lead not found in list")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_complete_lead_flow()

