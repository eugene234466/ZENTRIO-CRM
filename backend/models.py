from datetime import datetime, timezone
from flask_login import UserMixin
from extensions import db, bcrypt


def live(model):
    """Base query for a soft-deletable model, excluding deleted rows."""
    return model.query.filter(model.deleted_at.is_(None))


class User(db.Model, UserMixin):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="staff", nullable=False)


class Contacts(db.Model):
    __tablename__ = "contacts"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    deleted_at = db.Column(db.DateTime(timezone=True))


class Deal(db.Model):
    __tablename__ = "deal"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    contact_id = db.Column(db.Integer, db.ForeignKey("contacts.id"), nullable=False)
    value = db.Column(db.Float, default=0)
    stage = db.Column(db.String(20), default="NEW")
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    deleted_at = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "contact_id": self.contact_id,
            "value": self.value,
            "stage": self.stage,
            "assigned_to_id": self.assigned_to_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StageLog(db.Model):
    __tablename__ = "stage_log"

    id = db.Column(db.Integer, primary_key=True)
    deal_id = db.Column(db.Integer, db.ForeignKey("deal.id"), nullable=False)
    old_stage = db.Column(db.String(20), nullable=False)
    new_stage = db.Column(db.String(20), nullable=False)
    changed_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class Invoice(db.Model):
    __tablename__ = "invoice"

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(40), nullable=False, unique=True)
    client_name = db.Column(db.String(120), nullable=False)  # snapshot at send-time
    client_id = db.Column(db.Integer, db.ForeignKey("contacts.id"))
    status = db.Column(db.String(20), default="draft", nullable=False)  # draft, sent, paid, overdue, void
    issue_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    paid_date = db.Column(db.Date)
    subtotal = db.Column(db.Numeric(12, 2), default=0)
    tax_amount = db.Column(db.Numeric(12, 2), default=0)
    total = db.Column(db.Numeric(12, 2), default=0)
    # Snapshotted from settings at send-time, so a later settings change never
    # retroactively alters an invoice that's already been sent.
    tax_rate_snapshot = db.Column(db.Float, default=0)
    tax_enabled_snapshot = db.Column(db.Boolean, default=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    # Only ever set while status is still 'draft' — a sent/paid invoice is
    # voided instead (status='void'), never soft-deleted, per the brief.
    deleted_at = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        paid_total = sum((p.amount for p in self.payments), start=0)
        return {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "client_id": self.client_id,
            "client_name": self.client_name,
            "status": self.status,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "paid_date": self.paid_date.isoformat() if self.paid_date else None,
            "subtotal": float(self.subtotal or 0),
            "tax_amount": float(self.tax_amount or 0),
            "total": float(self.total or 0),
            "paid_total": float(paid_total),
            "balance": float((self.total or 0) - paid_total),
            "assigned_to_id": self.assigned_to_id,
            "items": [item.to_dict() for item in self.items],
        }


class InvoiceItem(db.Model):
    __tablename__ = "invoice_item"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoice.id"), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False, default=1)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    invoice = db.relationship("Invoice", backref=db.backref("items", lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "quantity": float(self.quantity or 0),
            "unit_price": float(self.unit_price or 0),
            "line_total": float((self.quantity or 0) * (self.unit_price or 0)),
        }


class Payment(db.Model):
    __tablename__ = "payment"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoice.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    method_id = db.Column(db.Integer, db.ForeignKey("payment_methods.id"))
    paid_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    recorded_by_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    invoice = db.relationship("Invoice", backref=db.backref("payments", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "invoice_id": self.invoice_id,
            "amount": float(self.amount or 0),
            "method_id": self.method_id,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "recorded_by_id": self.recorded_by_id,
        }


class Receipt(db.Model):
    __tablename__ = "receipt"

    id = db.Column(db.Integer, primary_key=True)
    receipt_number = db.Column(db.String(40), nullable=False, unique=True)
    payment_id = db.Column(db.Integer, db.ForeignKey("payment.id"), nullable=False, unique=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoice.id"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "receipt_number": self.receipt_number,
            "payment_id": self.payment_id,
            "invoice_id": self.invoice_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class InvoiceCounter(db.Model):
    """
    TODO(S1/S2 team): InvoiceSettings is currently scoped per-user
    (user_id is unique), so two staff members would each get their own
    next_number sequence — that breaks the requirement that invoice
    numbers stay unique across the whole business. This table is a
    single, business-wide counter used only for actually issuing
    numbers, kept separate so P4 doesn't have to unilaterally rewrite
    S2's already-shipped settings screen. Worth reconciling into one
    shared settings row later.
    """
    __tablename__ = "invoice_counter"

    id = db.Column(db.Integer, primary_key=True)
    # Guarantees only one counter row can ever exist, even if two requests
    # both try to create it for the first time at the same moment.
    singleton = db.Column(db.Boolean, unique=True, default=True, nullable=False)
    prefix = db.Column(db.String(20), default="INV-", nullable=False)
    next_number = db.Column(db.Integer, default=2045, nullable=False)
    receipt_prefix = db.Column(db.String(20), default="RCT-", nullable=False)
    next_receipt_number = db.Column(db.Integer, default=1, nullable=False)


class Task(db.Model):
    __tablename__ = "task"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    status = db.Column(db.String(20), default="pending")


class Message(db.Model):
    __tablename__ = "message"

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, default="")
    author = db.Column(db.String(80), default="")
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class Notification(db.Model):
    __tablename__ = "notification"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    kind = db.Column(db.String(40), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.String(500), default="")
    link = db.Column(db.String(200), default="")
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class NotificationPreference(db.Model):
    __tablename__ = "notification_preference"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    overdue_invoices = db.Column(db.Boolean, default=True)
    assigned_leads = db.Column(db.Boolean, default=True)
    assigned_tasks = db.Column(db.Boolean, default=True)
    pinned_messages = db.Column(db.Boolean, default=True)


class AuditLog(db.Model):
    __tablename__ = "auFind    datetime.datetime.utcnowit_log"

    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    action = db.Column(db.String(60), nullable=False)
    target_type = db.Column(db.String(60), default="")
    target_id = db.Column(db.Integer)
    detail = db.Column(db.String(500), default="")
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )





