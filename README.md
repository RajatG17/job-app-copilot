# AI Job Application Copilot 🎯

> **A high-performance, full-stack workspace designed to automate the job search pipeline using LLMs, vector search, and asynchronous background tasks.**

---

## Project Showcase

This project isn't just a basic tracker—it's an engineering showcase of modern full-stack patterns.

- **Intelligent RAG Pipeline:** Uses Google Gemini to parse resumes and semantically match them to job descriptions using `pgvector`.
- **Production-Ready UX:** Implements advanced UI patterns like loading skeletons, real-time toast notifications, and asynchronous task polling to handle 5+ second AI workloads without blocking the UI.
- **Scalable Architecture:** Built with a decoupled FastAPI/Next.js foundation and a Celery/Redis background worker system.

### [Read the Technical Design Document →](./DESIGN.md)

---

## Features

- **Kanban Application Pipeline:** Drag and drop job applications across "Applied", "Interviewing", "Offered", and "Rejected" stages.
- **AI Cover Letter Generation:** Automatically writes highly-targeted cover letters using your base resume and the job description.
- **AI Interview Prep:** Generates custom behavioral and technical interview questions based on the exact job requirements and your background.
- **Semantic Vector Search:** Built with `pgvector` to semantically match your uploaded resumes against job descriptions.
- **Asynchronous Processing:** Heavy AI generation tasks and PDF parsing are offloaded to Celery background workers to keep the UI buttery smooth.
- **Modern Dashboard UI:** Built with Next.js and Tailwind CSS, featuring loading skeletons, native toast notifications, and aggregate metric widgets.

---

## Tech Stack

**Frontend:**

- [Next.js 15](https://nextjs.org/) (App Router)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Lucide Icons, Skeleton Loaders, Toaster)
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (Drag and Drop)

**Backend:**

- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [SQLAlchemy / asyncpg](https://www.sqlalchemy.org/) (Async ORM)
- [Celery](https://docs.celeryq.dev/) (Distributed Task Queue)
- [Google Gemini API](https://ai.google.dev/) (LLM Embeddings and Generation)
- [PyPDF2](https://pypdf2.readthedocs.io/) (Resume Parsing)

**Infrastructure:**

- [PostgreSQL](https://www.postgresql.org/) with `pgvector` extension
- [Redis](https://redis.io/) (Message Broker & Cache)
- [Docker & Docker Compose](https://www.docker.com/) (Unified Deployment)

---

## Getting Started (Local Development)

The easiest way to run the entire application stack is via Docker Compose.

### Prerequisites

1. Install [Docker](https://www.docker.com/products/docker-desktop/) and ensure the Docker Daemon is running.
2. Obtain a [Google Gemini API Key](https://aistudio.google.com/app/apikey).

### Environment Setup

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd job-app-copilot
   ```

2. Create a `.env` file in the root directory and add your Google Gemini API key:

   ```bash
   echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
   ```

   *(Note: The `docker-compose.yml` file defaults the Postgres username, password, and DB to `postgres` / `job_copilot`. You can override these in the `.env` file if desired).*

### Running the Full Stack (Production Profile)

We use a unified `docker-compose.yml` file with a `production` profile to orchestrate the entire stack. This automatically builds the Next.js `standalone` bundle, the FastAPI backend, the Celery workers, Redis, and Postgres.

```bash
docker compose --profile production up -d --build
```

### Accessing the App

Once Docker reports that all 5 containers are `Running`, you can access the application at:

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

*(Note: The very first time you boot the application, the Next.js frontend might take ~15-30 seconds to fully compile its standalone Docker image).*

---

## Stopping the Application

To shut down the stack safely without deleting your database volumes (so you don't lose your saved jobs and resumes):

```bash
docker compose --profile production stop
```

To entirely wipe the application and delete the database volumes:

```bash
docker compose --profile production down -v
```

---

## Architecture Overview

### Asynchronous AI Workflow

When a user requests a custom Cover Letter via the UI:

1. The Next.js frontend hits the `/api/matching/tailor` endpoint.
2. FastAPI validates the request and dispatches a task to the **Celery Queue** (backed by Redis).
3. FastAPI immediately returns a `task_id` to the frontend.
4. The frontend begins polling the `/api/tasks/{task_id}` endpoint every 2 seconds.
5. In the background, the **Celery Worker** extracts the Resume text from the DB, extracts the Job description, calls the **Gemini LLM**, and stores the result back in the DB.
6. The frontend's polling endpoint sees the state change to `SUCCESS` and displays the Cover Letter gracefully.
