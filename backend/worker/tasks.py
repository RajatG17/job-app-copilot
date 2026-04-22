import asyncio
import json
from celery import shared_task
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import AsyncSessionLocal
from models import Job, Resume, User, Application
from core.llm import client as gemini_client

def async_to_sync(coro):
    """Utility to run an async function in a sync context (like Celery worker)."""
    return asyncio.run(coro)

async def _generate_interview_prep(job_id: int, resume_id: int | None):
    if not gemini_client:
        return {"error": "Gemini client not configured"}
        
    async with AsyncSessionLocal() as db:
        job = await db.scalar(select(Job).where(Job.id == job_id))
        if not job:
            return {"error": "Job not found"}
            
        resume_text = ""
        if resume_id:
            resume = await db.scalar(select(Resume).where(Resume.id == resume_id))
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
                model="gemini-2.5-flash",
                contents=prompt,
            )
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            parsed = json.loads(response_text.strip())
            return parsed
        except Exception as e:
            return {"error": str(e)}

@shared_task(bind=True, max_retries=5, retry_backoff=True)
def generate_interview_prep_task(self, job_id: int, resume_id: int | None = None):
    try:
        result = async_to_sync(_generate_interview_prep(job_id, resume_id))
        if "error" in result:
            if "ResourceExhausted" in result["error"] or "InternalServerError" in result["error"]:
                raise self.retry(exc=Exception(result["error"]))
            return {"status": "failed", "error": result["error"]}
        return {"status": "success", "data": result}
    except Exception as exc:
        raise self.retry(exc=exc)

async def _generate_cover_letter(job_id: int, resume_id: int):
    if not gemini_client:
        return {"error": "Gemini client not configured"}

    async with AsyncSessionLocal() as db:
        job = await db.scalar(select(Job).where(Job.id == job_id))
        if not job:
            return {"error": "Job not found"}

        resume = await db.scalar(select(Resume).where(Resume.id == resume_id))
        if not resume:
            return {"error": "Resume not found"}

        if not resume.parsed_text:
            return {"error": "Resume has no parsed text"}

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
                model="gemini-3.1-flash-lite-preview",
                contents=prompt,
            )
            return {"cover_letter": response.text}
        except Exception as e:
            return {"error": str(e)}

@shared_task(bind=True, max_retries=5, retry_backoff=True)
def generate_cover_letter_task(self, job_id: int, resume_id: int):
    try:
        result = async_to_sync(_generate_cover_letter(job_id, resume_id))
        if "error" in result:
            if "ResourceExhausted" in result["error"] or "InternalServerError" in result["error"]:
                raise self.retry(exc=Exception(result["error"]))
            return {"status": "failed", "error": result["error"]}
        return {"status": "success", "data": result}
    except Exception as exc:
        raise self.retry(exc=exc)
