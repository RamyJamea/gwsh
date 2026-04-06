from .db import SESSION
from .enums import RoleEnum
from .schemas import UserCreate, BranchCreate
from ..repositories import UserRepository
from ..services.user_service import UserService
from ..services.branch_service import BranchService


def seed_admin_user():
    db = SESSION()
    try:
        branch_service = BranchService(db)

        branch = db.query(branch_service.repo.model).first()
        if not branch:
            branch = branch_service.create(BranchCreate(name="Main Branch"))

        user_repo = UserRepository(db)
        user_service = UserService(db)

        admin_exists = (
            db.query(user_repo.model)
            .filter(user_repo.model.role == RoleEnum.ADMIN)
            .first()
        )

        if not admin_exists:
            admin_in = UserCreate(
                username="admin",
                full_name="System Administrator",
                role=RoleEnum.ADMIN,
                password="admin36951",
                branch_id=branch.id,
            )
            user_service.create(admin_in)
            print("Default admin created")
    finally:
        db.close()
