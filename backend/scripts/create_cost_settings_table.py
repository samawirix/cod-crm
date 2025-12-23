"""
Create System Cost Settings Table Migration

This script creates the system_cost_settings table and initializes
the singleton settings row with default values.
"""

import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.models.cost_settings import SystemCostSettings

print("Creating system_cost_settings table...")

with engine.connect() as conn:
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS system_cost_settings (
                id INTEGER PRIMARY KEY,
                default_shipping_cost FLOAT DEFAULT 35.0,
                packaging_cost FLOAT DEFAULT 3.0,
                return_shipping_cost FLOAT DEFAULT 35.0,
                agent_confirmation_fee FLOAT DEFAULT 5.0,
                agent_delivery_fee FLOAT DEFAULT 10.0,
                agent_return_penalty FLOAT DEFAULT 0.0,
                payment_gateway_fee_percent FLOAT DEFAULT 0.0,
                other_fixed_fees FLOAT DEFAULT 0.0,
                cod_collection_fee_percent FLOAT DEFAULT 0.0,
                company_name VARCHAR(255) DEFAULT 'COD Express',
                company_phone VARCHAR(50) DEFAULT '+212 600 000 000',
                company_address VARCHAR(500),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by INTEGER
            )
        """))
        conn.commit()
        print("✅ Table created!")
    except Exception as e:
        print(f"Note: {e}")

# Insert default row
print("Initializing default settings...")
db = SessionLocal()
try:
    settings = SystemCostSettings.get_settings(db)
    print(f"✅ Default settings initialized:")
    print(f"   - Shipping Cost: {settings.default_shipping_cost} MAD")
    print(f"   - Packaging Cost: {settings.packaging_cost} MAD")
    print(f"   - Agent Confirmation: {settings.agent_confirmation_fee} MAD")
    print(f"   - Agent Delivery: {settings.agent_delivery_fee} MAD")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()

print("\n✅ Cost settings migration complete!")
