from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8000
    allowed_origins: str = "http://localhost:3000"
    artifacts_dir: str = "artifacts"

    model_config = {"env_file": ".env"}


settings = Settings()
