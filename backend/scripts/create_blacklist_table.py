"""
Migration script to create the Blacklist table.

Run this script to create the blacklist table in your database:
    cd backend
    python scripts/create_blacklist_table.py
"""

import sys
sys.path.insert(0, '.')

from app.core.database import engine, Base
from app.models.blacklist import Blacklist, BlacklistReason


def create_blacklist_table():
    """Create the blacklist table if it doesn't exist."""
    
    print("📋 Creating Blacklist table...")
    
    # Create the table
    Blacklist.__table__.create(engine, checkfirst=True)
    
    print("✅ Blacklist table created successfully!")
    print("\nTable schema:")
    print("  - id: Primary Key")
    print("  - phone: Unique, indexed phone number")
    print("  - reason: Enum (WRONG_NUMBER, DO_NOT_CALL, FRAUD, SPAM, DUPLICATE, OTHER)")
    print("  - notes: Optional text notes")
    print("  - added_by: Optional string")
    print("  - created_at: Timestamp")
    print("  - updated_at: Timestamp")


if __name__ == "__main__":
    create_blacklist_table()
