"""sync_attendance_geofence_templates_and_ai_columns

Revision ID: 050f6cfc45be
Revises: 21075853b302
Create Date: 2026-11-10 12:51:50.942418

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '050f6cfc45be'
down_revision: Union[str, Sequence[str], None] = '21075853b302'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'campus_geofence',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('short_name', sa.String(length=100), nullable=True),
        sa.Column('location_note', sa.String(length=255), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('radius_meters', sa.Float(), nullable=False),
        sa.Column('boundary_type', sa.String(length=50), nullable=True),
        sa.Column('polygon_coords', sa.JSON(), nullable=True),
        sa.Column('enforce_geofence', sa.Boolean(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'evaluation_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_key', sa.String(length=100), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subtitle', sa.String(length=255), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('version', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('criteria', sa.JSON(), nullable=False),
        sa.Column('rating_scale', sa.JSON(), nullable=True),
        sa.Column('qualitative_prompts', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['user_account.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_evaluation_templates_id'), 'evaluation_templates', ['id'], unique=False)
    op.create_index(op.f('ix_evaluation_templates_is_active'), 'evaluation_templates', ['is_active'], unique=False)
    op.create_index(op.f('ix_evaluation_templates_template_key'), 'evaluation_templates', ['template_key'], unique=False)

    op.create_table(
        'attendance_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('time_in', sa.DateTime(), nullable=True),
        sa.Column('time_out', sa.DateTime(), nullable=True),
        sa.Column('shift_type', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('is_geofence_verified', sa.Boolean(), nullable=True),
        sa.Column('in_latitude', sa.Float(), nullable=True),
        sa.Column('in_longitude', sa.Float(), nullable=True),
        sa.Column('out_latitude', sa.Float(), nullable=True),
        sa.Column('out_longitude', sa.Float(), nullable=True),
        sa.Column('geofence_site_name', sa.String(length=255), nullable=True),
        sa.Column('minutes_late', sa.Integer(), nullable=True),
        sa.Column('undertime_minutes', sa.Integer(), nullable=True),
        sa.Column('is_overtime', sa.Boolean(), nullable=True),
        sa.Column('overtime_hours', sa.Float(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user_account.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_attendance_log_id'), 'attendance_log', ['id'], unique=False)
    op.create_index(op.f('ix_attendance_log_log_date'), 'attendance_log', ['log_date'], unique=False)
    op.create_index(op.f('ix_attendance_log_user_id'), 'attendance_log', ['user_id'], unique=False)

    op.create_table(
        'leave_request',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('leave_type', sa.String(length=100), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('days_count', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('attachment_url', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['department.id']),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['user_account.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user_account.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_leave_request_id'), 'leave_request', ['id'], unique=False)
    op.create_index(op.f('ix_leave_request_user_id'), 'leave_request', ['user_id'], unique=False)

    op.add_column('user_account', sa.Column('contract_start_date', sa.Date(), nullable=True))
    op.alter_column(
        'user_account',
        'avatar_url',
        existing_type=sa.String(length=500),
        type_=sa.Text(),
        existing_nullable=True,
    )
    op.add_column('daily_accomplishment_report', sa.Column('photo_hash', sa.String(length=64), nullable=True))
    op.create_index(
        op.f('ix_daily_accomplishment_report_photo_hash'),
        'daily_accomplishment_report',
        ['photo_hash'],
        unique=False,
    )
    op.add_column('renewal_application', sa.Column('ai_synthesis', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('renewal_application', 'ai_synthesis')
    op.drop_index(op.f('ix_daily_accomplishment_report_photo_hash'), table_name='daily_accomplishment_report')
    op.drop_column('daily_accomplishment_report', 'photo_hash')
    op.alter_column(
        'user_account',
        'avatar_url',
        existing_type=sa.Text(),
        type_=sa.String(length=500),
        existing_nullable=True,
    )
    op.drop_column('user_account', 'contract_start_date')

    op.drop_index(op.f('ix_leave_request_user_id'), table_name='leave_request')
    op.drop_index(op.f('ix_leave_request_id'), table_name='leave_request')
    op.drop_table('leave_request')

    op.drop_index(op.f('ix_attendance_log_user_id'), table_name='attendance_log')
    op.drop_index(op.f('ix_attendance_log_log_date'), table_name='attendance_log')
    op.drop_index(op.f('ix_attendance_log_id'), table_name='attendance_log')
    op.drop_table('attendance_log')

    op.drop_index(op.f('ix_evaluation_templates_template_key'), table_name='evaluation_templates')
    op.drop_index(op.f('ix_evaluation_templates_is_active'), table_name='evaluation_templates')
    op.drop_index(op.f('ix_evaluation_templates_id'), table_name='evaluation_templates')
    op.drop_table('evaluation_templates')

    op.drop_table('campus_geofence')
