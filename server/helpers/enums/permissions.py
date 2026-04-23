from enum import Enum


class PermissionEnum(str, Enum):
    READ_USERS = "read:users"
    READ_USERS_ME = "read:users:me"
    CREATE_USERS = "create:users"
    UPDATE_USERS = "update:users"
    DELETE_USERS = "delete:users"
    RESET_PASSWORD = "reset:password"

    MANAGE_CATALOG = "manage:catalog"


class RoleEnum(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"


ROLE_PERMISSIONS = {
    RoleEnum.ADMIN: [
        PermissionEnum.READ_USERS,
        PermissionEnum.READ_USERS_ME,
        PermissionEnum.CREATE_USERS,
        PermissionEnum.UPDATE_USERS,
        PermissionEnum.DELETE_USERS,
        PermissionEnum.RESET_PASSWORD,
        PermissionEnum.MANAGE_CATALOG,
    ],
    RoleEnum.CASHIER: [
        PermissionEnum.READ_USERS_ME,
        PermissionEnum.UPDATE_USERS,
        PermissionEnum.RESET_PASSWORD,
    ],
}
