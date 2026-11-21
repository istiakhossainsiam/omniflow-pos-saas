import asyncio
from sqlalchemy import text
from app.database import engine, Base
import app.models

async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        migration_statements = [
            "ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(150)",
            "ALTER TABLE tenants ADD COLUMN ecommerce_settings JSON",
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
                await conn.execute(text(stmt))
                print("Executed:", stmt[:45])
            except Exception as e:
                print("Skipped/Exists:", stmt[:45], "->", str(e)[:40])
    print("Migration finished successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
