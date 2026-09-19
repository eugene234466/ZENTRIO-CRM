import pytest

from extensions import db
from models import Contacts, Deal
from permissions import (
    can,
    ROLE_OWNER,
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_STAFF,
    ROLE_ACCOUNTANT,
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
    ACTION_INVOICES_SEND,
    ACTION_INVOICES_VOID,
    ACTION_TEAM_MANAGE,
    ACTION_OWN_TASKS,
    ACTION_OWN_MESSAGES,
    ACTION_PIN_MESSAGES,
    ACTION_SETTINGS,
    ACTION_USERS_ROLES,
    ACTION_EXPORT_CSV,
    ACTION_IMPORT_CLIENTS,
    ACTION_BACKUP,
    ACTION_OWN_ACCOUNT,
)



# Section 5 of the brief, row by row.
# Format: (action, owner, admin, manager, staff, accountant)
# The "Own" means: allowed only on records assigned to that staff member.
# The "View" means: allowed to view, but not add/edit.

PERMISSION_TABLE = [
    (ACTION_REVENUE,         True,  True,  True,  False, True),
    (ACTION_CLIENTS_VIEW,    True,  True,  True,  "Own", "View"),
    (ACTION_CLIENTS_ADD,     True,  True,  True,  "Own", False),
    (ACTION_CLIENTS_EDIT,    True,  True,  True,  "Own", False),
    (ACTION_CLIENTS_DELETE,  True,  True,  True,  False, False),
    (ACTION_LEADS_VIEW,      True,  True,  True,  "Own", False),
    (ACTION_LEADS_ADD,       True,  True,  True,  "Own", False),
    (ACTION_LEADS_EDIT,      True,  True,  True,  "Own", False),
    (ACTION_LEADS_MOVE,      True,  True,  True,  "Own", False),
    (ACTION_LEADS_DELETE,    True,  True,  True,  False, False),
    (ACTION_ASSIGN,          True,  True,  True,  False, False),
    (ACTION_INVOICES_VIEW,   True,  True,  True,  "Own", True),
    (ACTION_INVOICES_CREATE, True,  True,  True,  "Own", True),
    (ACTION_INVOICES_SEND,   True,  True,  True,  False, True),
    (ACTION_INVOICES_VOID,   True,  True,  False, False, False),
    (ACTION_TEAM_MANAGE,     True,  True,  False, False, False),
    (ACTION_OWN_TASKS,       True,  True,  True,  True,  True),
    (ACTION_OWN_MESSAGES,    True,  True,  True,  True,  True),
    (ACTION_PIN_MESSAGES,    True,  True,  True,  False, False),
    (ACTION_SETTINGS,        True,  True,  False, False, False),
    (ACTION_USERS_ROLES,     True,  True,  False, False, False),
    (ACTION_EXPORT_CSV,      True,  True,  False, False, True),
    (ACTION_IMPORT_CLIENTS,  True,  True,  False, False, False),
    (ACTION_BACKUP,          True,  False, False, False, False),
    (ACTION_OWN_ACCOUNT,     True,  True,  True,  True,  True),
]


@pytest.mark.parametrize(
    "action, owner_ok, admin_ok, manager_ok, staff_ok, accountant_ok",
    PERMISSION_TABLE,
)
def test_permission_table(
    app, make_user,
    action, owner_ok, admin_ok, manager_ok, staff_ok, accountant_ok,
):
    owner      = make_user("owner_" + action, ROLE_OWNER)
    admin      = make_user("admin_" + action, ROLE_ADMIN)
    manager    = make_user("manager_" + action, ROLE_MANAGER)
    staff      = make_user("staff_" + action, ROLE_STAFF)
    accountant = make_user("acc_" + action, ROLE_ACCOUNTANT)

    assert can(owner, action) is True, (
        f"Owner should be allowed: {action}"
    )

    assert can(admin, action) is admin_ok, (
        f"Admin {action} expected {admin_ok}"
    )

    assert can(manager, action) is manager_ok, (
        f"Manager {action} expected {manager_ok}"
    )


    if staff_ok != "Own":
        assert can(staff, action) is staff_ok, (
            f"Staff {action} expected {staff_ok}"
        )

    # The accountant "View" = can view but not modify.
    expected_acc = True if accountant_ok == "View" else accountant_ok
    assert can(accountant, action) is expected_acc, (
        f"Accountant {action} expected {expected_acc}"
    )