class BusinessProfile(db.Model):
    __tablename__ = 'business_profiles'

    id = db.Column(db.Integer,primary_key=True)
    user_id = db.Column(db.Integer,nullable=False,unique=True)
    company_name = db.Column(db.String(255),nullable=True)
    address = db.Column(db.Text,nullable=True)
    tax_id = db.Column(db.String(100),nullable=True)
    currency = db.Column(db.String(10),default='USD')
    timezone = db.Column(db.String(100),default='UTC')
    logo_url = db.Column(db.String(512),nullable=True)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)

    updated_at = db.Column(db.DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name or '',
            'address': self.address or '',
            'tax_id': self.tax_id or '',
            'currency': self.currency or 'USD',
            'timezone': self.timezone or 'UTC',
            'logo_url': self.logo_url or '',
            'logoUrl': self.logo_url or '',
        }


class InvoiceSettings(db.Model):
    __tablename__ = 'invoice_settings'

    id = db.Column(db.Integer,primary_key=True)
    user_id = db.Column(db.Integer,nullable=False,unique=True)
    prefix = db.Column(db.String(20),default='INV-')
    next_number = db.Column(db.Integer,default=1001)
    tax_rate = db.Column(db.Float,default=0.0)
    tax_enabled = db.Column(db.Boolean,default=True)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prefix': self.prefix or 'INV-',
            'next_number': self.next_number or 1001,
            'tax_rate': self.tax_rate or 0.0,
            'tax_enabled': self.tax_enabled,
        }



class PaymentMethod(db.Model):
    __tablename__ = 'payment_methods'
    id = db.Column(db.Integer,primary_key=True)
    user_id = db.Column(db.Integer,nullable=False)
    method_type = db.Column(db.String(50),nullable=False)
    details = db.Column(db.Text,nullable=True)
    is_active = db.Column(db.Boolean,default=True)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'method_type': self.method_type,
            'details': self.details or '',
            'is_active': self.is_active,
        }

class TeamMember(db.Model):
    __tablename__ = 'team_members'

    id = db.Column(db.Integer,primary_key=True)
    owner_id = db.Column(db.Integer,nullable=False)
    name = db.Column(db.String(255),nullable=False)
    email = db.Column(db.String(255),nullable=False)
    role = db.Column(db.String(100),nullable=False)
    avatar = db.Column(db.String(512),nullable=True)
    status = db.Column(db.String(50),default='Active')
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    tasks = db.relationship('TeamTask',backref='member',cascade='all, delete-orphan',lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'avatar': self.avatar or '',
            'status': self.status,
            'tasks': [
                task.to_dict()
                for task in self.tasks
            ],
        }


class TeamTask(db.Model):
    __tablename__ = 'team_tasks'

    id = db.Column(db.Integer,primary_key=True)
    team_member_id = db.Column(db.Integer,db.ForeignKey('team_members.id'),nullable=False)
    title = db.Column(db.String(255),nullable=False)
    status = db.Column( db.String(50),default='Pending')
    due_date = db.Column(db.String(50),nullable=True)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'team_member_id': self.team_member_id,
            'title': self.title,
            'status': self.status,
            'due_date': self.due_date or '',
        }


class ListSettings(db.Model):
    __tablename__ = 'list_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, unique=True)
    client_types = db.Column(db.Text, nullable=True)
    lead_stages = db.Column(db.Text, nullable=True)
    lead_temperatures = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)

    def to_dict(self):
        import json

        def parse_json(value, fallback):
            if not value:
                return fallback

            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return fallback

        return {'id': self.id,'user_id': self.user_id,'client_types': parse_json(self.client_types,['SME', 'Enterprise', 'Individual']),

            'lead_stages': parse_json(self.lead_stages,['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost']),
            'lead_temperatures': parse_json(self.lead_temperatures,['Hot', 'Warm', 'Cold']),
        }


class AccountSettings(db.Model):
    __tablename__ = 'account_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, unique=True)
    display_name = db.Column(db.String(255),nullable=True)
    email = db.Column(db.String(255),nullable=True)
    phone = db.Column(db.String(50),nullable=True)
    timezone = db.Column(db.String(100),default='UTC')
    language = db.Column(db.String(20),default='en')
    date_format = db.Column(db.String(50),default='DD/MM/YYYY')
    created_at = db.Column(db.DateTime,default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'display_name': self.display_name or '',
            'email': self.email or '',
            'phone': self.phone or '',
            'timezone': self.timezone or 'UTC',
            'language': self.language or 'en',
            'date_format': self.date_format or 'DD/MM/YYYY',
        }
