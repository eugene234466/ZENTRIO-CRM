"""Seed the database with demo data mirroring the frontend sample dataset.

Idempotent: existing rows (matched by email / title / invoice number) are
skipped, so it is safe to re-run. Records are split between the admin and
staff dev accounts so permission contrast (own vs all) can be exercised.
"""

from datetime import date

from app import create_app
from extensions import db
from models import Contacts, Deal, Invoice, User

ADMIN_USERNAME = "admin"
STAFF_USERNAME = "staff"


def _get(model, **filters):
    return model.query.filter_by(**filters).first()


def seed():
    app = create_app("development")
    with app.app_context():
        admin = User.query.filter_by(username=ADMIN_USERNAME).first()
        staff = User.query.filter_by(username=STAFF_USERNAME).first()
        if admin is None or staff is None:
            raise SystemExit("Seed requires the 'admin' and 'staff' dev users to exist.")

        clients = [
            # (name, phone, email, address, owner)
            ("Acme Logistics", "+233 20 123 4567", "contact@acmelogistics.com", "Plot 12, Industrial Area, Accra", admin),
            ("Bright Schools", "+233 24 987 6543", "admin@brightschools.edu.gh", "Osu Badu Street, Accra", admin),
            ("City Health Clinic", "+233 27 456 7890", "info@cityhealth.com", "Ring Road East, Accra", staff),
            ("Nexus SME Hub", "+233 26 789 0123", "hello@nexussme.com", "Cantonments, Accra", staff),
            ("TechStart Ghana", "+233 23 345 6789", "team@techstart.io", "East Legon, Accra", admin),
            ("Royal Hospital", "+233 28 901 2345", "admin@royalhospital.org", "Korle Bu, Accra", staff),
        ]
        made_clients = 0
        contact_ids = {}
        for name, phone, email, address, owner in clients:
            row = _get(Contacts, email=email)
            if row is None:
                row = Contacts(
                    name=name, phone=phone, email=email, address=address,
                    assigned_to_id=owner.id,
                )
                db.session.add(row)
                made_clients += 1
            contact_ids[name] = row

        db.session.flush()

        deals = [
            # (title, client_name, value, stage, owner)
            ("Acme rebrand rollout", "Acme Logistics", 8500, "NEW", admin),
            ("Acme warehouse portal", "Acme Logistics", 15000, "WON", admin),
            ("School management system", "Bright Schools", 12000, "CONTACTED", admin),
            ("Clinic branding package", "City Health Clinic", 5500, "CONTACTED", staff),
            ("SME hub onboarding", "Nexus SME Hub", 4200, "PROPOSAL", staff),
            ("Mobile app development", "TechStart Ghana", 11000, "PROPOSAL", admin),
            ("Hospital records digitization", "Royal Hospital", 3200, "LOST", staff),
        ]
        made_deals = 0
        for title, client_name, value, stage, owner in deals:
            if _get(Deal, title=title) is None:
                contact = contact_ids[client_name]
                db.session.add(Deal(
                    title=title, contact_id=contact.id, value=value,
                    stage=stage, assigned_to_id=owner.id,
                ))
                made_deals += 1

        invoices = [
            # (number, client_name, status, total, due, owner)
            ("INV-2041", "Acme Logistics", "Paid", 7475, date(2024, 3, 15), admin),
            ("INV-2042", "Bright Schools", "Sent", 3680, date(2024, 3, 24), admin),
            ("INV-2043", "City Health Clinic", "Overdue", 2530, date(2024, 3, 5), staff),
            ("INV-2044", "TechStart Ghana", "Draft", 12650, date(2024, 4, 8), admin),
        ]
        made_invoices = 0
        for number, client_name, status, total, due, owner in invoices:
            if _get(Invoice, invoice_number=number) is None:
                contact = contact_ids[client_name]
                db.session.add(Invoice(
                    invoice_number=number, client_name=client_name,
                    client_id=contact.id, due_date=due, status=status,
                    total=total, assigned_to_id=owner.id,
                ))
                made_invoices += 1

        db.session.commit()
        print(f"clients: +{made_clients}, deals: +{made_deals}, invoices: +{made_invoices}")
        print(f"totals: {Contacts.query.count()} contacts, "
              f"{Deal.query.count()} deals, {Invoice.query.count()} invoices")


if __name__ == "__main__":
    seed()
