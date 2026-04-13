from pydantic import BaseModel, field_validator


class ChatRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def prompt_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Prompt must not be empty or whitespace-only")
        return stripped
