import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] == 3
    assert "sa_pcinn" in data["available_models"]
    assert data["default_model"] == "sa_pcinn"


@pytest.mark.asyncio
async def test_ready(client):
    r = await client.get("/api/v1/health/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ready"
