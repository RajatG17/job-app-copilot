from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from db.database import get_db
from models.user import User
from models.application import Application, ApplicationStatus
from api.auth import get_current_user

router = APIRouter()

class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: Optional[int] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None

class JobSummary(BaseModel):
    id: int
    title: str
    company: str
    url: str | None = None
    class Config:
        from_attributes = True

class ResumeSummary(BaseModel):
    id: int
    filename: str
    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    resume_id: int | None = None
    status: ApplicationStatus
    notes: str | None = None
    match_score: float | None = None
    ai_tips: str | None = None
    created_at: datetime | None = None
    job: JobSummary | None = None
    resume: ResumeSummary | None = None
    class Config:
        from_attributes = True

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_in: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_app = Application(
        user_id=current_user.id,
        **app_in.model_dump()
    )
    db.add(new_app)
    await db.commit()
    
    # Refetch with relationships to satisfy Pydantic ApplicationResponse
    result = await db.execute(
        select(Application)
        .where(Application.id == new_app.id)
        .options(selectinload(Application.job), selectinload(Application.resume))
    )
    return result.scalars().first()

@router.get("", response_model=list[ApplicationResponse])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .options(selectinload(Application.job), selectinload(Application.resume))
    )
    apps = result.scalars().all()
    return apps

@router.patch("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: int,
    app_in: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Application)
        .where(Application.id == app_id, Application.user_id == current_user.id)
        .options(selectinload(Application.job), selectinload(Application.resume))
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    update_data = app_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)
        
    await db.commit()
    
    # Refetch with relationships to satisfy Pydantic ApplicationResponse
    result = await db.execute(
        select(Application)
        .where(Application.id == app_id)
        .options(selectinload(Application.job), selectinload(Application.resume))
    )
    return result.scalars().first()

@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Application).where(Application.id == app_id, Application.user_id == current_user.id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    await db.delete(app)
    await db.commit()
