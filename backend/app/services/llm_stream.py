import asyncio
import json
import logging
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI, OpenAIError

from app.core.config import LLM_SYSTEM_PROMPT, settings

logger = logging.getLogger(__name__)

MOCK_RESPONSE_TEMPLATE = (
    "Hello! You asked: '{prompt}'. This is a simulated streaming response "
    "to demonstrate how FastAPI integrates with Next.js word by word. "
    "Each word arrives individually over the wire, creating a real-time "
    "experience similar to what you would see with a large language model "
    "like GPT or Claude generating tokens on the fly."
)


async def stream_llm_response(prompt: str) -> AsyncGenerator[str, None]:
    """Async generator that yields SSE-formatted tokens.

    Uses a real LLM provider when LLM_API_KEY is set, otherwise falls back to mock.
    Supports any OpenAI-compatible API (OpenAI, Groq, Together, etc.) via LLM_BASE_URL.
    """
    if settings.use_llm:
        try:
            async for chunk in _stream_llm(prompt):
                yield chunk
        except OpenAIError as e:
            logger.error("LLM provider error: %s", e)
            yield f"data: {json.dumps(f'[ERROR] {e.message}')}\n\n"
    else:
        async for chunk in _stream_mock(prompt):
            yield chunk

    yield "data: [DONE]\n\n"


async def _stream_llm(prompt: str) -> AsyncGenerator[str, None]:
    client = AsyncOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )

    stream = await client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": LLM_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield f"data: {json.dumps(delta)}\n\n"


async def _stream_mock(prompt: str) -> AsyncGenerator[str, None]:
    response_text = MOCK_RESPONSE_TEMPLATE.format(prompt=prompt)

    for word in response_text.split():
        yield f"data: {json.dumps(word + ' ')}\n\n"
        await asyncio.sleep(settings.llm_delay)
