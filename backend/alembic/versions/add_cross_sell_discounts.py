"""Add cross_sell_ids and quantity_discounts to products

Revision ID: add_cross_sell_discounts
Revises: 9d7b28532bf6
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_cross_sell_discounts'
down_revision = '9d7b28532bf6'
branch_labels = None
depends_on = None


def upgrade():
    # Add cross_sell_ids column (JSON array of product IDs)
    op.add_column('products', sa.Column('cross_sell_ids', sa.JSON(), nullable=True))
    
    # Add quantity_discounts column (JSON array of discount tiers)
    op.add_column('products', sa.Column('quantity_discounts', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('products', 'cross_sell_ids')
    op.drop_column('products', 'quantity_discounts')
