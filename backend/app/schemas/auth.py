"""
Authentication Schemas

Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field


class LoginSchema(BaseModel):
    """Schema for user login."""
    
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "admin@crm.com",
                "password": "admin123"
            }
        }
    }


class RegisterSchema(BaseModel):
    """Schema for user registration."""
    
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="User email")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name")
    password: str = Field(..., min_length=6, max_length=100, description="Password")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "newuser",
                "email": "newuser@crm.com",
                "full_name": "New User",
                "password": "password123"
            }
        }
    }


class TokenResponse(BaseModel):
    """Schema for token response."""
    
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email")
    full_name: str = Field(..., description="Full name")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user_id": 1,
                "username": "admin",
                "email": "admin@crm.com",
                "full_name": "Admin User"
            }
        }
    }


class UserResponse(BaseModel):
    """Schema for user response."""
    
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    is_superuser: bool
    
    model_config = {"from_attributes": True}
