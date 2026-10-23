"""
Database models for quietcart.

Each class is one table. Ownership flows User → Recipient → Gift:
a user owns their recipients, and gifts belong to a user through
their recipient. Routes rely on this chain for ownership checks.
"""

from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import validates

# Shared objects created once in config.py
# Importing them keeps one db connection for whole app
from config import db, bcrypt


# JOIN TABLE: recipient_interests
# A plain table: each row links one recipient to one interest
# Many-to-Many Relationship: recipients can have many interests/interests shared amongst recipients
recipient_interests = db.Table(
    "recipient_interests",
    # both columns together form primary key; same chip can't be added to same recipient twice
    #  ondelete = "CASCADE", if either side is deleted, it's link rows delete too
    db.Column(
        "recipient_id",
        db.Integer,
        db.ForeignKey("recipients.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "interest_id",
        db.Integer,
        db.ForeignKey("interests.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class User(db.Model):
    """An account. Every recipient and gift ultimately belongs to one user."""
    __tablename__ = "users"

    # USER ID:
    id = db.Column(db.Integer, primary_key=True)

    # USERNAME:
    # unique=True is the database-level backstop against duplicate usernames.
    # the signup route also checks first, so it can return a friendly 409.
    username = db.Column(db.String(30), unique=True, nullable=False)

    # PASSWORD:
    # only the bcrypt hash is stored; plain-text passwords never reach the db
    # set through set_password(), never directly set
    password_hash = db.Column(db.String, nullable=False)

    # CREATED AT:
    # filled in automatically by postgres when the row is created
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # RELATIONSHIPS:
    # one user has many recipients, cascade when user is deleted
    recipients = db.relationship("Recipient", back_populates="user", cascade="all, delete-orphan")

    # INTERESTS:
    # one user has many interests (their own set of chips)
    interests = db.relationship("Interest", back_populates="user", cascade="all, delete-orphan")


    @validates("username")
    def validate_username(self, key, username):
        """Runs everytime a username is set (signup or edit)"""
        # Trim stray spaces
        username = (username or "").strip()
        if not 3 <= len(username) <= 30:
            raise ValueError("Username must be 3-30 characters.")
        return username

    def set_password(self, password):
        """Validate and hash a new password"""
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")
        # Bcrypt returns bytes; decode to a string for the database column
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Used at login: True if the attempted password matches the stored hash"""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        """The only shape of a user ever sent to the frontend.

        password_hash is deliberately left out, so hashes are never returned
        by any route (a rule from the pitch's Authentication section).
        """
        return {
            "id": self.id,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Recipient(db.Model):
    """A person the user shops for; owned by just one user"""
    __tablename__ = "recipients"

    # RECIPIENT ID:
    id = db.Column(db.Integer, primary_key=True)

    # OWNERSHIP:
    # makes this recipient belong to one user
    # index=True speeds up 'all recipients for this user' which almost all routes run
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )

    # DETAILS:
    name = db.Column(db.String(50), nullable=False)
    relationship = db.Column(db.String(30))     # optional: "sister", "coworker"
    notes = db.Column(db.Text)                  # optional: clothing size, "already has..."

    # BUDGET:
    # optional - not every recipient needs a budget
    budget = db.Column(db.Numeric(10, 2))      # up to $99,999,999.99

    # CREATED AT:
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # RELATIONSHIPS:
    # the other side of user.recipients, so recipient.user works:
    user = db.relationship("User", back_populates="recipients")

    # GIFTS:
    # one recipient has many gifts; deleting a recipient deletes their gifts (cascades)
    gifts = db.relationship(
        "Gift", back_populates="recipient", cascade="all, delete-orphan"
    )

    # INTERESTS:
    # many-to-many through the join table
    # deleting a recipient removes their link rows but keeps the interests (other recipients may share them)
    interests = db.relationship(
        "Interest", secondary=recipient_interests, back_populates="recipients"
    )


    @validates("name")
    def validates_name(self, key, name):
        """Name is the only required detail"""
        name = (name or "").strip()
        if not 1 <= len(name) <= 50:
            raise ValueError("Name is required and must be 50 characters or less.")
        return name

    @validates("relationship")
    def validate_relationship(self, key, value):
        """Optional label- blank input is stored as empty (None)"""
        value = (value or "").strip()
        if len(value) > 30:
            raise ValueError("Relationship must be 30 characters or less.")
        return value or None

    @validates("budget")
    def validate_budget(self, key, budget):
        """Accepts numbers/numeric string from JSON; blank = no budget"""
        if budget is None or budget == "":
            return None
        try:
            # convert through str() so 19.99 stays exactly 19.99
            budget = Decimal(str(budget))
        except InvalidOperation:
            raise ValueError("Budget must be a number.")
        if budget < 0:
            raise ValueError("Budget cannot be negative.")
        return budget

    @property
    def spent(self):
        """Total price of purchased gifts: Calculated not stored,
        so it's always accurate after any gift is added, edited, or checked off."""
        return sum(
            (gift.price for gift in self.gifts if gift.purchased and gift.price), Decimal("0"),
        )

    @property
    def idea_count(self):
        """Gift ideas not yet purchased."""
        return sum(1 for gift in self.gifts if not gift.purchased)

    def to_dict(self):
        """Basic shape sent to the frontend."""
        return {
            "id": self.id,
            "name": self.name,
            "relationship": self.relationship,
            "notes": self.notes,
            # Decimal isn't valid JSON, so send it as a number:
            "budget": float(self.budget) if self.budget is not None else None,
            "spent": float(self.spent),
            "idea_count": self.idea_count,
            # Chips sorted alphabetically so they always appear in the same order
            "interests": [
                interest.to_dict()
                for interest in sorted(self.interests, key=lambda i: i.label)
            ],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Gift(db.Model):
    """A gift idea for one recipient. Belongs to a user THROUGH its recipient,
    so it has no user_id of its own (avoids storing the same fact twice)"""
    __tablename__ = "gifts"

    # GIFT ID:
    id = db.Column(db.Integer, primary_key=True)

    # OWNERSHIP:
    # the recipient this idea is for; ownership checks go through it
    recipient_id = db.Column(
        db.Integer, db.ForeignKey("recipients.id"), nullable=False, index=True
    )

    # DETAILS:
    name = db.Column(db.String(100), nullable=False)  # example: "Pilates class"
    url = db.Column(db.String(500))                    # optional store link
    price = db.Column(db.Numeric(10, 2))               # optional, exact money
    notes = db.Column(db.Text)                         # optional: color, size

    # CHECKLIST:
    # 'purchased' drives the checklist (gray + bottom of list when True);
    # purchased_at records when (for the Week 2 gift history feature)
    purchased = db.Column(db.Boolean, nullable=False, default=False)
    purchased_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # RELATIONSHIPS:
    # the other side of Recipient.gifts, so gift.recipient works
    recipient = db.relationship("Recipient", back_populates="gifts")

    @validates("name")
    def validate_name(self, key, name):
        """The name of the idea is the only required detail"""
        name = (name or "").strip()
        if not 1 <= len(name) <= 100:
            raise ValueError("Gift name is required; must be 100 characters or less.")
        return name

    @validates("url")
    def validate_url(self, key, url):
        """optional link to item; must be real url"""
        url = (url or "").strip()
        if not url:
            return None
        # only allow http/https:
        if not url.startswith(("http://", "https://")):
            raise ValueError("Link must start with http:// or https://")
        if len(url) > 500:
            raise ValueError("Link must be 500 characters or less.")
        return url

    @validates("price")
    def validate_price(self, key, price):
        """Same rules as a recipient's budget: optional, numeric, not negative."""
        if price is None or price == "":
            return None
        try:
            price = Decimal(str(price))
        except InvalidOperation:
            raise ValueError("Price must be a number.")
        if price < 0:
            raise ValueError("Price cannot be negative.")
        return price

    @validates("purchased")
    def validate_purchased(self, key, purchased):
        """Checking a gift off also stamps purchased_at; unchecking clears it."""
        # JSON sends true/false; reject anything else (like "yes")
        if not isinstance(purchased, bool):
            raise ValueError("Purchased must only be True or False.")
        if purchased and not self.purchased:
            self.purchased_at = datetime.now()  # newly checked off/purchased
        elif not purchased:
            self.purchased_at = None            # not checked off / not purchased
        return purchased


    def to_dict(self):
        """Shape of a gift sent to the frontend."""
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "name": self.name,
            "url": self.url,
            "price": float(self.price) if self.price is not None else None,
            "notes": self.notes,
            "purchased": self.purchased,
            "purchased_at": self.purchased_at.isoformat() if self.purchased_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Interest(db.Model):
    """An interest chip (like "cats" or "board games"),
    owned by one user and shareable across that user's recipients"""
    __tablename__ = "interests"

    # Each user can have a label only once
    __table_args__ = (db.UniqueConstraint("user_id", "label"),)

    # INTEREST ID:
    id = db.Column(db.Integer, primary_key=True)

    # OWNERSHIP: chips belong to a user directly (not shared with any/all users)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )

    # LABEL:
    label = db.Column(db.String(30), nullable=False)

    # CREATED AT:
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # RELATIONSHIPS:
    user = db.relationship("User", back_populates="interests")
    recipients = db.relationship("Recipient", secondary=recipient_interests, back_populates="interests")


    @staticmethod
    def clean_label(label):
        """Trims spaces, collapses doubles, and lowercases, so "Cats" and " cats " count as the same chip.
        Shared by the validator and the add-chip route (which needs the clean label to search for an existing chip)."""
        label = " ".join((label or "").split()).lower()
        if not 1 <= len(label) <= 30:
            raise ValueError("Interest must be 1-30 characters.")
        return label

    @validates("label")
    def validate_label(self, key, label):
        """Runs every time a label is set"""
        return Interest.clean_label(label)

    def to_dict(self):
        """Shape of a chip sent to the frontend: just its id and label"""
        return {"id": self.id, "label": self.label}