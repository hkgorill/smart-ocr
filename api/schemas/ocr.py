"""OCR API 요청·응답 Pydantic 모델."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    points: list[list[int]] = Field(
        description="4개 꼭짓점 좌표 [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]"
    )


class OCRBlock(BaseModel):
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: list[list[int]]


class OCRResponse(BaseModel):
    task_id: str
    status: Literal["done", "failed"]
    result: list[OCRBlock]
    plain_text: str


class BatchSubmitResponse(BaseModel):
    task_id: str
    status: Literal["pending"] = "pending"
    message: str = "배치 작업이 접수되었습니다."


class TaskStatusResponse(BaseModel):
    task_id: str
    status: Literal["pending", "processing", "done", "failed"]
    created_at: datetime
    result: list[list[OCRBlock]] | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    version: str = "1.0.0"
    ocr_engine: str = "PaddleOCR PP-OCRv4"
