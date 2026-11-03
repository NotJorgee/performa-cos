import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from .config import settings
from .database import get_db, engine, Base
from . import models, schemas
from .auth import get_current_user
from .storage_service import ensure_buckets_exist

# Routers
from .routers.auth import router as auth_router
from .routers.uploads import router as uploads_router
from .routers.invitations import router as invitations_router
from .routers.users import router as users_router
from .routers.dar import router as dar_router
from .routers.audit import router as audit_router
from .routers.analytics import router as analytics_router
from .routers.notifications import router as notifications_router
from .routers.sessions import router as sessions_router
from .routers.geofence import router as geofence_router
from .routers.audit import log_audit

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

# Include Routers
app.include_router(auth_router)
app.include_router(uploads_router)
app.include_router(invitations_router)
app.include_router(users_router)
app.include_router(dar_router)
app.include_router(audit_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(sessions_router)
app.include_router(geofence_router)


@app.on_event("startup")
async def startup_event():
    try:
        ensure_buckets_exist()
    except Exception as e:
        print(f"[startup] Storage bucket check failed: {e}")


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
        result = db.execute(text("SELECT 1")).scalar()
        return {
            "status": "healthy",
            "database": "connected" if result == 1 else "unexpected_result",
            "postgres_host": (
                settings.DATABASE_URL.split("@")[-1].split(":")[0]
                if "@" in settings.DATABASE_URL
                else "configured"
            ),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}",
        )


