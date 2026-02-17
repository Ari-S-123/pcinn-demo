import pytest
from pydantic import ValidationError

from app.schemas.prediction import PredictionResponse

VALID_INPUT = {
    "m_molar": 3.326,
    "s_molar": 6.674,
    "i_molar": 0.0246,
    "temperature_k": 333.0,
    "time_s": 7200.0,
}


@pytest.mark.asyncio
async def test_predict_valid(client):
    r = await client.post("/api/v1/predict", json=VALID_INPUT)
    assert r.status_code == 200
    data = r.json()
    assert "conversion" in data
    assert "mn" in data
    assert "mw" in data
    assert "dispersity" in data
    assert "raw_outputs" in data
    assert len(data["raw_outputs"]) == 6
    assert 0.0 <= data["conversion"] <= 1.0
    assert data["dispersity"] >= 1.0


@pytest.mark.asyncio
async def test_predict_with_model_param(client):
    r = await client.post("/api/v1/predict?model=baseline_nn", json=VALID_INPUT)
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_predict_invalid_bounds(client):
    invalid = {**VALID_INPUT, "m_molar": 0.1}
    r = await client.post("/api/v1/predict", json=invalid)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_predict_invalid_model(client):
    r = await client.post("/api/v1/predict?model=nonexistent", json=VALID_INPUT)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_predict_batch(client):
    r = await client.post(
        "/api/v1/predict/batch",
        json={"inputs": [VALID_INPUT, {**VALID_INPUT, "time_s": 14400.0}]},
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["predictions"]) == 2
    assert all(0.0 <= p["conversion"] <= 1.0 for p in data["predictions"])
    assert all(p["dispersity"] >= 1.0 for p in data["predictions"])


@pytest.mark.asyncio
async def test_predict_timeseries(client):
    r = await client.post(
        "/api/v1/predict/timeseries",
        json={
            "m_molar": 3.326,
            "s_molar": 6.674,
            "i_molar": 0.0246,
            "temperature_k": 333.0,
            "time_start_s": 100,
            "time_end_s": 18000,
            "time_steps": 50,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["times"]) == 50
    assert len(data["conversion"]) == 50
    assert len(data["mw"]) == 50
    assert all(0.0 <= c <= 1.0 for c in data["conversion"])
    assert all(d >= 1.0 for d in data["dispersity"])


@pytest.mark.asyncio
async def test_predict_compare(client):
    r = await client.post(
        "/api/v1/predict/compare",
        json={
            "m_molar": 3.326,
            "s_molar": 6.674,
            "i_molar": 0.0246,
            "temperature_k": 333.0,
            "time_start_s": 100,
            "time_end_s": 18000,
            "time_steps": 20,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "baseline_nn" in data
    assert "pcinn" in data
    assert "sa_pcinn" in data
    assert len(data["times"]) == 20
    for model_name in ("baseline_nn", "pcinn", "sa_pcinn"):
        assert all(0.0 <= c <= 1.0 for c in data[model_name]["conversion"])
        assert all(d >= 1.0 for d in data[model_name]["dispersity"])


@pytest.mark.asyncio
async def test_list_models(client):
    r = await client.get("/api/v1/models")
    assert r.status_code == 200
    data = r.json()
    assert len(data["models"]) == 3
    names = {m["name"] for m in data["models"]}
    assert names == {"baseline_nn", "pcinn", "sa_pcinn"}


@pytest.mark.asyncio
async def test_model_info(client):
    r = await client.get("/api/v1/model/info")
    assert r.status_code == 200
    data = r.json()
    assert data["model_name"] == "sa_pcinn"
    assert "scaler_ranges" in data
    assert "served_output_constraints" in data


def test_prediction_response_rejects_dispersity_below_one():
    with pytest.raises(ValidationError):
        PredictionResponse(
            conversion=0.42,
            mn=1000.0,
            mw=900.0,
            mz=1100.0,
            mz_plus_1=1200.0,
            mv=1050.0,
            dispersity=0.9,
            raw_outputs=[0.42, 3.0, 2.95, 3.04, 3.08, 3.02],
        )
