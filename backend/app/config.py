from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ProcessAssessmentAI"
    # For production (Render), set DATABASE_URL env var to the PostgreSQL connection string.
    # For local dev, defaults to SQLite.
    DATABASE_URL: str = "sqlite+aiosqlite:///./processassessmentai.db"
    OPENAI_API_KEY: str = ""
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    class Config:
        env_file = ".env"

    @property
    def async_database_url(self) -> str:
        """Convert DATABASE_URL to async-compatible format."""
        url = self.DATABASE_URL
        # Render provides postgres:// but SQLAlchemy needs postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

settings = Settings()
