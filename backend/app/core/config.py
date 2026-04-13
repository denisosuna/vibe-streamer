from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Vibe Streamer API"
    cors_origins: list[str] = ["http://localhost:3000"]
    llm_delay: float = 0.1

    llm_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_system_prompt: str = "Respond in the same language the user writes in."

    @property
    def use_llm(self) -> bool:
        return bool(self.llm_api_key)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
