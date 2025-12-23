#!/usr/bin/env python3
"""
Test Financial Dashboard API
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"


def login():
    """Get access token"""
    # Try the login URL
    response = requests.post(f"{BASE_URL}/auth/api/v1/auth/login", data={
        "username": "admin@example.com",
        "password": "admin123"
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    
    return None


def main():
    print("=" * 60)
    print("TESTING FINANCIAL DASHBOARD API")
    print("=" * 60)
    
    # Get token
    token = login()
    if not token:
        print("❌ Could not authenticate. Some tests may fail.")
        headers = {}
    else:
        print("✅ Login successful!")
        headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Financial Summary
    print("\n💰 Financial Summary...")
    r = requests.get(f"{BASE_URL}/financial/summary", headers=headers)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Period: {data['period']['start_date'][:10]} to {data['period']['end_date'][:10]}")
        print(f"   Revenue:")
        print(f"     - Total Revenue: {data['revenue']['total_revenue']} MAD")
        print(f"     - Shipping Revenue: {data['revenue']['shipping_revenue']} MAD")
        print(f"     - Pending Revenue: {data['revenue']['pending_revenue']} MAD")
        print(f"   Profit:")
        print(f"     - Gross Profit: {data['profit']['gross_profit']} MAD")
        print(f"     - Gross Margin: {data['profit']['gross_margin']}%")
        print(f"   Orders:")
        print(f"     - Total: {data['orders']['total_orders']}")
        print(f"     - Delivered: {data['orders']['delivered_orders']}")
        print(f"     - Pending: {data['orders']['pending_orders']}")
        print(f"     - Avg Order Value: {data['orders']['avg_order_value']} MAD")
        print(f"   Collection:")
        print(f"     - Collected: {data['collection']['collected_amount']} MAD")
        print(f"     - Pending: {data['collection']['pending_collection']} MAD")
    else:
        print(f"❌ Error: {r.text}")
    
    # Test 2: Revenue by Day
    print("\n📈 Revenue by Day...")
    r = requests.get(f"{BASE_URL}/financial/revenue-by-day", headers=headers)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Days with data: {len(data)}")
        for day in data[:5]:
            print(f"   - {day['date']}: {day['revenue']} MAD ({day['orders']} orders)")
    else:
        print(f"❌ Error: {r.text}")
    
    # Test 3: Revenue by Product
    print("\n📦 Revenue by Product...")
    r = requests.get(f"{BASE_URL}/financial/revenue-by-product", headers=headers)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Products: {len(data)}")
        for p in data[:5]:
            print(f"   - {p['product_name']}: {p['revenue']} MAD (Profit: {p['profit']} MAD)")
    else:
        print(f"❌ Error: {r.text}")
    
    # Test 4: Revenue by City
    print("\n🏙️ Revenue by City...")
    r = requests.get(f"{BASE_URL}/financial/revenue-by-city", headers=headers)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Cities: {len(data)}")
        for c in data[:5]:
            print(f"   - {c['city']}: {c['revenue']} MAD ({c['orders']} orders)")
    else:
        print(f"❌ Error: {r.text}")
    
    # Test 5: Monthly Comparison
    print("\n📊 Monthly Comparison...")
    r = requests.get(f"{BASE_URL}/financial/monthly-comparison", headers=headers)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Months: {len(data)}")
        for m in data:
            print(f"   - {m['month']}: {m['revenue']} MAD ({m['orders']} orders)")
    else:
        print(f"❌ Error: {r.text}")
    
    # Test 6: Profit Analysis
    print("\n💹 Profit Analysis...")
    r = requests.get(f"{BASE_URL}/financial/profit-analysis", headers=headers)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        summary = data['summary']
        print(f"✅ Summary:")
        print(f"   - Total Revenue: {summary['total_revenue']} MAD")
        print(f"   - Total Cost: {summary['total_cost']} MAD")
        print(f"   - Gross Profit: {summary['gross_profit']} MAD")
        print(f"   - Gross Margin: {summary['gross_margin']}%")
        
        if data['top_profitable_products']:
            print(f"   Top Profitable:")
            for p in data['top_profitable_products'][:3]:
                print(f"     - {p['name']}: {p['profit']} MAD profit")
    else:
        print(f"❌ Error: {r.text}")
    
    print("\n" + "=" * 60)
    print("✅ ALL FINANCIAL TESTS COMPLETED!")
    print("=" * 60)
    print("\nFinancial Endpoints Available:")
    print("  GET /financial/summary        - Comprehensive financial summary")
    print("  GET /financial/revenue-by-day - Daily revenue breakdown")
    print("  GET /financial/revenue-by-product - Revenue by product")
    print("  GET /financial/revenue-by-city - Revenue by city")
    print("  GET /financial/monthly-comparison - Month-over-month")
    print("  GET /financial/profit-analysis - Detailed profit analysis")


if __name__ == "__main__":
    main()
