from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@cod-crm.com",
                "password": "Admin123!"
            }
        }


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "admin@cod-crm.com",
                    "full_name": "Admin User",
                    "role": "admin",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00Z"
                }
            }
        }


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.CALL_CENTER
    phone: Optional[str] = Field(None, max_length=20)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            # Remove all non-digit characters
            digits_only = ''.join(filter(str.isdigit, v))
            if len(digits_only) < 10:
                raise ValueError('Phone number must have at least 10 digits')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@cod-crm.com",
                "password": "SecurePass123!",
                "full_name": "New User",
                "role": "call_center",
                "phone": "+1234567890"
            }
        }


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            digits_only = ''.join(filter(str.isdigit, v))
            if len(digits_only) < 10:
                raise ValueError('Phone number must have at least 10 digits')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "updated@cod-crm.com",
                "full_name": "Updated Name",
                "phone": "+1234567890",
                "avatar_url": "https://example.com/avatar.jpg",
                "is_active": True
            }
        }


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "OldPass123!",
                "new_password": "NewPass123!"
            }
        }
