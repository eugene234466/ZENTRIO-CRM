
import datetime

from flask_sqlalchemy import SQLAlchemy
from .extensions import db


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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)

    updated_at = db.Column(db.DateTime,default=datetime.datetime.utcnow,onupdate=datetime.datetime.utcnow)

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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.datetime.utcnow,onupdate=datetime.datetime.utcnow)

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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)
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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)
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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)

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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.datetime.utcnow,onupdate=datetime.datetime.utcnow)

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
    created_at = db.Column(db.DateTime,default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.datetime.utcnow,onupdate=datetime.datetime.utcnow)

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