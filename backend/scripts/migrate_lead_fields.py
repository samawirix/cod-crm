#!/usr/bin/env python3
"""
Database Migration Script - Add New Lead Fields

This script adds the new fields to the existing leads table:
- alternate_phone
- city
- address
- product_interest
- quantity
- unit_price
- total_amount
"""

import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_database():
    """Add new fields to the leads table"""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    
    print("🔄 Starting database migration...")
    print("📋 Adding new fields to leads table...")
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Add new columns one by one (SQLite doesn't support IF NOT EXISTS for ADD COLUMN)
                columns_to_add = [
                    "ALTER TABLE leads ADD COLUMN alternate_phone VARCHAR(20);",
                    "ALTER TABLE leads ADD COLUMN city VARCHAR(100);",
                    "ALTER TABLE leads ADD COLUMN address TEXT;",
                    "ALTER TABLE leads ADD COLUMN product_interest VARCHAR(255);",
                    "ALTER TABLE leads ADD COLUMN quantity INTEGER DEFAULT 1;",
                    "ALTER TABLE leads ADD COLUMN unit_price FLOAT DEFAULT 0.0;",
                    "ALTER TABLE leads ADD COLUMN total_amount FLOAT DEFAULT 0.0;"
                ]
                
                for sql in columns_to_add:
                    try:
                        conn.execute(text(sql))
                        print(f"✅ Added column: {sql.split()[-1].rstrip(';')}")
                    except Exception as e:
                        if "duplicate column name" in str(e).lower():
                            print(f"⚠️  Column already exists: {sql.split()[-1].rstrip(';')}")
                        else:
                            print(f"❌ Error adding column: {e}")
                            raise
                
                # Update existing records to calculate total_amount
                conn.execute(text("UPDATE leads SET total_amount = quantity * unit_price WHERE quantity IS NOT NULL AND unit_price IS NOT NULL;"))
                
                # Set default values for existing records
                conn.execute(text("UPDATE leads SET quantity = 1 WHERE quantity IS NULL;"))
                conn.execute(text("UPDATE leads SET unit_price = 0.0 WHERE unit_price IS NULL;"))
                conn.execute(text("UPDATE leads SET total_amount = 0.0 WHERE total_amount IS NULL;"))
                
                # Commit transaction
                trans.commit()
                
                print("✅ Migration completed successfully!")
                print("📊 New fields added:")
                print("   - alternate_phone (VARCHAR(20))")
                print("   - city (VARCHAR(100))")
                print("   - address (TEXT)")
                print("   - product_interest (VARCHAR(255))")
                print("   - quantity (INTEGER, default: 1)")
                print("   - unit_price (FLOAT, default: 0.0)")
                print("   - total_amount (FLOAT, default: 0.0)")
                print("💰 Total amounts calculated for existing records")
                
            except Exception as e:
                # Rollback on error
                trans.rollback()
                print(f"❌ Migration failed: {str(e)}")
                raise
                
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        raise

if __name__ == "__main__":
    migrate_database()
