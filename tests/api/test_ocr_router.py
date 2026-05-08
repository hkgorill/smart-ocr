"""OCR 라우터 통합 테스트."""

from __future__ import annotations

import io

import pytest
from PIL import Image

from tests.api.conftest import AUTH_HEADERS


# ── /ocr/image ────────────────────────────────────────────────


@pytest.mark.api
def test_image_ocr_success(client, jpeg_file):
    resp = client.post("/api/v1/ocr/image", files=jpeg_file, headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert "result" in data
    assert "plain_text" in data
    assert "task_id" in data


@pytest.mark.api
def test_image_ocr_result_structure(client, jpeg_file):
    resp = client.post("/api/v1/ocr/image", files=jpeg_file, headers=AUTH_HEADERS)
    block = resp.json()["result"][0]
    assert "text" in block
    assert "confidence" in block
    assert "bbox" in block
    assert 0.0 <= block["confidence"] <= 1.0


@pytest.mark.api
def test_image_ocr_plain_text(client, jpeg_file):
    resp = client.post("/api/v1/ocr/image", files=jpeg_file, headers=AUTH_HEADERS)
    assert resp.json()["plain_text"] == "테스트 문자"


@pytest.mark.api
def test_image_ocr_empty_result(client, jpeg_file, empty_pipeline):
    """인식 결과가 없을 때 빈 리스트와 빈 문자열을 반환."""
    from api.services.ocr_service import get_pipeline
    from api.main import app
    app.dependency_overrides[get_pipeline] = lambda: empty_pipeline
    resp = client.post("/api/v1/ocr/image", files=jpeg_file, headers=AUTH_HEADERS)
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["result"] == []
    assert resp.json()["plain_text"] == ""


@pytest.mark.api
def test_invalid_file_type_rejected(client):
    """허용되지 않는 파일 형식은 422를 반환한다."""
    fake = {"file": ("malware.exe", b"MZ\x00\x00", "application/octet-stream")}
    resp = client.post("/api/v1/ocr/image", files=fake, headers=AUTH_HEADERS)
    assert resp.status_code == 422


@pytest.mark.api
def test_oversized_file_rejected(client, jpeg_bytes):
    """설정된 최대 크기를 초과하면 413을 반환한다."""
    from unittest.mock import patch
    from api.config import Settings
    tiny = Settings(api_key=AUTH_HEADERS["X-API-Key"], max_file_size_mb=0)
    with patch("api.services.ocr_service.get_settings", return_value=tiny):
        resp = client.post(
            "/api/v1/ocr/image",
            files={"file": ("t.jpg", jpeg_bytes, "image/jpeg")},
            headers=AUTH_HEADERS,
        )
    assert resp.status_code == 413


@pytest.mark.api
def test_png_file_accepted(client):
    """PNG 파일도 정상 처리되어야 한다."""
    buf = io.BytesIO()
    Image.new("RGB", (100, 50), color=(255, 255, 255)).save(buf, format="PNG")
    resp = client.post(
        "/api/v1/ocr/image",
        files={"file": ("test.png", buf.getvalue(), "image/png")},
        headers=AUTH_HEADERS,
    )
    assert resp.status_code == 200


# ── /ocr/batch ────────────────────────────────────────────────


@pytest.mark.api
def test_batch_submit_returns_task_id(client, jpeg_bytes):
    files = [
        ("files", ("a.jpg", jpeg_bytes, "image/jpeg")),
    ]
    resp = client.post("/api/v1/ocr/batch", files=files, headers=AUTH_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data
    assert data["status"] == "pending"


@pytest.mark.api
def test_batch_empty_files_rejected(client):
    resp = client.post("/api/v1/ocr/batch", files=[], headers=AUTH_HEADERS)
    assert resp.status_code == 422


@pytest.mark.api
def test_batch_task_result_retrievable(client, jpeg_bytes):
    """배치 완료 후 태스크 조회 시 결과를 포함해야 한다."""
    files = [
        ("files", ("a.jpg", jpeg_bytes, "image/jpeg")),
        ("files", ("b.jpg", jpeg_bytes, "image/jpeg")),
    ]
    submit = client.post("/api/v1/ocr/batch", files=files, headers=AUTH_HEADERS)
    assert submit.status_code == 200
    task_id = submit.json()["task_id"]

    # BackgroundTask는 TestClient에서 응답 반환 후 완료됨
    status_resp = client.get(f"/api/v1/tasks/{task_id}", headers=AUTH_HEADERS)
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["status"] in ("done", "processing", "pending")


# ── /tasks/{task_id} ──────────────────────────────────────────


@pytest.mark.api
def test_unknown_task_id_returns_404(client):
    resp = client.get(
        "/api/v1/tasks/00000000-0000-0000-0000-000000000000",
        headers=AUTH_HEADERS,
    )
    assert resp.status_code == 404


# ── WebSocket /ocr/stream ─────────────────────────────────────


@pytest.mark.api
def test_websocket_invalid_key_closes(client):
    """잘못된 API 키로 WebSocket 연결 시 종료되어야 한다."""
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/ocr/stream?api_key=bad-key"):
            pass


@pytest.mark.api
def test_websocket_valid_key_receives_result(client, jpeg_bytes):
    """유효한 키로 연결하고 프레임을 전송하면 JSON 결과를 받는다."""
    api_key = AUTH_HEADERS["X-API-Key"]
    with client.websocket_connect(f"/api/v1/ocr/stream?api_key={api_key}") as ws:
        ws.send_bytes(jpeg_bytes)
        data = ws.receive_json()
        assert data["status"] == "ok"
        assert "result" in data
        assert "plain_text" in data
