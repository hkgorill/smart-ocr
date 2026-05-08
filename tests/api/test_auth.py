"""인증 미들웨어 테스트 — 401/403 시나리오."""

import pytest

from tests.api.conftest import AUTH_HEADERS, TEST_API_KEY


@pytest.mark.api
def test_missing_api_key_returns_401(client, jpeg_file):
    resp = client.post("/api/v1/ocr/image", files=jpeg_file)
    assert resp.status_code == 401


@pytest.mark.api
def test_wrong_api_key_returns_403(client, jpeg_file):
    resp = client.post(
        "/api/v1/ocr/image",
        files=jpeg_file,
        headers={"X-API-Key": "wrong-key"},
    )
    assert resp.status_code == 403


@pytest.mark.api
def test_valid_api_key_allows_access(client, jpeg_file):
    resp = client.post(
        "/api/v1/ocr/image",
        files=jpeg_file,
        headers=AUTH_HEADERS,
    )
    assert resp.status_code == 200


@pytest.mark.api
def test_task_endpoint_requires_auth(client):
    resp = client.get("/api/v1/tasks/nonexistent-id")
    assert resp.status_code == 401


@pytest.mark.api
def test_batch_endpoint_requires_auth(client, jpeg_file):
    # 배치는 "files" 키로 전송
    batch_file = {"files": jpeg_file["file"]}
    resp = client.post("/api/v1/ocr/batch", files=batch_file)
    assert resp.status_code == 401
