from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from models.user import User
from models.job import Job
from api.auth import get_current_user

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    url: str | None = None

class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    description: str
    url: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_job = Job(
        user_id=current_user.id,
        **job_in.model_dump()
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job

@router.get("", response_model=list[JobResponse])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Job).where(Job.user_id == current_user.id))
    jobs = result.scalars().all()
    return jobs
