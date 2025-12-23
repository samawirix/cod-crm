#!/usr/bin/env python3
"""
Create Frontend User

Creates a user with the exact credentials expected by the frontend.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DatabaseConfig
from app.services.auth_service import AuthService


async def create_frontend_user():
    """Create user with frontend-expected credentials."""
    print("🔧 Creating user for frontend...")
    
    # Create database config
    db_config = DatabaseConfig(
        database_url="sqlite+aiosqlite:///./crm_dev.db",
        echo=False,
        use_null_pool=True
    )
    
    async with db_config.async_session_maker() as session:
        # Create user with frontend credentials
        try:
            user = await AuthService.create_user(
                db=session,
                username="admin_cod",
                email="admin@cod-crm.com",
                full_name="Admin User",
                password="Admin123!",
                is_superuser=True
            )
            print(f"✅ Created frontend user:")
            print(f"   Email: admin@cod-crm.com")
            print(f"   Password: Admin123!")
            print(f"   ID: {user.id}")
        except Exception as e:
            print(f"⚠️  User creation failed: {str(e)}")
            # Try to update existing user
            print("Trying to update existing user...")
    
    await db_config.close()


if __name__ == "__main__":
    asyncio.run(create_frontend_user())
