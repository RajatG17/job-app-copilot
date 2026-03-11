from fastapi import APIRouter
from celery.result import AsyncResult
from core.celery_app import celery_app

router = APIRouter()

@router.get("/{task_id}")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    result = {
        "task_id": task_id,
        "status": task_result.status,
    }
    
    if task_result.status == "SUCCESS":
        result["result"] = task_result.result
    elif task_result.status == "FAILURE":
        result["error"] = str(task_result.result)
        
    return result
