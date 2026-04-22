import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380/0")
if REDIS_URL.startswith("rediss://") and "ssl_cert_reqs" not in REDIS_URL:
    REDIS_URL += "?ssl_cert_reqs=CERT_NONE" if "?" not in REDIS_URL else "&ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    "job_copilot_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["worker.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    worker_concurrency=1,
    worker_max_tasks_per_child=10,
)

# Optional: To help debugging during local dev
if __name__ == '__main__':
    celery_app.start()
