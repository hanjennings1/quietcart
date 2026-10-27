import os

from dotenv import load_dotenv
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData

# Read SECRET_KEY and DATABASE_URL from the .env file
load_dotenv()

# FRONTEND BUILD: `npm run build` puts the finished React files in client/dist.
# Flask serves them, so the site and the API share one address (needed for the session cookie).
# static_url_path="" serves them from the site root (/assets/..., not /static/assets/...).
CLIENT_DIST = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
app = Flask(__name__, static_folder=CLIENT_DIST, static_url_path="")

# Secrets come from .env, never from the code itself
app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Session cookie security
app.config["SESSION_COOKIE_HTTPONLY"] = True        # JS in browser can't read the cookie
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"       # protects against CSRF attacks

# Online, the site is HTTPS, so the cookie should only ever travel over HTTPS.
# Render sets a RENDER environment variable automatically; locally it doesn't exist,
# so the cookie still works on http://localhost during development.
app.config["SESSION_COOKIE_SECURE"] = "RENDER" in os.environ

# Predictable names for constraints, so migrations stay clean
metadata = MetaData(naming_convention={
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
})

db = SQLAlchemy(metadata=metadata)
db.init_app(app)

migrate = Migrate(app, db)
bcrypt = Bcrypt(app)


# Import models last, so Flask-Migrate can detect every table.
# (At the bottom, not the top, to avoid a circular import: models.py itself imports db from this file.)
import models  # noqa: E402,F401