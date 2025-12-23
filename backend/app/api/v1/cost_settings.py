"""
Cost Settings API Router

Endpoints for managing system cost configuration.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.cost_settings import SystemCostSettings
from app.schemas.cost_settings import CostSettingsUpdate, CostSettingsResponse

router = APIRouter(prefix="/cost-settings", tags=["Cost Settings"])


# Simple auth helper
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user


@router.get("/", response_model=CostSettingsResponse)
async def get_cost_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current cost settings"""
    return SystemCostSettings.get_settings(db)


@router.put("/", response_model=CostSettingsResponse)
async def update_cost_settings(
    data: CostSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update cost settings"""
    settings = SystemCostSettings.get_settings(db)
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    
    settings.updated_by = current_user.id
    db.commit()
    db.refresh(settings)
    
    return settings
