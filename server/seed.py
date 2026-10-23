"""
Seed the database with sample data for development and testing.

Run from server/ with:  python seed.py

WARNING: deletes all existing data first, so only use it on the
development database, never on real users' data.

Two users are created on purpose, so ownership rules can be tested
(e.g., log in as sam and confirm hannah's gifts return 404).
"""

from config import app, db
from models import User, Recipient, Gift, Interest, recipient_interests


def clear_data():
    """Delete every row, children first, so no foreign key points
    to a row that no longer exists."""
    # Link rows first: they point at both recipients and interests
    db.session.execute(db.delete(recipient_interests))
    db.session.execute(db.delete(Gift))
    db.session.execute(db.delete(Recipient))
    # Interests point at users, so they go before users
    db.session.execute(db.delete(Interest))
    db.session.execute(db.delete(User))
    db.session.commit()


def create_user(username, password):
    """Create a user the same way signup will: through set_password(),
    so seeded passwords are hashed like real ones."""
    user = User(username=username)
    user.set_password(password)
    return user


def seed():
    print("Clearing old data...")
    clear_data()

    print("Creating users...")
    # Both share one easy dev password for Postman testing.
    hannah = create_user("hannah", "giftsecret1")
    sam = create_user("sam", "giftsecret1")

    print("Creating recipients and gifts...")
    # HANNAH'S RECIPIENTS:
    # Adding to user.recipients sets each recipient's user automatically
    # (back_populates), so user_id never has to be set by hand.
    erin = Recipient(
        name="Erin", relationship="sister", budget=50,
        notes="Favorite colors: blue or rainbow. Loves the WNBA and NYC.",
    )
    erin.gifts.extend([
        Gift(name="NY Liberty jersey", price="64.99",
             url="https://www.wnba.com", notes="Size M"),
        Gift(name="Cooperative board game", price=30),
    ])

    emma = Recipient(
        name="Emma", relationship="sister", budget=60,
        notes="Fairies, pink, cats, fun drinks.",
    )
    emma.gifts.extend([
        # purchased=True also stamps purchased_at (see Gift's validator),
        # so the checklist and spent total have real data to show.
        Gift(name="Cat mug", price="18.50", purchased=True),
        Gift(name="Fairy string lights", price=25),
        Gift(name="Pottery class", notes="She mentioned it in passing!"),
    ])

    cameron = Recipient(
        name="Cameron", relationship="friend",  # no budget on purpose
        notes="Star Wars, pizza, Japan, travel, outdoors.",
    )
    cameron.gifts.append(Gift(name="Lego X-wing", price=49.99))

    hannah.recipients.extend([erin, emma, cameron])

    print("Creating interests...")
    # HANNAH'S INTERESTS:
    # Each chip is created once, then shared. "travel" goes on both
    # Emma and Cameron, so the "who shares this interest?" filter has data.
    board_games = Interest(label="board games")
    basketball = Interest(label="basketball")
    nyc = Interest(label="nyc")
    cats = Interest(label="cats")
    whimsical = Interest(label="whimsical")
    crafts = Interest(label="crafts")
    star_wars = Interest(label="star wars")
    travel = Interest(label="travel")
    video_games = Interest(label="video games")

    # Adding to user.interests sets each chip's user (back_populates)
    hannah.interests.extend(
        [board_games, basketball, nyc, cats, whimsical, crafts, star_wars, travel, video_games]
    )

    # Appending to recipient.interests creates the link rows in recipient_interests
    erin.interests.extend([basketball, nyc, board_games])
    emma.interests.extend([cats, whimsical, crafts, travel])
    cameron.interests.extend([star_wars, travel, video_games])


    # SAM'S RECIPIENTS:
    # A second account's data, used to test that users can't see each other's lists.
    mom = Recipient(name="Mom", relationship="mother", budget=75)
    mom.gifts.append(Gift(name="Gardening gloves", price=22))
    sam.recipients.append(mom)

    # SAM'S INTERESTS:
    # Sam also has a "cats" chip: the same label is allowed for two different users
    # (the unique rule is per user), and the ownership tests can confirm sam never sees hannah's chips.
    gardening = Interest(label="gardening")
    sam_cats = Interest(label="cats")
    sam.interests.extend([gardening, sam_cats])
    mom.interests.extend([gardening, sam_cats])

    # Saving the users also saves their recipients and gifts, because of cascade="all, delete-orphan".
    db.session.add_all([hannah, sam])
    db.session.commit()


    # FINAL PRINT:
    print(f"Done! {User.query.count()} users, "
            f"{Recipient.query.count()} recipients, {Gift.query.count()} gifts, "
            f"{Interest.query.count()} interests.")


# Only runs when this file is executed directly (python seed.py),
# not when it's imported somewhere else, like a test file.
if __name__ == "__main__":
    # Database work needs an app context: it tells Flask which app's db setting to use
    with app.app_context():
        seed()