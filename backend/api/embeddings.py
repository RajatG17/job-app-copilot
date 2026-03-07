from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.database import get_db
from models.user import User
from models.resume import Resume
from models.job import Job
from api.auth import get_current_user
from core.llm import generate_embedding

router = APIRouter()

@router.post("/resumes/{resume_id}")
async def generate_resume_embedding(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not resume.parsed_text:
        raise HTTPException(status_code=400, detail="Resume has no parsed text to embed.")

    try:
        embedding = await generate_embedding(resume.parsed_text[:8000]) # Cap text length to avoid token limits
        resume.embedding = embedding
        await db.commit()
        return {"message": "Embedding generated successfully", "dimensions": len(embedding)}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate embedding from LLM provider.")


@router.post("/jobs/{job_id}")
async def generate_job_embedding(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == current_user.id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    text_to_embed = f"Title: {job.title}\nCompany: {job.company}\n\n{job.description}"

    try:
        embedding = await generate_embedding(text_to_embed[:8000])
        job.embedding = embedding
        await db.commit()
        return {"message": "Embedding generated successfully", "dimensions": len(embedding)}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate embedding from LLM provider.")
