import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SQLALCHEMY_DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    BACKUP_SENDER_EMAIL: str = ""
    BACKUP_SENDER_PASSWORD: str = ""
    BACKUP_RECIPIENT_EMAIL: str = ""
    BACKUP_TIME_HOUR: int = 3
    BACKUP_TIME_MINUTE: int = 0

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
