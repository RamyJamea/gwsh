from fastapi import Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ...services import AuthenticationService, UserService


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def get_auth_service(
    user_service: UserService = Depends(get_user_service),
) -> AuthenticationService:
    return AuthenticationService(user_service)
