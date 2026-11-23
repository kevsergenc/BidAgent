from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """BidAgent application settings."""

    model_config = SettingsConfigDict(
    env_prefix="BIDAGENT_",
    case_sensitive=False,
    extra="ignore",
    env_file=".env",
    env_file_encoding="utf-8",
)

    app_name: str = "BidAgent API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

      
    ollama_base_url: str = "http://localhost:11434"
    chat_model: str = "qwen2.5:1.5b"
    chat_temperature: float = 0.0

    
    rag_top_k: int = 5

    database_url: str | None = None

    jwt_secret: str | None = None
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()


