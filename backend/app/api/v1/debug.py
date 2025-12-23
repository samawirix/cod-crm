"""
Debug API Endpoints

Simple endpoints to help debug frontend connection issues.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/v1/debug", tags=["debug"])


@router.get("/")
async def debug_root():
    """Debug root endpoint."""
    return {
        "message": "Debug API is working",
        "backend_url": "http://localhost:8000",
        "frontend_url": "http://localhost:8080",
        "status": "connected"
    }


@router.get("/test-login")
async def test_login_endpoint():
    """Test if login endpoint is accessible."""
    return {
        "message": "Login endpoint is accessible",
        "login_url": "POST /api/v1/auth/login",
        "method": "POST",
        "content_type": "application/json",
        "example_body": {
            "email": "admin@cod-crm.com",
            "password": "Admin123!"
        }
    }


@router.post("/test-login")
async def test_login_post():
    """Test POST to login endpoint."""
    return {
        "message": "POST request received successfully",
        "status": "working",
        "note": "Use /api/v1/auth/login for actual login"
    }
