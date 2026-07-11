import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.helpers.config import ASYNC_ENGINE
from server.helpers.security import hash_password
from server.helpers.enums import RoleEnum
from server.models import (
    Base, BranchModel, TableModel, UserModel, CategoryModel,
    ProductModel, SizeModel, ExtraModel, MenuItemModel, MenuItemExtraModel
)

async def seed_data():
    async with AsyncSession(ASYNC_ENGINE) as session:
        # Check if already seeded
        result = await session.execute(select(BranchModel))
        if result.scalars().first():
            print("Database already contains branch data. Skipping seeding.")
            return

        print("Seeding database...")

        # 1. Create Branches
        b1 = BranchModel(name="Branch 1")
        b2 = BranchModel(name="Branch 2")
        session.add_all([b1, b2])
        await session.flush()

        # 2. Create Tables
        tables = []
        for i in range(1, 6):
            tables.append(TableModel(branch_id=b1.id, num_chairs=4, is_available=True))
            tables.append(TableModel(branch_id=b2.id, num_chairs=4, is_available=True))
        session.add_all(tables)

        # 3. Create Cashiers
        cashier1 = UserModel(
            username="cashier_1",
            email="cashier1@nancysgun.com",
            role=RoleEnum.CASHIER,
            hashed_password=hash_password("password123"),
            branch_id=b1.id,
            is_active=True
        )
        cashier2 = UserModel(
            username="cashier_2",
            email="cashier2@nancysgun.com",
            role=RoleEnum.CASHIER,
            hashed_password=hash_password("password123"),
            branch_id=b2.id,
            is_active=True
        )
        session.add_all([cashier1, cashier2])

        # 4. Create Categories
        categories = {
            "Desserts": CategoryModel(name="Desserts"),
            "Hot Drinks": CategoryModel(name="Hot Drinks"),
            "Cold Drinks": CategoryModel(name="Cold Drinks"),
            "Milkshakes": CategoryModel(name="Milkshakes")
        }
        session.add_all(categories.values())
        await session.flush()

        # 5. Create Extras
        extra_ice_cream = ExtraModel(name="Add Ice Cream", price=50.0)
        extra_cream = ExtraModel(name="Add Cream (Ashta)", price=60.0)
        session.add_all([extra_ice_cream, extra_cream])
        await session.flush()

        # 6. Helper lists of products and their prices
        menu_setup = [
            # Desserts
            ("Desserts", "Palestinian Kunafa (Soft)", True, {
                "Small": (220.0, 240.0, 260.0),
                "Large": (320.0, 340.0, 380.0)
            }, "https://images.unsplash.com/photo-1575702156655-e72338fead46?auto=format&fit=crop&q=80&w=400"),
            ("Desserts", "Palestinian Kunafa (Crunchy)", True, {
                "Small": (220.0, 240.0, 260.0),
                "Large": (320.0, 340.0, 380.0)
            }, "https://images.unsplash.com/photo-1575702156655-e72338fead46?auto=format&fit=crop&q=80&w=400"),
            ("Desserts", "Special Abu Ghoush Tray", False, (700.0, 750.0, 840.0), 
             "https://images.unsplash.com/photo-1575702156655-e72338fead46?auto=format&fit=crop&q=80&w=400"),
            ("Desserts", "Vegan Palestinian Kunafa", True, {
                "Small": (320.0, 340.0, 380.0),
                "Large": (420.0, 450.0, 500.0)
            }, "https://images.unsplash.com/photo-1575702156655-e72338fead46?auto=format&fit=crop&q=80&w=400"),

            # Hot Drinks
            ("Hot Drinks", "Karak Tea", False, (80.0, 90.0, 100.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Herbal Tea", False, (50.0, 60.0, 65.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Mint Tea", False, (50.0, 60.0, 65.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Turkish Coffee", False, (100.0, 110.0, 120.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Coffee with Cardamom", False, (150.0, 160.0, 180.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Espresso", False, (60.0, 70.0, 75.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Americano", False, (150.0, 160.0, 180.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Cappuccino", False, (150.0, 160.0, 180.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Latte", False, (150.0, 160.0, 180.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),
            ("Hot Drinks", "Hot Chocolate", False, (150.0, 160.0, 180.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),

            # Cold Drinks
            ("Cold Drinks", "Fresh Orange Juice", True, {
                "Regular": (150.0, 160.0, 180.0),
                "Large": (200.0, 220.0, 240.0)
            }, "https://images.unsplash.com/photo-1641659735894-45046caad624?auto=format&fit=crop&q=80&w=400"),
            ("Cold Drinks", "Fresh Pomegranate Juice", True, {
                "Regular": (150.0, 160.0, 180.0),
                "Large": (200.0, 220.0, 240.0)
            }, "https://images.unsplash.com/photo-1641659735894-45046caad624?auto=format&fit=crop&q=80&w=400"),
            ("Cold Drinks", "Lemon with Mint", False, (220.0, 240.0, 260.0), 
             "https://images.unsplash.com/photo-1641659735894-45046caad624?auto=format&fit=crop&q=80&w=400"),
            ("Cold Drinks", "Fresh Mango Juice", False, (220.0, 240.0, 260.0), 
             "https://images.unsplash.com/photo-1641659735894-45046caad624?auto=format&fit=crop&q=80&w=400"),
            ("Cold Drinks", "Fresh Strawberry Juice", False, (220.0, 240.0, 260.0), 
             "https://images.unsplash.com/photo-1641659735894-45046caad624?auto=format&fit=crop&q=80&w=400"),
            ("Cold Drinks", "Fruit Cocktail", False, (220.0, 240.0, 260.0), 
             "https://images.unsplash.com/photo-1641659735894-45046caad624?auto=format&fit=crop&q=80&w=400"),
            ("Cold Drinks", "Iced Karak Tea", False, (110.0, 120.0, 130.0), 
             "https://images.unsplash.com/photo-1696590406209-811e378bd107?auto=format&fit=crop&q=80&w=400"),

            # Milkshakes
            ("Milkshakes", "Mango Milkshake", False, (250.0, 270.0, 300.0), 
             "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=400"),
            ("Milkshakes", "Strawberry Milkshake", False, (250.0, 270.0, 300.0), 
             "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=400"),
            ("Milkshakes", "Date Milkshake", False, (250.0, 270.0, 300.0), 
             "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=400"),
            ("Milkshakes", "Banana Milkshake", False, (250.0, 270.0, 300.0), 
             "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=400")
        ]

        # Pre-create all sizes we'll need
        size_cache: dict[str, SizeModel] = {}
        all_size_names = set()
        for cat_name, prod_name, has_sizes, price_config, img_url in menu_setup:
            if has_sizes:
                for size_name in price_config.keys():
                    all_size_names.add(size_name)
            else:
                all_size_names.add("Regular")
        for size_name in sorted(all_size_names):
            s = SizeModel(name=size_name)
            session.add(s)
            size_cache[size_name] = s
        await session.flush()

        for cat_name, prod_name, has_sizes, price_config, img_url in menu_setup:
            category = categories[cat_name]
            # Create Product
            product = ProductModel(name=prod_name, category_id=category.id, image_url=img_url)
            session.add(product)
            await session.flush()

            if has_sizes:
                for size_name, prices in price_config.items():
                    size = size_cache[size_name]

                    mi1 = MenuItemModel(branch_id=b1.id, product_id=product.id, size_id=size.id, price=prices[0])
                    mi2 = MenuItemModel(branch_id=b2.id, product_id=product.id, size_id=size.id, price=prices[1])
                    session.add_all([mi1, mi2])
                    await session.flush()

                    if cat_name == "Desserts":
                        session.add_all([
                            MenuItemExtraModel(menu_item_id=mi1.id, extra_id=extra_ice_cream.id, price=extra_ice_cream.price),
                            MenuItemExtraModel(menu_item_id=mi1.id, extra_id=extra_cream.id, price=extra_cream.price),
                            MenuItemExtraModel(menu_item_id=mi2.id, extra_id=extra_ice_cream.id, price=extra_ice_cream.price),
                            MenuItemExtraModel(menu_item_id=mi2.id, extra_id=extra_cream.id, price=extra_cream.price),
                        ])
            else:
                size = size_cache["Regular"]

                mi1 = MenuItemModel(branch_id=b1.id, product_id=product.id, size_id=size.id, price=price_config[0])
                mi2 = MenuItemModel(branch_id=b2.id, product_id=product.id, size_id=size.id, price=price_config[1])
                session.add_all([mi1, mi2])
                await session.flush()

                if cat_name == "Desserts":
                    session.add_all([
                        MenuItemExtraModel(menu_item_id=mi1.id, extra_id=extra_ice_cream.id, price=extra_ice_cream.price),
                        MenuItemExtraModel(menu_item_id=mi1.id, extra_id=extra_cream.id, price=extra_cream.price),
                        MenuItemExtraModel(menu_item_id=mi2.id, extra_id=extra_ice_cream.id, price=extra_ice_cream.price),
                        MenuItemExtraModel(menu_item_id=mi2.id, extra_id=extra_cream.id, price=extra_cream.price),
                    ])

        await session.commit()
        print("Database seeding completed successfully!")

if __name__ == '__main__':
    asyncio.run(seed_data())
