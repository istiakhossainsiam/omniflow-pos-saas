import asyncio
from app.database import engine, Base, AsyncSessionLocal
from app.core.seed import seed_initial_data

async def main():
    print("Testing DB initialization...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)
    print("[SUCCESS] DB schema and initial seed successfully verified!")

if __name__ == "__main__":
    asyncio.run(main())
