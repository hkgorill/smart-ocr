"""API 테스트 공통 fixture."""

from __future__ import annotations

import io
from unittest.mock import MagicMock

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from api.config import Settings, get_settings
from api.main import app
from api.services.ocr_service import get_pipeline
from api.tasks.store import task_store

TEST_API_KEY = "test-api-key-12345"
AUTH_HEADERS = {"X-API-Key": TEST_API_KEY}

_SAMPLE_BLOCK = {
    "text": "테스트 문자",
    "confidence": 0.99,
    "bbox": [[0, 0], [100, 0], [100, 30], [0, 30]],
}


def _make_test_settings() -> Settings:
    return Settings(api_key=TEST_API_KEY)


def _make_mock_pipeline(blocks: list[dict] | None = None) -> MagicMock:
    blocks = blocks if blocks is not None else [_SAMPLE_BLOCK]
    mock = MagicMock()
    mock.run.return_value = blocks
    return mock


def _make_jpeg_bytes(text: str = "TEST", size: tuple[int, int] = (200, 80)) -> bytes:
    """테스트용 JPEG 이미지 바이트 생성."""
    img = Image.new("RGB", size, color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(autouse=True)
def override_settings(monkeypatch):
    """모든 API 테스트에서 테스트용 설정을 사용."""
    get_settings.cache_clear()
    monkeypatch.setenv("SMARTOCR_API_KEY", TEST_API_KEY)
    yield
    get_settings.cache_clear()


@pytest.fixture
def mock_pipeline():
    return _make_mock_pipeline()


@pytest.fixture
def client(mock_pipeline):
    """OCR 파이프라인이 Mock으로 교체된 TestClient."""
    task_store.clear()
    app.dependency_overrides[get_pipeline] = lambda: mock_pipeline
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def jpeg_bytes():
    return _make_jpeg_bytes()


@pytest.fixture
def jpeg_file(jpeg_bytes):
    """multipart 업로드용 파일 dict — files=jpeg_file 형식으로 사용."""
    return {"file": ("test.jpg", jpeg_bytes, "image/jpeg")}


@pytest.fixture
def empty_pipeline():
    """인식 결과가 없는 Mock 파이프라인."""
    return _make_mock_pipeline(blocks=[])
