"""
Migration script to create daily_ad_spend table.
Run: python scripts/create_ad_spend_table.py
"""

import sys
sys.path.append('.')

from sqlalchemy import text
from app.core.database import engine

print("Creating daily_ad_spend table...")

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS daily_ad_spend (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            platform VARCHAR(50) DEFAULT 'FACEBOOK',
            amount FLOAT NOT NULL DEFAULT 0,
            leads_generated INTEGER DEFAULT 0,
            notes VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            UNIQUE(date, platform)
        )
    """))
    conn.commit()
    print("✅ daily_ad_spend table created!")
