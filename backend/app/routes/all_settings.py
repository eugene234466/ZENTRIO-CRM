import os
import json

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from app.models import (
    db,
    BusinessProfile,
    InvoiceSettings,
    PaymentMethod,
    ListSettings,
    AccountSettings,
    TeamMember,
    TeamTask,
)


settings_bp = Blueprint('settings_bp', __name__)


ALLOWED_EXTENSIONS = {
    'png',
    'jpg',
    'jpeg',
    'svg',
    'webp',
}


def allowed_file(filename):
    return (
        '.' in filename
        and filename.rsplit('.', 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


def get_current_user_id():
    # Temporary user ID for testing.
    # Replace this with your real authenticated user's ID
    # when authentication is connected.
    return 1


# ============================================================
# BUSINESS PROFILE
# ============================================================

@settings_bp.route(
    '/api/invoices/settings/business-profile',
    methods=['GET']
)
def get_business_profile():
    user_id = get_current_user_id()

    profile = BusinessProfile.query.filter_by(
        user_id=user_id
    ).first()

    if not profile:
        profile = BusinessProfile(
            user_id=user_id,
            company_name='',
            address='',
            tax_id='',
            currency='USD',
            timezone='UTC',
        )

        db.session.add(profile)
        db.session.commit()

    return jsonify(profile.to_dict()), 200


@settings_bp.route(
    '/api/invoices/settings/business-profile',
    methods=['PUT']
)
def update_business_profile():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    profile = BusinessProfile.query.filter_by(
        user_id=user_id
    ).first()

    if not profile:
        profile = BusinessProfile(
            user_id=user_id
        )
        db.session.add(profile)

    profile.company_name = data.get(
        'company_name',
        data.get(
            'companyName',
            profile.company_name
        )
    )

    profile.address = data.get(
        'address',
        profile.address
    )

    profile.tax_id = data.get(
        'tax_id',
        data.get(
            'taxId',
            profile.tax_id
        )
    )

    profile.currency = data.get(
        'currency',
        profile.currency
    )

    profile.timezone = data.get(
        'timezone',
        profile.timezone
    )

    db.session.commit()

    return jsonify(profile.to_dict()), 200


@settings_bp.route(
    '/api/invoices/settings/business-profile/logo',
    methods=['POST']
)
def upload_logo():
    user_id = get_current_user_id()

    if 'logo' not in request.files:
        return jsonify({
            'error': 'No file part in the request'
        }), 400

    file = request.files['logo']

    if file.filename == '':
        return jsonify({
            'error': 'No selected file'
        }), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(
            f'user_{user_id}_{file.filename}'
        )

        upload_folder = current_app.config.get(
            'UPLOAD_FOLDER',
            'uploads'
        )

        os.makedirs(
            upload_folder,
            exist_ok=True
        )

        file_path = os.path.join(
            upload_folder,
            filename
        )

        file.save(file_path)

        logo_url = f'/uploads/{filename}'

        # FIXED: user_id, not ser_id
        profile = BusinessProfile.query.filter_by(
            user_id=user_id
        ).first()

        if not profile:
            profile = BusinessProfile(
                user_id=user_id
            )
            db.session.add(profile)

        profile.logo_url = logo_url

        db.session.commit()

        return jsonify({
            'logo_url': logo_url,
            'logoUrl': logo_url,
            'message': 'Logo uploaded successfully',
        }), 200

    return jsonify({
        'error': 'File type not allowed'
    }), 400


# ============================================================
# INVOICE SETTINGS
# ============================================================

@settings_bp.route(
    '/api/invoices/settings',
    methods=['GET']
)
def get_invoice_settings():
    user_id = get_current_user_id()

    inv_settings = InvoiceSettings.query.filter_by(
        user_id=user_id
    ).first()

    if not inv_settings:
        inv_settings = InvoiceSettings(
            user_id=user_id
        )

        db.session.add(inv_settings)
        db.session.commit()

    return jsonify(
        inv_settings.to_dict()
    ), 200


@settings_bp.route(
    '/api/invoices/settings',
    methods=['PUT']
)
def update_invoice_settings():
    user_id = get_current_user_id()

    data = request.get_json() or {}

    inv_settings = InvoiceSettings.query.filter_by(
        user_id=user_id
    ).first()

    if not inv_settings:
        inv_settings = InvoiceSettings(
            user_id=user_id
        )

        db.session.add(inv_settings)

    if 'prefix' in data:
        inv_settings.prefix = data['prefix']

    if (
        'next_number' in data
        or 'nextNumber' in data
    ):
        value = data.get(
            'next_number',
            data.get('nextNumber')
        )

        inv_settings.next_number = int(value)

    if (
        'tax_rate' in data
        or 'taxRate' in data
    ):
        value = data.get(
            'tax_rate',
            data.get('taxRate')
        )

        inv_settings.tax_rate = float(value)

    if (
        'tax_enabled' in data
        or 'taxEnabled' in data
    ):
        value = data.get(
            'tax_enabled',
            data.get('taxEnabled')
        )

        inv_settings.tax_enabled = bool(value)

    db.session.commit()

    return jsonify(
        inv_settings.to_dict()
    ), 200


# ============================================================
# PAYMENT METHODS
# ============================================================

@settings_bp.route(
    '/api/invoices/settings/payment-methods',
    methods=['GET']
)
def get_payment_methods():
    user_id = get_current_user_id()

    methods = PaymentMethod.query.filter_by(
        user_id=user_id
    ).all()

    return jsonify([
        method.to_dict()
        for method in methods
    ]), 200


@settings_bp.route(
    '/api/invoices/settings/payment-methods',
    methods=['POST']
)
def add_payment_method():
    user_id = get_current_user_id()

    data = request.get_json() or {}

    method = PaymentMethod(
        user_id=user_id,
        method_type=data.get(
            'method_type',
            data.get(
                'methodType',
                'Bank Transfer'
            )
        ),
        details=data.get(
            'details',
            ''
        ),
        is_active=data.get(
            'is_active',
            data.get(
                'isActive',
                True
            )
        ),
    )

    db.session.add(method)
    db.session.commit()

    return jsonify(
        method.to_dict()
    ), 201


@settings_bp.route(
    '/api/invoices/settings/payment-methods/<int:method_id>',
    methods=['DELETE']
)
def delete_payment_method(method_id):
    user_id = get_current_user_id()

    method = PaymentMethod.query.filter_by(
        id=method_id,
        user_id=user_id
    ).first()

    if not method:
        return jsonify({
            'error': 'Payment method not found'
        }), 404

    db.session.delete(method)
    db.session.commit()

    return jsonify({
        'message': 'Payment method deleted successfully'
    }), 200


# ============================================================
# LIST SETTINGS
# ============================================================

@settings_bp.route(
    '/api/settings/lists',
    methods=['GET']
)
def get_list_settings():
    user_id = get_current_user_id()

    settings = ListSettings.query.filter_by(
        user_id=user_id
    ).first()

    if not settings:
        settings = ListSettings(
            user_id=user_id,
            client_types=json.dumps([
                'SME',
                'Enterprise',
                'Individual'
            ]),
            lead_stages=json.dumps([
                'New',
                'Contacted',
                'Qualified',
                'Proposal',
                'Won',
                'Lost'
            ]),
            lead_temperatures=json.dumps([
                'Hot',
                'Warm',
                'Cold'
            ])
        )

        db.session.add(settings)
        db.session.commit()

    return jsonify(
        settings.to_dict()
    ), 200


@settings_bp.route(
    '/api/settings/lists',
    methods=['PUT']
)
def update_list_settings():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    settings = ListSettings.query.filter_by(
        user_id=user_id
    ).first()

    if not settings:
        settings = ListSettings(
            user_id=user_id
        )
        db.session.add(settings)

    if 'client_types' in data:
        settings.client_types = json.dumps(
            data['client_types']
        )

    if 'lead_stages' in data:
        settings.lead_stages = json.dumps(
            data['lead_stages']
        )

    if 'lead_temperatures' in data:
        settings.lead_temperatures = json.dumps(
            data['lead_temperatures']
        )

    db.session.commit()

    return jsonify(
        settings.to_dict()
    ), 200


# ============================================================
# ACCOUNT SETTINGS
# ============================================================

@settings_bp.route(
    '/api/settings/account',
    methods=['GET']
)
def get_account_settings():
    user_id = get_current_user_id()

    settings = AccountSettings.query.filter_by(
        user_id=user_id
    ).first()

    if not settings:
        settings = AccountSettings(
            user_id=user_id,
            display_name='',
            email='',
            phone='',
            timezone='UTC',
            language='en',
            date_format='DD/MM/YYYY'
        )

        db.session.add(settings)
        db.session.commit()

    return jsonify(
        settings.to_dict()
    ), 200


@settings_bp.route(
    '/api/settings/account',
    methods=['PUT']
)
def update_account_settings():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    settings = AccountSettings.query.filter_by(
        user_id=user_id
    ).first()

    if not settings:
        settings = AccountSettings(
            user_id=user_id
        )
        db.session.add(settings)

    settings.display_name = data.get(
        'display_name',
        data.get(
            'displayName',
            settings.display_name
        )
    )

    settings.email = data.get(
        'email',
        settings.email
    )

    settings.phone = data.get(
        'phone',
        settings.phone
    )

    settings.timezone = data.get(
        'timezone',
        settings.timezone
    )

    settings.language = data.get(
        'language',
        settings.language
    )

    settings.date_format = data.get(
        'date_format',
        data.get(
            'dateFormat',
            settings.date_format
        )
    )

    db.session.commit()

    return jsonify(
        settings.to_dict()
    ), 200


# ============================================================
# TEAM MEMBERS
# ============================================================

@settings_bp.route(
    '/api/team',
    methods=['GET']
)
def get_team_members():
    user_id = get_current_user_id()

    members = TeamMember.query.filter_by(
        owner_id=user_id
    ).all()

    return jsonify([
        member.to_dict()
        for member in members
    ]), 200


@settings_bp.route(
    '/api/team',
    methods=['POST']
)
def create_team_member():
    user_id = get_current_user_id()
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    role = data.get('role', 'Developer')
    avatar = data.get('avatar')
    status = data.get('status', 'Active')

    if not name:
        return jsonify({
            'error': 'Name is required'
        }), 400

    if not email:
        return jsonify({
            'error': 'Email is required'
        }), 400

    member = TeamMember(
        owner_id=user_id,
        name=name,
        email=email,
        role=role,
        avatar=avatar,
        status=status,
    )

    db.session.add(member)
    db.session.commit()

    return jsonify(
        member.to_dict()
    ), 201


@settings_bp.route(
    '/api/team/<int:member_id>',
    methods=['PUT']
)
def update_team_member(member_id):
    user_id = get_current_user_id()

    member = TeamMember.query.filter_by(
        id=member_id,
        owner_id=user_id
    ).first()

    if not member:
        return jsonify({
            'error': 'Team member not found'
        }), 404

    data = request.get_json() or {}

    if 'name' in data:
        member.name = data['name']

    if 'email' in data:
        member.email = data['email']

    if 'role' in data:
        member.role = data['role']

    if 'avatar' in data:
        member.avatar = data['avatar']

    if 'status' in data:
        member.status = data['status']

    db.session.commit()

    return jsonify(
        member.to_dict()
    ), 200


@settings_bp.route(
    '/api/team/<int:member_id>',
    methods=['DELETE']
)
def delete_team_member(member_id):
    user_id = get_current_user_id()

    member = TeamMember.query.filter_by(
        id=member_id,
        owner_id=user_id
    ).first()

    if not member:
        return jsonify({
            'error': 'Team member not found'
        }), 404

    db.session.delete(member)
    db.session.commit()

    return jsonify({
        'message': 'Team member deleted successfully'
    }), 200


# ============================================================
# TEAM TASKS
# ============================================================

@settings_bp.route(
    '/api/team/<int:member_id>/tasks',
    methods=['POST']
)
def create_team_task(member_id):
    user_id = get_current_user_id()

    member = TeamMember.query.filter_by(
        id=member_id,
        owner_id=user_id
    ).first()

    if not member:
        return jsonify({
            'error': 'Team member not found'
        }), 404

    data = request.get_json() or {}

    title = data.get(
        'title',
        ''
    ).strip()

    if not title:
        return jsonify({
            'error': 'Task title is required'
        }), 400

    task = TeamTask(
        team_member_id=member.id,
        title=title,
        status=data.get(
            'status',
            'Pending'
        ),
        due_date=data.get(
            'due_date',
            data.get(
                'dueDate',
                ''
            )
        ),
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(
        task.to_dict()
    ), 201


@settings_bp.route(
    '/api/team/<int:member_id>/tasks/<int:task_id>',
    methods=['PUT']
)
def update_team_task(member_id, task_id):
    user_id = get_current_user_id()

    member = TeamMember.query.filter_by(
        id=member_id,
        owner_id=user_id
    ).first()

    if not member:
        return jsonify({
            'error': 'Team member not found'
        }), 404

    task = TeamTask.query.filter_by(
        id=task_id,
        team_member_id=member.id
    ).first()

    if not task:
        return jsonify({
            'error': 'Task not found'
        }), 404

    data = request.get_json() or {}

    if 'title' in data:
        task.title = data['title']

    if 'status' in data:
        task.status = data['status']

    if (
        'due_date' in data
        or 'dueDate' in data
    ):
        task.due_date = data.get(
            'due_date',
            data.get(
                'dueDate',
                task.due_date
            )
        )

    db.session.commit()

    return jsonify(
        task.to_dict()
    ), 200


@settings_bp.route(
    '/api/team/<int:member_id>/tasks/<int:task_id>',
    methods=['DELETE']
)
def delete_team_task(member_id, task_id):
    user_id = get_current_user_id()

    member = TeamMember.query.filter_by(
        id=member_id,
        owner_id=user_id
    ).first()

    if not member:
        return jsonify({
            'error': 'Team member not found'
        }), 404

    task = TeamTask.query.filter_by(
        id=task_id,
        team_member_id=member.id
    ).first()

    if not task:
        return jsonify({
            'error': 'Task not found'
        }), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        'message': 'Task deleted successfully'
    }), 200
