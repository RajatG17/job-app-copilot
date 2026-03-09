from fastapi import APIRouter, Depends, HTTPException
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

class InterviewQuestion(BaseModel):
    category: str
    question: str
    advice: str

class InterviewPrepResponse(BaseModel):
    questions: list[InterviewQuestion]

@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def generate_interview_prep(
    request: InterviewPrepRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini client not configured")

    job = await db.scalar(select(Job).where(Job.id == request.job_id, Job.user_id == current_user.id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume_text = ""
    if request.resume_id:
        resume = await db.scalar(select(Resume).where(Resume.id == request.resume_id, Resume.user_id == current_user.id))
        if resume and resume.parsed_text:
            resume_text = f"Candidate Resume:\n{resume.parsed_text}\n\n"

    prompt = f"""
    You are an expert technical recruiter and hiring manager.
    
    Job Description ({job.title} at {job.company}):
    {job.description}
    
    {resume_text}
    Generate 5 highly relevant interview questions for this specific role. 
    Include a mix of Technical, Behavioral, and System Design (if applicable) questions.
    For each question, provide a brief 'advice' snippet on how the candidate should approach answering it (referencing their resume experience if provided).
    
    Respond EXACTLY with a JSON object in this format, and no other text:
    {{
        "questions": [
            {{
                "category": "Technical",
                "question": "The question text",
                "advice": "How to answer"
            }}
        ]
    }}
    """

    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-3.1-flash-preview",
            contents=prompt,
        )
        # Strip markdown json block if it exists
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        parsed = json.loads(response_text.strip())
        return InterviewPrepResponse(**parsed)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")
