"""애플리케이션 설정 — 환경변수 또는 .env 파일에서 로드."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SMARTOCR_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    api_key: str = "dev-secret-key"
    rate_limit: str = "60/minute"       # slowapi 형식
    ocr_lang: str = "ko"
    max_file_size_mb: int = 10
    allowed_content_types: list[str] = ["image/jpeg", "image/png", "image/webp"]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
