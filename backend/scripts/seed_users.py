#!/usr/bin/env python3
"""
Seed script to create initial users with different roles
"""
import sys
sys.path.append('.')

from app.core.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_users():
    db = SessionLocal()
    
    users_data = [
        {
            "email": "admin@example.com", 
            "full_name": "Admin User", 
            "role": "admin", 
            "password": "admin123",
            "is_superuser": True
        },
        {
            "email": "manager@example.com", 
            "full_name": "Sarah Manager", 
            "role": "manager", 
            "password": "manager123"
        },
        {
            "email": "agent1@example.com", 
            "full_name": "Ahmed Ali", 
            "role": "agent", 
            "password": "agent123"
        },
        {
            "email": "agent2@example.com", 
            "full_name": "Fatima Hassan", 
            "role": "agent", 
            "password": "agent123"
        },
        {
            "email": "agent3@example.com", 
            "full_name": "Omar Benjelloun", 
            "role": "agent", 
            "password": "agent123"
        },
        {
            "email": "fulfillment@example.com", 
            "full_name": "Karim Fulfillment", 
            "role": "fulfillment", 
            "password": "fulfill123"
        },
    ]
    
    print("=" * 50)
    print("SEEDING USERS")
    print("=" * 50)
    
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                username=user_data["email"].split("@")[0],  # Use email prefix as username
                full_name=user_data["full_name"],
                role=user_data["role"],
                hashed_password=pwd_context.hash(user_data["password"]),
                is_active=True,
                is_verified=True,
                is_superuser=user_data.get("is_superuser", False)
            )
            db.add(user)
            db.commit()
            print(f"  ✅ Created: {user_data['full_name']} ({user_data['role']})")
        else:
            # Update role if needed
            if existing.role != user_data["role"]:
                existing.role = user_data["role"]
                existing.is_superuser = user_data.get("is_superuser", False)
                db.commit()
                print(f"  🔄 Updated: {user_data['full_name']} ({user_data['role']})")
            else:
                print(f"  ⏭️  Exists: {user_data['full_name']} ({user_data['role']})")
    
    db.close()
    
    print("\n" + "=" * 50)
    print("✅ USERS SEEDED SUCCESSFULLY!")
    print("=" * 50)
    print("\n📋 Login credentials:")
    print("  Admin:       admin@example.com / admin123")
    print("  Manager:     manager@example.com / manager123")
    print("  Agents:      agent1@example.com / agent123")
    print("               agent2@example.com / agent123")
    print("               agent3@example.com / agent123")
    print("  Fulfillment: fulfillment@example.com / fulfill123")


if __name__ == "__main__":
    seed_users()
