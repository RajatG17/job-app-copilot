import asyncio
import sys
import os

# Add backend directory to sys.path so we can import core.config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from core.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
    await engine.dispose()
    print("Extension created.")

if __name__ == "__main__":
    asyncio.run(main())
