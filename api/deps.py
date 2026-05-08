"""FastAPI 공통 의존성 — 인증."""

from __future__ import annotations

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from api.config import get_settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_api_key(api_key: str | None = Security(_api_key_header)) -> str:
    """X-API-Key 헤더를 검증한다.

    Raises:
        HTTPException 401: 헤더 누락
        HTTPException 403: 키 불일치
    """
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key 헤더가 없습니다.",
        )
    settings = get_settings()
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="유효하지 않은 API 키입니다.",
        )
    return api_key
