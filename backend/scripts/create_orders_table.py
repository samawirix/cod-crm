#!/usr/bin/env python3
"""
Script to create order tables in the database.
Run this from the backend directory: python scripts/create_orders_table.py
"""

import sys
sys.path.insert(0, '.')

from app.core.database import engine, Base
from app.models.order import Order, OrderHistory
from app.models.lead import Lead
from app.models.user import User

print("=" * 50)
print("Creating Orders Tables")
print("=" * 50)

try:
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Orders tables created successfully!")
    print("")
    print("Tables created:")
    print("  - orders")
    print("  - order_history")
    print("")
    print("You can now start the server with: python run.py")
except Exception as e:
    print(f"❌ Error creating tables: {e}")
    sys.exit(1)
