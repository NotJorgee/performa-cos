"""
routers/analytics.py — Real-time institutional metrics & dashboard analytics for PerformaCOS.
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..auth import get_current_user
from .. import models

router = APIRouter(prefix="/api/analytics", tags=["Dashboard Analytics"])


@router.get("/hr-dashboard")
def get_hr_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Real-time institutional metrics for HRMD Officers and Administrators."""
    today = datetime.date.today()
    thirty_days_later = today + datetime.timedelta(days=30)

    # 1. Total COS Employees (Active & Non-Archived)
    total_employees = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "COS Employee",
            models.UserAccount.is_archived == False,
        )
        .count()
    )

    # 2. Total Administrators (HR Personnel + Dept Heads)
    total_administrators = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role.in_(["HR Personnel", "Department Head"]),
            models.UserAccount.is_archived == False,
        )
        .count()
    )

    # 3. Active Departments & Colleges
    total_departments = db.query(models.Department).count()
    active_colleges = (
        db.query(func.count(func.distinct(models.Department.college)))
        .filter(models.Department.college.isnot(None))
        .scalar()
        or 1
    )

    # 4. DARs Submitted Today
    dar_today = (
        db.query(models.DailyAccomplishmentReport)
        .filter(models.DailyAccomplishmentReport.log_date == today)
        .count()
    )

    # 5. Pending Evaluations (Triad cycles not yet completed)
    pending_evals = (
        db.query(models.EvaluationRecord)
        .filter(models.EvaluationRecord.status.notin_(["Completed", "Rejected"]))
        .count()
    )

    # 6. Total Completed Evaluations & Rate
    total_evals = db.query(models.EvaluationRecord).count()
    completed_evals = (
        db.query(models.EvaluationRecord)
        .filter(models.EvaluationRecord.status == "Completed")
        .count()
    )
    completion_rate = (
        round((completed_evals / total_evals) * 100, 1)
        if total_evals > 0
        else 0
    )

    # 7. Contracts Nearing Expiration (within 30 days)
    nearing_expiration = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "COS Employee",
            models.UserAccount.is_archived == False,
            models.UserAccount.contract_end_date.isnot(None),
            models.UserAccount.contract_end_date <= thirty_days_later,
            models.UserAccount.contract_end_date >= today,
        )
        .count()
    )

    # 8. Verified MAR reports submitted
    verified_dars = (
        db.query(models.DailyAccomplishmentReport)
        .filter(models.DailyAccomplishmentReport.status == "Verified")
        .count()
    )

    return {
        "totalEmployees": total_employees,
        "totalAdministrators": total_administrators,
        "totalDepartments": total_departments,
        "activeColleges": active_colleges,
        "darSubmittedToday": dar_today,
        "pendingEvaluations": pending_evals,
        "marReportsSubmitted": verified_dars,
        "completionRate": completion_rate,
        "nearingExpiration": nearing_expiration,
    }


@router.get("/depthead-dashboard")
def get_depthead_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Department Head overview metrics scoped to their assigned department."""
    dept_id = current_user.department_id

    # Total subordinates
    subordinates_query = db.query(models.UserAccount).filter(
        models.UserAccount.role == "COS Employee",
        models.UserAccount.is_archived == False,
    )
    if dept_id:
        subordinates_query = subordinates_query.filter(models.UserAccount.department_id == dept_id)
    total_subordinates = subordinates_query.count()

    # Pending supervisor evaluations
    pending_evals_query = db.query(models.EvaluationRecord).join(
        models.UserAccount, models.EvaluationRecord.employee_id == models.UserAccount.id
    ).filter(
        models.EvaluationRecord.supervisor_score == None,
        models.EvaluationRecord.status.notin_(["Completed", "Rejected"]),
    )
    if dept_id:
        pending_evals_query = pending_evals_query.filter(models.UserAccount.department_id == dept_id)
    pending_reviews = pending_evals_query.count()

    # Pending renewal intent reviews
    pending_intents_query = db.query(models.RenewalApplication).join(
        models.UserAccount, models.RenewalApplication.employee_id == models.UserAccount.id
    ).filter(
        models.RenewalApplication.department_head_endorsement == None,
    )
    if dept_id:
        pending_intents_query = pending_intents_query.filter(models.UserAccount.department_id == dept_id)
    pending_intents = pending_intents_query.count()

    return {
        "totalSubordinates": total_subordinates,
        "pendingReviews": pending_reviews,
        "pendingIntents": pending_intents,
        "avgScore": 0.0,
        "ratingLabel": "Active Department",
    }


@router.get("/employee-dashboard")
def get_employee_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """COS Employee personal operational metrics."""
    today = datetime.date.today()

    # 1. DARs today
    dar_today = (
        db.query(models.DailyAccomplishmentReport)
        .filter(
            models.DailyAccomplishmentReport.user_id == current_user.id,
            models.DailyAccomplishmentReport.log_date == today,
        )
        .count()
    )

    # 2. Total DARs logged
    total_dars = (
        db.query(models.DailyAccomplishmentReport)
        .filter(models.DailyAccomplishmentReport.user_id == current_user.id)
        .count()
    )

    # 3. Contract expiration calculations
    contract_end = current_user.contract_end_date
    days_until_expiration = 0
    if contract_end:
        days_until_expiration = max(0, (contract_end - today).days)

    # 4. Renewal intent status
    latest_renewal = (
        db.query(models.RenewalApplication)
        .filter(models.RenewalApplication.employee_id == current_user.id)
        .order_by(models.RenewalApplication.id.desc())
        .first()
    )
    intent_status = latest_renewal.status if latest_renewal else "Open for Intent Confirmation"

    return {
        "contractEndDate": contract_end.strftime("%B %d, %Y") if contract_end else "Not Specified",
        "daysUntilExpiration": days_until_expiration,
        "darTasksToday": dar_today,
        "totalDarsLogged": total_dars,
        "renewalIntentStatus": intent_status,
        "pendingPeerReviews": 0,
    }
