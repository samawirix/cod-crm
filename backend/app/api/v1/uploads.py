from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime
from app.core.security import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload a product image."""
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Max 5MB allowed.")
    
    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return URL (adjust based on your static file serving setup)
    url = f"/uploads/images/{unique_name}"
    
    return {"url": url, "filename": unique_name}


@router.delete("/image/{filename}")
async def delete_image(
    filename: str,
    current_user = Depends(get_current_user)
):
    """Delete an uploaded image."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(404, "Image not found")
    
    try:
        os.remove(file_path)
        return {"message": "Image deleted successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to delete image: {str(e)}")