def test_staff_own_rule_clients(app, make_user):
    """Staff can only see/edit clients assigned to them."""
    staff = make_user("staff_own_c", ROLE_STAFF)

    mine = Contacts(
        name="Mine", phone="1", email="m@x.com", address="X",
        assigned_to_id=staff.id,
    )
    not_mine = Contacts(
        name="Not Mine", phone="2", email="n@x.com", address="Y",
        assigned_to_id=None,
    )
    db.session.add_all([mine, not_mine])
    db.session.commit()

    # Can see/edit own
    assert can(staff, ACTION_CLIENTS_VIEW, mine) is True
    assert can(staff, ACTION_CLIENTS_EDIT, mine) is True

    # Cannot see/edit not own
    assert can(staff, ACTION_CLIENTS_VIEW, not_mine) is False
    assert can(staff, ACTION_CLIENTS_EDIT, not_mine) is False

    # Can create new clients (no record yet)
    assert can(staff, ACTION_CLIENTS_ADD) is True


def test_staff_own_rule_leads(app, make_user):
    """Staff can only see/edit leads assigned to them."""
    staff = make_user("staff_own_l", ROLE_STAFF)

    mine = Deal(title="Mine", contact_id=1, value=100, assigned_to_id=staff.id)
    not_mine = Deal(title="Not Mine", contact_id=1, value=100, assigned_to_id=None)
    db.session.add_all([mine, not_mine])
    db.session.commit()

    assert can(staff, ACTION_LEADS_VIEW, mine) is True
    assert can(staff, ACTION_LEADS_EDIT, mine) is True
    assert can(staff, ACTION_LEADS_MOVE, mine) is True

    assert can(staff, ACTION_LEADS_VIEW, not_mine) is False
    assert can(staff, ACTION_LEADS_EDIT, not_mine) is False
    assert can(staff, ACTION_LEADS_MOVE, not_mine) is False


def test_admin_cannot_change_owner(app, make_user):
    """Admin must not be able to change the Owner."""
    admin = make_user("admin_own_check", ROLE_ADMIN)
    owner = make_user("owner_check", ROLE_OWNER)

    assert can(admin, ACTION_USERS_ROLES, owner) is False
    # But admin can change other admins / managers / staff / accountants
    manager = make_user("mgr_check", ROLE_MANAGER)
    assert can(admin, ACTION_USERS_ROLES, manager) is True


def test_admin_cannot_backup(app, make_user):
    """Only the Owner can backup / restore / reset."""
    admin = make_user("admin_backup_check", ROLE_ADMIN)
    assert can(admin, ACTION_BACKUP) is False




def test_staff_blocked_from_dashboard(client, make_user, login):
    make_user("staff_int_dash", ROLE_STAFF)
    login("staff_int_dash")

    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 403


def test_owner_can_access_dashboard(client, make_user, login):
    make_user("owner_int_dash", ROLE_OWNER)
    login("owner_int_dash")

    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 200


def test_staff_cannot_see_other_contacts_in_list(
    client, make_user, login,
):
    staff = make_user("staff_list", ROLE_STAFF)

    mine = Contacts(
        name="Mine", phone="1", email="m@x.com", address="A",
        assigned_to_id=staff.id,
    )
    not_mine = Contacts(
        name="Not Mine", phone="2", email="n@x.com", address="B",
        assigned_to_id=None,
    )
    db.session.add_all([mine, not_mine])
    db.session.commit()

    login("staff_list")
    resp = client.get("/api/contacts/")
    assert resp.status_code == 200

    names = [c["name"] for c in resp.get_json()["contacts"]]
    assert "Mine" in names
    assert "Not Mine" not in names


def test_admin_cannot_change_owner_via_http(
    client, make_user, login, logout,
):
    admin = make_user("admin_http", ROLE_ADMIN)
    owner = make_user("owner_http", ROLE_OWNER)

    login("admin_http")
    resp = client.patch(
        f"/auth/users/{owner.id}/role",
        json={"role": "admin"},
    )
    assert resp.status_code == 403
