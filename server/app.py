"""
Entry point for the quietcart backend.

Run from server/ with:  python app.py
Then the API is available at http://localhost:5555/api/...

config.py creates the app and database; auth.py holds signup, login,
logout, and the @login_required decorator. This file holds the
recipient, gift, and dashboard routes.

OWNERSHIP RULE: every query here is filtered by the logged-in user, so
another user's records can't be found at all. Requests for them get
the same 404 as records that don't exist (never a 403, which would
confirm the record exists).
"""
from flask import g 

from config import app
from auth import auth_bp, login_required
from models import Recipient

# Plug in the auth routes: /api/signup, /api/login, /api/logout, & /api/check_session.
app.register_blueprint(auth_bp)


# ─── OWNERSHIP HELPERS ────────────────────────────────────────────────
# Every route that touches one record goes through these, 
# so the ownership rule is written once instead of repeated in every route
def get_owned_recipient(recipient_id):
    """Return the logged-in user's recipient with this id, or None.

    None covers both "doesn't exist" and "belongs to someone else";
    routes turn either into the same 404.
    """
    return Recipient.query.filter_by(
        id=recipient_id, user_id=g.current_user.id
    ).first()


# ─── RECIPIENT ROUTES ─────────────────────────────────────────────────
@app.get("/api/recipients")
@login_required
def list_recipients():
    """All of the logged-in user's recipients, alphabetical by name.
    Each includes budget, spent, and idea_count (from Recipient.to_dict).
    """
    recipients = (
        Recipient.query
        .filter_by(user_id=g.current_user.id)   # only this user's recipients
        .order_by(Recipient.name)
        .all()
    )
    return[recipient.to_dict() for recipient in recipients], 200


# Only start the server when this file is run directly (not when it's imported).
if __name__ == "__main__":
    app.run(port=5555, debug=True)