"""
Interest chip tests: how chips are added, shared, and removed, and
proof that one user can never see or change another user's chips.

Setup for every test: hannah owns Emma (cats, travel) and Cameron
(travel), so "travel" is shared. Sam owns Mom, plus his own "cats" chip,
since two users can each have the same label.
"""

import pytest

from config import db
from models import Interest, Recipient


@pytest.fixture
def chips_data(create_user):
    """Create both users' recipients and chips; return the ids the tests need."""
    hannah = create_user("hannah")
    sam = create_user("sam")

    cats = Interest(label="cats", user=hannah)
    travel = Interest(label="travel", user=hannah)
    emma = Recipient(name="Emma", user=hannah)
    cameron = Recipient(name="Cameron", user=hannah)
    emma.interests.extend([cats, travel])
    cameron.interests.append(travel)       # "travel" is shared

    sam_cats = Interest(label="cats", user=sam)
    mom = Recipient(name="Mom", user=sam)
    mom.interests.append(sam_cats)

    db.session.add_all([emma, cameron, mom])
    db.session.commit()
    return {
        "cats_id": cats.id, "travel_id": travel.id, "sam_cats_id": sam_cats.id,
        "emma_id": emma.id, "cameron_id": cameron.id, "mom_id": mom.id,
    }


# ─── ADDING CHIPS ─────────────────────────────────────────────────────

def test_add_chip_cleans_label_and_reuses_existing(client, login_as, chips_data):
    """" CATS " should become "cats" and reuse hannah's chip, not make a duplicate."""
    login_as("hannah")
    response = client.post(
        f"/api/recipients/{chips_data['cameron_id']}/interests", json={"label": " CATS "}
    )

    assert response.status_code == 201
    assert response.get_json()["id"] == chips_data["cats_id"]
    assert Interest.query.filter_by(label="cats").count() == 2   # hannah's + sam's only


def test_add_chip_already_on_recipient_returns_200(client, login_as, chips_data):
    login_as("hannah")
    response = client.post(
        f"/api/recipients/{chips_data['emma_id']}/interests", json={"label": "travel"}
    )

    assert response.status_code == 200
    labels = [i.label for i in db.session.get(Recipient, chips_data["emma_id"]).interests]
    assert labels.count("travel") == 1


def test_add_blank_chip_returns_400(client, login_as, chips_data):
    login_as("hannah")
    response = client.post(
        f"/api/recipients/{chips_data['emma_id']}/interests", json={"label": "   "}
    )

    assert response.status_code == 400


def test_same_label_makes_a_separate_chip_per_user(client, login_as, chips_data):
    """Sam adding "travel" gets his own chip, never hannah's."""
    login_as("sam")
    response = client.post(
        f"/api/recipients/{chips_data['mom_id']}/interests", json={"label": "travel"}
    )

    assert response.status_code == 201
    assert response.get_json()["id"] != chips_data["travel_id"]


# ─── REMOVING CHIPS ───────────────────────────────────────────────────

def test_removing_last_use_deletes_the_chip(client, login_as, chips_data):
    """Only Emma has "cats," so removing it from her deletes the chip entirely."""
    login_as("hannah")
    response = client.delete(
        f"/api/recipients/{chips_data['emma_id']}/interests/{chips_data['cats_id']}"
    )

    assert response.status_code == 204
    assert db.session.get(Interest, chips_data["cats_id"]) is None


def test_removing_shared_chip_keeps_it_for_others(client, login_as, chips_data):
    login_as("hannah")
    response = client.delete(
        f"/api/recipients/{chips_data['emma_id']}/interests/{chips_data['travel_id']}"
    )

    assert response.status_code == 204
    travel = db.session.get(Interest, chips_data["travel_id"])
    assert [r.name for r in travel.recipients] == ["Cameron"]


# ─── THE FILTER ───────────────────────────────────────────────────────

def test_interest_lists_everyone_who_shares_it(client, login_as, chips_data):
    login_as("hannah")
    data = client.get(f"/api/interests/{chips_data['travel_id']}").get_json()

    assert [r["name"] for r in data["recipients"]] == ["Cameron", "Emma"]


# ─── OWNERSHIP ────────────────────────────────────────────────────────

def test_list_only_shows_own_chips(client, login_as, chips_data):
    login_as("sam")
    chips = client.get("/api/interests").get_json()

    assert [c["id"] for c in chips] == [chips_data["sam_cats_id"]]


def test_cannot_view_another_users_chip(client, login_as, chips_data):
    login_as("sam")
    response = client.get(f"/api/interests/{chips_data['travel_id']}")

    assert response.status_code == 404


def test_cannot_add_chip_to_another_users_recipient(client, login_as, chips_data):
    login_as("sam")
    response = client.post(
        f"/api/recipients/{chips_data['emma_id']}/interests", json={"label": "sneaky"}
    )

    assert response.status_code == 404
    assert Interest.query.filter_by(label="sneaky").first() is None


def test_cannot_remove_chip_from_another_users_recipient(client, login_as, chips_data):
    login_as("sam")
    response = client.delete(
        f"/api/recipients/{chips_data['emma_id']}/interests/{chips_data['cats_id']}"
    )

    assert response.status_code == 404
    labels = [i.label for i in db.session.get(Recipient, chips_data["emma_id"]).interests]
    assert "cats" in labels