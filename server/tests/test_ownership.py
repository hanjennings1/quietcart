"""
Ownership tests: prove that one user can never see, change, or delete
another user's recipients and gifts.

Setup for every test: hannah owns Emma (with one gift), and sam owns
Mom. Each test logs in as sam and tries to reach hannah's data, which
should always fail with 404, as if it didn't exist.
"""

import pytest

from config import db
from models import Gift, Recipient


@pytest.fixture
def hannahs_data(create_user):
    """Create hannah's and sam's data; return the ids the tests need.

    Ids are returned (rather than the objects) because they're what
    real requests use: URLs and JSON bodies contain ids.
    """
    hannah = create_user("hannah")
    sam = create_user("sam")

    emma = Recipient(name="Emma", budget=60, user=hannah)
    mug = Gift(name="Cat mug", price=18, recipient=emma)
    mom = Recipient(name="Mom", user=sam)

    db.session.add_all([emma, mug, mom])
    db.session.commit()
    return {"emma_id": emma.id, "mug_id": mug.id, "mom_id": mom.id}


# ─── RECIPIENTS ───────────────────────────────────────────────────────

def test_list_only_shows_own_recipients(client, login_as, hannahs_data):
    login_as("sam")
    names = [r["name"] for r in client.get("/api/recipients").get_json()]

    assert names == ["Mom"]


def test_cannot_view_another_users_recipient(client, login_as, hannahs_data):
    login_as("sam")
    response = client.get(f"/api/recipients/{hannahs_data['emma_id']}")

    assert response.status_code == 404


def test_cannot_edit_another_users_recipient(client, login_as, hannahs_data):
    login_as("sam")
    response = client.patch(
        f"/api/recipients/{hannahs_data['emma_id']}", json={"name": "Hacked"}
    )

    assert response.status_code == 404
    assert db.session.get(Recipient, hannahs_data["emma_id"]).name == "Emma"


def test_cannot_delete_another_users_recipient(client, login_as, hannahs_data):
    login_as("sam")
    response = client.delete(f"/api/recipients/{hannahs_data['emma_id']}")

    assert response.status_code == 404
    assert db.session.get(Recipient, hannahs_data["emma_id"]) is not None


def test_create_recipient_ignores_user_id_in_body(client, login_as, hannahs_data):
    """Sending another user's id must not put the recipient in their account."""
    login_as("sam")
    hannah_id = db.session.get(Recipient, hannahs_data["emma_id"]).user_id
    response = client.post("/api/recipients", json={"name": "Sneaky", "user_id": hannah_id})

    assert response.status_code == 201
    sneaky = db.session.get(Recipient, response.get_json()["id"])
    assert sneaky.user.username == "sam"


# ─── GIFTS ────────────────────────────────────────────────────────────

def test_cannot_add_gift_to_another_users_recipient(client, login_as, hannahs_data):
    login_as("sam")
    response = client.post(
        "/api/gifts", json={"recipient_id": hannahs_data["emma_id"], "name": "Sneaky gift"}
    )

    assert response.status_code == 404
    assert Gift.query.filter_by(name="Sneaky gift").first() is None


def test_cannot_check_off_another_users_gift(client, login_as, hannahs_data):
    login_as("sam")
    response = client.patch(f"/api/gifts/{hannahs_data['mug_id']}", json={"purchased": True})

    assert response.status_code == 404
    assert db.session.get(Gift, hannahs_data["mug_id"]).purchased is False


def test_cannot_delete_another_users_gift(client, login_as, hannahs_data):
    login_as("sam")
    response = client.delete(f"/api/gifts/{hannahs_data['mug_id']}")

    assert response.status_code == 404
    assert db.session.get(Gift, hannahs_data["mug_id"]) is not None


# ─── DASHBOARD ────────────────────────────────────────────────────────

def test_dashboard_only_shows_own_data(client, login_as, hannahs_data):
    login_as("sam")
    data = client.get("/api/dashboard").get_json()

    assert [r["name"] for r in data["recipients"]] == ["Mom"]
    assert data["recent_ideas"] == []          # hannah's mug must not appear
    assert data["totals"]["spent"] == 0


# ─── THE OWNER STILL HAS ACCESS ───────────────────────────────────────

def test_owner_can_view_their_own_recipient(client, login_as, hannahs_data):
    """The control case: the same request works for the real owner, which
    proves the 404s above come from ownership, not a broken route."""
    login_as("hannah")
    response = client.get(f"/api/recipients/{hannahs_data['emma_id']}")

    assert response.status_code == 200
    assert response.get_json()["gifts"][0]["name"] == "Cat mug"