"""
Migration script to add call script fields to products table.
Run: python scripts/add_script_to_products.py
"""

import sys
sys.path.append('.')

from sqlalchemy import text
from app.core.database import engine

print("Adding script fields to products table...")

with engine.connect() as conn:
    try:
        conn.execute(text("""
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS call_script TEXT,
            ADD COLUMN IF NOT EXISTS confirmation_script TEXT
        """))
        conn.commit()
        print("✅ Script fields added!")
    except Exception as e:
        print(f"Note: {e}")
        for col_name in ["call_script", "confirmation_script"]:
            try:
                conn.execute(text(f"ALTER TABLE products ADD COLUMN {col_name} TEXT"))
                conn.commit()
                print(f"  ✅ Added {col_name}")
            except Exception as e2:
                print(f"  ⏭️ {col_name}: {e2}")
