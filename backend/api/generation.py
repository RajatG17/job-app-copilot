from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from db.database import get_db
from models.user import User
from models.job import Job
from models.resume import Resume
from api.auth import get_current_user
from core.llm import client as gemini_client
import json

router = APIRouter()

class InterviewPrepRequest(BaseModel):
    job_id: int
    resume_id: int | None = None

class TaskResponse(BaseModel):
    task_id: str
    status: str

@router.post("/interview-prep", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_interview_prep(
    request: InterviewPrepRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = await db.scalar(select(Job).where(Job.id == request.job_id, Job.user_id == current_user.id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if request.resume_id:
        resume = await db.scalar(select(Resume).where(Resume.id == request.resume_id, Resume.user_id == current_user.id))
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

    from worker.tasks import generate_interview_prep_task
    
    # Dispatch to Celery worker
    task = generate_interview_prep_task.delay(request.job_id, request.resume_id)
    
    return TaskResponse(task_id=task.id, status="processing")
