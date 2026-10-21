"""
Tests for authentication: signup, login, logout, check_session, and
the @login_required protection. Each test starts with empty tables.
"""

from models import User


# ─── HELPERS ──────────────────────────────────────────────────────────

def login(client, username="hannah", password="giftsecret1"):
    """Log in through the real route, so the test client stores the
    session cookie just like a browser would."""
    return client.post("/api/login", json={"username": username, "password": password})


# ─── SIGNUP ───────────────────────────────────────────────────────────

def test_signup_creates_user_and_logs_in(client):
    response = client.post("/api/signup", json={"username": "hannah", "password": "giftsecret1"})

    assert response.status_code == 201
    assert response.get_json()["username"] == "hannah"
    # Signing up should also log the user in
    assert client.get("/api/check_session").status_code == 200


def test_signup_never_returns_password_hash(client):
    response = client.post("/api/signup", json={"username": "hannah", "password": "giftsecret1"})

    assert "password_hash" not in response.get_json()


def test_password_is_stored_hashed(client):
    client.post("/api/signup", json={"username": "hannah", "password": "giftsecret1"})

    user = User.query.filter_by(username="hannah").first()
    assert user.password_hash != "giftsecret1"
    assert user.password_hash.startswith("$2b$")   # Bcrypt's format


def test_signup_rejects_taken_username(client, create_user):
    create_user("hannah")
    response = client.post("/api/signup", json={"username": "hannah", "password": "different123"})

    assert response.status_code == 409


def test_signup_rejects_short_password(client):
    response = client.post("/api/signup", json={"username": "hannah", "password": "short"})

    assert response.status_code == 400
    assert "8 characters" in response.get_json()["error"]


def test_signup_requires_username_and_password(client):
    response = client.post("/api/signup", json={"username": "hannah"})

    assert response.status_code == 400


# ─── LOGIN AND LOGOUT ─────────────────────────────────────────────────

def test_login_with_correct_password(client, create_user):
    create_user("hannah")
    response = login(client)

    assert response.status_code == 200
    assert client.get("/api/check_session").get_json()["username"] == "hannah"


def test_login_errors_dont_reveal_which_usernames_exist(client, create_user):
    """A wrong password and an unknown username must look identical."""
    create_user("hannah")
    wrong_password = login(client, "hannah", "wrongpassword")
    unknown_user = login(client, "nobody", "wrongpassword")

    assert wrong_password.status_code == unknown_user.status_code == 401
    assert wrong_password.get_json() == unknown_user.get_json()


def test_logout_clears_session(client, create_user):
    create_user("hannah")
    login(client)

    assert client.delete("/api/logout").status_code == 204
    assert client.get("/api/check_session").status_code == 401


# ─── PROTECTED ROUTES ─────────────────────────────────────────────────

def test_private_routes_require_login(client):
    """Every private route should return 401 when no one is logged in."""
    private_requests = [
        client.get("/api/recipients"),
        client.post("/api/recipients", json={"name": "Emma"}),
        client.get("/api/dashboard"),
        client.post("/api/gifts", json={"recipient_id": 1, "name": "Mug"}),
    ]
    for response in private_requests:
        assert response.status_code == 401