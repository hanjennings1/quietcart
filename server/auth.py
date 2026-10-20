"""
Authentication for quietcart: signup, login, logout, session check,
and the @login_required decorator that protects every private route.

How it works: 
On signup or login, the user's id is stored in Flask's session, 
a cookie signed with SECRET_KEY (so it can't be faked) and
marked HttpOnly (so JavaScript can't read it). 
The browser sends it with every request, and 
@login_required checks it before private routes run.
"""

from functools import wraps
from flask import Blueprint, g, request, session
from sqlalchemy.exc import IntegrityError

from config import db
from models import User

# Every route here is groupeed under /api; registered on the app in app.py
auth_bp = Blueprint("auth", __name__, url_prefix="/api")


# ─── DECORATOR ────────────────────────────────────────────────────────
def login_required(func):
    """Protect a route: 401 unless someone is logged in.

    On success, the logged-in user is available to the route as
    g.current_user ("g" is Flask's per-request storage), 
    so routes never have to look the user up themselves.
    """
    @wraps(func)        #k keeps the route's own name (Flask needs unique names)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        user = db.session.get(User, user_id) if user_id else None

        if user is None:
            # Covers "never logged in" and "account no longer exists"
            session.clear()
            return {"error" : "Please log in."}, 401

        g.current_user = user
        return func(*args, **kwargs)

    return wrapper


# ─── HELPERS ────────────────────────────────────────────────────────
def get_credentials():
    """Read username and password from the JSON body, or None if missing.

    silent=True returns None instead of crashing when the body isn't
    valid JSON, so bad requests get a clean 400 instead of a 500.
    """
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password  = data.get("password")
    if not isinstance(username, str) or not isinstance (password, str):
        return None, None
    return username, password

def start_session(user):
    """Log a user in by remembering their if in the session cookie"""
    # Clear first, so no data from a previous session carries over
    session.clear()
    session["user_id"] = user.id


# ─── ROUTES ────────────────────────────────────────────────────────
@auth_bp.post("/signup")
def signup():
    """Create an account and log in. 201, 400 invalid data, 409 taken."""
    username, password = get_credentials()
    if username is None:
        return {"error": "Username and password are required."}, 400    #Bad Request

    try:        # model validators run here:
        user = User(username=username)
        user.set_password(password)
    except ValueError as err:
        return {"error": str(err)}, 400    #Bad Request

    # Friednly check for a taken username:
    if User.query.filter_by(username=user.username).first():
        return {"error": "That username is taken."}, 409        #Conflict

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        # Backstop: the db's unique rule caught a duplicate (that slipped past above)
        db.session.rollback()
        return {"error": "That username is taken."}, 409        #Conflict

    start_session(user)
    return user.to_dict(), 201      #Created

@auth_bp.post("/login")
def login():
    """Log in. 200 with the user, or 401 with one generic error."""
    username, password = get_credentials()
    user = User.query.filter_by(username=username.strip()).first() if username else None

    # Same message: whether username/password is wrong (so app doesn't reveal existent usernames)
    if user is None or not user.check_password(password):
        return {"error": "Invlaid username or password."}, 401      #Unauthorized

    start_session(user)
    return user.to_dict(), 200      # OK

@auth_bp.delete("/logout")
def logout():
    """Log out by clearing the session. 
    Always 204, even if no one was logged in, so logging out twice is harmless."""
    session.clear()
    return "", 204      #No Content

@auth_bp.get("/check_session")
def check_session():
    user_id = session.get("user_id")
    user = db.session.get(User, user_id) if user_id else None
    if user is None:
        return {"error": "Not logged in."}, 401        #Unauthorized
    return user.to_dict(), 200      #OK
