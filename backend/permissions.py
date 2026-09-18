from functools import wraps
from flask import jsonify
from flask_login import current_user, login_required

ROLE_OWNER = "owner"
ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"
ROLE_STAFF = "staff"
ROLE_ACCOUNTANT = "accountant"

ROLE_ALIASES = {
    "owner": ROLE_OWNER,
    "admin": ROLE_ADMIN,
    "manager": ROLE_MANAGER,
    "staff": ROLE_STAFF,
    "accountant": ROLE_ACCOUNTANT,
    "level 1": ROLE_STAFF,
    "level 2": ROLE_MANAGER,
    "level 3": ROLE_ADMIN,
}


def role_of(user):
    if not user:
        return ""
    raw = (getattr(user, "role", "") or "").strip().lower()
    return ROLE_ALIASES.get(raw, raw)


def is_own(user, record):
    if record is None:
        return False

    for field in ("assigned_to_id", "owner_id", "user_id"):
        if hasattr(record, field):
            if getattr(record, field) == user.id:
                return True

    return False


ACTION_REVENUE = "revenue_reports"
ACTION_CLIENTS_VIEW = "clients_view"
ACTION_CLIENTS_ADD = "clients_add"
ACTION_CLIENTS_EDIT = "clients_edit"
ACTION_CLIENTS_DELETE = "clients_delete"
ACTION_LEADS_VIEW = "leads_view"
ACTION_LEADS_ADD = "leads_add"
ACTION_LEADS_EDIT = "leads_edit"
ACTION_LEADS_MOVE = "leads_move"
ACTION_LEADS_DELETE = "leads_delete"
ACTION_ASSIGN = "assign"
ACTION_INVOICES_VIEW = "invoices_view"
ACTION_INVOICES_CREATE = "invoices_create"
ACTION_INVOICES_SEND = "invoices_send"
ACTION_INVOICES_VOID = "invoices_void"
ACTION_TEAM_MANAGE = "team_manage"
ACTION_OWN_TASKS = "own_tasks"
ACTION_OWN_MESSAGES = "own_messages"
ACTION_PIN_MESSAGES = "pin_messages"
ACTION_SETTINGS = "settings"
ACTION_USERS_ROLES = "users_roles"
ACTION_EXPORT_CSV = "export_csv"
ACTION_IMPORT_CLIENTS = "import_clients"
ACTION_BACKUP = "backup"
ACTION_OWN_ACCOUNT = "own_account"

OPEN_ACTIONS = {
    ACTION_OWN_TASKS,
    ACTION_OWN_MESSAGES,
    ACTION_OWN_ACCOUNT,
}

ROLE_PERMISSIONS = {
    ROLE_MANAGER: {
        ACTION_REVENUE,
        ACTION_CLIENTS_VIEW,
        ACTION_CLIENTS_ADD,
        ACTION_CLIENTS_EDIT,
        ACTION_CLIENTS_DELETE,
        ACTION_LEADS_VIEW,
        ACTION_LEADS_ADD,
        ACTION_LEADS_EDIT,
        ACTION_LEADS_MOVE,
        ACTION_LEADS_DELETE,
        ACTION_ASSIGN,
        ACTION_INVOICES_VIEW,
        ACTION_INVOICES_CREATE,
        ACTION_PIN_MESSAGES,
    },
    ROLE_STAFF: {
        ACTION_CLIENTS_VIEW,
        ACTION_CLIENTS_ADD,
        ACTION_CLIENTS_EDIT,
        ACTION_LEADS_VIEW,
        ACTION_LEADS_ADD,
        ACTION_LEADS_EDIT,
        ACTION_LEADS_MOVE,
        ACTION_INVOICES_VIEW,
        ACTION_INVOICES_CREATE,
    },
    ROLE_ACCOUNTANT: {
        ACTION_REVENUE,
        ACTION_CLIENTS_VIEW,
        ACTION_INVOICES_VIEW,
        ACTION_INVOICES_CREATE,
        ACTION_INVOICES_SEND,
        ACTION_EXPORT_CSV,
    },
}

STAFF_OWN_ACTIONS = {
    ACTION_CLIENTS_VIEW,
    ACTION_CLIENTS_EDIT,
    ACTION_LEADS_VIEW,
    ACTION_LEADS_EDIT,
    ACTION_LEADS_MOVE,
    ACTION_INVOICES_VIEW,
    ACTION_INVOICES_CREATE,
}


def can(user, action, record=None):
    if not user or not getattr(user, "is_authenticated", False):
        return False

    role = role_of(user)

    if role == ROLE_OWNER:
        return True

    if action in OPEN_ACTIONS:
        return True

    if role == ROLE_ADMIN:
        if action == ACTION_BACKUP:
            return False
        if action == ACTION_USERS_ROLES and record is not None:
            if role_of(record) == ROLE_OWNER:
                return False
        return True

    if action not in ROLE_PERMISSIONS.get(role, set()):
        return False

    if role == ROLE_STAFF and action in STAFF_OWN_ACTIONS:
        if record is None:
            return action in {
                ACTION_CLIENTS_ADD,
                ACTION_LEADS_ADD,
                ACTION_INVOICES_CREATE,
            }
        return is_own(user, record)

    return True


def permission_required(action):
    def decorator(view):
        @wraps(view)
        @login_required
        def wrapped(*args, **kwargs):
            if not can(current_user, action):
                return jsonify({"error": "You don't have access."}), 403
            return view(*args, **kwargs)

        return wrapped

    return decorator