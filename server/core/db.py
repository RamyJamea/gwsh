from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import get_settings

SETTINGS = get_settings()
ENGINE = create_engine(
    SETTINGS.SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)


def get_db():
    db = SESSION()
    try:
        yield db
    finally:
        db.close()
