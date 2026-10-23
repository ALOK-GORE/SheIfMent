"""enforce inventory model constraints

Revision ID: b5c6d7e8f901
Revises: a33a3fd1cfe5
Create Date: 2026-10-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b5c6d7e8f901"
down_revision: Union[str, Sequence[str], None] = "a33a3fd1cfe5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill legacy rows before adding NOT NULL constraints.
    op.execute("UPDATE product SET name = 'Unnamed product' WHERE name IS NULL")
    op.execute("UPDATE product SET description = '' WHERE description IS NULL")
    op.execute("UPDATE product SET price = 0.01 WHERE price IS NULL OR price <= 0")
    op.execute("UPDATE product SET quantity = 0 WHERE quantity IS NULL")
    op.execute("INSERT INTO categories (name) VALUES ('Uncategorized') ON CONFLICT (name) DO NOTHING")
    op.execute("UPDATE product SET category_id = (SELECT id FROM categories WHERE name = 'Uncategorized') WHERE category_id IS NULL")
    op.execute("UPDATE tags SET name = '__legacy_tag__' || id::text WHERE name IS NULL")

    op.alter_column("product", "name", existing_type=sa.String(), nullable=False)
    op.alter_column("product", "description", existing_type=sa.String(), nullable=False)
    op.alter_column("product", "price", existing_type=sa.Float(), nullable=False)
    op.alter_column("product", "quantity", existing_type=sa.Integer(), nullable=False)
    op.alter_column("product", "category_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("tags", "name", existing_type=sa.String(), nullable=False)
    op.create_unique_constraint("uq_tags_name", "tags", ["name"])


def downgrade() -> None:
    op.drop_constraint("uq_tags_name", "tags", type_="unique")
    op.alter_column("tags", "name", existing_type=sa.String(), nullable=True)
    op.alter_column("product", "category_id", existing_type=sa.Integer(), nullable=True)
