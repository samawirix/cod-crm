#!/usr/bin/env python3
"""
Create order_items table for multi-product orders
"""
import sys
sys.path.append('.')

from app.core.database import engine, Base
from app.models.order_item import OrderItem

print("=" * 50)
print("CREATING ORDER_ITEMS TABLE")
print("=" * 50)

try:
    # Create order_items table specifically
    OrderItem.__table__.create(bind=engine, checkfirst=True)
    print("✅ Order items table created successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

print("\nYou can now create orders with multiple products!")
print("Use POST /api/v1/orders/with-items endpoint")
