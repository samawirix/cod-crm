from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="COD CRM API",
    description="Cash-on-Delivery CRM System API",
    version="1.0.0",
)

# CORS Configuration - Allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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

@app.get("/")
async def root():
    return {
        "message": "COD CRM API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "cod-crm-api"}

@app.get("/api/v1/test")
async def test_endpoint():
    return {
        "message": "Backend connected successfully!",
        "success": True
    }