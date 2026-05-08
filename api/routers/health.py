"""헬스체크 엔드포인트."""

from fastapi import APIRouter

from api.schemas.ocr import HealthResponse

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")
