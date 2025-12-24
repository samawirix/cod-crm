from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os

from app.api.v1.auth import router as auth_router
from app.api.v1.leads import router as leads_router
from app.api.v1.lead_notes import router as lead_notes_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.debug import router as debug_router
from app.api.v1.orders import router as orders_router
from app.api.v1.products import router as products_router
from app.api.v1.financial import router as financial_router
from app.api.v1.users import router as users_router
from app.api.v1.ad_spend import router as ad_spend_router
from app.api.v1.cost_settings import router as cost_settings_router
from app.api.v1.unit_economics import router as unit_economics_router
from app.api.v1.calls import router as calls_router
from app.api.v1.couriers import router as couriers_router
from app.api.v1.shipments import router as shipments_router
from app.api.v1.bordereaux import router as bordereaux_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.websockets import websocket_endpoint, start_callback_checker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="COD CRM API",
    description="Cash-on-Delivery CRM System API",
    version="1.0.0",
)

# CORS Configuration - Explicit origins required when credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(leads_router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(lead_notes_router, prefix="/api/v1/lead_notes", tags=["lead_notes"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(debug_router, prefix="/api/v1/debug", tags=["debug"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(products_router, prefix="/api/v1/products", tags=["products"])
app.include_router(financial_router, prefix="/api/v1", tags=["financial"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(ad_spend_router, prefix="/api/v1", tags=["ad-spend"])
app.include_router(cost_settings_router, prefix="/api/v1", tags=["cost-settings"])
app.include_router(unit_economics_router, prefix="/api/v1", tags=["unit-economics"])
app.include_router(calls_router, prefix="/api/v1/calls", tags=["calls"])
app.include_router(couriers_router, prefix="/api/v1/couriers", tags=["couriers"])
app.include_router(shipments_router, prefix="/api/v1/shipments", tags=["shipments"])
app.include_router(bordereaux_router, prefix="/api/v1/bordereaux", tags=["bordereaux"])
app.include_router(uploads_router, prefix="/api/v1", tags=["uploads"])

# Mount static files for uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# WebSocket endpoints
app.websocket("/ws/notifications/{agent_id}")(websocket_endpoint)

# Startup event to initialize background tasks
@app.on_event("startup")
async def startup_event():
    """Initialize background tasks on startup"""
    print("🚀 Starting COD CRM API...")
    start_callback_checker()
    print("✅ Callback notification checker started")


@app.get("/")
async def root():
    return {
        "message": "COD CRM API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cod-crm-api"}

@app.get("/api/v1/test")
async def test_endpoint():
    return {
        "message": "Backend connected successfully!",
        "success": True
    }