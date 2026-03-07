import logging
from google import genai
from google.genai import types
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini Client
try:
    if settings.GEMINI_API_KEY:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    else:
        logger.warning("GEMINI_API_KEY not found in settings.")
        client = None
except Exception as e:
    logger.warning(f"Failed to initialize Gemini client: {e}")
    client = None

async def generate_embedding(text: str) -> list[float]:
    """Generates an embedding vector using Gemini's text-embedding-004 model."""
    if not client:
        raise ValueError("Gemini client not configured. Missing API key.")
        
    try:
        # gemini-embedding-001 defaults to 3072, so we restrict it to 768 to match pgvector
        response = await client.aio.models.embed_content(
            model="models/gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        # response.embeddings might be a list of embeddings. We take the first.
        return response.embeddings[0].values
    except Exception as e:
        logger.error(f"Failed to generate embedding: {str(e)}")
        raise e
