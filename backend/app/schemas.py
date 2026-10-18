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

class DepartmentOut(DepartmentBase):
    id: int
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
    date_appointed: Optional[datetime.date] = None
    contract_end_date: Optional[datetime.date] = None
    is_active: bool = True

class UserAccountCreate(UserAccountBase):
    password: str

class UserAccountOut(UserAccountBase):
    id: int
    department: Optional[DepartmentOut] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- DAR Schemas ---
class DarTaskItem(BaseModel):
    title: str
    workAccomplished: Optional[str] = None
    category: str
    hours: float
    quantity: Optional[str] = None
    requiresPhoto: bool = False
    photos: List[str] = []

class DailyReportCreate(BaseModel):
    log_date: Optional[datetime.date] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remarks: Optional[str] = None
    tasks: List[DarTaskItem] = []

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

# --- Evaluation Schemas ---
class EvaluationScoreSubmit(BaseModel):
    evaluator_role: str  # 'Immediate Supervisor' | 'Peer' | 'HRMO'
    raw_score: float
    dimension_scores: Optional[dict] = None
    strengths: Optional[str] = None
    recommendations: Optional[str] = None
    is_proxy_entry: bool = False

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
