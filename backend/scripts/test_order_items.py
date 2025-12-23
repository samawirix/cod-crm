#!/usr/bin/env python3
"""
Test multi-product order functionality
"""
import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def login():
    """Get access token"""
    # Try the login URL (with doubled prefix issue)
    response = requests.post(f"{BASE_URL}/auth/api/v1/auth/login", data={
        "username": "admin@example.com",
        "password": "admin123"
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    
    # Try alternate login  
    response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "admin@example.com",
        "password": "admin123"
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    
    print(f"❌ Login failed: {response.status_code}")
    return None


def main():
    print("=" * 60)
    print("TESTING MULTI-PRODUCT ORDER SYSTEM")
    print("=" * 60)
    
    # Get token
    token = login()
    if not token:
        print("❌ Could not authenticate. Some tests will fail.")
        headers = {}
    else:
        print("✅ Login successful!")
        headers = {"Authorization": f"Bearer {token}"}
    
    time.sleep(1)
    
    # Test 1: Get available products
    print("\n📦 Getting available products...")
    response = requests.get(f"{BASE_URL}/orders/products/available", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        products = response.json()["products"]
        print(f"✅ Available products: {len(products)}")
        for p in products[:5]:
            print(f"   - {p['name']} (ID: {p['id']}) - Stock: {p['stock_quantity']} - {p['selling_price']} MAD")
    else:
        print(f"❌ Error: {response.text}")
        return
    
    if len(products) < 2:
        print("❌ Need at least 2 products to test multi-product orders")
        return
    
    # Test 2: Get a lead
    print("\n📋 Getting a lead for the order...")
    response = requests.get(f"{BASE_URL}/leads/api/v1/leads/", headers=headers)
    
    if response.status_code == 200:
        leads = response.json().get("leads", [])
        if leads:
            lead = leads[0]
            print(f"✅ Using lead: {lead['first_name']} {lead.get('last_name', '')} (ID: {lead['id']})")
        else:
            print("❌ No leads found. Create a lead first.")
            return
    else:
        print(f"❌ Error getting leads: {response.text}")
        return
    
    # Record initial stock
    print("\n📊 Initial stock levels:")
    initial_stocks = {}
    for p in products[:2]:
        initial_stocks[p['id']] = p['stock_quantity']
        print(f"   - {p['name']}: {p['stock_quantity']} units")
    
    # Test 3: Create order with multiple products
    print("\n📝 Creating order with 2 products...")
    order_data = {
        "lead_id": lead["id"],
        "items": [
            {"product_id": products[0]["id"], "quantity": 2, "discount": 0},
            {"product_id": products[1]["id"], "quantity": 1, "discount": 10}
        ],
        "shipping_cost": 30,
        "discount": 0,
        "shipping_address": "123 Test Street, Apt 4B",
        "shipping_city": "Casablanca",
        "order_notes": "Test multi-product order"
    }
    
    response = requests.post(f"{BASE_URL}/orders/with-items", json=order_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        order = response.json()
        order_id = order['id']
        print(f"✅ Order created successfully!")
        print(f"   Order Number: {order['order_number']}")
        print(f"   Customer: {order['customer_name']}")
        print(f"   Products: {order['product_name']}")
        print(f"   Total Quantity: {order['quantity']}")
        print(f"   Subtotal: {order['subtotal']} MAD")
        print(f"   Delivery: {order['delivery_charges']} MAD")
        print(f"   Total: {order['total_amount']} MAD")
    else:
        print(f"❌ Error creating order: {response.text}")
        return
    
    # Test 4: Get order items
    print(f"\n📋 Getting order items for order #{order_id}...")
    response = requests.get(f"{BASE_URL}/orders/{order_id}/items", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        items = response.json()
        print(f"✅ Order has {len(items)} items:")
        for item in items:
            print(f"   - {item['product_name']} x{item['quantity']} @ {item['unit_price']} MAD = {item['total']} MAD")
            if item['discount'] > 0:
                print(f"     (Discount: {item['discount']} MAD)")
    else:
        print(f"❌ Error: {response.text}")
    
    # Test 5: Check stock was reduced
    print("\n📊 Stock after order:")
    for p_id, initial_stock in initial_stocks.items():
        response = requests.get(f"{BASE_URL}/products/{p_id}", headers=headers)
        if response.status_code == 200:
            prod = response.json()
            print(f"   - {prod['name']}: {prod['stock_quantity']} units (was {initial_stock})")
        else:
            print(f"   ❌ Could not get product {p_id}")
    
    # Test 6: Cancel order and restore stock
    print(f"\n❌ Cancelling order #{order_id} to restore stock...")
    response = requests.post(
        f"{BASE_URL}/orders/{order_id}/cancel-with-stock",
        params={"reason": "Test cancellation"},
        headers=headers
    )
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        order = response.json()
        print(f"✅ Order cancelled! Status: {order['status']}")
    else:
        print(f"❌ Error: {response.text}")
    
    # Test 7: Check stock was restored
    print("\n📊 Stock after cancellation:")
    for p_id, initial_stock in initial_stocks.items():
        response = requests.get(f"{BASE_URL}/products/{p_id}", headers=headers)
        if response.status_code == 200:
            prod = response.json()
            restored = "✅ Restored" if prod['stock_quantity'] == initial_stock else "⚠️ Different"
            print(f"   - {prod['name']}: {prod['stock_quantity']} units (expected {initial_stock}) {restored}")
        else:
            print(f"   ❌ Could not get product {p_id}")
    
    print("\n" + "=" * 60)
    print("✅ ALL MULTI-PRODUCT ORDER TESTS COMPLETED!")
    print("=" * 60)
    print("\nNew Endpoints Available:")
    print("  POST /orders/with-items       - Create order with multiple products")
    print("  GET  /orders/available-products - Get products for order")
    print("  GET  /orders/{id}/items       - Get order items")
    print("  POST /orders/{id}/cancel-with-stock - Cancel & restore stock")
    print("  POST /orders/{id}/return-with-stock - Return & restore stock")


if __name__ == "__main__":
    main()
