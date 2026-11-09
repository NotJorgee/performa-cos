import asyncio
import datetime
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from .config import settings
from .database import get_db, engine, Base
from . import models, schemas
from .auth import get_current_user
from .storage_service import ensure_buckets_exist
from .email_service import (
    send_renewal_intent_submitted_email,
    send_endorsement_decision_email,
    send_contract_resolution_email,
    send_dept_head_contract_resolution_email,
)
from .scheduler import evaluate_contract_deadlines, start_deadline_scheduler

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
from .routers.backup import router as backup_router
from .routers.templates import router as templates_router
from .routers.attendance import router as attendance_router
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
app.include_router(backup_router)
app.include_router(templates_router)
app.include_router(attendance_router)


@app.on_event("startup")
async def startup_event():
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[startup] Table creation check: {e}")
    try:
        ensure_buckets_exist()
    except Exception as e:
        print(f"[startup] Storage bucket check failed: {e}")
    try:
        asyncio.create_task(start_deadline_scheduler())
    except Exception as e:
        print(f"[startup] Failed to launch deadline scheduler: {e}")


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
        d_out.domain = d.college
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

    dept_data = dept.model_dump()
    if dept_data.get("domain") and not dept_data.get("college"):
        dept_data["college"] = dept_data["domain"]
    dept_data.pop("domain", None)
    new_dept = models.Department(**dept_data)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    res = schemas.DepartmentOut.model_validate(new_dept)
    res.domain = new_dept.college
    return res


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

    if dept_update.domain is not None:
        dept.college = dept_update.domain
    elif dept_update.college is not None:
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

    # Universal Immediate Supervisor Evaluation (100% Definitive Score)
    ev.supervisor_score = payload.raw_score
    ev.final_score = payload.raw_score
    ev.supervisor_id = current_user.id

    if ev.final_score >= 90:
        ev.rating_label = "Outstanding"
    elif ev.final_score >= 70:
        ev.rating_label = "Very Satisfactory"
    elif ev.final_score >= 50:
        ev.rating_label = "Satisfactory"
    elif ev.final_score >= 30:
        ev.rating_label = "Needs Improvement"
    else:
        ev.rating_label = "Unsatisfactory"

    if payload.strengths:
        ev.qualitative_strengths = payload.strengths
    if payload.recommendations:
        ev.qualitative_recommendations = payload.recommendations
    if payload.dimension_scores:
        ev.dimension_scores = payload.dimension_scores

    ev.status = "Completed"
    db.commit()
    db.refresh(ev)
    return {
        "message": "Performance evaluation successfully recorded by Immediate Supervisor.",
        "supervisor_score": ev.supervisor_score,
        "final_score": ev.final_score,
        "rating_label": ev.rating_label,
        "status": ev.status,
    }


