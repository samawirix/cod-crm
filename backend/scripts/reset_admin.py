"""
Reset Admin User Script
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_admin():
    db = SessionLocal()
    
    try:
        # Delete existing admin if any
        existing = db.query(User).filter(User.email == "admin@cod-crm.com").first()
        if existing:
            print(f"Found existing admin user (ID: {existing.id})")
            db.delete(existing)
            db.commit()
            print("✅ Deleted old admin user")
        
        # Create fresh admin user
        admin = User(
            username="admin",
            email="admin@cod-crm.com",
            full_name="Admin User",
            hashed_password=get_password_hash("Admin123!"),
            is_active=True,
            is_superuser=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("\n✅ Admin user created successfully!")
        print(f"   ID: {admin.id}")
        print(f"   Email: {admin.email}")
        print(f"   Username: {admin.username}")
        print(f"   Active: {admin.is_active}")
        print(f"   Password: Admin123!")
        print(f"   Hash: {admin.hashed_password[:50]}...")
        print("\n🔑 Login with:")
        print("   Email: admin@cod-crm.com")
        print("   Password: Admin123!\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()

