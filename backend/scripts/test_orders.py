#!/usr/bin/env python3
"""
Test script for Order API endpoints.
Run this from the backend directory: python scripts/test_orders.py
"""

import requests
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def print_header(text):
    print("\n" + "=" * 50)
    print(text)
    print("=" * 50)

def test_orders():
    print_header("TESTING ORDER ENDPOINTS")
    
    # Login first
    print("\n🔐 Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": "admin@cod-crm.com",
            "password": "Admin123!"
        }
    )
    
    if login_response.status_code != 200:
        # Try alternative credentials
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": "admin@cod-crm.com",
                "password": "Admin123!"
            }
        )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        return
    
    token = login_response.json().get("access_token")
    if not token:
        print("❌ No access token in response")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful!")
    
    # Get a lead first
    print("\n📋 Getting a lead to create order...")
    leads_response = requests.get(f"{BASE_URL}/leads/", headers=headers)
    
    if leads_response.status_code != 200:
        print(f"❌ Failed to get leads: {leads_response.status_code}")
        return
    
    leads_data = leads_response.json()
    leads = leads_data.get("leads", [])
    
    if not leads:
        print("❌ No leads found. Create a lead first!")
        return
    
    lead = leads[0]
    lead_id = lead.get("id")
    lead_name = lead.get("first_name", "Unknown")
    lead_phone = lead.get("phone", "0000000000")
    
    print(f"✅ Using lead: {lead_name} (ID: {lead_id})")
    
    # Create order
    print("\n📝 Creating order...")
    order_data = {
        "lead_id": lead_id,
        "customer_name": lead_name,
        "customer_phone": lead_phone,
        "customer_email": lead.get("email"),
        "delivery_address": "123 Test Street",
        "city": "Casablanca",
        "postal_code": "20000",
        "product_name": "Test Product",
        "quantity": 2,
        "unit_price": 150.0,
        "delivery_charges": 30.0,
        "notes": "Test order created by script"
    }
    
    response = requests.post(f"{BASE_URL}/orders/", json=order_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code not in [200, 201]:
        print(f"❌ Error creating order: {response.text}")
        return
    
    order = response.json()
    order_id = order.get("id")
    order_number = order.get("order_number")
    
    print(f"✅ Order created: {order_number}")
    print(f"   Total: {order.get('total_amount')} MAD")
    
    # Get orders list
    print("\n📋 Getting orders list...")
    response = requests.get(f"{BASE_URL}/orders/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total orders: {data.get('total', 0)}")
    
    # Get order details
    print(f"\n🔍 Getting order details (ID: {order_id})...")
    response = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Order details fetched successfully")
    
    # Confirm order
    print("\n✅ Confirming order...")
    confirm_data = {
        "confirmed_by": "Test Agent",
        "notes": "Confirmed via test script"
    }
    response = requests.post(f"{BASE_URL}/orders/{order_id}/confirm", json=confirm_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"✅ Order confirmed: {response.json().get('status')}")
    
    # Ship order
    print("\n🚚 Shipping order...")
    ship_data = {
        "tracking_number": "TRK123456789",
        "delivery_partner": "Amana Express"
    }
    response = requests.post(f"{BASE_URL}/orders/{order_id}/ship", json=ship_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"✅ Order shipped: {response.json().get('status')}")
        print(f"   Tracking: {response.json().get('tracking_number')}")
    
    # Mark out for delivery
    print("\n📦 Marking out for delivery...")
    response = requests.post(f"{BASE_URL}/orders/{order_id}/out-for-delivery", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"✅ Order out for delivery: {response.json().get('status')}")
    
    # Deliver order
    print("\n✅ Delivering order...")
    deliver_data = {
        "success": True,
        "cash_collected": 330.0
    }
    response = requests.post(f"{BASE_URL}/orders/{order_id}/deliver", json=deliver_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Order delivered: {result.get('status')}")
        print(f"   Payment: {result.get('payment_status')}")
        print(f"   Cash collected: {result.get('cash_collected')} MAD")
    
    # Get order history
    print(f"\n📜 Getting order history...")
    response = requests.get(f"{BASE_URL}/orders/{order_id}/history", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        history = response.json()
        print(f"✅ History entries: {len(history)}")
        for entry in history[:5]:
            print(f"   - {entry.get('action')}: {entry.get('notes', 'N/A')}")
    
    # Get stats
    print("\n📊 Getting order stats...")
    response = requests.get(f"{BASE_URL}/orders/stats/summary", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Total orders: {stats.get('total_orders')}")
        print(f"   Delivered: {stats.get('by_status', {}).get('delivered', 0)}")
        print(f"   Revenue: {stats.get('revenue', {}).get('total_revenue', 0)} MAD")
    
    print_header("✅ ALL ORDER TESTS COMPLETED!")

if __name__ == "__main__":
    try:
        test_orders()
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Make sure the backend server is running:")
        print("   cd backend && python run.py")
    except Exception as e:
        print(f"❌ Error: {e}")
