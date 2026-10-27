"""
Recipient color tests: the least-used color is picked when none is sent,
a chosen color is kept, and colors outside 0–8 are rejected.
"""

from config import db
from models import Recipient


def test_new_recipients_get_least_used_colors(client, create_user, login_as):
    """With no color sent, the first three recipients get colors 0, 1, 2."""
    create_user("hannah")
    login_as("hannah")

    colors = [
        client.post("/api/recipients", json={"name": name}).get_json()["color"]
        for name in ("Ava", "Ben", "Cal")
    ]

    assert colors == [0, 1, 2]


def test_least_used_skips_a_chosen_color(client, create_user, login_as):
    """If someone picked color 0, the next automatic one skips it."""
    create_user("hannah")
    login_as("hannah")
    client.post("/api/recipients", json={"name": "Ava", "color": 0})

    response = client.post("/api/recipients", json={"name": "Ben"})

    assert response.get_json()["color"] == 1


def test_chosen_color_is_kept(client, create_user, login_as):
    create_user("hannah")
    login_as("hannah")

    response = client.post("/api/recipients", json={"name": "Ava", "color": 7})

    assert response.status_code == 201
    assert response.get_json()["color"] == 7


def test_color_out_of_range_returns_400(client, create_user, login_as):
    create_user("hannah")
    login_as("hannah")

    response = client.post("/api/recipients", json={"name": "Ava", "color": 9})

    assert response.status_code == 400
    assert Recipient.query.filter_by(name="Ava").first() is None


def test_color_can_be_changed(client, create_user, login_as):
    create_user("hannah")
    login_as("hannah")
    ava_id = client.post("/api/recipients", json={"name": "Ava"}).get_json()["id"]

    response = client.patch(f"/api/recipients/{ava_id}", json={"color": 4})

    assert response.status_code == 200
    assert db.session.get(Recipient, ava_id).color == 4