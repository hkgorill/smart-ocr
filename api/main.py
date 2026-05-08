"""FastAPI 애플리케이션 진입점."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from api.routers.health import router as health_router
from api.routers.ocr import router as ocr_router, task_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="SmartOCR API",
    description="사진·영상 기반 문자인식 REST API",
    version="1.0.0",
    lifespan=lifespan,
)

# 라우터 등록
app.include_router(health_router)
app.include_router(ocr_router)
app.include_router(task_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 내부 오류가 발생했습니다."},
    )
