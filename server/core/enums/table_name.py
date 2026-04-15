from enum import Enum


class TableEnum(Enum):
    USERS = "users"
    
    BRANCHES = "branches"
    TABLES = "tables"
    
    CATEGORIES = "categories"
    PRODUCTS = "products"
    SIZES = "sizes"
    EXTRAS = "extras"
    
    MENU_ITEMS = "menu_items"
    MENU_ITEMS_EXTRAS = "menu_items_extras"
    
    ORDERS = "orders"
    ORDERS_ITEMS = "orders_items"
    ORDERS_ITEMS_EXTRAS = "orders_items_extras"
    
    HISTORIES = "histories"
    HISTORIES_ITEMS = "histories_items"
    HISTORIES_ITEMS_EXTRAS = "histories_items_extras"
