import math
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from .config import settings
from .database import get_db, engine, Base
from . import models, schemas

# Initialize FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="PerformaCOS 3-Tier Backend API for EVSU Performance Evaluation and Contract Renewal System",
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint that verifies PostgreSQL connectivity."""
    try:
        # Check active PostgreSQL connection
        result = db.execute(text("SELECT 1")).scalar()
        return {
            "status": "healthy",
            "database": "connected" if result == 1 else "unexpected_result",
            "postgres_host": settings.DATABASE_URL.split("@")[-1].split(":")[0] if "@" in settings.DATABASE_URL else "configured",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}",
        )


# ==========================================
# 1. DEPARTMENTS ENDPOINTS (UC-10, FR-23)
# ==========================================
@app.get("/api/departments", response_model=list[schemas.DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()


@app.post("/api/departments", response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Department).filter(models.Department.name == dept.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists.")
    new_dept = models.Department(**dept.model_dump())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@app.delete("/api/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    
    # Referential Integrity Rule (UC-10, FR-23)
    user_count = db.query(models.UserAccount).filter(models.UserAccount.department_id == dept_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department '{dept.name}': {user_count} active employee accounts are assigned to it.",
        )
    
    db.delete(dept)
    db.commit()
    return {"message": f"Department '{dept.name}' deleted successfully."}


# ==========================================
# 2. USER ACCOUNT & AUTH ENDPOINTS (UC-07)
# ==========================================
@app.get("/api/users", response_model=list[schemas.UserAccountOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.UserAccount).all()


@app.post("/api/auth/login")
def login(creds: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.UserAccount).filter(models.UserAccount.email == creds.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid institutional email or password.")
    
    # In production, compare with passlib/bcrypt: pwd_context.verify(creds.password, user.password_hash)
    # Temporary dev fallback allows smooth initial testing
    return {
        "access_token": f"dev-token-for-user-{user.id}",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "role": user.role,
            "department": user.department.name if user.department else "Unassigned",
            "cosCategory": user.cos_category,
            "employeeIdNumber": user.employee_id_number,
        },
    }


# ==========================================
# 3. DAILY ACCOMPLISHMENT REPORTS (UC-13, FR-29, FR-30)
# ==========================================
def calculate_haversine_distance_meters(lat1, lon1, lat2, lon2):
    """Calculates distance in meters between two GPS coordinates."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@app.post("/api/dar", response_model=schemas.DailyReportOut, status_code=status.HTTP_201_CREATED)
def submit_dar(report: schemas.DailyReportCreate, user_id: int = 1, db: Session = Depends(get_db)):
    # Geofence Campus Verification (UC-13, FR-29)
    is_valid_geofence = False
    if report.latitude and report.longitude:
        distance = calculate_haversine_distance_meters(
            report.latitude, report.longitude,
            settings.EVSU_LATITUDE, settings.EVSU_LONGITUDE
        )
        is_valid_geofence = distance <= settings.GEOFENCE_RADIUS_METERS

    new_dar = models.DailyAccomplishmentReport(
        user_id=user_id,
        log_date=report.log_date or datetime.date.today(),
        status="Submitted" if is_valid_geofence else "Pending Geofence Verification",
        is_geofence_verified=is_valid_geofence,
        latitude=report.latitude,
        longitude=report.longitude,
        remarks=report.remarks,
        tasks=[t.model_dump() for t in report.tasks],
    )
    db.add(new_dar)
    db.commit()
    db.refresh(new_dar)
    return new_dar


@app.get("/api/dar", response_model=list[schemas.DailyReportOut])
def list_dars(user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.DailyAccomplishmentReport)
    if user_id:
        query = query.filter(models.DailyAccomplishmentReport.user_id == user_id)
    return query.order_by(models.DailyAccomplishmentReport.log_date.desc()).all()


