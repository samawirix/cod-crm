"""
Ad Spend API Router

Endpoints for managing advertising spend and viewing ROI metrics.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List

from app.core.database import get_db
from app.models.user import User
from app.services.ad_spend_service import AdSpendService
from app.services.csv_parser import AdSpendCSVParser, CSVParseError
from app.schemas.ad_spend import AdSpendCreate, AdSpendUpdate, AdSpendResponse, AdSpendSummary

router = APIRouter(prefix="/ad-spend", tags=["Ad Spend"])


# Simple auth helper
def get_current_user(db: Session = Depends(get_db)):
    """Get current user - simplified version"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found")
    return user


@router.get("/", response_model=List[AdSpendResponse])
async def get_ad_spend(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all ad spend records with optional filters."""
    service = AdSpendService(db)
    return service.get_ad_spend(start_date, end_date, platform)


@router.get("/summary", response_model=AdSpendSummary)
async def get_ad_spend_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ad spend summary with totals and platform breakdown."""
    service = AdSpendService(db)
    return service.get_spend_summary(start_date, end_date)


@router.post("/", response_model=AdSpendResponse)
async def create_ad_spend(
    data: AdSpendCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update ad spend entry (upserts by date+platform)."""
    service = AdSpendService(db)
    return service.create_ad_spend(data.model_dump(), current_user.id)


@router.post("/import")
async def import_ad_spend_csv(
    file: UploadFile = File(...),
    preview_only: bool = False,
    date_format: str = "DD/MM/YYYY",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import ad spend data from CSV file.
    
    - **file**: CSV file with columns: Date/Reporting Starts, Amount Spent, Campaign Name (optional)
    - **preview_only**: If true, only parse and return preview without saving
    - **date_format**: Date format hint: "DD/MM/YYYY" (European) or "MM/DD/YYYY" (US)
    
    Supports Facebook Ads Manager exports. Platform is auto-detected from campaign names.
    Existing entries for same date+platform are updated (upsert).
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Read file content
    content = await file.read()
    
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB allowed.")
    
    # Determine dayfirst based on date_format parameter
    dayfirst = date_format != "MM/DD/YYYY"
    
    # Parse CSV
    parser = AdSpendCSVParser()
    
    try:
        records, parse_errors = parser.parse_csv(content, dayfirst=dayfirst)
    except CSVParseError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Aggregate by date+platform
    aggregated_records = parser.aggregate_by_date_platform(records)
    
    # Preview mode - just return parsed data
    if preview_only:
        return {
            "preview": True,
            "records": aggregated_records,
            "total_records": len(aggregated_records),
            "total_amount": round(sum(r['amount'] for r in aggregated_records), 2),
            "platforms": list(set(r['platform'] for r in aggregated_records)),
            "date_range": {
                "start": min(r['date'] for r in aggregated_records),
                "end": max(r['date'] for r in aggregated_records),
            },
            "errors": parse_errors[:10],  # Limit errors shown
        }
    
    # Save records using upsert
    service = AdSpendService(db)
    created = 0
    updated = 0
    
    for record in aggregated_records:
        # Check if exists
        from app.models.ad_spend import DailyAdSpend
        existing = db.query(DailyAdSpend).filter(
            DailyAdSpend.date == record['date'],
            DailyAdSpend.platform == record['platform']
        ).first()
        
        if existing:
            updated += 1
        else:
            created += 1
        
        service.create_ad_spend(record, current_user.id)
    
    return {
        "success": True,
        "message": f"Successfully imported {len(aggregated_records)} records",
        "created": created,
        "updated": updated,
        "total_amount": round(sum(r['amount'] for r in aggregated_records), 2),
        "date_range": {
            "start": min(r['date'] for r in aggregated_records),
            "end": max(r['date'] for r in aggregated_records),
        },
        "errors": parse_errors[:5],
    }


@router.delete("/{spend_id}")
async def delete_ad_spend(
    spend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an ad spend entry."""
    service = AdSpendService(db)
    if service.delete_ad_spend(spend_id):
        return {"message": "Ad spend entry deleted successfully", "id": spend_id}
    raise HTTPException(status_code=404, detail="Ad spend entry not found")

