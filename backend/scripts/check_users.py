#!/usr/bin/env python3
"""
Check Users in Database

Lists all users in the database to see what credentials are available.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DatabaseConfig
from app.models.user import User
from sqlalchemy.future import select


async def check_users():
    """List all users in the database."""
    print("🔍 Checking users in database...")
    
    # Create database config
    db_config = DatabaseConfig(
        database_url="sqlite+aiosqlite:///./crm_dev.db",
        echo=False,
        use_null_pool=True
    )
    
    async with db_config.async_session_maker() as session:
        # Get all users
        query = select(User)
        result = await session.execute(query)
        users = result.scalars().all()
        
        print(f"\n📊 Found {len(users)} users:")
        print("-" * 50)
        
        for user in users:
            print(f"ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Full Name: {user.full_name}")
            print(f"Active: {user.is_active}")
            print(f"Superuser: {user.is_superuser}")
            print("-" * 50)
    
    await db_config.close()


if __name__ == "__main__":
    asyncio.run(check_users())
