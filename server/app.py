"""
Entry point for the quietcart backend.

Run from server/ with:  python app.py
Then the API is available at http://localhost:5555/api/...

config.py creates the app and database; auth.py holds signup, login,
logout, and the @login_required decorator. This file holds the
recipient, gift, interest (chip), and dashboard routes.

OWNERSHIP RULE: every query here is filtered by the logged-in user, so
another user's records can't be found at all. Requests for them get
the same 404 as records that don't exist (never a 403, which would
confirm the record exists).
"""

from decimal import Decimal

from flask import g, request

from config import app, db
from auth import auth_bp, login_required
from models import Gift, Interest, Recipient

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


def get_owned_gift(gift_id):
    """Return the logged-in user's gift with this id, or None.

    Gifts have no user_id of their own, so ownership is checked through their recipient:
    join gifts to recipients, then keep only gifts whose recipient belongs to the current user.
    """
    return (
        Gift.query
        .join(Recipient)
        .filter(Gift.id == gift_id, Recipient.user_id == g.current_user.id)
        .first()
    )


def get_owned_interest(interest_id):
    """Return the logged-in user's interest with this id, or None.
    Another user's chip returns None too, so routes respond 404 (not 403)."""
    return Interest.query.filter_by(
        id=interest_id, user_id=g.current_user.id
    ).first()


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
    return [recipient.to_dict() for recipient in recipients], 200       # OK


# CREATE A RECIPIENT
@app.post("/api/recipients")
@login_required
def create_recipient():
    """Add a recipient for the logged-in user. 201, or 400 invalid data."""
    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400     # Bad Request

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
        return {"error": str(err)}, 400     # Bad request

    db.session.add(recipient)
    db.session.commit()
    return recipient.to_dict(), 201     # Created


# SEE INDIVIDUAL RECIPIENT BY ID
@app.get("/api/recipients/<int:recipient_id>")
@login_required
def get_recipient(recipient_id):
    """One recipient with their gifts and spending.
    200, or 404 if it doesn't exist/belongs to another user."""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return {"error": "Recipient not found."}, 404       # Not Found

    data = recipient.to_dict()
    # Checklist order: unpurchased ideas first, then purchased;
    # newest first within each group (a higher id means added later).
    data["gifts"] = [
        gift.to_dict()
        for gift in sorted(recipient.gifts, key=lambda gift: (gift.purchased, -gift.id))    # -gift.id = newer first
    ]
    return data, 200        #OK


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
        return {"error": "Recipient not found."}, 404       # Not Found

    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400     # Bad Request

    try:
        for field in RECIPIENT_FIELDS:
            if field in data:
                setattr(recipient, field, data[field])
    except ValueError as err:
        # Undo any fields already changed in this loop,
        # so a request with one bad field changes nothing at all.
        db.session.rollback()
        return {"error": str(err)}, 400     # Bad Request

    db.session.commit()
    return recipient.to_dict(), 200     # OK


# DELETE A RECIPIENT
@app.delete("/api/recipients/<int:recipient_id>")
@login_required
def delete_recipient(recipient_id):
    """Delete a recipient and, through the cascade, all their gifts."""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return {"error": "Recipient not found."}, 404       # Not Found

    db.session.delete(recipient)
    db.session.commit()
    return "", 204      # No Content


# ─── GIFT ROUTES ──────────────────────────────────────────────────────
# CREATE A GIFT IDEA (used by the gift form and the quick-add button)
@app.post("/api/gifts")
@login_required
def create_gift():
    """Save a gift idea for one of the user's recipients"""
    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400     # Bad Request

    recipient_id = data.get("recipient_id")
    # bool excluded since Python treats True = 1
    if not isinstance(recipient_id, int) or isinstance(recipient_id, bool):
        return {"error": "recipient_id is required."}, 400      # Bad Request

    recipient = get_owned_recipient(recipient_id)   # SECURITY: confirms recipient belongs to this user
    if recipient is None:
        return {"error": "Recipient not found."}, 404      # Not Found

    try:
        gift = Gift(
            name=data.get("name"),
            url=data.get("url"),
            price=data.get("price"),
            notes=data.get("notes"),
            recipient=recipient,
        )
    except ValueError as err:
        return {"error": str(err)}, 400     # Bad request

    db.session.add(gift)
    db.session.commit()
    return gift.to_dict(), 201      # Created


# Fields a user may edit.
# recipient_id left out, so a gift can't move to another user's list
GIFT_FIELDS = ("name", "url", "price", "notes", "purchased")


# EDIT A GIFT, INCLUDING CHECKING IT OFF
@app.patch("/api/gifts/<int:gift_id>")
@login_required
def update_gift(gift_id):
    """Update a gift's editable fields.
    Checking it off is {"purchased": true}."""
    gift = get_owned_gift(gift_id)
    if gift is None:
        return {"error": "Gift not found."}, 404      # Not Found

    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400     # Bad Request

    try:
        for field in GIFT_FIELDS:
            if field in data:
                setattr(gift, field, data[field])
    except ValueError as err:
        # Undo partial changes, one bad field means nothing saves
        db.session.rollback()
        return {"error": str(err)}, 400     # Bad Request

    db.session.commit()
    return gift.to_dict(), 200      # OK


# DELETE A GIFT
@app.delete("/api/gifts/<int:gift_id>")
@login_required
def delete_gift(gift_id):
    gift = get_owned_gift(gift_id)
    if gift is None:
        return {"error": "Gift not found."}, 404      # Not Found

    db.session.delete(gift)
    db.session.commit()
    return "", 204      # No Content


