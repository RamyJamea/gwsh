from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from .app_config import get_settings

SETTINGS = get_settings()

ASYNC_ENGINE = create_async_engine(
    SETTINGS.SQLALCHEMY_DATABASE_URL,
    echo=False,
    future=True,
)

ASYNC_SESSION = async_sessionmaker(
    bind=ASYNC_ENGINE,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with ASYNC_SESSION() as db:
        yield db
