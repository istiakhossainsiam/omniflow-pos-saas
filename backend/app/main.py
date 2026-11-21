from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.core.seed import seed_initial_data

# Import API Routers
from app.api.auth import router as auth_router
from app.api.tenants import router as tenants_router
from app.api.products import router as products_router
from app.api.pos import router as pos_router
from app.api.attendance import router as attendance_router
from app.api.employees import router as employees_router
from app.api.requisitions import router as requisitions_router
from app.api.reports import router as reports_router
from app.api.ecommerce import router as ecommerce_router
from app.api.hrm import router as hrm_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist & run initial seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Check SQLite columns for settings, ecommerce, and HRM
        migration_statements = [
            "ALTER TABLE tenants ADD COLUMN settings JSON",
            "ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(150)",
            "ALTER TABLE tenants ADD COLUMN ecommerce_settings JSON",
            "ALTER TABLE landing_contents ADD COLUMN theme JSON",
            "ALTER TABLE landing_contents ADD COLUMN superadmin_theme JSON",
            "ALTER TABLE customers ADD COLUMN due_balance FLOAT DEFAULT 0.0",
            "ALTER TABLE orders ADD COLUMN due_amount FLOAT DEFAULT 0.0",
            "ALTER TABLE orders ADD COLUMN order_source VARCHAR(20) DEFAULT 'POS'",
            "ALTER TABLE orders ADD COLUMN shipping_address TEXT",
            "ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(80)",
            "ALTER TABLE orders ADD COLUMN shipping_zone VARCHAR(50)",
            "ALTER TABLE orders ADD COLUMN delivery_charge FLOAT DEFAULT 0.0",
            "ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(30) DEFAULT 'PENDING'",
            "ALTER TABLE orders ADD COLUMN customer_notes TEXT",
            "ALTER TABLE employee_profiles ADD COLUMN mobile_allowance FLOAT DEFAULT 0.0",
            "ALTER TABLE employee_profiles ADD COLUMN medical_allowance FLOAT DEFAULT 0.0",
            "ALTER TABLE employee_profiles ADD COLUMN conveyance_allowance FLOAT DEFAULT 0.0",
            "ALTER TABLE employee_profiles ADD COLUMN bank_name VARCHAR(80)",
            "ALTER TABLE employee_profiles ADD COLUMN bank_account_no VARCHAR(50)",
            "ALTER TABLE employee_profiles ADD COLUMN mfs_number VARCHAR(30)",
            "ALTER TABLE employee_profiles ADD COLUMN joining_date VARCHAR(10)"
        ]
        for stmt in migration_statements:
            try:
                from sqlalchemy import text
                await conn.execute(text(stmt))
            except Exception:
                pass
    
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)

    yield

    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise Multi-Tenant Cloud POS, Clothing Matrix Inventory, Employee Attendance 2FA Handshake, Tenant E-Commerce Website & HRM SaaS Engine",
    lifespan=lifespan
)

# Enable CORS for Frontend PWA & Mobile Web Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(tenants_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(pos_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(employees_router, prefix=settings.API_V1_STR)
app.include_router(requisitions_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(ecommerce_router, prefix=settings.API_V1_STR)
app.include_router(hrm_router, prefix=settings.API_V1_STR)

import os
from fastapi.responses import FileResponse

# Check if frontend build exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to pass through
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "system": settings.PROJECT_NAME,
            "status": "online",
            "docs_url": "/docs",
            "version": "1.0.0"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
