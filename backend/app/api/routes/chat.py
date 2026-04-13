from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.llm_stream import stream_llm_response

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_llm_response(request.prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
