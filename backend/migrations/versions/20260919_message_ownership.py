"""add message ownership and lifecycle fields

Revision ID: 20260919msgown
Revises: 1d2e03bc1242
"""
from alembic import op
import sqlalchemy as sa


revision = "20260919msgown"
down_revision = "1d2e03bc1242"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("message", sa.Column("author_id", sa.Integer(), nullable=True))
    op.add_column("message", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("message", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))

    connection = op.get_bind()
    users = connection.execute(sa.text("SELECT id, username FROM user ORDER BY id")).fetchall()
    if users:
        fallback_id = users[0].id
        for user_id, username in users:
            connection.execute(
                sa.text(
                    "UPDATE message SET author_id = :user_id "
                    "WHERE author IS NOT NULL AND author = :username"
                ),
                {"user_id": user_id, "username": username},
            )
        connection.execute(
            sa.text("UPDATE message SET author_id = :user_id WHERE author_id IS NULL"),
            {"user_id": fallback_id},
        )
    elif connection.execute(sa.text("SELECT 1 FROM message LIMIT 1")).first():
        raise RuntimeError("Cannot migrate messages without at least one user.")

    connection.execute(
        sa.text(
            "UPDATE message SET updated_at = created_at "
            "WHERE updated_at IS NULL"
        )
    )

    with op.batch_alter_table("message") as batch_op:
        batch_op.alter_column("author_id", existing_type=sa.Integer(), nullable=False)
        batch_op.create_foreign_key(
            "fk_message_author_id_user",
            "user",
            ["author_id"],
            ["id"],
        )
        batch_op.drop_column("author")


def downgrade():
    with op.batch_alter_table("message") as batch_op:
        batch_op.add_column(sa.Column("author", sa.String(length=80), nullable=True))
        batch_op.drop_constraint("fk_message_author_id_user", type_="foreignkey")
        batch_op.drop_column("author_id")
        batch_op.drop_column("updated_at")
        batch_op.drop_column("deleted_at")
