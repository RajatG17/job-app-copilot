from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from pydantic import BaseModel

from db.database import get_db
from models.user import User
from models.job import Job
from models.resume import Resume
from api.auth import get_current_user
from core.llm import client as gemini_client

router = APIRouter()

class MatchResponse(BaseModel):
    job_id: int
    resume_id: int
    similarity_score: float

@router.get("/score/{job_id}/{resume_id}", response_model=MatchResponse)
async def get_match_score(
    job_id: int,
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch job
    job = await db.scalar(select(Job).where(Job.id == job_id, Job.user_id == current_user.id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch resume
    resume = await db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    import redis
    import json
    import os
    
    try:
        # Check cache first
        redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6380/0"))
        cache_key = f"score:{job_id}:{resume_id}"
        cached_score = redis_client.get(cache_key)
        
        if cached_score:
            score = float(cached_score)
            return MatchResponse(job_id=job_id, resume_id=resume_id, similarity_score=score)
    except Exception as e:
        print(f"Redis cache error: {e}")

    if job.embedding is None or resume.embedding is None:
        raise HTTPException(
            status_code=400, 
            detail="Embeddings not generated for this job or resume. Please re-create them or wait for processing."
        )

    # Calculate cosine similarity using pgvector's <=> operator (cosine distance)
    # Cosine similarity = 1 - Cosine distance
    query = text("""
        SELECT 1 - (j.embedding <=> r.embedding) AS similarity
        FROM jobs j, resumes r
        WHERE j.id = :job_id AND r.id = :resume_id
    """)
    
    result = await db.execute(query, {"job_id": job_id, "resume_id": resume_id})
    similarity = result.scalar()

    if similarity is None:
        similarity = 0.0

    # Ensure score is between 0 and 1, then scale to 100 for percentage
    score_percentage = max(0.0, min(1.0, similarity)) * 100
    final_score = round(score_percentage, 1)

    try:
        # Cache the score for 1 hour
        redis_client.setex(cache_key, 3600, str(final_score))
    except Exception as e:
        pass

    return MatchResponse(
        job_id=job_id,
        resume_id=resume_id,
        similarity_score=final_score
    )

class TailorRequest(BaseModel):
    job_id: int
    resume_id: int

class TaskResponse(BaseModel):
    task_id: str
    status: str

@router.post("/tailor", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_cover_letter_for_job(
    request: TailorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch job
    job = await db.scalar(select(Job).where(Job.id == request.job_id, Job.user_id == current_user.id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch resume
    resume = await db.scalar(select(Resume).where(Resume.id == request.resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.parsed_text:
        raise HTTPException(status_code=400, detail="Resume has no parsed text to work with.")

    from worker.tasks import generate_cover_letter_task
    
    # Dispatch to Celery worker
    task = generate_cover_letter_task.delay(request.job_id, request.resume_id)
    
    return TaskResponse(task_id=task.id, status="processing")
