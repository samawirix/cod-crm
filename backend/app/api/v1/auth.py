"""
Authentication API - Simple Login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User

# Create router
router = APIRouter(
    tags=["authentication"]
)


# ============== SCHEMAS ==============

class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    username: str
    full_name: str
    is_active: bool
    is_superuser: bool
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str
    user_id: int
    username: str
    email: str
    full_name: str


# ============== ENDPOINTS ==============

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint - Returns JWT token
    
    Example request:
    {
        "email": "admin@cod-crm.com",
        "password": "Admin123!"
    }
    
    Example response:
    {
        "access_token": "eyJ...",
        "token_type": "bearer",
        "user_id": 1,
        "username": "admin",
        "email": "admin@cod-crm.com",
        "full_name": "Admin User"
    }
    """
    print(f"\n🔐 Login attempt for: {credentials.email}")
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == credentials.email).first()
    except Exception as e:
        print(f"🔥 DB error during login query: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    
    if not user:
        print(f"❌ User not found: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    print(f"✅ User found: {user.email} (ID: {user.id})")
    
    try:
        # Verify password
        password_valid = verify_password(credentials.password, user.hashed_password)
    except Exception as e:
        print(f"🔥 Password verification error: {e}")
        raise HTTPException(status_code=500, detail="Password verification error")
    
    if not password_valid:
        print(f"❌ Invalid password for: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    print(f"✅ Password verified for: {credentials.email}")
    
    # Check if active
    if not user.is_active:
        print(f"❌ User inactive: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    try:
        # Create JWT token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
    except Exception as e:
        print(f"🔥 Token creation error: {e}")
        raise HTTPException(status_code=500, detail="Token creation error")
    
    print(f"✅ Login successful! Token created for: {credentials.email}\n")
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(db: Session = Depends(get_db)):
    """
    Get current user information
    Note: This is a simplified version - proper JWT validation should be added
    """
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.get("/health")
async def auth_health():
    """Auth service health check"""
    return {"status": "ok", "service": "auth"}
