"""
Database migration script for Orders and OrderHistory tables
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.order import Order, OrderHistory

def migrate_orders():
    """Create orders and order_history tables"""
    print("🔄 Creating orders tables...")
    
    # Create all tables (will only create if they don't exist)
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Orders and order_history tables created!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return
    
    # Verify tables exist
    db = SessionLocal()
    try:
        # Check if orders table exists
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'"))
        if result.fetchone():
            print("✅ Orders table verified")
        else:
            print("⚠️  Orders table not found")
        
        # Check if order_history table exists
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='order_history'"))
        if result.fetchone():
            print("✅ Order_history table verified")
        else:
            print("⚠️  Order_history table not found")
        
        print("\n✅ Migration complete!")
        print("📊 Orders and OrderHistory tables are ready to use!")
    except Exception as e:
        print(f"❌ Error verifying tables: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_orders()

