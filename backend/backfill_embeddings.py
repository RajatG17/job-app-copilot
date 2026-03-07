import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import engine, get_db
from models.user import User
from models.job import Job
from models.resume import Resume
from models.application import Application
from core.llm import generate_embedding

async def main():
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with AsyncSessionLocal() as session:
        # Backfill Jobs
        result = await session.execute(select(Job).where(Job.embedding == None))
        jobs = result.scalars().all()
        for job in jobs:
            print(f"Generating embedding for job: {job.title}")
            text_to_embed = f"Title: {job.title}\nCompany: {job.company}\n\n{job.description}"
            embedding = await generate_embedding(text_to_embed[:8000])
            job.embedding = embedding
            await session.commit()

        # Backfill Resumes
        result = await session.execute(select(Resume).where(Resume.embedding == None))
        resumes = result.scalars().all()
        for resume in resumes:
            if not resume.parsed_text:
                continue
            print(f"Generating embedding for resume: {resume.filename}")
            embedding = await generate_embedding(resume.parsed_text[:8000])
            resume.embedding = embedding
            await session.commit()

    print("Backfill complete.")

if __name__ == "__main__":
    asyncio.run(main())
