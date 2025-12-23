import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.call_note import CallNote
from app.models.lead import Lead
from app.models.user import User

def create_tables():
    """Create call_notes table and add new columns to leads table"""
    print("🔄 Creating call_notes table...")
    
    # Create all tables (will only create call_notes if it doesn't exist)
    Base.metadata.create_all(bind=engine)
    print("✅ call_notes table created!")
    
    # Add new columns to leads table
    db = SessionLocal()
    try:
        # Try to add last_call_date column
        try:
            db.execute(text("ALTER TABLE leads ADD COLUMN last_call_date DATETIME"))
            db.commit()
            print("✅ Added last_call_date column to leads table")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("⚠️  last_call_date column already exists")
            else:
                print(f"❌ Error adding last_call_date: {e}")
            db.rollback()
        
        # Try to add call_attempts column
        try:
            db.execute(text("ALTER TABLE leads ADD COLUMN call_attempts INTEGER DEFAULT 0"))
            db.commit()
            print("✅ Added call_attempts column to leads table")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("⚠️  call_attempts column already exists")
            else:
                print(f"❌ Error adding call_attempts: {e}")
            db.rollback()
        
        print("\n✅ Migration complete!")
        print("📊 Database schema updated successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_tables()