# ─── INTERESTS (chips) ──────────────────────────────────────────────────
# LIST OF ALL INTEREST CHIPS
@app.get("/api/interests")
@login_required
def list_interests():
    """All of the user's chips, alphabetically, each with # recipients that have it"""
    interests = (
        Interest.query.filter_by(user_id=g.current_user.id)
        .order_by(Interest.label)
        .all()
    )
    return [
        {**interest.to_dict(), "recipient_count": len(interest.recipients)}
        for interest in interests
    ], 200      # OK


# ONE INTEREST AND LISTING OF WHO ALL SHARES IT
@app.get("/api/interests/<int:interest_id>")
@login_required
def get_interest(interest_id):
    """One chip plus every recipient who shares it"""
    interest = get_owned_interest(interest_id)
    if interest is None:
        return {"error": "Interest not found."}, 404        # Not Found

    recipients = sorted(interest.recipients, key=lambda r: r.name)
    return {
        **interest.to_dict(),
        "recipients": [recipient.to_dict() for recipient in recipients],
    }, 200      #OK


# ADD A CHIP TO A RECIPIENT
@app.post("/api/recipients/<int:recipient_id>/interests")
@login_required
def add_interest(recipient_id):
    """ Add a chip to a recipient by its label;
    re-uses existing chip with that label if it exists, or creates a new one"""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return{"error": "Recipient not found."}, 404     # Not Found

    data = get_json_body()
    if data is None:
        return {"error": "Request body must be JSON."}, 400     # Bad Request

    try:
        label = Interest.clean_label(data.get("label"))
    except ValueError as err:
        return {"error": str(err)}, 400     # Bad Request

    # Find-or-Create: search only this user's chips
    interest = Interest.query.filter_by(
            user_id=g.current_user.id, label=label
    ).first()
    if interest is None:
        interest = Interest(label=label, user=g.current_user)
        db.session.add(interest)

    # Already on this recipient: nothing to change/no error
    if interest in recipient.interests:
        return interest.to_dict(), 200      #OK

    recipient.interests.append(interest)        # creates the link row
    db.session.commit()
    return interest.to_dict(), 201      # Created


# REMOVE A CHIP FROM A RECIPIENT
@app.delete("/api/recipients/<int:recipient_id>/interests/<int:interest_id>")
@login_required
def remove_interest(recipient_id, interest_id):
    """Remove a chip from a recipient; if no other recipients share it, it is deleted entirely"""
    recipient = get_owned_recipient(recipient_id)
    if recipient is None:
        return {"error": "Recipient not found."}, 404       # Not Found

    interest = get_owned_interest(interest_id)
    if interest is None or interest not in recipient.interests:
        return {"error": "Interest not found."}, 404       # Not Found

    recipient.interests.remove(interest)        # deletes link row

    # back_populats keeps interest.recipients in sync, so this sees the removal:
    if not interest.recipients:
        db.session.delete(interest)

    db.session.commit()
    return "", 204      # No Content


# ─── DASHBOARD ROUTE ──────────────────────────────────────────────────
# How many recent ideas the homepage shows
RECENT_IDEAS_LIMIT = 5


# VIEW THE DASHBOARD/HOMEPAGE
@app.get("/api/dashboard")
@login_required
def dashboard():
    """Everything the homepage needs in one request.
    Built for quick checks while shopping: "what's on everyone's list?"
        - recipients: each recipient with budget, spent, and unpurchased ideas
        - totals: overall numbers for the summary cards
        - recent_ideas: the newest unpurchased ideas, each with its recipient's name
    """
    # RECIPIENT SUMMARIES:
    recipients = (
        Recipient.query
        .filter_by(user_id=g.current_user.id)       # only this user's recipients
        .order_by(Recipient.name)
        .all()
    )
    recipient_summaries = []
    for recipient in recipients:
        summary = recipient.to_dict()
        # only what's left to buy, newest first:
        summary["ideas"] = [
            gift.to_dict()
            for gift in sorted(recipient.gifts, key=lambda gift: -gift.id)
            if not gift.purchased
        ]
        recipient_summaries.append(summary)

    # TOTALS:
    # Decimal start values to keep money sums exact
    total_budget = sum(
        (r.budget for r in recipients if r.budget is not None),
        Decimal("0")
    )
    total_spent = sum((r.spent for r in recipients), Decimal("0"))

    # RECENTLY SAVED:
    # Same ownership join as get_owned_gift: only gifts whose recipient belongs to this user.
    # Purchased gifts are skipped.
    recent_gifts = (
        Gift.query
        .join(Recipient)
        .filter(Recipient.user_id == g.current_user.id, Gift.purchased.is_(False))
        .order_by(Gift.created_at.desc(), Gift.id.desc())
        .limit(RECENT_IDEAS_LIMIT)
        .all()
    )
    recent_ideas = []
    for gift in recent_gifts:
        idea = gift.to_dict()
        # add the name so the page shows 'Pottery class · Emma":
        idea["recipient_name"] = gift.recipient.name
        recent_ideas.append(idea)

    return {
        "recipients": recipient_summaries,
        "totals": {
            "recipients": len(recipients),
            "ideas": sum(r.idea_count for r in recipients),
            "budget": float(total_budget),
            "spent": float(total_spent),
        },
        "recent_ideas": recent_ideas,
    }, 200      # OK


# Only start the server when this file is run directly (not when it's imported).
if __name__ == "__main__":
    app.run(port=5555, debug=True)
