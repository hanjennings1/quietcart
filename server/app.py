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
from flask import g, request

from config import app, db
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


def get_json_body():
    """The request's JSON body as a dict, or None if it's missing or
    isn't a JSON object (e.g., invalid JSON or a list)."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


# ─── RECIPIENT ROUTES ─────────────────────────────────────────────────
# SEE LIST OF RECIPIENTS FOR THIS USER
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
    return [recipient.to_dict() for recipient in recipients], 200


# CREATE A RECIPIENT
@app.post("/api/recipients")
@login_required
def create_recipient():
    """Add a recipient for the logged-in user. 201, or 400 invalid data."""
    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400

    try:
        # Model validators run here (name required, budget not negative, etc.),
        # and raise ValueError with a readable message.
        recipient = Recipient(
            name=data.get("name"),
            relationship=data.get("relationship"),
            budget=data.get("budget"),
            notes=data.get("notes"),
            user=g.current_user,      # SECURITY: owner comes from the session, not request body
        )
    except ValueError as err:
        return {"error": str(err)}, 400

    db.session.add(recipient)
    db.session.commit()
    return recipient.to_dict(), 201


# SEE INDIVIDUAL RECIPIENT BY ID
@app.get("/api/recipients/<int:recipient_id>")
@login_required
def get_recipient(recipient_id):
    """One recipient with their gifts and spending.
    200, or 404 if it doesn't exist/belongs to another user."""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return {"error": "Recipient not found."}, 404

    data = recipient.to_dict()
    # Checklist order: unpurchased ideas first, then purchased;
    # newest first within each group (a higher id means added later).
    data["gifts"] = [
        gift.to_dict()
        for gift in sorted(recipient.gifts, key=lambda gift: (gift.purchased, -gift.id))    # -gift.id = newer first
    ]
    return data, 200


# Fields a user may edit.
# Anything else in the body is ignored
RECIPIENT_FIELDS = ("name", "relationship", "budget", "notes")


# EDIT A RECIPIENT  (can only edit fields listed above)
@app.patch("/api/recipients/<int:recipient_id>")
@login_required
def update_recipient(recipient_id):
    """Update any of a recipient's editable fields. 200, 400, or 404."""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return {"error": "Recipient not found."}, 404

    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400

    try:
        for field in RECIPIENT_FIELDS:
            if field in data:
                setattr(recipient, field, data[field])
    except ValueError as err:
        # Undo any fields already changed in this loop,
        # so a request with one bad field changes nothing at all.
        db.session.rollback()
        return {"error": str(err)}, 400

    db.session.commit()
    return recipient.to_dict(), 200


# DELETE A RECIPIENT
@app.delete("/api/recipients/<int:recipient_id>")
@login_required
def delete_recipient(recipient_id):
    """Delete a recipient and, through the cascade, all their gifts."""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return {"error": "Recipient not found."}, 404

    db.session.delete(recipient)
    db.session.commit()
    return "", 204


# Only start the server when this file is run directly (not when it's imported).
if __name__ == "__main__":
    app.run(port=5555, debug=True)