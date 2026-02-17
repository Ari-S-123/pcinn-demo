import numpy as np
import torch

from app.models.inference import ModelPredictor, load_model, predict


def test_load_model():
    p = load_model("artifacts/sa_pcinn_fold8_bundle.pt")
    assert p.model_name == "sa_pcinn"
    assert p.scalerx_min.shape == (5,)
    assert p.scalerx_max.shape == (5,)
    assert p.fold == 8
    assert p.is_best is True


def test_predict_single():
    p = load_model("artifacts/sa_pcinn_fold8_bundle.pt")
    result = predict(p, np.array([3.326, 6.674, 0.0246, 333.0, 7200.0]))
    assert 0.0 <= result["conversion"] <= 1.0
    assert result["mn"] > 0
    assert result["mw"] >= result["mn"]
    assert result["dispersity"] >= 1.0
    assert len(result["raw_outputs"]) == 6


def test_predict_batch():
    p = load_model("artifacts/sa_pcinn_fold8_bundle.pt")
    inputs = np.array(
        [
            [3.326, 6.674, 0.0246, 333.0, 7200.0],
            [3.326, 6.674, 0.0246, 333.0, 14400.0],
        ]
    )
    results = predict(p, inputs)
    assert len(results) == 2
    # More time should yield more conversion
    assert results[1]["conversion"] > results[0]["conversion"]


def test_predict_clips_conversion_bounds():
    p = load_model("artifacts/sa_pcinn_fold8_bundle.pt")
    result = predict(p, np.array([3.326, 6.674, 0.0246, 333.0, 0.0]))
    assert 0.0 <= result["conversion"] <= 1.0
    assert len(result["raw_outputs"]) == 6


def test_predict_clamps_dispersity_minimum():
    class FakeModel:
        def __call__(self, x):
            row = torch.tensor([0.5, 3.0, 2.0, 2.1, 2.2, 2.3], dtype=torch.float32)
            return row.repeat(x.shape[0], 1)

    p = ModelPredictor(
        model=FakeModel(),  # type: ignore[arg-type]
        scalerx_min=np.zeros(5, dtype=np.float64),
        scalerx_max=np.ones(5, dtype=np.float64),
        model_name="fake",
        fold=0,
        final_test_loss=0.0,
        is_best=False,
    )
    result = predict(p, np.array([0.2, 0.3, 0.4, 0.5, 0.6]))
    assert result["dispersity"] == 1.0
