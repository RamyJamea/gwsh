import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from .db import SESSION
from .enums import RoleEnum, ActionEnum, PaymentEnum
from .hash import get_password_hash
from ..models.branch_model import Branch, RestaurantTable
from ..models.catalog_model import Category, Product, Extra, Size
from ..models.menu_model import MenuItem, MenuItemExtra
from ..models.user_model import User
from ..models.order_model import Order, OrderItem, OrderItemExtra
from ..models.history_model import (
    OrderHistory,
    OrderHistoryItem,
    OrderHistoryItemExtra,
)


def seed_full_database(num_orders: int = 300) -> None:
    """
    Seeds the database with a realistic amount of test data:
    - Categories, Products, Sizes, Extras (global)
    - Multiple Branches + Tables + Cashier users
    - MenuItems (every product + every size per branch) + MenuItemExtras
    - Hundreds of Orders with OrderItems + OrderItemExtras
    - Matching OrderHistory + OrderHistoryItem + OrderHistoryItemExtra (CREATE action)
    """
    db: Session = SESSION()
    try:
        # === 1. Idempotency check ===
        if db.query(Category).first() is not None:
            print(
                "✅ Database already contains seeded data (categories found). Skipping."
            )
            return

        print("🌱 Starting full database seed...")

        # === 2. Categories ===
        category_names = [
            "Burgers",
            "Pizzas",
            "Pasta",
            "Salads",
            "Drinks",
            "Desserts",
            "Sides",
            "Soups",
        ]
        categories = []
        for name in category_names:
            cat = Category(name=name)
            db.add(cat)
            categories.append(cat)
        db.commit()
        print(f"   Created {len(categories)} categories")

        # Category lookup for products
        category_dict = {cat.name: cat for cat in categories}

        # === 3. Products (≈43 items) ===
        product_data = {
            "Burgers": [
                "Classic Burger",
                "Cheeseburger",
                "Bacon Burger",
                "Veggie Burger",
                "Spicy Chicken Burger",
                "Mushroom Burger",
            ],
            "Pizzas": [
                "Margherita Pizza",
                "Pepperoni Pizza",
                "Hawaiian Pizza",
                "Veggie Supreme Pizza",
                "Meat Lovers Pizza",
                "BBQ Chicken Pizza",
            ],
            "Pasta": [
                "Spaghetti Bolognese",
                "Carbonara",
                "Fettuccine Alfredo",
                "Pesto Pasta",
                "Lasagna",
            ],
            "Salads": [
                "Caesar Salad",
                "Greek Salad",
                "Garden Salad",
                "Grilled Chicken Salad",
                "Tuna Salad",
            ],
            "Drinks": [
                "Coca Cola",
                "Pepsi",
                "Lemonade",
                "Orange Juice",
                "Iced Coffee",
                "Hot Tea",
                "Sparkling Water",
            ],
            "Desserts": [
                "Chocolate Fudge Cake",
                "Vanilla Ice Cream",
                "Tiramisu",
                "New York Cheesecake",
                "Brownie Sundae",
            ],
            "Sides": [
                "French Fries",
                "Onion Rings",
                "Garlic Bread",
                "Mozzarella Sticks",
                "Chicken Wings",
            ],
            "Soups": [
                "Tomato Basil Soup",
                "Creamy Chicken Soup",
                "Minestrone",
                "Lentil Soup",
            ],
        }

        products = []
        for cat_name, prod_list in product_data.items():
            cat = category_dict[cat_name]
            for p_name in prod_list:
                prod = Product(name=p_name, category_id=cat.id)
                db.add(prod)
                products.append(prod)
        db.commit()
        print(f"   Created {len(products)} products")

        # === 4. Sizes & Extras ===
        size_names = ["Small", "Medium", "Large", "Extra Large"]
        sizes = []
        for name in size_names:
            size_obj = Size(name=name)
            db.add(size_obj)
            sizes.append(size_obj)
        db.commit()
        print(f"   Created {len(sizes)} sizes")

        extra_names = [
            "Extra Cheese",
            "Bacon",
            "Mushrooms",
            "Black Olives",
            "Pepperoni",
            "Red Onions",
            "Fresh Tomatoes",
            "Lettuce",
            "Pickles",
            "Jalapeños",
            "BBQ Sauce",
            "Garlic Sauce",
            "Ranch Dressing",
            "Ketchup",
            "Mustard",
        ]
        extras = []
        for name in extra_names:
            extra_obj = Extra(name=name)
            db.add(extra_obj)
            extras.append(extra_obj)
        db.commit()
        print(f"   Created {len(extras)} extras")

        # === 5. Branches (5 branches) ===
        branch_names = [
            "Downtown Branch",
            "Mall Branch",
            "Airport Branch",
            "Beach Branch",
            "Suburban Branch",
        ]
        branches = []
        for name in branch_names:
            branch = Branch(name=name)
            db.add(branch)
            branches.append(branch)
        db.commit()
        print(f"   Created {len(branches)} branches")

        # === 6. Restaurant Tables (20 per branch) ===
        for branch in branches:
            for i in range(20):
                table = RestaurantTable(
                    branch_id=branch.id,
                    num_chairs=random.randint(2, 10),
                    is_available=random.choice([True, False]),
                )
                db.add(table)
        db.commit()
        print("   Created tables for all branches")

        # === 7. Cashier Users (3 per branch) ===
        for branch in branches:
            for i in range(3):
                username = f"cashier_{branch.name.lower().replace(' ', '_')}_{i+1}"
                user = User(
                    branch_id=branch.id,
                    username=username,
                    role=RoleEnum.CASHIER,
                    hashed_password=get_password_hash("stringst"),
                    is_active=True,
                )
                db.add(user)
        db.commit()
        print("   Created cashier users")

        # Pre-load data for fast order creation
        menu_items_by_branch: dict[int, list[MenuItem]] = {}
        tables_by_branch: dict[int, list[RestaurantTable]] = {}
        cashiers = db.query(User).filter(User.role == RoleEnum.CASHIER).all()

        for branch in branches:
            menu_items_by_branch[branch.id] = (
                db.query(MenuItem).filter(MenuItem.branch_id == branch.id).all()
            )
            tables_by_branch[branch.id] = (
                db.query(RestaurantTable)
                .filter(RestaurantTable.branch_id == branch.id)
                .all()
            )

        # === 8. Menu Items (every product + every size per branch) ===
        for branch in branches:
            for product in products:
                for size in sizes:
                    price = Decimal(random.uniform(4.99, 34.99)).quantize(
                        Decimal("0.01")
                    )
                    menu_item = MenuItem(
                        branch_id=branch.id,
                        product_id=product.id,
                        size_id=size.id,
                        price=price,
                    )
                    db.add(menu_item)
        db.commit()
        print(f"   Created ~{len(branches) * len(products) * len(sizes)} menu items")

        # === 9. MenuItemExtras (randomly attach 0-4 extras to ~60% of menu items) ===
        all_menu_items = db.query(MenuItem).all()
        for menu_item in all_menu_items:
            if random.random() < 0.6:  # 60% of items get extras
                num_extras = random.randint(1, 4)
                selected = random.sample(extras, num_extras)
                for extra in selected:
                    extra_price = Decimal(random.uniform(0.49, 4.99)).quantize(
                        Decimal("0.01")
                    )
                    mie = MenuItemExtra(
                        menu_item_id=menu_item.id,
                        extra_id=extra.id,
                        price=extra_price,
                    )
                    db.add(mie)
        db.commit()
        print("   Created MenuItemExtras")

        # Refresh menu items with extras loaded (for order creation)
        for branch_id in menu_items_by_branch:
            menu_items_by_branch[branch_id] = (
                db.query(MenuItem).filter(MenuItem.branch_id == branch_id).all()
            )

        # === 10. Orders + Items + Extras + History (the "many data" part) ===
        print(f"   Generating {num_orders} orders with items, extras and history...")
        for i in range(num_orders):
            if i % 50 == 0 and i > 0:
                print(f"      ...{i}/{num_orders} orders created")

            cashier = random.choice(cashiers)
            branch_id = cashier.branch_id

            # Optional table
            table_id = None
            if random.random() < 0.75 and tables_by_branch.get(branch_id):
                table_id = random.choice(tables_by_branch[branch_id]).id

            payment_method = random.choice([PaymentEnum.CASH, PaymentEnum.CARD])

            # Create Order
            order = Order(
                cashier_id=cashier.id,
                branch_id=branch_id,
                table_id=table_id,
                total_amount=Decimal("0.00"),
                action=ActionEnum.CREATE,
                payment_method=payment_method,
            )
            db.add(order)
            db.flush()  # get order.id

            total_amount = Decimal("0.00")
            num_items = random.randint(2, 6)
            branch_menu = menu_items_by_branch[branch_id]

            order_items_created = []  # temporary list for history creation

            for _ in range(num_items):
                menu_item = random.choice(branch_menu)
                qty = random.randint(1, 3)
                price_at_time = menu_item.price

                order_item = OrderItem(
                    order_id=order.id,
                    menu_item_id=menu_item.id,
                    quantity=qty,
                    price_at_time=price_at_time,
                )
                db.add(order_item)
                db.flush()

                item_subtotal = price_at_time * qty
                total_amount += item_subtotal

                # Extras for this item
                menu_item_extras = (
                    db.query(MenuItemExtra)
                    .filter(MenuItemExtra.menu_item_id == menu_item.id)
                    .all()
                )

                if menu_item_extras and random.random() < 0.55:
                    max_possible = len(menu_item_extras)
                    num_extras_to_add = random.randint(1, min(3, max_possible))
                    if num_extras_to_add > 0:
                        selected_extras = random.sample(
                            menu_item_extras, num_extras_to_add
                        )
                        for mie in selected_extras:
                            ex_qty = random.randint(1, 2)
                            order_item_extra = OrderItemExtra(
                                order_item_id=order_item.id,
                                menu_item_extra_id=mie.id,
                                quantity=ex_qty,
                                price_at_time=mie.price,
                            )
                            db.add(order_item_extra)
                            total_amount += mie.price * ex_qty

                order_items_created.append(order_item)

            # Finalize order total
            order.total_amount = total_amount.quantize(Decimal("0.01"))
            db.add(order)

            # === Create matching OrderHistory (CREATE snapshot) ===
            history = OrderHistory(
                order_id=order.id,
                cashier_id=cashier.id,
                action=ActionEnum.CREATE,
                timestamp=datetime.now() - timedelta(days=random.randint(0, 60)),
                total_amount_at_time=order.total_amount,
            )
            db.add(history)
            db.flush()

            # Copy items & extras into history
            for oi in order_items_created:
                h_item = OrderHistoryItem(
                    order_history_id=history.id,
                    menu_item_id=oi.menu_item_id,
                    quantity=oi.quantity,
                    price_at_time=oi.price_at_time,
                )
                db.add(h_item)
                db.flush()

                # Copy extras
                item_extras = (
                    db.query(OrderItemExtra)
                    .filter(OrderItemExtra.order_item_id == oi.id)
                    .all()
                )
                for oie in item_extras:
                    h_extra = OrderHistoryItemExtra(
                        order_history_item_id=h_item.id,
                        menu_item_extra_id=oie.menu_item_extra_id,
                        quantity=oie.quantity,
                        price_at_time=oie.price_at_time,
                    )
                    db.add(h_extra)

        db.commit()
        print(f"✅ Seeding completed successfully!")
        print(f"   • {len(branches)} branches")
        print(
            f"   • {len(products)} products × {len(sizes)} sizes = {len(branches)*len(products)*len(sizes)} menu items"
        )
        print(f"   • {num_orders} orders with items, extras & full history")
        print("   Ready for testing queries, reports, and dashboards!")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


# Optional: run directly
if __name__ == "__main__":
    # You can change the number of orders here
    seed_full_database(num_orders=300)
