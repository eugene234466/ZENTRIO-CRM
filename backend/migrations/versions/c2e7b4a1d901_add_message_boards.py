"""Add message boards and board membership.

Revision ID: c2e7b4a1d901
Revises: b6539132fa33
Create Date: 2026-09-25
"""

from alembic import op
import sqlalchemy as sa

revision = "c2e7b4a1d901"
# This merges the existing invoice and message-ownership branches before
# adding boards. Keeping it as a single head makes `flask db upgrade` work
# without requiring a revision target.
down_revision = ("52dfc1df2de2", "20260919msgown")
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "message_board",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "message_board_member",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("board_id", sa.Integer(), sa.ForeignKey("message_board.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("added_by_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("board_id", "user_id", name="uq_message_board_member"),
    )
    with op.batch_alter_table("message") as batch:
        batch.add_column(sa.Column("board_id", sa.Integer(), nullable=True))
        batch.create_foreign_key("fk_message_board", "message_board", ["board_id"], ["id"])

    # Preserve existing conversations by placing them in a shared General board.
    # All existing login users become members, so the former global board remains
    # available after the migration.
    bind = op.get_bind()
    metadata = sa.MetaData()
    users = sa.Table("user", metadata, autoload_with=bind)
    boards = sa.Table("message_board", metadata, autoload_with=bind)
    memberships = sa.Table("message_board_member", metadata, autoload_with=bind)
    messages = sa.Table("message", metadata, autoload_with=bind)
    user_ids = [row.id for row in bind.execute(sa.select(users.c.id))]
    if user_ids:
        board_id = bind.execute(
            boards.insert().values(name="General", description="", created_by_id=user_ids[0])
        ).inserted_primary_key[0]
        bind.execute(messages.update().where(messages.c.board_id.is_(None)).values(board_id=board_id))
        bind.execute(memberships.insert(), [
            {"board_id": board_id, "user_id": user_id, "added_by_id": user_ids[0]}
            for user_id in user_ids
        ])


def downgrade():
    with op.batch_alter_table("message") as batch:
        batch.drop_constraint("fk_message_board", type_="foreignkey")
        batch.drop_column("board_id")
    op.drop_table("message_board_member")
    op.drop_table("message_board")
