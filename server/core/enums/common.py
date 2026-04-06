from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"


class ActionEnum(str, Enum):
    CREATE = "create"
    DELETE = "delete"
    UPDATE = "update"


class PaymentEnum(str, Enum):
    CASH = "cash"
    CARD = "card"
