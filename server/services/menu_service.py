from sqlalchemy.orm import Session
from ..core.schemas.menu_schema import MenuItemCreate, MenuItemUpdate
from ..repositories import MenuItemRepository, MenuItemExtraRepository
from ..repositories import BranchRepository
from ..repositories import ProductRepository, SizeRepository, ExtraRepository
from .base_service import BaseService
from ..models import MenuItem


class MenuService(BaseService[MenuItem, MenuItemCreate, MenuItemUpdate]):
    def __init__(self, session: Session):
        super().__init__(session, MenuItemRepository(session))
        self.branch_repo = BranchRepository(session)
        self.product_repo = ProductRepository(session)
        self.size_repo = SizeRepository(session)
        self.extra_repo = ExtraRepository(session)
        self.menu_extra_repo = MenuItemExtraRepository(session)

    def create(self, data: MenuItemCreate) -> MenuItem:
        if not self.branch_repo.get_by_id(data.branch_id):
            raise ValueError("Branch not found")
        if not self.product_repo.get_by_id(data.product_id):
            raise ValueError("Product not found")
        if not self.size_repo.get_by_id(data.size_id):
            raise ValueError("Size not found")

        if self.repo.get_by_branch_product_size(
            data.branch_id, data.product_id, data.size_id
        ):
            raise ValueError("Menu item with this branch/product/size already exists")

        if data.extras:
            extra_ids = {extra.extra_id for extra in data.extras}
            valid_extras = self.extra_repo.get_by_ids(list(extra_ids))
            if len(valid_extras) != len(extra_ids):
                raise ValueError("One or more extras provided do not exist")

        menu_item = self.repo.create(
            {
                "branch_id": data.branch_id,
                "product_id": data.product_id,
                "size_id": data.size_id,
                "price": data.price,
            }
        )

        if data.extras:
            extras_data = [
                {
                    "menu_item_id": menu_item.id,
                    "extra_id": extra.extra_id,
                    "price": extra.price,
                }
                for extra in data.extras
            ]
            self.menu_extra_repo.create_bulk(extras_data)

        self.session.commit()

        return menu_item

    def update(self, menu_item_id: int, data: MenuItemUpdate) -> MenuItem:
        obj = self.get(menu_item_id)
        self.repo.update(obj, data.model_dump(exclude_unset=True))
        self.session.commit()
        return obj
