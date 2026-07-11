from .routes.management import extra_management_router, user_management_router, size_management_router
from .routes.authentication import auth_router
from .routes.branch_router import router as branch_router
from .routes.category_router import router as category_router
from .routes.product_router import router as product_router
from .routes.size_router import router as size_router
from .routes.extra_router import router as extra_router
from .routes.menu_router import router as menu_router
from .routes.table_router import router as table_router
from .routes.order_router import router as order_router
from .routes.history_router import router as history_router
from .routes.upload_router import router as upload_router
from fastapi.staticfiles import StaticFiles
import os
from .models import *
from .helpers.config import ASYNC_ENGINE
from .helpers.enums import RoleEnum
from .helpers.security import hash_password
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text


async def seed_default_access(session: AsyncSession) -> None:
    result = await session.execute(
        select(BranchModel).where(BranchModel.name == "Branch 1")
    )
    branch = result.scalar_one_or_none()
    if not branch:
        branch = BranchModel(name="Branch 1", is_active=True)
        session.add(branch)
        await session.flush()

    result = await session.execute(
        select(TableModel).where(TableModel.branch_id == branch.id)
    )
    if not result.scalars().first():
        session.add_all(
            TableModel(branch_id=branch.id, num_chairs=4, is_available=True)
            for _ in range(5)
        )

    for category_name in ["Desserts", "Hot Drinks", "Cold Drinks"]:
        result = await session.execute(
            select(CategoryModel).where(CategoryModel.name == category_name)
        )
        if not result.scalar_one_or_none():
            session.add(CategoryModel(name=category_name))

    result = await session.execute(select(SizeModel).where(SizeModel.name == "Regular"))
    if not result.scalar_one_or_none():
        session.add(SizeModel(name="Regular"))

    default_users = [
        {
            "username": "admin",
            "email": "admin@nancysgun.com",
            "role": RoleEnum.ADMIN,
            "password": "36951Admin@",
            "branch_id": None,
        },
        {
            "username": "cashier_1",
            "email": "cashier1@nancysgun.com",
            "role": RoleEnum.CASHIER,
            "password": "password123",
            "branch_id": branch.id,
        },
    ]

    for user_data in default_users:
        result = await session.execute(
            select(UserModel).where(UserModel.username == user_data["username"])
        )
        user = result.scalar_one_or_none()
        if user:
            user.email = user_data["email"]
            user.role = user_data["role"]
            user.branch_id = user_data["branch_id"]
            user.is_active = True
            user.deleted_at = None
            continue

        session.add(
            UserModel(
                username=user_data["username"],
                email=user_data["email"],
                role=user_data["role"],
                hashed_password=hash_password(user_data["password"]),
                is_active=True,
                branch_id=user_data["branch_id"],
            )
        )

    await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with ASYNC_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if ASYNC_ENGINE.url.get_backend_name().startswith("sqlite"):
            columns = await conn.execute(text("PRAGMA table_info(orders)"))
            existing_columns = {row[1] for row in columns}
            if "destination" not in existing_columns:
                await conn.execute(text("ALTER TABLE orders ADD COLUMN destination VARCHAR(50)"))

    async with AsyncSession(ASYNC_ENGINE) as session:
        await seed_default_access(session)

    yield
    await ASYNC_ENGINE.dispose()


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NancysGun",
    description="A robust API for managing cashiers, inventory, and sales orders.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        path = request.url.path
        if not path.startswith("/api") and not path.startswith("/uploads"):
            if not path.startswith("/assets/") and not any(path.endswith(ext) for ext in [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"]):
                if os.path.exists("gui/index.html"):
                    return FileResponse("gui/index.html")
    return await http_exception_handler(request, exc)


@app.get("/api/health", tags=["Root"])
def root_check():
    return {
        "status": "online",
        "message": "Welcome to the Point of Sale API. Visit /docs for the Swagger UI.",
    }


app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_management_router, prefix="/api/v1")
app.include_router(size_management_router, prefix="/api/v1")
app.include_router(extra_management_router, prefix="/api/v1")
app.include_router(branch_router, prefix="/api/v1")
app.include_router(category_router, prefix="/api/v1")
app.include_router(product_router, prefix="/api/v1")
app.include_router(size_router, prefix="/api/v1")
app.include_router(extra_router, prefix="/api/v1")
app.include_router(menu_router, prefix="/api/v1")
app.include_router(table_router, prefix="/api/v1")
app.include_router(order_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")

# Mount upload directory (must be after API routes)
os.makedirs("gui/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="gui/uploads"), name="uploads")

# Mount SPA last so it catches all unmatched routes (only if built)
if os.path.exists("gui") and os.path.exists("gui/index.html"):
    app.mount("/", StaticFiles(directory="gui", html=True), name="spa")


if __name__ == "__main__":
    import uvicorn
    import sys

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("NancysGun POS API - Starting...")
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
