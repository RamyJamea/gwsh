from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from .app_config import get_settings

SETTINGS = get_settings()
ENGINE = create_engine(
    SETTINGS.SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in SETTINGS.SQLALCHEMY_DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)


def get_db():
    db = SESSION()
    try:
        yield db
    finally:
        db.close()
