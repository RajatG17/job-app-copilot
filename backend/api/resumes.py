from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import shutil
from uuid import uuid4
from pypdf import PdfReader

from db.database import get_db
from models.user import User
from models.resume import Resume
from api.auth import get_current_user
from datetime import datetime

from pydantic import BaseModel

class ResumeResponse(BaseModel):
    id: int
    filename: str
    parsed_text: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True

router = APIRouter()

UPLOAD_DIR = "uploads/resumes"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_id = str(uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Parse PDF text
    try:
        reader = PdfReader(file_path)
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

    # Save to database
    new_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        parsed_text=extracted_text
    )
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)

    return {"message": "Resume uploaded successfully", "id": new_resume.id}

@router.get("", response_model=list[ResumeResponse])
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Resume).where(Resume.user_id == current_user.id))
    resumes = result.scalars().all()
    return resumes

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Attempt to remove file
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass # Ignore if file missing or locked
            
    await db.delete(resume)
    await db.commit()
