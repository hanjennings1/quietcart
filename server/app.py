"""
Entry point for the quietcart backend.

Run from server/ with:  python app.py
Then the API is available at http://localhost:5555/api/...

config.py creates the app and database; this file plugs in the route
groups (blueprints) and starts the server. Recipient, gift, and
dashboard routes are added here on Wednesday.
"""

from config import app
from auth import auth_bp

# Plug in the auth routes: /api/signup, /api/login, /api/logout, & /api/check_session.
app.register_blueprint(auth_bp)

# Only start the server when this file is run directly (not when it's imported).
if __name__ == "__main__":
    app.run(port=5555, debug=True)