@app.post("/api/evaluations/employee/{employee_id}/score")
def submit_employee_evaluation_score(
    employee_id: int,
    payload: schemas.EvaluationScoreSubmit,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    ev = (
        db.query(models.EvaluationRecord)
        .filter(models.EvaluationRecord.employee_id == employee_id)
        .order_by(models.EvaluationRecord.id.desc())
        .first()
    )
    if not ev or ev.status == "Completed":
        ev = models.EvaluationRecord(
            period=datetime.datetime.utcnow().strftime("Evaluation Cycle %Y"),
            employee_id=employee_id,
            supervisor_id=current_user.id,
            status="Open",
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)

    ev.supervisor_score = payload.raw_score
    ev.final_score = payload.raw_score
    ev.supervisor_id = current_user.id

    if ev.final_score >= 90:
        ev.rating_label = "Outstanding"
    elif ev.final_score >= 70:
        ev.rating_label = "Very Satisfactory"
    elif ev.final_score >= 50:
        ev.rating_label = "Satisfactory"
    elif ev.final_score >= 30:
        ev.rating_label = "Needs Improvement"
    else:
        ev.rating_label = "Unsatisfactory"

    if payload.strengths:
        ev.qualitative_strengths = payload.strengths
    if payload.recommendations:
        ev.qualitative_recommendations = payload.recommendations
    if payload.dimension_scores:
        ev.dimension_scores = payload.dimension_scores

    ev.status = "Completed"
    db.commit()
    db.refresh(ev)
    return {
        "message": "Performance evaluation successfully recorded by Immediate Supervisor.",
        "evaluation_id": ev.id,
        "supervisor_score": ev.supervisor_score,
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


@app.post("/api/evaluations/employee/{employee_id}/start")
def start_employee_evaluation(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    HR Personnel or Department Head initiates/opens the evaluation cycle for an employee.
    Ensures an EvaluationRecord exists with status 'Open' and dispatches in-app notifications.
    """
    if current_user.role not in ["HR Personnel", "Department Head"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR Personnel or Department Heads can initiate evaluations.",
        )

    emp = db.query(models.UserAccount).filter(models.UserAccount.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    ev = (
        db.query(models.EvaluationRecord)
        .filter(models.EvaluationRecord.employee_id == employee_id)
        .order_by(models.EvaluationRecord.id.desc())
        .first()
    )

    now = datetime.datetime.utcnow()
    cycle_period = now.strftime("Evaluation Cycle %Y")
    renewal = (
        db.query(models.RenewalApplication)
        .filter(models.RenewalApplication.employee_id == employee_id)
        .order_by(models.RenewalApplication.id.desc())
        .first()
    )
    if renewal and renewal.period:
        cycle_period = renewal.period

    if not ev or ev.status == "Completed":
        ev = models.EvaluationRecord(
            period=cycle_period,
            employee_id=employee_id,
            status="Open",
            created_at=now,
        )
        db.add(ev)
    else:
        ev.status = "Open"

    if renewal and renewal.status in ["Submitted", "Pending Initiation"]:
        renewal.status = "Under Review"

    dept_head = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "Department Head",
            models.UserAccount.department_id == emp.department_id,
            models.UserAccount.is_archived == False,
        )
        .first()
    )
    if dept_head:
        db.add(
            models.Notification(
                user_id=dept_head.id,
                title="Performance Evaluation Initiated",
                message=f"Performance evaluation for {emp.full_name} has been initiated and opened for supervisory scoring.",
                category="evaluation",
                is_read=False,
                action_view="intent_review",
                created_at=now,
            )
        )

    db.add(
        models.Notification(
            user_id=emp.id,
            title="Performance Evaluation Cycle Opened",
            message="Your performance evaluation cycle is now underway with your Immediate Supervisor.",
            category="evaluation",
            is_read=False,
            action_view="contract_status",
            created_at=now,
        )
    )

    log_audit(
        db=db,
        action="EVALUATION_INITIATED",
        target_scope=f"User #{emp.id} ({emp.full_name})",
        operation_details=f"Initiated performance evaluation for {emp.full_name} ({cycle_period}).",
        user=current_user,
    )

    db.commit()
    db.refresh(ev)

    return {
        "message": f"Evaluation initiated for {emp.full_name}",
        "evaluation_id": ev.id,
        "status": ev.status,
        "period": ev.period,
    }


# ==========================================
# CONTRACT RENEWALS (UC-02)
# ==========================================
@app.get("/api/renewals", response_model=list[schemas.RenewalApplicationOut])
def list_renewals(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    query = db.query(models.RenewalApplication)
    if current_user.role == "Department Head" and current_user.department_id:
        query = query.join(models.UserAccount, models.RenewalApplication.employee_id == models.UserAccount.id).filter(
            models.UserAccount.department_id == current_user.department_id
        )
    return query.order_by(models.RenewalApplication.id.desc()).all()


@app.post("/api/renewals", response_model=schemas.RenewalApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_renewal(
    payload: schemas.RenewalApplicationCreate,
    background_tasks: BackgroundTasks,
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

    # Automatically initialize EvaluationRecord for Immediate Supervisor
    existing_eval = (
        db.query(models.EvaluationRecord)
        .filter(
            models.EvaluationRecord.employee_id == current_user.id,
            models.EvaluationRecord.period == payload.period,
        )
        .first()
    )
    if not existing_eval:
        db.add(
            models.EvaluationRecord(
                period=payload.period,
                employee_id=current_user.id,
                status="Open",
            )
        )

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
        message=f"Your contract renewal application for {payload.period} has been submitted and forwarded to your Department Head for endorsement.",
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

    # 6. Automatic SMTP Email to Department Head
    if dept_head and dept_head.email:
        background_tasks.add_task(
            send_renewal_intent_submitted_email,
            to=dept_head.email,
            emp_name=current_user.full_name,
            dept_name=dept_name,
            period=payload.period,
            dept_head_name=dept_head.full_name,
        )

    return renewal


@app.post("/api/renewals/{renewal_id}/endorse")
def endorse_renewal(
    renewal_id: int,
    payload: schemas.RenewalEndorsementSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Department Head submits endorsement review for subordinate renewal intent.
    Automatically generates in-app notifications and dispatches official email to HR Personnel.
    """
    if current_user.role not in ["Department Head", "HR Personnel"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Department Heads or HR Personnel can submit renewal endorsements.",
        )

    renewal = db.query(models.RenewalApplication).filter(models.RenewalApplication.id == renewal_id).first()
    if not renewal:
        raise HTTPException(status_code=404, detail="Renewal application not found.")

    emp = db.query(models.UserAccount).filter(models.UserAccount.id == renewal.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    is_rec = payload.status == "Recommended"
    renewal.department_head_endorsement = "Endorsed" if is_rec else "Disapproved"
    renewal.status = "Pending HRMO" if is_rec else "Pending HR Mediation"

    notes_or_grounds = payload.notes if is_rec else f"Grounds: {payload.category or 'Performance'}. Justification: {payload.justification or 'None provided'}"
    if renewal.mar_narrative:
        renewal.mar_narrative += f"\n[Dept Head Endorsement]: {payload.status}. {notes_or_grounds}"
    else:
        renewal.mar_narrative = f"[Dept Head Endorsement]: {payload.status}. {notes_or_grounds}"

    now = datetime.datetime.utcnow()
    dept_name = emp.department.name if emp.department else "Department"

    # In-App Notification for HR Personnel
    hr_title = f"Renewal Endorsement: {emp.full_name} ({payload.status})"
    hr_msg = f"Department Head {current_user.full_name} ({dept_name}) has filed a renewal endorsement for {emp.full_name}: {payload.status}. {notes_or_grounds}"
    db.add(
        models.Notification(
            target_role="HR Personnel",
            title=hr_title,
            message=hr_msg,
            category="contract",
            is_read=False,
            action_view="evaluation_management",
            created_at=now,
        )
    )

    # In-App Notification for Employee
    emp_title = "Renewal Endorsement Update"
    emp_msg = f"Your Department Head has reviewed your contract renewal application: {payload.status}. It has been forwarded to HRMO."
    db.add(
        models.Notification(
            user_id=emp.id,
            title=emp_title,
            message=emp_msg,
            category="contract",
            is_read=False,
            action_view="contract_status",
            created_at=now,
        )
    )

    db.commit()
    db.refresh(renewal)

    # Dispatches email to all active HR Personnel
    hr_users = db.query(models.UserAccount).filter(
        models.UserAccount.role == "HR Personnel",
        models.UserAccount.is_archived == False,
    ).all()

    for h in hr_users:
        if h.email:
            background_tasks.add_task(
                send_endorsement_decision_email,
                to=h.email,
                emp_name=emp.full_name,
                dept_name=dept_name,
                status=payload.status,
                notes_or_grounds=notes_or_grounds,
                dept_head_name=current_user.full_name,
                hr_name=h.full_name,
            )

    log_audit(
        db=db,
        action="RENEWAL_ENDORSEMENT_FILED",
        target_scope=f"Renewal #{renewal.id} ({emp.full_name})",
        operation_details=f"Department Head {current_user.full_name} endorsed renewal: {payload.status}. {notes_or_grounds}",
        user=current_user,
    )

    return {
        "message": f"Renewal endorsement filed as {payload.status}",
        "renewal_id": renewal.id,
        "status": renewal.status,
        "department_head_endorsement": renewal.department_head_endorsement,
    }


@app.post("/api/renewals/{renewal_id}/finalize-contract")
def finalize_contract_renewal(
    renewal_id: int,
    payload: schemas.RenewalFinalizeSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    HR Personnel finalizes contract renewal disposition (Renewed / Non-Renewal).
    Dispatches in-app notifications and official resolution emails to Employee and Dept Head.
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR Personnel can finalize contract renewal determinations.",
        )

    renewal = db.query(models.RenewalApplication).filter(models.RenewalApplication.id == renewal_id).first()
    if not renewal:
        raise HTTPException(status_code=404, detail="Renewal application not found.")

    emp = db.query(models.UserAccount).filter(models.UserAccount.id == renewal.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    is_renewed = payload.decision == "Yes"
    renewal.hrmo_approval = "Approved" if is_renewed else "Declined"
    renewal.status = "Approved" if is_renewed else "Declined"

    if is_renewed:
        emp.total_contracts = (emp.total_contracts or 0) + 1
        from .routers.auth import _add_six_months
        new_start = (emp.contract_end_date + datetime.timedelta(days=1)) if emp.contract_end_date else datetime.date.today()
        emp.contract_start_date = new_start
        emp.contract_end_date = _add_six_months(new_start)

    now = datetime.datetime.utcnow()
    decision_label = "RENEWED (Term Extension)" if is_renewed else "DO NOT RENEW (Contract Conclusion)"
    remarks = payload.remarks.strip() if payload.remarks and payload.remarks.strip() else None
    remarks_suffix = f" Remarks: {remarks}" if remarks else ""

    # Record HR resolution remarks in renewal application narrative if provided
    if renewal.mar_narrative:
        renewal.mar_narrative += f"\n[HRMO Resolution]: {decision_label}.{remarks_suffix}"
    else:
        renewal.mar_narrative = f"[HRMO Resolution]: {decision_label}.{remarks_suffix}"

    # Record to university audit trail
    db.add(
        models.AuditLog(
            user_id=current_user.id,
            user_name=current_user.full_name,
            role=current_user.role,
            action="FINALIZE_CONTRACT_DISPOSITION",
            target_scope=f"Employee {emp.full_name} (ID: {emp.id})",
            operation_details=f"Decision: {payload.decision}. Disposition: {decision_label}.{remarks_suffix}",
            timestamp=now,
        )
    )

    # In-App Notification for Employee
    db.add(
        models.Notification(
            user_id=emp.id,
            title="Official Contract Resolution Finalized",
            message=f"HRMO has finalized your contract disposition: {decision_label}.{remarks_suffix}",
            category="contract",
            is_read=False,
            action_view="contract_status",
            created_at=now,
        )
    )

    # In-App Notification for Department Head
    dept_head = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "Department Head",
            models.UserAccount.department_id == emp.department_id,
            models.UserAccount.is_archived == False,
        )
        .first()
    )
    if dept_head:
        db.add(
            models.Notification(
                user_id=dept_head.id,
                title=f"Contract Resolution: {emp.full_name}",
                message=f"Official determination finalized for {emp.full_name}: {decision_label}.{remarks_suffix}",
                category="contract",
                is_read=False,
                action_view="department_records",
                created_at=now,
            )
        )

    db.commit()
    db.refresh(renewal)

    # Dispatches email to Employee
    if emp.email:
        background_tasks.add_task(
            send_contract_resolution_email,
            to=emp.email,
            emp_name=emp.full_name,
            decision=payload.decision,
            remarks=remarks,
            period=renewal.period,
        )

    # Dispatches email to Department Head
    if dept_head and dept_head.email:
        dept_name_str = dept_head.department.name if dept_head.department else (emp.department.name if emp.department else "Department")
        background_tasks.add_task(
            send_dept_head_contract_resolution_email,
            to=dept_head.email,
            dept_head_name=dept_head.full_name,
            emp_name=emp.full_name,
            dept_name=dept_name_str,
            decision=payload.decision,
            remarks=remarks,
            period=renewal.period,
        )

    log_audit(
        db=db,
        action="CONTRACT_DISPOSITION_FINALIZED",
        target_scope=f"User #{emp.id} ({emp.full_name})",
        operation_details=f"HRMO finalized contract disposition as {decision_label}. Remarks: {remarks}",
        user=current_user,
    )

    return {
        "message": f"Contract disposition finalized as {decision_label}",
        "renewal_id": renewal.id,
        "hrmo_approval": renewal.hrmo_approval,
        "status": renewal.status,
    }


@app.post("/api/scheduler/check-deadlines")
def trigger_deadline_check(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Manually triggers the automated contract expiration & renewal window evaluation.
    Evaluates all active COS Employee contracts and dispatches due alerts.
    """
    result = evaluate_contract_deadlines(db)
    log_audit(
        db=db,
        action="DEADLINE_EVALUATION_TRIGGERED",
        target_scope="System Scheduler",
        operation_details=f"Evaluated {result['total_evaluated']} contracts. Dispatched {result['alerts_dispatched']} deadline alerts.",
        user=current_user,
    )
    return result
