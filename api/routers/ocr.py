"""OCR 엔드포인트 — 단건 동기, 배치 비동기, WebSocket 스트림."""

from __future__ import annotations

import asyncio
import threading
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from io import BytesIO

import numpy as np
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from PIL import Image

from api.deps import require_api_key
from api.schemas.ocr import BatchSubmitResponse, OCRBlock, OCRResponse, TaskStatusResponse
from api.services.ocr_service import get_pipeline, validate_image
from api.tasks.store import task_store
from core.pipeline import OCRPipeline

router = APIRouter(prefix="/api/v1/ocr", tags=["ocr"])
task_router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


# ── 인메모리 Rate Limiter (클로저 의존성 방식) ────────────────

def _make_rate_limiter(calls: int, period_seconds: int):
    """슬라이딩 윈도우 Rate Limiter를 FastAPI 의존성으로 반환."""
    history: dict[str, list[datetime]] = defaultdict(list)
    lock = threading.Lock()
    period = timedelta(seconds=period_seconds)

    def _limit(request: Request) -> None:
        ip = request.client.host if request.client else "unknown"
        now = datetime.now()
        cutoff = now - period
        with lock:
            history[ip] = [t for t in history[ip] if t > cutoff]
            if len(history[ip]) >= calls:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="요청 횟수 한도를 초과했습니다. 잠시 후 다시 시도하세요.",
                )
            history[ip].append(now)

    return _limit


_image_rate_limit = _make_rate_limiter(calls=60, period_seconds=60)
_batch_rate_limit = _make_rate_limiter(calls=20, period_seconds=60)


# ── 유틸리티 ──────────────────────────────────────────────────

def _blocks_to_schema(blocks: list[dict]) -> list[OCRBlock]:
    return [OCRBlock(**b) for b in blocks]


# ── 단건 동기 OCR ──────────────────────────────────────────────

@router.post("/image", response_model=OCRResponse)
async def ocr_image(
    file: UploadFile = File(...),
    pipeline: OCRPipeline = Depends(get_pipeline),
    _key: str = Depends(require_api_key),
    _rate: None = Depends(_image_rate_limit),
) -> OCRResponse:
    """이미지 파일을 업로드해 OCR 결과를 즉시 반환."""
    data = await validate_image(file)
    img = Image.open(BytesIO(data)).convert("RGB")
    blocks = pipeline.run(np.array(img))
    plain = "\n".join(b["text"] for b in blocks)

    return OCRResponse(
        task_id=str(uuid.uuid4()),
        status="done",
        result=_blocks_to_schema(blocks),
        plain_text=plain,
    )


# ── 배치 비동기 OCR ────────────────────────────────────────────

def _run_batch_task(task_id: str, images_data: list[bytes]) -> None:
    """BackgroundTask로 실행되는 배치 처리 함수."""
    task_store.update(task_id, status="processing")
    try:
        pipeline = get_pipeline()
        all_results: list[list[dict]] = []
        for data in images_data:
            img = Image.open(BytesIO(data)).convert("RGB")
            all_results.append(pipeline.run(np.array(img)))
        task_store.update(task_id, status="done", result=all_results)
    except Exception as exc:
        task_store.update(task_id, status="failed", error=str(exc))


@router.post("/batch", response_model=BatchSubmitResponse)
async def ocr_batch(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    _key: str = Depends(require_api_key),
    _rate: None = Depends(_batch_rate_limit),
) -> BatchSubmitResponse:
    """복수 이미지를 비동기로 처리. task_id로 결과를 폴링."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="파일이 없습니다.",
        )

    images_data: list[bytes] = []
    for f in files:
        images_data.append(await validate_image(f))

    task = task_store.create()
    background_tasks.add_task(_run_batch_task, task.id, images_data)

    return BatchSubmitResponse(task_id=task.id)


# ── 태스크 상태 조회 ───────────────────────────────────────────

@task_router.get("/{task_id}", response_model=TaskStatusResponse)
def get_task(
    task_id: str,
    _key: str = Depends(require_api_key),
) -> TaskStatusResponse:
    """배치 작업의 진행 상태와 결과를 반환."""
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 task_id입니다.",
        )

    result_schema = None
    if task.result is not None:
        result_schema = [_blocks_to_schema(blocks) for blocks in task.result]

    return TaskStatusResponse(
        task_id=task.id,
        status=task.status,
        created_at=task.created_at,
        result=result_schema,
        error=task.error,
    )


# ── WebSocket 실시간 스트림 OCR ────────────────────────────────

@router.websocket("/stream")
async def ocr_stream(websocket: WebSocket) -> None:
    """카메라 프레임(JPEG 바이너리)을 수신해 OCR 결과를 실시간 반환.

    연결 시 쿼리 파라미터로 API 키 전달: ws://.../stream?api_key=<key>
    """
    from api.config import get_settings
    settings = get_settings()
    api_key = websocket.query_params.get("api_key", "")
    if api_key != settings.api_key:
        await websocket.close(code=4001, reason="Invalid API key")
        return

    await websocket.accept()
    pipeline = get_pipeline()

    try:
        while True:
            data = await websocket.receive_bytes()
            if not data:
                continue
            try:
                img = Image.open(BytesIO(data)).convert("RGB")
                blocks = await asyncio.get_event_loop().run_in_executor(
                    None, pipeline.run, np.array(img)
                )
                await websocket.send_json({
                    "status": "ok",
                    "result": blocks,
                    "plain_text": "\n".join(b["text"] for b in blocks),
                })
            except Exception as exc:
                await websocket.send_json({"status": "error", "detail": str(exc)})

    except WebSocketDisconnect:
        pass
