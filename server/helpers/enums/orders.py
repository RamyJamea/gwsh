from enum import Enum


class ActionEnum(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    PAY = "pay"
    CANCEL = "cancel"
    DELETE = "delete"


class PaymentEnum(str, Enum):
    CASH = "cash"
    CARD = "card"