# ==========================================
# DEPARTMENTS ENDPOINTS (UC-10, FR-23)
# ==========================================
@app.get("/api/departments", response_model=list[schemas.DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """List all official university departments/offices with live employee counts."""
    departments = db.query(models.Department).order_by(models.Department.name.asc()).all()

    # Pre-aggregate non-archived user counts per department
    user_counts = dict(
        db.query(models.UserAccount.department_id, func.count(models.UserAccount.id))
        .filter(models.UserAccount.is_archived == False)
        .group_by(models.UserAccount.department_id)
        .all()
    )

    # Pre-aggregate active evaluations per department
    active_eval_counts = dict(
        db.query(models.UserAccount.department_id, func.count(models.EvaluationRecord.id))
        .join(models.EvaluationRecord, models.EvaluationRecord.employee_id == models.UserAccount.id)
        .filter(
            models.UserAccount.is_archived == False,
            models.EvaluationRecord.status.notin_(["Completed", "Rejected"]),
        )
        .group_by(models.UserAccount.department_id)
        .all()
    )

    results = []
    for d in departments:
        d_out = schemas.DepartmentOut.model_validate(d)
        d_out.employee_count = user_counts.get(d.id, 0)
        d_out.active_evaluations = active_eval_counts.get(d.id, 0)
        results.append(d_out)

    return results


@app.post("/api/departments", response_model=schemas.DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    dept: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Create a new department (HR only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can create departments.")

    existing = db.query(models.Department).filter(models.Department.name == dept.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists.")

    new_dept = models.Department(**dept.model_dump())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@app.patch("/api/departments/{dept_id}", response_model=schemas.DepartmentOut)
def update_department(
    dept_id: int,
    dept_update: schemas.DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Edit department info (HR only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can edit departments.")

    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    if dept_update.name is not None and dept_update.name != dept.name:
        existing = db.query(models.Department).filter(models.Department.name == dept_update.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this name already exists.")
        dept.name = dept_update.name

    if dept_update.college is not None:
        dept.college = dept_update.college
    if dept_update.college_code is not None:
        dept.college_code = dept_update.college_code
    if dept_update.latitude is not None:
        dept.latitude = dept_update.latitude
    if dept_update.longitude is not None:
        dept.longitude = dept_update.longitude
    if dept_update.radius_meters is not None:
        dept.radius_meters = dept_update.radius_meters

    db.commit()
    db.refresh(dept)
    return dept


@app.delete("/api/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Delete department (HR only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can delete departments.")

    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    # Referential Integrity Rule (UC-10, FR-23)
    user_count = db.query(models.UserAccount).filter(models.UserAccount.department_id == dept_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department '{dept.name}': {user_count} employee accounts are assigned to it.",
        )

    db.delete(dept)
    db.commit()
    return {"message": f"Department '{dept.name}' deleted successfully."}


# ==========================================
# EVALUATION SYSTEM (50/20/30) (UC-01, UC-04, UC-05, UC-06)
# ==========================================
@app.get("/api/evaluations", response_model=list[schemas.EvaluationRecordOut])
def list_evaluations(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    return db.query(models.EvaluationRecord).all()


@app.post("/api/evaluations/{eval_id}/score")
def submit_evaluation_score(
    eval_id: int,
    payload: schemas.EvaluationScoreSubmit,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
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

    # 50/20/30 Formula: Final = (Supervisor * 0.50) + (Peer * 0.20) + (HRMO * 0.30)
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
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
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
# CONTRACT RENEWALS (UC-02)
# ==========================================
@app.get("/api/renewals", response_model=list[schemas.RenewalApplicationOut])
def list_renewals(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    return db.query(models.RenewalApplication).all()


@app.post("/api/renewals", response_model=schemas.RenewalApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_renewal(
    payload: schemas.RenewalApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Create Renewal Application record
    renewal = models.RenewalApplication(
        employee_id=current_user.id,
        period=payload.period,
        status="Submitted",
        loi_file_url=payload.loi_file_url,
        loi_original_filename=payload.loi_original_filename,
        mar_narrative=payload.mar_narrative,
        submitted_at=now,
    )
    db.add(renewal)
    db.commit()
    db.refresh(renewal)

    dept_name = (
        current_user.department.name
        if current_user.department
        else "your department"
    )

    # 2. Personal Confirmation Notification for Employee
    emp_notif = models.Notification(
        user_id=current_user.id,
        title="Contract Renewal Intent Confirmed",
        message=f"Your 6-month contract renewal application for {payload.period} has been submitted and forwarded to your Department Head for endorsement.",
        category="contract",
        is_read=False,
        action_view="contract_status",
        created_at=now,
    )
    db.add(emp_notif)

    # 3. Smart Rollup Notification for Department Head (Consolidated Batch)
    dept_head = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "Department Head",
            models.UserAccount.department_id == current_user.department_id,
            models.UserAccount.is_archived == False,
        )
        .first()
    )

    dept_renewals_today = (
        db.query(models.RenewalApplication)
        .join(models.UserAccount, models.RenewalApplication.employee_id == models.UserAccount.id)
        .filter(
            models.UserAccount.department_id == current_user.department_id,
            models.RenewalApplication.submitted_at >= today_start,
        )
        .count()
    )

    existing_dept_rollup = (
        db.query(models.Notification)
        .filter(
            models.Notification.category == "renewal_rollup_dept",
            models.Notification.is_read == False,
            models.Notification.created_at >= today_start,
            (models.Notification.user_id == (dept_head.id if dept_head else None))
            | (models.Notification.target_role == "Department Head"),
        )
        .first()
    )

    if existing_dept_rollup:
        # Aggregation: update existing unread notification card
        existing_dept_rollup.title = f"{dept_renewals_today} Subordinate Renewal Intents Submitted"
        existing_dept_rollup.message = f"{dept_renewals_today} COS Personnel in {dept_name} have submitted contract renewal applications today for your endorsement review."
        existing_dept_rollup.action_view = "intent_review"
        existing_dept_rollup.created_at = now
    else:
        title = (
            "Contract Renewal Intent Submitted"
            if dept_renewals_today <= 1
            else f"{dept_renewals_today} Subordinate Renewal Intents Submitted"
        )
        message = (
            f"{current_user.full_name} submitted a formal Contract Renewal Intent for {dept_name}."
            if dept_renewals_today <= 1
            else f"{dept_renewals_today} COS Personnel in {dept_name} have submitted renewal intents for review."
        )
        db.add(
            models.Notification(
                user_id=dept_head.id if dept_head else None,
                target_role="Department Head" if not dept_head else None,
                title=title,
                message=message,
                category="renewal_rollup_dept",
                is_read=False,
                action_view="intent_review",
                created_at=now,
            )
        )

    # 4. Smart Rollup Notification for HR Personnel (Campus-Wide Batch)
    hr_renewals_today = (
        db.query(models.RenewalApplication)
        .filter(models.RenewalApplication.submitted_at >= today_start)
        .count()
    )

    existing_hr_rollup = (
        db.query(models.Notification)
        .filter(
            models.Notification.category == "renewal_rollup_hr",
            models.Notification.is_read == False,
            models.Notification.created_at >= today_start,
            models.Notification.target_role == "HR Personnel",
        )
        .first()
    )

    if existing_hr_rollup:
        # Aggregation: update existing unread HR batch card
        existing_hr_rollup.title = f"{hr_renewals_today} Contract Renewal Applications Submitted"
        existing_hr_rollup.message = f"{hr_renewals_today} COS Personnel across campus departments have submitted renewal applications today."
        existing_hr_rollup.action_view = "evaluation_management"
        existing_hr_rollup.created_at = now
    else:
        hr_title = (
            "New Contract Renewal Application"
            if hr_renewals_today <= 1
            else f"{hr_renewals_today} Renewal Applications Submitted"
        )
        hr_message = (
            f"A contract renewal application was submitted by {current_user.full_name} ({dept_name})."
            if hr_renewals_today <= 1
            else f"{hr_renewals_today} COS Personnel across campus departments have submitted renewal applications today."
        )
        db.add(
            models.Notification(
                target_role="HR Personnel",
                title=hr_title,
                message=hr_message,
                category="renewal_rollup_hr",
                is_read=False,
                action_view="evaluation_management",
                created_at=now,
            )
        )

    db.commit()

    # 5. Security Audit Log
    log_audit(
        db=db,
        action="RENEWAL_INTENT_SUBMITTED",
        target_scope=f"User #{current_user.id} ({current_user.full_name})",
        operation_details=f"Submitted contract renewal application for period {payload.period}.",
        user=current_user,
    )

    return renewal
