"""
routers/dar.py — Daily Accomplishment Reports (DAR) & MAR aggregation for PerformaCOS.
"""
import math
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/dar", tags=["Daily Accomplishment Reports"])


def calculate_haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in meters between two GPS coordinates."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.post("", response_model=schemas.DailyReportOut, status_code=status.HTTP_201_CREATED)
def submit_dar(
    report: schemas.DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Submits a Daily Accomplishment Report with multi-campus geofence verification.
    Accepts both unified single task input or structured task list.
    """
    is_valid_geofence = False
    verified_campus = None

    if report.latitude and report.longitude:
        # Check against database-configured campus geofences
        active_campuses = db.query(models.CampusGeofence).filter(models.CampusGeofence.enforce_geofence == True).all()
        if active_campuses:
            for campus in active_campuses:
                from .geofence import is_point_in_polygon
                if campus.boundary_type == "polygon" and campus.polygon_coords and len(campus.polygon_coords) >= 3:
                    if is_point_in_polygon(report.latitude, report.longitude, campus.polygon_coords):
                        is_valid_geofence = True
                        verified_campus = campus.name
                        break
                else:
                    dist = calculate_haversine_distance_meters(
                        report.latitude, report.longitude,
                        campus.latitude, campus.longitude,
                    )
                    if dist <= campus.radius_meters:
                        is_valid_geofence = True
                        verified_campus = campus.name
                        break
        else:
            # Fallback to config settings
            dist_main = calculate_haversine_distance_meters(
                report.latitude, report.longitude,
                settings.EVSU_MAIN_LATITUDE, settings.EVSU_MAIN_LONGITUDE,
            )
            dist_luna = calculate_haversine_distance_meters(
                report.latitude, report.longitude,
                settings.EVSU_LUNA_LATITUDE, settings.EVSU_LUNA_LONGITUDE,
            )

            if dist_main <= settings.EVSU_MAIN_RADIUS_METERS:
                is_valid_geofence = True
                verified_campus = "EVSU Ormoc — Main Campus"
            elif dist_luna <= settings.EVSU_LUNA_RADIUS_METERS:
                is_valid_geofence = True
                verified_campus = "EVSU Ormoc — Luna Campus"

    # Duplicate photo hash check (anti-spoofing / anti-replay)
    if report.photo_hash:
        existing = (
            db.query(models.DailyAccomplishmentReport)
            .filter(
                models.DailyAccomplishmentReport.user_id == current_user.id,
                models.DailyAccomplishmentReport.photo_hash == report.photo_hash,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate photo evidence detected: This exact photo was already submitted for an accomplishment report. Live, unique photo documentation is required for each task.",
            )

    # Normalize tasks structure:
    tasks_data = []
    if report.tasks and len(report.tasks) > 0:
        tasks_data = [t.model_dump() for t in report.tasks]
    elif report.job_description:
        tasks_data = [
            {
                "title": report.job_description,
                "workAccomplished": report.work_accomplished or "",
                "category": "General",
                "hours": 8.0,
                "quantity": report.quantity or "1 task",
                "requiresPhoto": bool(report.photo_evidence_url),
                "photos": [report.photo_evidence_url] if report.photo_evidence_url else [],
            }
        ]

    new_dar = models.DailyAccomplishmentReport(
        user_id=current_user.id,
        log_date=report.log_date or datetime.date.today(),
        status="Submitted" if is_valid_geofence else "Pending Geofence Verification",
        is_geofence_verified=is_valid_geofence,
        latitude=report.latitude,
        longitude=report.longitude,
        photo_hash=report.photo_hash,
        remarks=(
            f"[{verified_campus}] {report.remarks}"
            if verified_campus and report.remarks
            else (verified_campus or report.remarks)
        ),
        tasks=tasks_data,
    )
    db.add(new_dar)
    db.commit()
    db.refresh(new_dar)
    return new_dar


@router.get("", response_model=List[schemas.DailyReportOut])
def list_dars(
    user_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    List DAR logs. Employees see only their own. Dept Head and HR can view subordinate logs.
    """
    target_user_id = user_id or current_user.id
    if current_user.role == "COS Employee" and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot view another employee's DAR logs.")

    query = db.query(models.DailyAccomplishmentReport).filter(
        models.DailyAccomplishmentReport.user_id == target_user_id
    )

    if year:
        query = query.filter(models.DailyAccomplishmentReport.log_date >= datetime.date(year, 1, 1))
        query = query.filter(models.DailyAccomplishmentReport.log_date <= datetime.date(year, 12, 31))
    if month and year:
        import calendar
        _, last_day = calendar.monthrange(year, month)
        query = query.filter(models.DailyAccomplishmentReport.log_date >= datetime.date(year, month, 1))
        query = query.filter(models.DailyAccomplishmentReport.log_date <= datetime.date(year, month, last_day))

    return query.order_by(models.DailyAccomplishmentReport.log_date.desc()).all()


@router.get("/monthly", response_model=List[schemas.MonthlyReportRecordOut])
def get_monthly_accomplishment_report(
    user_id: Optional[int] = None,
    month_name: Optional[str] = None,
    year: Optional[int] = None,
    cutoff: Optional[str] = Query("all", pattern="^(1st_half|2nd_half|full_month|all)$"),
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns aggregated DAR accomplishment records matching the exact format required by Accumulated DAR logs.
    Supports quincena cutoff filtering:
    - 1st_half: Days 1 to 15
    - 2nd_half: Days 16 to end of month
    - full_month / all: All days of target month/year
    """
    target_user_id = user_id or current_user.id
    if current_user.role == "COS Employee" and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")

    query = db.query(models.DailyAccomplishmentReport).filter(
        models.DailyAccomplishmentReport.user_id == target_user_id
    )

    if year:
        query = query.filter(models.DailyAccomplishmentReport.log_date >= datetime.date(year, 1, 1))
        query = query.filter(models.DailyAccomplishmentReport.log_date <= datetime.date(year, 12, 31))

    records = query.order_by(models.DailyAccomplishmentReport.log_date.desc()).all()

    mar_items: List[schemas.MonthlyReportRecordOut] = []
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    for r in records:
        rec_month = month_names[r.log_date.month - 1]
        rec_year = str(r.log_date.year)
        rec_day = r.log_date.day
        rec_cutoff = "1st_half" if rec_day <= 15 else "2nd_half"

        if month_name and month_name != "All Months" and rec_month.lower() != month_name.lower():
            continue

        if cutoff == "1st_half" and rec_day > 15:
            continue
        if cutoff == "2nd_half" and rec_day < 16:
            continue

        date_str = r.created_at.strftime("%b %d, %Y, %I:%M %p") if r.created_at else r.log_date.strftime("%b %d, %Y")
        log_date_str = r.log_date.strftime("%Y-%m-%d")
        tasks = r.tasks or []

        if tasks:
            for idx, t in enumerate(tasks):
                photo_url = None
                if t.get("photos") and len(t.get("photos")) > 0:
                    photo_url = t.get("photos")[0]
                elif t.get("photoEvidenceUrl"):
                    photo_url = t.get("photoEvidenceUrl")

                mar_items.append(
                    schemas.MonthlyReportRecordOut(
                        id=r.id * 100 + idx,
                        dateSubmitted=date_str,
                        month=rec_month,
                        year=rec_year,
                        logDate=log_date_str,
                        day=rec_day,
                        cutoff=rec_cutoff,
                        jobDescription=t.get("title") or t.get("jobDescription") or "Task Log",
                        workAccomplished=t.get("workAccomplished") or "",
                        quantity=t.get("quantity") or "1 unit",
                        remarks=r.remarks,
                        photoEvidenceUrl=photo_url,
                        campusSite="EVSU Ormoc Campus",
                        isGeofenceValid=r.is_geofence_verified,
                    )
                )
        else:
            mar_items.append(
                schemas.MonthlyReportRecordOut(
                    id=r.id,
                    dateSubmitted=date_str,
                    month=rec_month,
                    year=rec_year,
                    logDate=log_date_str,
                    day=rec_day,
                    cutoff=rec_cutoff,
                    jobDescription="Daily Log",
                    workAccomplished=r.remarks or "",
                    quantity="1 day",
                    remarks=r.remarks,
                    photoEvidenceUrl=None,
                    campusSite="EVSU Ormoc Campus",
                    isGeofenceValid=r.is_geofence_verified,
                )
            )

    return mar_items
