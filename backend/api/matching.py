from fastapi import APIRouter, Depends, HTTPException
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

    return MatchResponse(
        job_id=job_id,
        resume_id=resume_id,
        similarity_score=round(score_percentage, 1)
    )

class TailorRequest(BaseModel):
    job_id: int
    resume_id: int

class TailorResponse(BaseModel):
    cover_letter: str

@router.post("/tailor", response_model=TailorResponse)
async def generate_cover_letter_for_job(
    request: TailorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini client not configured")

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

    prompt = f"""
    You are an expert career counselor and resume writer. I need you to write a compelling, tailored cover letter for a job application.
    
    Here is the Job Description for the role at {job.company} for the title "{job.title}":
    {job.description}
    
    Here is my Resume text:
    {resume.parsed_text}
    
    Please write a professional, engaging cover letter that highlights how my specific experience matches the key requirements of the job. 
    Keep it concise (3-4 short paragraphs), confident, and ready to be pasted into an email or application portal. Do not include placeholder brackets like [Your Name] if the name is available in the resume, try to infer it. Otherwise use placeholders.
    Output ONLY the content of the cover letter.
    """

    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return TailorResponse(cover_letter=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cover letter: {str(e)}")
