from fastapi import Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ...services import AuthenticationService, UserService
from ...services import BranchService, TableService
from ...services import CategoryService, ProductService, SizeService, ExtraService
from ...services import MenuService


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def get_auth_service(
    user_service: UserService = Depends(get_user_service),
) -> AuthenticationService:
    return AuthenticationService(user_service)


def get_branch_service(db: Session = Depends(get_db)) -> BranchService:
    return BranchService(db)


def get_table_service(db: Session = Depends(get_db)) -> TableService:
    return TableService(db)


def get_category_service(db: Session = Depends(get_db)) -> CategoryService:
    return CategoryService(db)


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)


def get_size_service(db: Session = Depends(get_db)) -> SizeService:
    return SizeService(db)


def get_extra_service(db: Session = Depends(get_db)) -> ExtraService:
    return ExtraService(db)


def get_menu_service(db: Session = Depends(get_db)) -> MenuService:
    return MenuService(db)
