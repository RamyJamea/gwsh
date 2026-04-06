from fastapi import Depends
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...repositories import UserRepository


def get_user_repository(db: Session = Depends(get_db)):
    return UserRepository(db)