# ==========================================
# 4. EVALUATION SYSTEM (50/20/30) (UC-01, UC-04, UC-05, UC-06)
# ==========================================
@app.get("/api/evaluations", response_model=list[schemas.EvaluationRecordOut])
def list_evaluations(db: Session = Depends(get_db)):
    return db.query(models.EvaluationRecord).all()


@app.post("/api/evaluations/{eval_id}/score")
def submit_evaluation_score(
    eval_id: int,
    payload: schemas.EvaluationScoreSubmit,
    db: Session = Depends(get_db)
):
    ev = db.query(models.EvaluationRecord).filter(models.EvaluationRecord.id == eval_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    if payload.evaluator_role == "Immediate Supervisor":
        ev.supervisor_score = payload.raw_score
    elif payload.evaluator_role == "Peer":
        ev.peer_score = payload.raw_score
    elif payload.evaluator_role == "HRMO":
        ev.hrmo_score = payload.raw_score

    if payload.strengths:
        ev.qualitative_strengths = payload.strengths
    if payload.recommendations:
        ev.qualitative_recommendations = payload.recommendations
    if payload.dimension_scores:
        ev.dimension_scores = payload.dimension_scores

    # 50/20/30 Formula Calculation
    # Final = (Supervisor * 0.50) + (Peer * 0.20) + (HRMO * 0.30)
    if ev.supervisor_score is not None and ev.peer_score is not None and ev.hrmo_score is not None:
        weighted = (ev.supervisor_score * 0.50) + (ev.peer_score * 0.20) + (ev.hrmo_score * 0.30)
        ev.final_score = round(weighted, 2)
        if ev.final_score >= 90:
            ev.rating_label = "Outstanding"
        elif ev.final_score >= 80:
            ev.rating_label = "Very Satisfactory"
        elif ev.final_score >= 70:
            ev.rating_label = "Satisfactory"
        else:
            ev.rating_label = "Needs Improvement"
        ev.status = "Completed"
    else:
        ev.status = "Pending HR Review" if (ev.supervisor_score and ev.peer_score) else "Open"

    db.commit()
    db.refresh(ev)
    return {
        "message": f"Score recorded for {payload.evaluator_role}",
        "supervisor_score": ev.supervisor_score,
        "peer_score": ev.peer_score,
        "hrmo_score": ev.hrmo_score,
        "final_score": ev.final_score,
        "rating_label": ev.rating_label,
        "status": ev.status,
    }


@app.post("/api/evaluations/{eval_id}/fast-track-reject")
def fast_track_reject(
    eval_id: int,
    payload: schemas.FastTrackRejectionSubmit,
    db: Session = Depends(get_db)
):
    """Fast-Track Non-Renewal Rejection (UC-06)."""
    ev = db.query(models.EvaluationRecord).filter(models.EvaluationRecord.id == eval_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    ev.is_fast_track_rejected = True
    ev.fast_track_category = payload.category
    ev.fast_track_justification = payload.justification
    ev.fast_track_document_url = payload.document_url
    ev.status = "Rejected"
    ev.rating_label = "Non-Renewal (Fast-Track)"

    db.commit()
    return {"message": "Fast-track rejection recorded on official grounds.", "status": ev.status}


# ==========================================
# 5. CONTRACT RENEWALS (UC-02)
# ==========================================
@app.get("/api/renewals", response_model=list[schemas.RenewalApplicationOut])
def list_renewals(db: Session = Depends(get_db)):
    return db.query(models.RenewalApplication).all()


@app.post("/api/renewals", response_model=schemas.RenewalApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_renewal(
    payload: schemas.RenewalApplicationCreate,
    employee_id: int = 1,
    db: Session = Depends(get_db)
):
    renewal = models.RenewalApplication(
        employee_id=employee_id,
        period=payload.period,
        status="Submitted",
        loi_file_url=payload.loi_file_url,
        loi_original_filename=payload.loi_original_filename,
        mar_narrative=payload.mar_narrative,
        submitted_at=datetime.datetime.utcnow(),
    )
    db.add(renewal)
    db.commit()
    db.refresh(renewal)
    return renewal
