# quietcart

*your private shopping list for the people you love*

quietcart is a year-round gift planner. Save gift ideas the moment someone mentions them, set a budget for each person, tag them with interest chips, and check gifts off as you buy them. Every list is private to its owner's account.

**Stack:** Flask · PostgreSQL · SQLAlchemy · React (Vite) · React Router · Material UI · session-based auth

## Features

- Sign up, log in, and stay logged in after a refresh (session cookies)
- Add, edit, and delete recipients, the people you shop for
- Save gift ideas with an optional link, price, and notes, from a recipient's page or the **+ Idea** button on any page
- Check off purchased gifts (they move to the bottom, grayed out)
- A budget per recipient with spent vs. budget; leave it blank for no limit, and spending over a budget shows in red
- Interest chips (many-to-many): tag recipients, see everyone who shares an interest, and filter by shared interests
- A dashboard with totals, each recipient's chips and unpurchased ideas, and recently saved ideas
- Ownership rules: users can only ever reach their own data (other users' records return 404)

## Setup

You'll need Python 3, Pipenv, Node.js, and PostgreSQL.

### 1. Clone the repo

```bash
git clone https://github.com/hanjennings1/quietcart.git
cd quietcart
```

### 2. Backend

```bash
cd server
pipenv install
```

Create two databases, one for development and one for tests:

```bash
createdb quietcart_dev
createdb quietcart_test
```

Create `server/.env` (never commit this file):

```
SECRET_KEY=any-long-random-string
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/quietcart_dev
TEST_DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/quietcart_test
```

To generate a `SECRET_KEY`, run: `python3 -c "import secrets; print(secrets.token_hex(32))"`

Build the tables, add sample data, and start the API:

```bash
pipenv run flask db upgrade
pipenv run python seed.py
pipenv run python app.py
```

The API runs at `http://localhost:5555`.

### 3. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` requests to Flask, so both servers need to be running.

### 4. Log in with sample data

| Username | Password | What's there |
|---|---|---|
| `hannah` | `giftsecret1` | 3 recipients with gifts, budgets, and interest chips |
| `sam` | `giftsecret1` | 1 recipient, used to test that users can't see each other's data |

### 5. Run the tests

```bash
cd server
pipenv run pytest
```

There are 32 tests covering authentication, ownership rules, and interest chips. They use `quietcart_test`, so your development data is never touched.

## API routes

All routes start with `/api` and return errors as `{"error": "message"}`. Every route except signup, login, and check_session requires a logged-in user (401 otherwise). Another user's records return 404.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/signup` | Create an account and log in |
| POST | `/api/login` | Log in |
| DELETE | `/api/logout` | Log out |
| GET | `/api/check_session` | Return the logged-in user |
| GET | `/api/recipients` | List recipients with budget, spent, idea count, and interests |
| POST | `/api/recipients` | Add a recipient |
| GET | `/api/recipients/<id>` | One recipient with gifts, spending, and interests |
| PATCH | `/api/recipients/<id>` | Update a recipient |
| DELETE | `/api/recipients/<id>` | Delete a recipient and their gifts |
| POST | `/api/gifts` | Save a gift idea |
| PATCH | `/api/gifts/<id>` | Update a gift, including checking it off |
| DELETE | `/api/gifts/<id>` | Delete a gift |
| GET | `/api/interests` | List interest chips with how many recipients share each |
| GET | `/api/interests/<id>` | One interest and everyone who shares it |
| POST | `/api/recipients/<id>/interests` | Add an interest to a recipient (reuses an existing label) |
| DELETE | `/api/recipients/<id>/interests/<interest_id>` | Remove an interest (deleted when no one has it) |
| GET | `/api/dashboard` | Totals, each recipient's ideas and interests, recent ideas |

## Project structure

```
quietcart/
├── server/
│   ├── config.py       # app, database, and session settings
│   ├── models.py       # User, Recipient, Gift, Interest + recipient_interests
│   ├── auth.py         # signup, login, logout, check_session, @login_required
│   ├── app.py          # recipient, gift, interest, and dashboard routes
│   ├── seed.py         # sample data
│   ├── migrations/     # Flask-Migrate (Alembic)
│   └── tests/          # pytest
└── client/
    └── src/
        ├── api.js      # apiFetch: one helper for every request
        ├── theme.js    # MUI theme and recipient colors
        ├── context/    # AuthContext (logged-in user)
        ├── components/ # shared components (BudgetBar, GiftForm, InterestChips, ...)
        └── pages/      # one file per route
```

## Known bugs and limitations

- Recipient colors repeat after six recipients (colors are assigned by id).
- Interest chips are displayed in lowercase (labels are lowercased so "Cats" and "cats" count as the same chip).
- The browser console shows suggestions about form fields missing `id`/`name`/`autocomplete` attributes.
- The tagline wraps onto two lines on the login card at some screen sizes.
- The Recipients filter row shows only interests shared by 2+ recipients; a "show all" option is planned if the row gets long.
- Not yet deployed; runs locally only.

## Coming in Week 2

Occasions (birthdays and holidays) with countdowns and a calendar view, a dashboard upgrade, styling polish, and deployment to Render.