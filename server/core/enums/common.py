from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"


class ActionEnum(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    PAY = "pay"
    CANCEL = "cancel"
    DELETE = "delete"


class PaymentEnum(str, Enum):
    CASH = "cash"
    CARD = "card"
