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


def test_cannot_create_gift_on_another_recipients_birthday(client, login_as, occasions_data):
    """Creating (not just editing) a gift also checks the occasion's recipient."""
    login_as("hannah")
    response = client.post(
        "/api/gifts",
        json={"recipient_id": occasions_data["emma_id"], "name": "Wrong party",
              "occasion_id": occasions_data["erin_birthday_id"]},
    )

    assert response.status_code == 400
    assert Gift.query.filter_by(name="Wrong party").first() is None


def test_dashboard_shows_upcoming_occasions_soonest_first(client, login_as, occasions_data):
    login_as("hannah")
    upcoming = client.get("/api/dashboard").get_json()["upcoming"]

    assert [o["name"] for o in upcoming] == ["Emma's party", "Holiday", "Erin's birthday"]


# ── MOVING DATES ──────────────────────────────────────────────────────────

# Known dates, so these never go stale: (week, weekday, month, year, expected)
# weekday: Sunday = 0 … Saturday = 6; week -1 = last
@pytest.mark.parametrize("week, weekday, month, year, expected", [
    (3, 0, 6, 2026, date(2026, 6, 21)),     # Father's Day: 3rd Sunday of June
    (2, 0, 5, 2027, date(2027, 5, 9)),      # Mother's Day: 2nd Sunday of May
    (4, 4, 11, 2026, date(2026, 11, 26)),   # Thanksgiving: 4th Thursday of November
    (-1, 1, 5, 2026, date(2026, 5, 25)),    # Memorial Day: last Monday of May
])
def test_rule_works_out_the_right_date(week, weekday, month, year, expected):
    occasion = Occasion(name="Test", rule_week=week, rule_weekday=weekday, rule_month=month)
    assert occasion._in_year(year) == expected


# The base rule for the API tests below: Father's Day
FATHERS_DAY = {"name": "Father's Day", "rule_week": 3, "rule_weekday": 0, "rule_month": 6}


def test_create_moving_occasion(client, login_as, occasions_data):
    login_as("hannah")
    response = client.post("/api/occasions", json=FATHERS_DAY)
    body = response.get_json()

    assert response.status_code == 201
    assert body["date"] is None
    assert body["repeats_yearly"] is True       # moving dates always repeat
    # next_date depends on today, so check its shape: a Sunday, June 15–21
    next_date = date.fromisoformat(body["next_date"])
    assert next_date.month == 6 and next_date.isoweekday() == 7 and 15 <= next_date.day <= 21


def test_incomplete_rule_is_rejected_and_not_saved(client, login_as, occasions_data):
    login_as("hannah")
    response = client.post("/api/occasions", json={**FATHERS_DAY, "rule_week": None})

    assert response.status_code == 400
    assert len(client.get("/api/occasions").get_json()) == 3     # still only the fixture's 3


def test_date_and_rule_together_is_rejected(client, login_as, occasions_data):
    login_as("hannah")
    response = client.post("/api/occasions", json={**FATHERS_DAY, "date": "2026-06-21"})

    assert response.status_code == 400


@pytest.mark.parametrize("bad_part", [
    {"rule_week": 5},       # no "5th" (use -1 for last)
    {"rule_month": 13},
    {"rule_weekday": 7},
])
def test_out_of_range_rule_is_rejected(client, login_as, occasions_data, bad_part):
    login_as("hannah")
    response = client.post("/api/occasions", json={**FATHERS_DAY, **bad_part})

    assert response.status_code == 400


def test_switch_fixed_date_to_moving(client, login_as, occasions_data):
    login_as("hannah")
    party_id = occasions_data["party_id"]
    response = client.patch(
        f"/api/occasions/{party_id}",
        json={"date": None, "rule_week": 2, "rule_weekday": 0, "rule_month": 5},
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["date"] is None
    assert body["rule_month"] == 5
    assert body["repeats_yearly"] is True