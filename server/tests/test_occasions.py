"""
Occasion tests: sorting, yearly dates, assigning gifts, what deletes
what, and proof that one user can never reach another user's occasions.

Setup for every test (dates are relative to today, so tests never go stale):
hannah owns Emma (with one gift) and Erin, a one-time party for Emma in
3 days, a holiday in 30 days (Emma's gift is assigned to it), and Erin's
yearly birthday in 60 days. Sam owns Mom, Mom's gift, and Mom's birthday.
"""

from datetime import date, timedelta

import pytest

from config import db
from models import Gift, Occasion, Recipient

@pytest.fixture
def occasions_data(create_user):
    """Create both users' data; return the ids the tests need."""
    hannah = create_user("hannah")
    sam = create_user("sam")
    today = date.today()

    emma = Recipient(name="Emma", user=hannah)
    erin = Recipient(name="Erin", user=hannah)
    party = Occasion(name="Emma's party", date=today + timedelta(days=3),
                     repeats_yearly=False, user=hannah, recipient=emma)
    holiday = Occasion(name="Holiday", date=today + timedelta(days=30),
                       repeats_yearly=False, user=hannah)          # no recipient
    erin_birthday = Occasion(name="Erin's birthday", date=today + timedelta(days=60),
                             repeats_yearly=True, user=hannah, recipient=erin)
    lights = Gift(name="Fairy lights", recipient=emma, occasion=holiday)

    mom = Recipient(name="Mom", user=sam)
    gloves = Gift(name="Gloves", recipient=mom)
    mom_birthday = Occasion(name="Mom's birthday", date=today + timedelta(days=10),
                            repeats_yearly=True, user=sam, recipient=mom)

    db.session.add_all([emma, erin, party, holiday, erin_birthday, lights,
                        mom, gloves, mom_birthday])
    db.session.commit()
    return {
        "emma_id": emma.id, "party_id": party.id, "holiday_id": holiday.id,
        "erin_birthday_id": erin_birthday.id, "lights_id": lights.id,
        "mom_id": mom.id, "gloves_id": gloves.id, "mom_birthday_id": mom_birthday.id,
    }


# ─── LISTING AND DATES ────────────────────────────────────────────────

def test_list_is_sorted_soonest_first(client, login_as, occasions_data):
    login_as("hannah")
    names = [o["name"] for o in client.get("/api/occasions").get_json()]

    assert names == ["Emma's party", "Holiday", "Erin's birthday"]


def test_yearly_occasion_rolls_forward(client):
    """A yearly date whose day already passed this year moves to next year."""
    yesterday = date.today() - timedelta(days=1)
    occasion = Occasion(name="Old birthday", date=date(2000, yesterday.month, yesterday.day),
                        repeats_yearly=True)

    assert occasion.next_date > date.today()
    assert 1 <= occasion.days_until <= 366


# ─── CREATING ─────────────────────────────────────────────────────────

def test_create_holiday_without_recipient(client, login_as, occasions_data):
    login_as("hannah")
    response = client.post(
        "/api/occasions", json={"name": "New Year", "date": "2027-01-01", "repeats_yearly": True}
    )

    assert response.status_code == 201
    assert response.get_json()["recipient_id"] is None


def test_create_with_bad_date_returns_400(client, login_as, occasions_data):
    login_as("hannah")
    response = client.post("/api/occasions", json={"name": "Oops", "date": "Feb 14"})

    assert response.status_code == 400


# ─── GIFTS AND DELETING ───────────────────────────────────────────────

def test_cannot_assign_gift_to_another_recipients_birthday(client, login_as, occasions_data):
    """Emma's gift can't go on Erin's birthday."""
    login_as("hannah")
    response = client.patch(
        f"/api/gifts/{occasions_data['lights_id']}",
        json={"occasion_id": occasions_data["erin_birthday_id"]},
    )

    assert response.status_code == 400
    assert db.session.get(Gift, occasions_data["lights_id"]).occasion_id == occasions_data["holiday_id"]


def test_deleting_occasion_keeps_its_gifts(client, login_as, occasions_data):
    login_as("hannah")
    response = client.delete(f"/api/occasions/{occasions_data['holiday_id']}")

    assert response.status_code == 204
    lights = db.session.get(Gift, occasions_data["lights_id"])
    assert lights is not None
    assert lights.occasion_id is None


def test_deleting_recipient_deletes_their_occasions(client, login_as, occasions_data):
    login_as("hannah")
    client.delete(f"/api/recipients/{occasions_data['emma_id']}")

    assert db.session.get(Occasion, occasions_data["party_id"]) is None


# ─── OWNERSHIP ────────────────────────────────────────────────────────

def test_list_only_shows_own_occasions(client, login_as, occasions_data):
    login_as("sam")
    names = [o["name"] for o in client.get("/api/occasions").get_json()]

    assert names == ["Mom's birthday"]


def test_cannot_view_another_users_occasion(client, login_as, occasions_data):
    login_as("sam")
    response = client.get(f"/api/occasions/{occasions_data['holiday_id']}")

    assert response.status_code == 404


def test_cannot_edit_another_users_occasion(client, login_as, occasions_data):
    login_as("sam")
    response = client.patch(
        f"/api/occasions/{occasions_data['holiday_id']}", json={"name": "Hacked"}
    )

    assert response.status_code == 404
    assert db.session.get(Occasion, occasions_data["holiday_id"]).name == "Holiday"


def test_cannot_delete_another_users_occasion(client, login_as, occasions_data):
    login_as("sam")
    response = client.delete(f"/api/occasions/{occasions_data['holiday_id']}")

    assert response.status_code == 404
    assert db.session.get(Occasion, occasions_data["holiday_id"]) is not None


def test_cannot_create_birthday_for_another_users_recipient(client, login_as, occasions_data):
    login_as("sam")
    response = client.post(
        "/api/occasions",
        json={"name": "Sneaky", "date": "2027-01-01", "recipient_id": occasions_data["emma_id"]},
    )

    assert response.status_code == 404
    assert Occasion.query.filter_by(name="Sneaky").first() is None


def test_cannot_assign_gift_to_another_users_occasion(client, login_as, occasions_data):
    login_as("sam")
    response = client.patch(
        f"/api/gifts/{occasions_data['gloves_id']}",
        json={"occasion_id": occasions_data["holiday_id"]},
    )

    assert response.status_code == 404
    assert db.session.get(Gift, occasions_data["gloves_id"]).occasion_id is None