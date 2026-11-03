import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr


# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Any


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    invitation_token: str
    email: EmailStr
    full_name: str
    password: str
    role: Optional[str] = None
    department_id: Optional[int] = None
    cos_category: Optional[str] = "Administrative"
    job_title: Optional[str] = None
    contact_number: Optional[str] = None
    first_name: Optional[str] = None
    middle_initial: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    starting_date: Optional[datetime.date] = None
    contract_start_date: Optional[datetime.date] = None
    contract_end_date: Optional[datetime.date] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


# --- Department Schemas ---
class DepartmentBase(BaseModel):
    name: str
    college: Optional[str] = None
    college_code: Optional[str] = None
    latitude: Optional[float] = 11.0065
    longitude: Optional[float] = 124.6075
    radius_meters: Optional[float] = 500.0


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    college_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_meters: Optional[float] = None


class DepartmentOut(DepartmentBase):
    id: int
    employee_count: int = 0
    active_evaluations: int = 0
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


# --- User Account Schemas ---
class UserAccountBase(BaseModel):
    employee_id_number: Optional[str] = None
    full_name: str
    email: EmailStr
    role: str = "COS Employee"
    department_id: Optional[int] = None
    cos_category: Optional[str] = "Administrative"
    job_title: Optional[str] = None
    contact_number: Optional[str] = None
    alternate_email: Optional[str] = None
    emergency_contact: Optional[str] = None
    office_location: Optional[str] = None
    avatar_url: Optional[str] = None
    date_appointed: Optional[datetime.date] = None
    contract_start_date: Optional[datetime.date] = None
    contract_end_date: Optional[datetime.date] = None
    is_active: bool = True
    is_archived: bool = False
    total_contracts: int = 0


class UserAccountCreate(UserAccountBase):
    password: str


class UserAccountOut(UserAccountBase):
    id: int
    department: Optional[DepartmentOut] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class UserUpdateContact(BaseModel):
    contact_number: Optional[str] = None
    alternate_email: Optional[str] = None
    emergency_contact: Optional[str] = None
    office_location: Optional[str] = None
    avatar_url: Optional[str] = None


class UserTransferDepartment(BaseModel):
    department_id: int


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str


class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    job_title: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    cos_category: Optional[str] = None


# --- DAR Schemas ---
class DarTaskItem(BaseModel):
    title: str
    workAccomplished: Optional[str] = None
    category: Optional[str] = "General"
    hours: Optional[float] = 8.0
    quantity: Optional[str] = None
    requiresPhoto: bool = False
    photos: List[str] = []


class DailyReportCreate(BaseModel):
    log_date: Optional[datetime.date] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remarks: Optional[str] = None
    # Support both single-task UI and multi-task payload:
    job_description: Optional[str] = None
    work_accomplished: Optional[str] = None
    quantity: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    tasks: Optional[List[DarTaskItem]] = None


class DailyReportOut(BaseModel):
    id: int
    user_id: int
    log_date: datetime.date
    status: str
    is_geofence_verified: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remarks: Optional[str] = None
    tasks: Optional[List[Any]] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class MonthlyReportRecordOut(BaseModel):
    id: int
    dateSubmitted: str
    month: str
    year: str
    jobDescription: str
    workAccomplished: str
    quantity: str
    remarks: Optional[str] = None
    photoEvidenceUrl: Optional[str] = None
    campusSite: Optional[str] = None
    isGeofenceValid: bool = True


# --- Evaluation Schemas ---
class EvaluationScoreSubmit(BaseModel):
    evaluator_role: str  # 'Immediate Supervisor' | 'Peer' | 'HRMO'
    raw_score: float
    dimension_scores: Optional[dict] = None
    strengths: Optional[str] = None
    recommendations: Optional[str] = None


class FastTrackRejectionSubmit(BaseModel):
    category: str
    justification: str
    document_url: Optional[str] = None


class EvaluationRecordOut(BaseModel):
    id: int
    period: str
    employee_id: int
    supervisor_score: Optional[float] = None
    peer_score: Optional[float] = None
    hrmo_score: Optional[float] = None
    final_score: Optional[float] = None
    rating_label: Optional[str] = None
    status: str
    is_fast_track_rejected: bool = False
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


# --- Renewal Schemas ---
class RenewalApplicationCreate(BaseModel):
    period: str
    loi_file_url: Optional[str] = None
    loi_original_filename: Optional[str] = None
    mar_narrative: Optional[str] = None


class RenewalApplicationOut(BaseModel):
    id: int
    employee_id: int
    period: str
    status: str
    loi_file_url: Optional[str] = None
    loi_original_filename: Optional[str] = None
    mar_narrative: Optional[str] = None
    submitted_at: Optional[datetime.datetime] = None
    department_head_endorsement: Optional[str] = None
    hrmo_approval: Optional[str] = None

    class Config:
        from_attributes = True


# --- Invitation Token Schemas ---
class InvitationCreate(BaseModel):
    email: Optional[EmailStr] = None
    role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None


class InvitationTokenOut(BaseModel):
    id: int
    token: str
    email: Optional[str] = None
    role: str
    department_id: Optional[int] = None
    expires_at: datetime.datetime
    used_at: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None
    invite_url: Optional[str] = None

    class Config:
        from_attributes = True


# --- Notification Preference Schemas ---
class NotificationPreferenceOut(BaseModel):
    user_id: int
    deadline_alerts: bool
    contract_notices: bool
    approval_alerts: bool
    sms_alerts: bool

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    deadline_alerts: Optional[bool] = None
    contract_notices: Optional[bool] = None
    approval_alerts: Optional[bool] = None
    sms_alerts: Optional[bool] = None


# --- User Session Schemas ---
class UserSessionOut(BaseModel):
    id: int
    device_description: Optional[str] = None
    network_info: Optional[str] = None
    ip_address: Optional[str] = None
    last_active: Optional[datetime.datetime] = None
    is_revoked: bool
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


# --- File Upload Schemas ---
class FileUploadResponse(BaseModel):
    url: str
    path: str
    bucket: str


# --- Audit Log Schemas ---
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime.datetime
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    role: Optional[str] = None
    action: str
    target_scope: Optional[str] = None
    ip_address: Optional[str] = None
    operation_details: Optional[str] = None

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    target_role: Optional[str] = None
    title: str
    message: str
    category: Optional[str] = None
    is_read: bool = False
    action_view: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    target_role: Optional[str] = None
    title: str
    message: str
    category: Optional[str] = "system"
    action_view: Optional[str] = None

