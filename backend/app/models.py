import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


# ---------------------------------------------------------------------------
# Department
# ---------------------------------------------------------------------------
class Department(Base):
    __tablename__ = "department"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    college = Column(String(255), nullable=True)
    college_code = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True, default=11.0065)
    longitude = Column(Float, nullable=True, default=124.6075)
    radius_meters = Column(Float, nullable=True, default=500.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    users = relationship("UserAccount", back_populates="department")


# ---------------------------------------------------------------------------
# UserAccount
# ---------------------------------------------------------------------------
class UserAccount(Base):
    __tablename__ = "user_account"

    id = Column(Integer, primary_key=True, index=True)
    employee_id_number = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="COS Employee")  # 'COS Employee' | 'Department Head' | 'HR Personnel'
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    cos_category = Column(String(100), default="Administrative")  # 'Administrative' | 'Technical' | 'Faculty'
    date_appointed = Column(Date, nullable=True)
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Extended profile fields
    job_title = Column(String(255), nullable=True)
    contact_number = Column(String(50), nullable=True)
    alternate_email = Column(String(255), nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    office_location = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_archived = Column(Boolean, default=False)
    total_contracts = Column(Integer, default=0)

    # Relationships
    department = relationship("Department", back_populates="users")
    dars = relationship("DailyAccomplishmentReport", back_populates="user")
    renewals = relationship("RenewalApplication", back_populates="employee")
    evaluations_as_supervisor = relationship(
        "EvaluationRecord",
        foreign_keys="EvaluationRecord.supervisor_id",
        backref="supervisor",
    )
    evaluations_as_peer = relationship(
        "EvaluationRecord",
        foreign_keys="EvaluationRecord.peer_id",
        backref="peer",
    )
    sessions = relationship("UserSession", back_populates="user")


# ---------------------------------------------------------------------------
# DailyAccomplishmentReport
# ---------------------------------------------------------------------------
class DailyAccomplishmentReport(Base):
    __tablename__ = "daily_accomplishment_report"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.id"), nullable=False)
    log_date = Column(Date, nullable=False, default=datetime.date.today)
    status = Column(String(50), default="In Progress")  # 'In Progress' | 'Submitted' | 'Verified' | 'Returned'
    is_geofence_verified = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    remarks = Column(Text, nullable=True)
    tasks = Column(JSON, nullable=True)  # JSON array of tasks, quantities, photo evidence URLs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("UserAccount", back_populates="dars")


# ---------------------------------------------------------------------------
# EvaluationRecord
# ---------------------------------------------------------------------------
class EvaluationRecord(Base):
    __tablename__ = "evaluation_record"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(100), nullable=False)  # e.g. "1st Semester 2026-2027"
    employee_id = Column(Integer, ForeignKey("user_account.id"), nullable=False)
    supervisor_id = Column(Integer, ForeignKey("user_account.id"), nullable=True)
    peer_id = Column(Integer, ForeignKey("user_account.id"), nullable=True)

    # 50/20/30 Formula Scores
    supervisor_score = Column(Float, nullable=True)  # 50%
    peer_score = Column(Float, nullable=True)        # 20%
    hrmo_score = Column(Float, nullable=True)        # 30%
    final_score = Column(Float, nullable=True)       # Calculated weighted score
    rating_label = Column(String(50), nullable=True)  # Outstanding, Very Satisfactory, etc.

    # Detailed rubric and qualitative fields
    dimension_scores = Column(JSON, nullable=True)   # Category A-E item breakdown
    qualitative_strengths = Column(Text, nullable=True)
    qualitative_recommendations = Column(Text, nullable=True)

    # Fast-Track Rejection (UC-06)
    is_fast_track_rejected = Column(Boolean, default=False)
    fast_track_category = Column(String(255), nullable=True)
    fast_track_justification = Column(Text, nullable=True)
    fast_track_document_url = Column(String(500), nullable=True)

    status = Column(String(50), default="Open")  # 'Open' | 'Pending HR Review' | 'Completed' | 'Rejected'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ---------------------------------------------------------------------------
# RenewalApplication
# ---------------------------------------------------------------------------
class RenewalApplication(Base):
    __tablename__ = "renewal_application"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("user_account.id"), nullable=False)
    period = Column(String(100), nullable=False)
    status = Column(String(50), default="In Progress")  # 'In Progress' | 'Submitted' | 'Under Review' | 'Approved' | 'Declined'

    # Letter of Intent (LOI) & Accomplishment
    loi_file_url = Column(String(500), nullable=True)
    loi_original_filename = Column(String(255), nullable=True)
    mar_narrative = Column(Text, nullable=True)

    submitted_at = Column(DateTime, nullable=True)
    department_head_endorsement = Column(String(50), nullable=True)  # 'Endorsed' | 'Disapproved'
    hrmo_approval = Column(String(50), nullable=True)                # 'Approved' | 'Declined'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    employee = relationship("UserAccount", back_populates="renewals")


# ---------------------------------------------------------------------------
# OTPCode
# ---------------------------------------------------------------------------
class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ---------------------------------------------------------------------------
# InvitationToken
# ---------------------------------------------------------------------------
class InvitationToken(Base):
    __tablename__ = "invitation_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    used_by_user_id = Column(Integer, ForeignKey("user_account.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("user_account.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ---------------------------------------------------------------------------
# UserSession
# ---------------------------------------------------------------------------
class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.id"), nullable=False)
    device_description = Column(String(255), nullable=True)
    network_info = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)
    token_hash = Column(String(255), nullable=True)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserAccount", back_populates="sessions")


# ---------------------------------------------------------------------------
# NotificationPreference
# ---------------------------------------------------------------------------
class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(Integer, ForeignKey("user_account.id"), primary_key=True)
    deadline_alerts = Column(Boolean, default=True)
    contract_notices = Column(Boolean, default=True)
    approval_alerts = Column(Boolean, default=True)
    sms_alerts = Column(Boolean, default=True)

    user = relationship("UserAccount")


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    user_id = Column(Integer, ForeignKey("user_account.id"), nullable=True)
    user_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=True)
    action = Column(String(255), nullable=False)
    target_scope = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True)
    operation_details = Column(Text, nullable=True)


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_account.id"), nullable=True)
    target_role = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    action_view = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
