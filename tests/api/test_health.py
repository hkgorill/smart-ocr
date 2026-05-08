"""헬스체크 엔드포인트 테스트."""

import pytest


@pytest.mark.api
def test_health_returns_ok(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.api
def test_health_contains_version(client):
    resp = client.get("/api/v1/health")
    assert "version" in resp.json()


@pytest.mark.api
def test_health_no_auth_required(client):
    """헬스체크는 인증 없이도 접근 가능해야 한다."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
