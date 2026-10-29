# quietcart

*your private shopping list for the people you love*

**Live demo:** https://quietcart-hi5t.onrender.com
*(free hosting: the first visit after a quiet spell can take about a minute to wake up)*

quietcart is a year-round gift planner. The best gift ideas come up in passing ("I'd love to try pottery someday"), then get lost by the time a birthday arrives. quietcart gives every person you shop for a private list: save ideas the moment they're mentioned, set a budget per person, tag them with interests, plan for birthdays and holidays with countdowns and a calendar, and check gifts off as you buy them. Every list is private to its owner's account.

## Screenshots

| Dashboard | Recipient page | Calendar |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Recipient page](docs/screenshots/recipient.png) | ![Calendar](docs/screenshots/calendar.png) |

## Features

**Accounts and privacy**
- Sign up, log in, and stay logged in after a refresh (session cookies)
- Every recipient, gift, interest, and occasion is private to its owner; another user's records return 404, so the app never confirms they exist

**Recipients and gift ideas**
- Add, edit, and delete recipients, each with their own color (9-color palette; the least-used color is suggested)
- Save gift ideas with an optional link, price, and notes, from a recipient's page or the **+ Idea** button on any page
- Check off purchased gifts (they move to the bottom, grayed out)
- A budget per recipient with spent vs. budget; leave it blank for no limit, and spending over a budget shows in red
- Search recipients by name, relationship, or interest

**Interests (many-to-many)**
- Tag recipients with interest chips; typing an existing label reuses it instead of creating a duplicate
- See everyone who shares an interest, and filter by interests shared by 2+ recipients

**Occasions and planning**
- Birthdays (linked to one recipient) and holidays (for anyone), one-time or yearly
- Countdowns ("In 6 days"), with gift ideas assigned to an occasion
- A month calendar with each day's occasions; click a day to add one, or a label to edit it

**Dashboard**
- Totals, a **Coming up** list of the next 3 occasions, each recipient's chips and top ideas, and recently saved ideas

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Python, Flask, Flask-SQLAlchemy, Flask-Migrate (Alembic), Flask-Bcrypt, Flask sessions, psycopg 3, gunicorn |
| Database | PostgreSQL (Neon in production) |
| Frontend | React (Vite), React Router, React Context, Material UI, dayjs |
| Testing | pytest (52 tests), Postman, curl |
| Deployment | Render (web service) + Neon (database) |

## Setup

You'll need Python 3.12, Pipenv, Node.js, and PostgreSQL.

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
| `hannah` | `giftsecret1` | 3 recipients with gifts, budgets, interests, birthdays, a housewarming, and Christmas |
| `sam` | `giftsecret1` | 1 recipient with a birthday, used to test that users can't see each other's data |

### 5. Run the tests

```bash
cd server
pipenv run pytest
```

52 tests cover authentication, ownership rules, interest chips, occasions, and recipient colors. They use `quietcart_test`, so your development data is never touched.

## API routes

All routes start with `/api` and return errors as `{"error": "message"}`. Every route except signup, login, and check_session requires a logged-in user (401 otherwise). Another user's records return 404.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/signup` | Create an account and log in |
| POST | `/api/login` | Log in |
| DELETE | `/api/logout` | Log out |
| GET | `/api/check_session` | Return the logged-in user |
| GET | `/api/recipients` | List recipients with budget, spent, color, idea count, and interests |
| POST | `/api/recipients` | Add a recipient (the least-used color is picked if none is sent) |
| GET | `/api/recipients/<id>` | One recipient with gifts, spending, interests, occasions, and holidays |
| PATCH | `/api/recipients/<id>` | Update a recipient, including their color |
| DELETE | `/api/recipients/<id>` | Delete a recipient with their gifts and occasions |
| POST | `/api/gifts` | Save a gift idea (optionally for an occasion) |
| PATCH | `/api/gifts/<id>` | Update a gift: check it off, or assign it to an occasion |
| DELETE | `/api/gifts/<id>` | Delete a gift |
| GET | `/api/interests` | List interest chips with how many recipients share each |
| GET | `/api/interests/<id>` | One interest and everyone who shares it |
| POST | `/api/recipients/<id>/interests` | Add an interest to a recipient (reuses an existing label) |
| DELETE | `/api/recipients/<id>/interests/<interest_id>` | Remove an interest (deleted when no one has it) |
| GET | `/api/occasions` | List occasions, soonest first, with countdowns |
| POST | `/api/occasions` | Add a birthday (with `recipient_id`) or holiday (without) |
| GET | `/api/occasions/<id>` | One occasion with its assigned gifts |
| PATCH | `/api/occasions/<id>` | Update an occasion |
| DELETE | `/api/occasions/<id>` | Delete an occasion (its gifts are kept, just unassigned) |
| GET | `/api/dashboard` | Totals, each recipient's ideas, recent ideas, and upcoming occasions |

## Project structure

```
quietcart/
├── server/
│   ├── config.py         # app, database, session settings; serves the React build
│   ├── models.py         # User, Recipient, Gift, Interest, Occasion + recipient_interests
│   ├── auth.py           # signup, login, logout, check_session, @login_required
│   ├── app.py            # recipient, gift, interest, occasion, and dashboard routes
│   ├── seed.py           # sample data
│   ├── requirements.txt  # for Render (generated from Pipfile.lock)
│   ├── migrations/       # Flask-Migrate (Alembic)
│   └── tests/            # pytest
└── client/
    └── src/
        ├── api.js        # apiFetch: one helper for every request
        ├── theme.js      # MUI theme and the 9 recipient colors
        ├── context/      # AuthContext (logged-in user)
        ├── components/   # AppLayout, BudgetBar, GiftForm, InterestChips, MonthGrid, OccasionDialog, ...
        └── pages/        # one file per route
```

## Deployment

quietcart runs on **Render** (web service) with a **Neon** PostgreSQL database. In production, Flask serves the built React app, so the site and API share one domain (required for the session cookie).

- **Build command:** `pip install -r server/requirements.txt && npm install --prefix client && npm run build --prefix client && cd server && flask db upgrade`
- **Start command:** `gunicorn --chdir server app:app`
- **Environment variables:** `DATABASE_URL` (Neon connection string), `SECRET_KEY`, `PYTHON_VERSION=3.12.14`

After adding a Python package with `pipenv install`, regenerate the requirements file:

```bash
cd server
pipenv requirements > requirements.txt
```

## Known limitations

- Interest chips display in lowercase (labels are lowercased so "Cats" and "cats" count as the same chip).
- A yearly occasion on Feb 29 doesn't appear on the calendar grid in non-leap years (its countdown treats it as Feb 28).
- The Recipients page only shows interests shared by 2+ recipients in its filter row.
- Deleting a recipient also deletes their gift history.
- Budgets and prices are in USD only.
- On the free hosting plan, the first visit after 15 idle minutes takes about a minute to load.

## Future ideas

- Gift history with a "given before" warning, and archiving recipients instead of deleting them
- Rule-based dates for moving holidays (like Mother's Day)
- Account settings (change password, delete account)
- Occasions listed beside the calendar instead of below it
- A seasonal Winter theme toggle