"""
Authentication Service

Business logic for user authentication and authorization.
"""

from datetime import timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.services.exceptions import InvalidDataException


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """
        Authenticate a user by email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        # Get user by email
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        return user
    
    @staticmethod
    async def create_user(
        db: AsyncSession,
        username: str,
        email: str,
        full_name: str,
        password: str,
        is_superuser: bool = False
    ) -> User:
        """
        Create a new user.
        
        Args:
            db: Database session
            username: Username
            email: Email address
            full_name: Full name
            password: Plain text password (will be hashed)
            is_superuser: Whether user is a superuser
            
        Returns:
            Created user object
            
        Raises:
            InvalidDataException: If user already exists
        """
        # Check if user exists
        query = select(User).where(
            (User.email == email) | (User.username == username)
        )
        result = await db.execute(query)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise InvalidDataException("User with this email or username already exists")
        
        # Create user
        hashed_password = get_password_hash(password)
        
        user = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=is_superuser
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    def create_token_for_user(user: User) -> str:
        """
        Create JWT token for a user.
        
        Args:
            user: User object
            
        Returns:
            JWT access token
        """
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        return access_token

