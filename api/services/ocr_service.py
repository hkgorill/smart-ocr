"""OCR 서비스 — 파이프라인 싱글턴 관리 및 파일 검증."""

from __future__ import annotations

from functools import cache

from fastapi import HTTPException, UploadFile, status

from api.config import get_settings
from core.pipeline import OCRPipeline


@cache
def _build_pipeline(lang: str, engine_type: str) -> OCRPipeline:
    """언어·엔진별 파이프라인을 한 번만 생성 (모델 로딩 비용 최소화)."""
    return OCRPipeline(lang=lang, engine_type=engine_type)


def get_pipeline(engine: str | None = None) -> OCRPipeline:
    """FastAPI 의존성 — 테스트에서 dependency_overrides 로 교체.

    engine: 요청별 엔진 override ("easyocr" | "paddle"). None 이면 설정값 사용.
    """
    settings = get_settings()
    engine_type = engine if engine in ("easyocr", "paddle") else settings.ocr_engine
    return _build_pipeline(settings.ocr_lang, engine_type)


async def validate_image(file: UploadFile) -> bytes:
    """파일 타입·크기를 검증하고 바이트를 반환.

    Raises:
        HTTPException 422: 허용되지 않는 파일 타입
        HTTPException 413: 파일 크기 초과
    """
    settings = get_settings()
    max_bytes = settings.max_file_size_mb * 1024 * 1024

    content_type = file.content_type or ""
    if content_type not in settings.allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"지원하지 않는 파일 형식입니다: {content_type}. "
                   f"허용: {settings.allowed_content_types}",
        )

    data = await file.read()
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"파일 크기가 {settings.max_file_size_mb}MB를 초과합니다.",
        )
    return data
