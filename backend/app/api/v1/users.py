from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.services.user_service import UserService
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse, PasswordChange
)

router = APIRouter(prefix="/users", tags=["Users"])


# Simple auth helper - matches other routers pattern
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user


@router.get("/", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users (admin/manager only)"""
    if not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = UserService(db)
    return service.get_users(
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        is_active=is_active
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.get("/agents")
async def get_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active agents for assignment"""
    service = UserService(db)
    agents = service.get_agents()
    return {"agents": [{"id": a.id, "name": a.full_name, "email": a.email, "role": a.role} for a in agents]}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    if not current_user.can_manage_users and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = UserService(db)
    user = service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/performance")
async def get_user_performance(
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user performance metrics"""
    if not current_user.can_manage_users and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = UserService(db)
    try:
        return service.get_user_performance(user_id, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user (admin/manager only)"""
    if not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = UserService(db)
    try:
        return service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user profile"""
    service = UserService(db)
    # Don't allow changing own role
    if user_data.role:
        user_data.role = None
    return service.update_user(current_user.id, user_data)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user (admin/manager only)"""
    if not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = UserService(db)
    try:
        return service.update_user(user_id, user_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/me/change-password")
async def change_own_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change own password"""
    service = UserService(db)
    try:
        service.change_password(current_user.id, password_data.current_password, password_data.new_password)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    new_password: str = Query(..., min_length=6),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset user password (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = UserService(db)
    try:
        service.reset_password(user_id, new_password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate a user (admin/manager only)"""
    if not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    service = UserService(db)
    try:
        return service.deactivate_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Activate a user (admin/manager only)"""
    if not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = UserService(db)
    try:
        return service.activate_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
