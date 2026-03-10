import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from db.database import engine, AsyncSessionLocal
from models.application import Application
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def test():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Application).options(selectinload(Application.job), selectinload(Application.resume)).limit(1))
        app = result.scalars().first()
        if app:
            app.status = "INTERVIEWING"
            await db.commit()

asyncio.run(test())
