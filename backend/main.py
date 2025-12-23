"""
CRM Backend Application - Simplified Version
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.leads import router as leads_router
from app.api.v1.auth import router as auth_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.call_notes import router as call_notes_router
from app.api.v1.orders import router as orders_router
from app.core.database import engine
from app.models.base import Base
from app.models.user import User
from app.models.lead import Lead
from app.models.call_note import CallNote  # ensure relationship resolution
from app.models.order import Order, OrderHistory  # Import to register with SQLAlchemy

# Create FastAPI app
app = FastAPI(
    title="CRM API",
    description="Customer Relationship Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",       # Vite default port
        "http://127.0.0.1:5173",       # Vite default (alt)
        "http://localhost:8080",       # Vite custom port
        "http://127.0.0.1:8080",       # Vite custom (alt)
        "http://localhost:3000",       # React default port
        "http://127.0.0.1:3000",       # React default (alt)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    print("🚀 Starting CRM Backend API...")
    print("📍 Server: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create default admin user if not exists
    from app.core.database import SessionLocal
    from app.core.security import get_password_hash
    
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@cod-crm.com").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@cod-crm.com",
                full_name="Admin User",
                hashed_password=get_password_hash("Admin123!"),
                is_active=True,
                is_superuser=True
            )
            db.add(admin)
            db.commit()
            print("✅ Created admin user: admin@cod-crm.com / Admin123!")
        else:
            print("✅ Admin user already exists")
    except Exception as e:
        print(f"⚠️  Error creating admin user: {e}")
    finally:
        db.close()
    
    print("✅ Application started successfully\n")

# Include routers
app.include_router(auth_router)
app.include_router(leads_router)
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(call_notes_router, prefix="/api/v1/call-notes", tags=["call-notes"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["orders"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CRM API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/leads/health"
    }

# Run with: python run.py or uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
