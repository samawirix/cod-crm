"""
Seed script to create initial users for the COD CRM system
"""
import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.database import Base


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def seed_users():
    """Create seed users"""
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("⚠️  Users already exist in database. Skipping seed.")
            return
        
        # Define seed users
        seed_users_data = [
            {
                "email": "admin@cod-crm.com",
                "password": "Admin123!",
                "full_name": "System Administrator",
                "role": UserRole.ADMIN,
                "phone": "+1234567890"
            },
            {
                "email": "agent@cod-crm.com", 
                "password": "Agent123!",
                "full_name": "Call Center Agent",
                "role": UserRole.CALL_CENTER,
                "phone": "+1234567891"
            },
            {
                "email": "fulfill@cod-crm.com",
                "password": "Fulfill123!",
                "full_name": "Fulfillment Manager",
                "role": UserRole.FULFILLMENT,
                "phone": "+1234567892"
            },
            {
                "email": "marketing@cod-crm.com",
                "password": "Marketing123!",
                "full_name": "Marketing Manager",
                "role": UserRole.MARKETING,
                "phone": "+1234567893"
            }
        ]
        
        # Create users
        created_users = []
        for user_data in seed_users_data:
            try:
                user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    phone=user_data["phone"],
                    is_active=True
                )
                db.add(user)
                created_users.append(user_data["email"])
            except IntegrityError:
                print(f"⚠️  User {user_data['email']} already exists, skipping...")
                continue
        
        # Commit all users
        db.commit()
        
        print("✅ Seed users created successfully:")
        for email in created_users:
            print(f"   - {email}")
        
        print("\n📋 Login Credentials:")
        print("=" * 50)
        for user_data in seed_users_data:
            if user_data["email"] in created_users:
                print(f"Email: {user_data['email']}")
                print(f"Password: {user_data['password']}")
                print(f"Role: {user_data['role'].value}")
                print("-" * 30)
        
    except Exception as e:
        print(f"❌ Error creating seed users: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """Main seed function"""
    print("🌱 Starting database seeding...")
    
    try:
        # Create tables
        create_tables()
        
        # Seed users
        seed_users()
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n🚀 You can now start the server and test the authentication endpoints.")
        
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
