import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.inference import load_all_models

DEFAULT_MODEL = "sa_pcinn"


@pytest.fixture(scope="session", autouse=True)
def _load_models():
    """Load models into app state once for all tests."""
    app.state.predictors = load_all_models()
    app.state.default_model = DEFAULT_MODEL
    yield
    del app.state.predictors


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
