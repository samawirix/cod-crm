#!/usr/bin/env python3
"""
Test Products API

This script tests all product-related API endpoints.
"""

import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login first
print("=" * 50)
print("TESTING PRODUCT ENDPOINTS")
print("=" * 50)

print("\n🔐 Logging in...")
login_response = requests.post(f"{BASE_URL}/auth/api/v1/auth/login", json={
    "email": "admin@cod-crm.com",
    "password": "Admin123!"
})

if login_response.status_code != 200:
    print(f"❌ Login failed! Status: {login_response.status_code}")
    print(login_response.json())
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Login successful!")

# Get categories
print("\n📁 Getting categories...")
response = requests.get(f"{BASE_URL}/products/categories", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    categories = response.json()
    print(f"✅ Categories: {len(categories)}")
    for cat in categories[:5]:
        print(f"   - {cat['name']}")
else:
    print(f"❌ Failed: {response.json()}")

# Get products
print("\n📦 Getting products...")
response = requests.get(f"{BASE_URL}/products/", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Total products: {data['total']}")
    for prod in data['products'][:3]:
        print(f"   - {prod['sku']}: {prod['name']} - {prod['selling_price']} MAD (Stock: {prod['stock_quantity']})")
else:
    print(f"❌ Failed: {response.json()}")

# Get inventory stats
print("\n📊 Getting inventory stats...")
response = requests.get(f"{BASE_URL}/products/stats", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    stats = response.json()
    print(f"✅ Total Products: {stats['total_products']}")
    print(f"   Active: {stats['active_products']}")
    print(f"   Out of Stock: {stats['out_of_stock']}")
    print(f"   Low Stock: {stats['low_stock']}")
    print(f"   Stock Value: {stats['total_stock_value']} MAD")
    print(f"   Retail Value: {stats['total_retail_value']} MAD")
    print(f"   Potential Profit: {stats['potential_profit']} MAD")
else:
    print(f"❌ Failed: {response.json()}")

# Create a new product
print("\n➕ Creating test product...")
response = requests.post(
    f"{BASE_URL}/products/",
    json={
        "name": "Test Product",
        "sku": "TEST-001",
        "description": "A test product",
        "cost_price": 50,
        "selling_price": 99,
        "stock_quantity": 100
    },
    headers=headers
)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    product = response.json()
    test_product_id = product['id']
    print(f"✅ Created: {product['name']} (ID: {test_product_id})")
    print(f"   Profit Margin: {product['profit_margin']}%")
    print(f"   Profit/Unit: {product['profit_per_unit']} MAD")
elif response.status_code == 400 and "already exists" in str(response.json()):
    print("⏭️  Product already exists, fetching it...")
    response = requests.get(f"{BASE_URL}/products/?search=TEST-001", headers=headers)
    if response.status_code == 200:
        test_product_id = response.json()['products'][0]['id']
        print(f"✅ Found existing product (ID: {test_product_id})")
else:
    print(f"❌ Failed: {response.json()}")
    test_product_id = None

if test_product_id:
    # Get product details
    print(f"\n🔍 Getting product details (ID: {test_product_id})...")
    response = requests.get(f"{BASE_URL}/products/{test_product_id}", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        product = response.json()
        print(f"✅ {product['name']}")
        print(f"   Stock: {product['stock_quantity']}")
        print(f"   Low Stock: {product['is_low_stock']}")
        print(f"   Out of Stock: {product['is_out_of_stock']}")
    else:
        print(f"❌ Failed: {response.json()}")
    
    # Adjust stock
    print(f"\n📦 Adjusting stock (+25)...")
    response = requests.post(
        f"{BASE_URL}/products/{test_product_id}/adjust-stock",
        json={"quantity": 25, "reason": "Restock", "notes": "Test restock"},
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        product = response.json()
        print(f"✅ New stock: {product['stock_quantity']}")
    else:
        print(f"❌ Failed: {response.json()}")
    
    # Get stock movements
    print(f"\n📜 Getting stock movements...")
    response = requests.get(f"{BASE_URL}/products/{test_product_id}/stock-movements", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        movements = response.json()
        print(f"✅ Movements: {len(movements)}")
        for mov in movements[:3]:
            print(f"   - {mov['movement_type']}: {mov['quantity']} ({mov['previous_stock']} → {mov['new_stock']})")
    else:
        print(f"❌ Failed: {response.json()}")
    
    # Update product
    print(f"\n✏️ Updating product...")
    response = requests.put(
        f"{BASE_URL}/products/{test_product_id}",
        json={"selling_price": 129, "is_featured": True},
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        product = response.json()
        print(f"✅ Updated price: {product['selling_price']} MAD")
        print(f"   Featured: {product['is_featured']}")
    else:
        print(f"❌ Failed: {response.json()}")

# Get top selling products
print("\n🏆 Getting top selling products...")
response = requests.get(f"{BASE_URL}/products/top-selling?limit=5", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Top sellers: {len(data['products'])}")
else:
    print(f"❌ Failed: {response.json()}")

# Get low stock products
print("\n⚠️ Getting low stock products...")
response = requests.get(f"{BASE_URL}/products/low-stock?limit=5", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Low stock items: {len(data['products'])}")
else:
    print(f"❌ Failed: {response.json()}")

print("\n" + "=" * 50)
print("✅ ALL PRODUCT TESTS COMPLETED!")
print("=" * 50)
