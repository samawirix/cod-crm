"""
Migration script to add courier field to orders table.
Run: python scripts/add_courier_to_orders.py
"""

import sys
sys.path.append('.')

from sqlalchemy import text
from app.core.database import engine

print("Adding courier field to orders table...")

with engine.connect() as conn:
    try:
        conn.execute(text("""
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS courier VARCHAR(50) DEFAULT 'AMANA',
            ADD COLUMN IF NOT EXISTS courier_tracking_url VARCHAR(500)
        """))
        conn.commit()
        print("✅ Courier field added!")
    except Exception as e:
        print(f"Note: {e}")
        # Try individual columns
        for col_name, col_def in [
            ("courier", "VARCHAR(50) DEFAULT 'AMANA'"),
            ("courier_tracking_url", "VARCHAR(500)")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}"))
                conn.commit()
                print(f"  ✅ Added {col_name}")
            except Exception as e2:
                print(f"  ⏭️ {col_name}: {e2}")
