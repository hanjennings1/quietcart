"""
Shared test setup for quietcart, loaded automatically by pytest.

Tests run against a separate database (TEST_DATABASE_URL in .env), so
they never touch the development data in quietcart_dev. Every test
gets fresh, empty tables.
"""

import os

import pytest
from dotenv import load_dotenv

# POINT THE APP AT THE TEST DATABASE:
# This must happen BEFORE the app is imported, because config.py reads
# DATABASE_URL the moment it's imported. load_dotenv() won't overwrite
# a value that's already set, so the test URL wins.
load_dotenv()
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]

# Safety check: stop immediately if this isn't a test database, since
# the fixtures below delete every table.
assert "test" in os.environ["DATABASE_URL"], "Tests must use a test database!"


from app import app  # noqa: E402
from config import db  # noqa: E402
from models import User # noqa: E402

@pytest.fixture
def client():
    """A test client with fresh, empty tables for each test.

    The client keeps cookies between requests (like Postman), so a test
    can log in and stay logged in for its later requests.
    """
    app.config["TESTING"] = True  # errors show up in tests instead of being hidden

    with app.app_context():
        db.drop_all()    # clear anything a crashed earlier run left behind
        db.create_all()  # build empty tables straight from the models

        yield app.test_client()  # the test runs here

        # Clean up after the test, pass or fail
        db.session.remove()
        db.drop_all()

@pytest.fixture
def create_user(client):
    """A factory for making users in a test: create_user("sam").

    Returns a function instead of a single user, so one test can create
    as many users as it needs (e.g., two users for ownership tests).
    Every user gets the same password unless another is given.
    """
    def _create_user(username="hannah", password="giftsecret1"):
        user = User(username=username)
        user.set_password(password)   # hashed, the same way signup does it
        db.session.add(user)
        db.session.commit()
        return user

    return _create_user