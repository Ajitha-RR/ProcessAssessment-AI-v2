from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from .config import settings

# Use the async-aware URL (handles postgres:// -> postgresql+asyncpg:// conversion)
db_url = settings.async_database_url
is_sqlite = "sqlite" in db_url

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    # PostgreSQL connection pool settings for production
    **({} if is_sqlite else {"pool_size": 5, "max_overflow": 10})
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def init_db():
    async with engine.begin() as conn:
        # For production use Alembic. Since this is for initial deployment:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
