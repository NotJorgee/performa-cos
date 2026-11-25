"""
routers/attendance.py — Attendance Logging, Campus Geofence Punching, 
Semi-Monthly 15-Day Payroll & DTR Aggregator, and Leave Management for PerformaCOS.
"""
import calendar
import datetime
import re
from typing import List, Optional, Tuple
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_

from ..database import get_db
from ..auth import get_current_user
from .. import models
from .audit import log_audit
from .geofence import calculate_haversine_distance_meters, is_point_in_polygon, distance_to_polygon_meters
from ..department_helpers import get_overseeing_department_ids

router = APIRouter(prefix="/api/attendance", tags=["Attendance & Leave Engine"])


# ---------------------------------------------------------------------------
# Pydantic Request & Response Schemas
# ---------------------------------------------------------------------------
class PunchRequest(BaseModel):
    latitude: float
    longitude: float
    remarks: Optional[str] = None
    accuracy: Optional[float] = None


class LeaveApplyRequest(BaseModel):
    leave_type: str  # 'Sick Leave' | 'Emergency Leave' | 'Official Business (OB)' | 'Overtime (OT)' | 'Bereavement' | 'Leave Without Pay'
    start_date: str  # 'YYYY-MM-DD'
    end_date: Optional[str] = None  # 'YYYY-MM-DD' (defaults to start_date if omitted)
    reason: str
    hours: Optional[float] = None
    attachment_url: Optional[str] = None


class LeaveReviewRequest(BaseModel):
    action: str  # 'APPROVE' | 'REJECT'
    review_notes: Optional[str] = None


class HolidayCreateRequest(BaseModel):
    name: str
    holiday_date: str  # 'YYYY-MM-DD'
    holiday_type: Optional[str] = "REGULAR"  # 'REGULAR' | 'SPECIAL_NON_WORKING' | 'LOCAL' | 'SUSPENSION'
    description: Optional[str] = None
    is_work_suspended: Optional[bool] = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_pht_now() -> datetime.datetime:
    """Returns current date and time in Philippine Time (UTC+8)."""
    return datetime.datetime.utcnow() + datetime.timedelta(hours=8)


def get_user_shift_schedule(user: models.UserAccount, db: Session) -> dict:
    """
    Determines shift schedule based strictly on the user's Department:
    - Department (Maintenance and Janitorial) -> MAINTENANCE (7:00 AM - 5:00 PM, 15m grace = 7:15 AM)
    - All other departments -> ADMINISTRATIVE (8:00 AM - 5:00 PM, 15m grace = 8:15 AM)
    Campus check-in gate opens at 6:00 AM PHT.
    """
    is_maintenance = False
    if user.department_id == 22:
        is_maintenance = True
    elif user.department and ("maintenance" in user.department.name.lower() or "janitorial" in user.department.name.lower()):
        is_maintenance = True

    if is_maintenance:
        return {
            "shift_type": "MAINTENANCE",
            "earliest_punch_hour": 6,
            "earliest_punch_minute": 0,
            "earliest_punch_str": "6:00 AM",
            "start_hour": 7,
            "start_minute": 0,
            "grace_period_minute": 15,
            "end_hour": 17,
            "end_minute": 0,
            "official_time": "7:00 AM - 5:00 PM",
            "official_start_str": "07:00 AM",
            "grace_cutoff": "7:15 AM",
            "label": "Maintenance and Janitorial Shift",
        }
    else:
        return {
            "shift_type": "ADMINISTRATIVE",
            "earliest_punch_hour": 6,
            "earliest_punch_minute": 0,
            "earliest_punch_str": "6:00 AM",
            "start_hour": 8,
            "start_minute": 0,
            "grace_period_minute": 15,
            "end_hour": 17,
            "end_minute": 0,
            "official_time": "8:00 AM - 5:00 PM",
            "official_start_str": "08:00 AM",
            "grace_cutoff": "8:15 AM",
            "label": "Administrative & Academic Support Shift",
        }


def resolve_normalized_time_in(
    time_in_dt: Optional[datetime.datetime],
    shift: dict,
    is_overtime: bool = False,
) -> tuple[Optional[str], bool, int]:
    """
    Applies Approach B (Time Normalization / CSC Form 48 standard):
    - Returns: (credited_time_in_str, is_early, early_minutes)
    - If user punches in before official shift start (e.g. 7:15 AM for an 8:00 AM shift),
      their official credited start time is normalized to shift start (8:00 AM / 7:00 AM).
    - If Saturday overtime or timed in after shift start, credited time equals actual time_in.
    """
    if not time_in_dt:
        return (None, False, 0)

    if is_overtime:
        return (time_in_dt.strftime("%I:%M %p"), False, 0)

    start_mins = shift["start_hour"] * 60 + shift["start_minute"]
    arrival_mins = time_in_dt.hour * 60 + time_in_dt.minute

    if arrival_mins < start_mins:
        early_mins = start_mins - arrival_mins
        credited_dt = time_in_dt.replace(
            hour=shift["start_hour"],
            minute=shift["start_minute"],
            second=0,
            microsecond=0,
        )
        return (credited_dt.strftime("%I:%M %p"), True, early_mins)

    return (time_in_dt.strftime("%I:%M %p"), False, 0)


def verify_campus_perimeter(lat: float, lon: float, db: Session, accuracy: Optional[float] = None) -> tuple[bool, str, float]:
    """
    Verifies if coordinates fall within any active EVSU Campus Geofence perimeter.
    Supports both polygon boundaries (with mobile device accuracy buffer) and radial perimeters.
    Returns: (is_inside: bool, site_name: str, distance_meters: float)
    """
    campuses = db.query(models.CampusGeofence).all()
    if not campuses:
        # Fallback to EVSU Main coordinates if table not seeded
        dist = calculate_haversine_distance_meters(lat, lon, 11.010466, 124.605469)
        return (dist <= 500.0, "EVSU Main Campus", round(dist, 1))

    # Mobile device accuracy tolerance: minimum 50m buffer, or device accuracy capped at 150m
    device_acc = accuracy if (accuracy is not None and accuracy > 0) else 0.0
    tolerance_m = max(50.0, min(device_acc, 150.0))

    closest_site = None
    min_dist = float("inf")
    matched_sites = []

    for campus in campuses:
        if campus.enforce_geofence is False:
            continue

        # Polygon-defined campus boundary: check inside polygon or within mobile accuracy tolerance
        if campus.boundary_type == "polygon" and campus.polygon_coords:
            poly_dist = distance_to_polygon_meters(lat, lon, campus.polygon_coords)
            if poly_dist < min_dist:
                min_dist = poly_dist
                closest_site = campus

            if poly_dist <= tolerance_m:
                matched_sites.append((campus, poly_dist))
        # Radial-defined campus boundary: check radial perimeter with tolerance
        else:
            radius = campus.radius_meters or 500.0
            dist_to_center = calculate_haversine_distance_meters(lat, lon, campus.latitude, campus.longitude)
            dist_to_perimeter = max(0.0, dist_to_center - radius)
            if dist_to_perimeter < min_dist:
                min_dist = dist_to_perimeter
                closest_site = campus

            if dist_to_center <= (radius + tolerance_m):
                matched_sites.append((campus, dist_to_perimeter))

    if matched_sites:
        # Sort by distance (polygon/radial matches with lowest distance first)
        matched_sites.sort(key=lambda x: x[1])
        best_campus, best_dist = matched_sites[0]
        return (True, best_campus.name, round(best_dist, 1))

    site_name = closest_site.name if closest_site else "Campus Perimeter"
    return (False, site_name, round(min_dist, 1))


# ---------------------------------------------------------------------------
# Attendance Punch Endpoints (Time-In & Time-Out)
# ---------------------------------------------------------------------------
@router.post("/time-in")
def attendance_time_in(
    payload: PunchRequest,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Records official Time-In with live GPS campus geofence validation.
    Applies 15-minute grace period based on department shift.
    Saturday punches are automatically flagged as OVERTIME.
    """
    pht_now = get_pht_now()
    today_date = pht_now.date()

    # 1. Shift Schedule Resolution
    shift = get_user_shift_schedule(current_user, db)
    arrival_mins = pht_now.hour * 60 + pht_now.minute
    earliest_mins = shift["earliest_punch_hour"] * 60 + shift["earliest_punch_minute"]
    end_mins = shift["end_hour"] * 60 + shift["end_minute"]

    weekday = pht_now.weekday()  # 0=Mon, ..., 5=Sat, 6=Sun
    is_weekend = (weekday in (5, 6))
    is_after_hours = (not is_weekend and arrival_mins >= end_mins)

    # Check if today is an official institutional holiday or declared suspension
    today_holiday = (
        db.query(models.InstitutionalHoliday)
        .filter(models.InstitutionalHoliday.holiday_date == today_date)
        .first()
    )
    is_holiday_duty = bool(today_holiday and today_holiday.is_work_suspended)

    # 1.1 Overtime / Holiday Duty Gate Check
    # Weekends, after 5:00 PM, or Institutional Holidays
    approved_ot = None
    if is_weekend or is_after_hours:
        approved_ot = (
            db.query(models.LeaveRequest)
            .filter(
                models.LeaveRequest.user_id == current_user.id,
                models.LeaveRequest.status == "APPROVED",
                models.LeaveRequest.start_date <= today_date,
                models.LeaveRequest.end_date >= today_date,
                models.LeaveRequest.leave_type.ilike("%Overtime%"),
            )
            .first()
        )
        if not approved_ot and not is_holiday_duty:
            if is_weekend:
                day_name = pht_now.strftime("%A")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Weekend attendance on {day_name} requires an approved Overtime Request. Please file an Overtime (OT) / Extended Shift Authorization under Time & Shift Requests before reporting for weekend duty.",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Regular check-in closed at 5:00 PM. An approved Overtime Request under Time & Shift Requests is required to clock in after hours.",
                )

    # 1.2 Morning Gate Opening Check (Regular weekday shifts, bypassed on holidays/weekends)
    if not is_weekend and not is_after_hours and not is_holiday_duty and arrival_mins < earliest_mins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campus check-in is not yet open. Official morning gate check-in opens at {shift['earliest_punch_str']} (official shift starts at {shift['official_start_str']}).",
        )

    # 2. Check existing record today
    existing = (
        db.query(models.AttendanceLog)
        .filter(
            models.AttendanceLog.user_id == current_user.id,
            models.AttendanceLog.log_date == today_date,
        )
        .first()
    )

    if existing and existing.time_in:
        cred_str, early_flag, early_mins = resolve_normalized_time_in(
            existing.time_in, shift, is_overtime=existing.is_overtime
        )
        return {
            "status": "already_timed_in",
            "message": "You have already timed in for today.",
            "record": {
                "id": existing.id,
                "time_in": existing.time_in.strftime("%I:%M %p"),
                "credited_time_in": cred_str,
                "is_early": early_flag,
                "early_minutes": early_mins,
                "time_out": existing.time_out.strftime("%I:%M %p") if existing.time_out else None,
                "status": existing.status,
                "minutes_late": existing.minutes_late,
                "shift_type": existing.shift_type,
                "geofence_site": existing.geofence_site_name,
            },
        }

    # 3. Geofence Verification
    is_inside, site_name, distance_m = verify_campus_perimeter(payload.latitude, payload.longitude, db, accuracy=payload.accuracy)
    if not is_inside:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance punch rejected: You are outside designated EVSU campus boundaries ({distance_m}m away from {site_name}).",
        )

    # 4. Shift and Tardiness Resolution
    if is_holiday_duty or is_weekend or is_after_hours:
        punch_status = "OVERTIME"
        is_ot = True
        minutes_late = 0
    else:
        is_ot = False
        start_mins = shift["start_hour"] * 60 + shift["start_minute"]
        grace_mins = start_mins + shift["grace_period_minute"]

        if arrival_mins > grace_mins:
            punch_status = "LATE"
            minutes_late = arrival_mins - start_mins
        else:
            punch_status = "ON_TIME"
            minutes_late = 0

    credited_time_in_str, is_early, early_minutes = resolve_normalized_time_in(
        pht_now, shift, is_overtime=is_ot
    )

    # 5. Save Record
    if existing:
        existing.time_in = pht_now
        existing.shift_type = shift["shift_type"]
        existing.status = punch_status
        existing.is_geofence_verified = True
        existing.in_latitude = payload.latitude
        existing.in_longitude = payload.longitude
        existing.geofence_site_name = site_name
        existing.minutes_late = minutes_late
        existing.is_overtime = is_ot
        if payload.remarks:
            existing.remarks = payload.remarks
        log_record = existing
    else:
        log_record = models.AttendanceLog(
            user_id=current_user.id,
            log_date=today_date,
            time_in=pht_now,
            shift_type=shift["shift_type"],
            status=punch_status,
            is_geofence_verified=True,
            in_latitude=payload.latitude,
            in_longitude=payload.longitude,
            geofence_site_name=site_name,
            minutes_late=minutes_late,
            is_overtime=is_ot,
            remarks=payload.remarks,
        )
        db.add(log_record)

    db.commit()
    db.refresh(log_record)

    audit_details = f"Time-In recorded at {pht_now.strftime('%I:%M %p')}. Status: {punch_status} ({site_name})"
    if is_ot and approved_ot:
        audit_details += f" [Approved Overtime Authorization #{approved_ot.id}]"
    elif is_early:
        audit_details += f" [Approach B: Early arrival normalized to {credited_time_in_str}]"

    log_audit(
        db=db,
        action="ATTENDANCE_TIME_IN",
        target_scope=f"{current_user.full_name} ({shift['shift_type']})",
        operation_details=audit_details,
        user=current_user,
    )

    return {
        "status": "success",
        "message": f"Time-In recorded successfully at {pht_now.strftime('%I:%M %p')}.",
        "record": {
            "id": log_record.id,
            "log_date": str(log_record.log_date),
            "time_in": log_record.time_in.strftime("%I:%M %p"),
            "credited_time_in": credited_time_in_str,
            "is_early": is_early,
            "early_minutes": early_minutes,
            "time_out": None,
            "status": log_record.status,
            "minutes_late": log_record.minutes_late,
            "shift_type": log_record.shift_type,
            "is_overtime": log_record.is_overtime,
            "geofence_site": log_record.geofence_site_name,
        },
    }


@router.post("/time-out")
def attendance_time_out(
    payload: PunchRequest,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Records official Time-Out with live GPS campus geofence validation.
    Calculates undertime if leaving before 5:00 PM, or overtime hours if Saturday.
    """
    pht_now = get_pht_now()
    today_date = pht_now.date()

    existing = (
        db.query(models.AttendanceLog)
        .filter(
            models.AttendanceLog.user_id == current_user.id,
            models.AttendanceLog.log_date == today_date,
        )
        .first()
    )

    if not existing or not existing.time_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must record Time-In first before recording Time-Out.",
        )

    # Geofence Verification
    is_inside, site_name, distance_m = verify_campus_perimeter(payload.latitude, payload.longitude, db, accuracy=payload.accuracy)
    if not is_inside:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance punch rejected: You are outside designated EVSU campus boundaries ({distance_m}m away from {site_name}).",
        )

    shift = get_user_shift_schedule(current_user, db)
    existing.time_out = pht_now
    existing.out_latitude = payload.latitude
    existing.out_longitude = payload.longitude

    # Compute undertime or overtime
    if existing.is_overtime:
        total_seconds = (pht_now - existing.time_in).total_seconds()
        existing.overtime_hours = max(0.0, round(total_seconds / 3600.0, 2))
    else:
        end_mins = shift["end_hour"] * 60 + shift["end_minute"]
        departure_mins = pht_now.hour * 60 + pht_now.minute
        if departure_mins < end_mins:
            existing.undertime_minutes = end_mins - departure_mins
            existing.status = "UNDERTIME"
        else:
            existing.undertime_minutes = 0

    db.commit()
    db.refresh(existing)

    log_audit(
        db=db,
        action="ATTENDANCE_TIME_OUT",
        target_scope=f"{current_user.full_name} ({shift['shift_type']})",
        operation_details=f"Time-Out recorded at {pht_now.strftime('%I:%M %p')}. Undertime: {existing.undertime_minutes}m, OT: {existing.overtime_hours}h ({site_name})",
        user=current_user,
    )

    return {
        "status": "success",
        "message": f"Time-Out recorded successfully at {pht_now.strftime('%I:%M %p')}.",
        "record": {
            "id": existing.id,
            "log_date": str(existing.log_date),
            "time_in": existing.time_in.strftime("%I:%M %p") if existing.time_in else None,
            "time_out": existing.time_out.strftime("%I:%M %p") if existing.time_out else None,
            "status": existing.status,
            "minutes_late": existing.minutes_late,
            "undertime_minutes": existing.undertime_minutes,
            "overtime_hours": existing.overtime_hours,
            "geofence_site": existing.geofence_site_name,
        },
    }


@router.get("/today")
def get_today_status(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns today's punch status for the logged-in user, their shift details,
    and whether today's Daily Accomplishment Report (DAR) has been submitted.
    """
    pht_now = get_pht_now()
    today_date = pht_now.date()
    shift = get_user_shift_schedule(current_user, db)

    log = (
        db.query(models.AttendanceLog)
        .filter(
            models.AttendanceLog.user_id == current_user.id,
            models.AttendanceLog.log_date == today_date,
        )
        .first()
    )

    dars_today = (
        db.query(models.DailyAccomplishmentReport)
        .filter(
            models.DailyAccomplishmentReport.user_id == current_user.id,
            models.DailyAccomplishmentReport.log_date == today_date,
        )
        .all()
    )
    all_today_tasks = []
    for d in dars_today:
        if d.tasks:
            all_today_tasks.extend(d.tasks)

    active_leave = (
        db.query(models.LeaveRequest)
        .filter(
            models.LeaveRequest.user_id == current_user.id,
            models.LeaveRequest.status == "APPROVED",
            models.LeaveRequest.start_date <= today_date,
            models.LeaveRequest.end_date >= today_date,
        )
        .first()
    )

    today_holiday = (
        db.query(models.InstitutionalHoliday)
        .filter(models.InstitutionalHoliday.holiday_date == today_date)
        .first()
    )

    credited_time_in_str, is_early, early_minutes = resolve_normalized_time_in(
        log.time_in if log else None, shift, is_overtime=bool(log and log.is_overtime)
    )

    if active_leave:
        today_display_status = active_leave.leave_type
    elif log and log.time_in:
        if today_holiday and today_holiday.is_work_suspended:
            today_display_status = f"Holiday Duty: {today_holiday.name}"
        else:
            today_display_status = log.status
    elif today_holiday and today_holiday.is_work_suspended:
        today_display_status = f"Official Holiday: {today_holiday.name}"
    else:
        today_display_status = "PENDING_PUNCH"

    return {
        "date": today_date.strftime("%B %d, %Y"),
        "day_of_week": pht_now.strftime("%A"),
        "server_time_pht": pht_now.strftime("%I:%M:%S %p"),
        "shift": shift,
        "is_weekend": pht_now.weekday() in (5, 6),
        "is_saturday": pht_now.weekday() == 5,
        "is_holiday": bool(today_holiday),
        "holiday_name": today_holiday.name if today_holiday else None,
        "holiday_type": today_holiday.holiday_type if today_holiday else None,
        "is_work_suspended": today_holiday.is_work_suspended if today_holiday else False,
        "holiday_description": today_holiday.description if today_holiday else None,
        "is_overtime": log.is_overtime if log else False,
        "has_timed_in": bool(log and log.time_in),
        "has_timed_out": bool(log and log.time_out),
        "time_in": log.time_in.strftime("%I:%M %p") if (log and log.time_in) else None,
        "credited_time_in": credited_time_in_str,
        "is_early": is_early,
        "early_minutes": early_minutes,
        "time_out": log.time_out.strftime("%I:%M %p") if (log and log.time_out) else None,
        "status": today_display_status,
        "minutes_late": log.minutes_late if log else 0,
        "undertime_minutes": log.undertime_minutes if log else 0,
        "overtime_hours": log.overtime_hours if log else 0.0,
        "geofence_site": log.geofence_site_name if log else None,
        "dar_submitted": len(dars_today) > 0,
        "dar_tasks_count": len(all_today_tasks),
        "on_approved_leave": bool(active_leave),
        "leave_type": active_leave.leave_type if active_leave else None,
    }


# ---------------------------------------------------------------------------
# Department Head: Live Attendance Radar & Subordinate Roster
# ---------------------------------------------------------------------------
@router.get("/department-roster")
def get_department_attendance_roster(
    date: Optional[str] = None,
    department_id: Optional[int] = None,
    department_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns live subordinate attendance status for Department Heads (or HR).
    Identifies who is present on campus, who is late, who is on approved leave,
    and who has not yet clocked in.
    """
    if current_user.role not in ["Department Head", "HR Personnel"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Department Heads and HR Personnel.",
        )

    target_date = datetime.date.fromisoformat(date) if date else get_pht_now().date()
    dept_id = current_user.department_id

    # For HR or Department Head with multiple departments
    query = db.query(models.UserAccount).filter(models.UserAccount.role == "COS Employee", models.UserAccount.is_active == True)
    if current_user.role == "Department Head":
        overseeing_ids = get_overseeing_department_ids(current_user, db)
        if department_id:
            if department_id not in overseeing_ids:
                raise HTTPException(status_code=403, detail="Cannot access department outside your supervisory scope.")
            query = query.filter(models.UserAccount.department_id == department_id)
        else:
            query = query.filter(models.UserAccount.department_id.in_(overseeing_ids))
    elif current_user.role == "HR Personnel":
        if department_id:
            query = query.filter(models.UserAccount.department_id == department_id)
        elif department_name and department_name != "ALL":
            query = query.join(models.Department).filter(models.Department.name == department_name)

    subordinates = query.order_by(models.UserAccount.full_name.asc()).all()

    target_holiday = (
        db.query(models.InstitutionalHoliday)
        .filter(models.InstitutionalHoliday.holiday_date == target_date)
        .first()
    )
    is_work_suspended_holiday = bool(target_holiday and target_holiday.is_work_suspended)

    roster = []
    total_present = 0
    total_late = 0
    total_on_leave = 0
    total_pending = 0

    for sub in subordinates:
        shift = get_user_shift_schedule(sub, db)
        att = (
            db.query(models.AttendanceLog)
            .filter(
                models.AttendanceLog.user_id == sub.id,
                models.AttendanceLog.log_date == target_date,
            )
            .first()
        )
        leave = (
            db.query(models.LeaveRequest)
            .filter(
                models.LeaveRequest.user_id == sub.id,
                models.LeaveRequest.status == "APPROVED",
                models.LeaveRequest.start_date <= target_date,
                models.LeaveRequest.end_date >= target_date,
            )
            .first()
        )
        dars_sub = (
            db.query(models.DailyAccomplishmentReport)
            .filter(
                models.DailyAccomplishmentReport.user_id == sub.id,
                models.DailyAccomplishmentReport.log_date == target_date,
            )
            .all()
        )
        all_sub_tasks = []
        for d in dars_sub:
            if d.tasks:
                all_sub_tasks.extend(d.tasks)

        sub_created = (sub.created_at + datetime.timedelta(hours=8)).date() if sub.created_at else None
        sub_contract = sub.contract_start_date
        is_pre_onboarding = False
        if not att and not leave:
            if sub_created and target_date < sub_created:
                is_pre_onboarding = True
            if sub_contract and target_date < sub_contract:
                is_pre_onboarding = True

        if leave:
            sub_status = f"On Leave ({leave.leave_type})"
            badge_type = "leave"
            total_on_leave += 1
        elif att and att.time_in:
            if is_work_suspended_holiday:
                sub_status = f"Holiday Duty ({target_holiday.name})"
                badge_type = "holiday_duty"
                total_present += 1
            elif att.status == "UNDERTIME" or att.undertime_minutes > 0:
                sub_status = f"Undertime ({att.undertime_minutes} mins)"
                badge_type = "undertime"
                total_present += 1
            elif att.status == "LATE":
                sub_status = f"Late ({att.minutes_late} mins)"
                badge_type = "late"
                total_late += 1
                total_present += 1
            elif att.status == "OVERTIME" or att.is_overtime:
                sub_status = f"Overtime ({att.overtime_hours} hrs)"
                badge_type = "overtime"
                total_present += 1
            else:
                sub_status = "On-Time (Present)"
                badge_type = "on_time"
                total_present += 1
        elif is_work_suspended_holiday:
            sub_status = f"Official Holiday ({target_holiday.name})"
            badge_type = "holiday"
        elif is_pre_onboarding:
            sub_status = "N/A"
            badge_type = "na"
        else:
            sub_status = "Not Timed In"
            badge_type = "pending"
            total_pending += 1

        sub_cred_str, sub_early_flag, sub_early_mins = resolve_normalized_time_in(
            att.time_in if att else None, shift, is_overtime=bool(att and att.is_overtime)
        )

        roster.append({
            "id": sub.id,
            "employee_id_number": sub.employee_id_number or f"D0105{sub.id}",
            "name": sub.full_name,
            "job_title": sub.job_title or "COS Staff",
            "department": sub.department.name if sub.department else "Unassigned",
            "shift_type": shift["shift_type"],
            "official_time": shift["official_time"],
            "time_in": att.time_in.strftime("%I:%M %p") if (att and att.time_in) else "—",
            "credited_time_in": sub_cred_str if (att and att.time_in) else "—",
            "is_early": sub_early_flag,
            "early_minutes": sub_early_mins,
            "time_out": att.time_out.strftime("%I:%M %p") if (att and att.time_out) else "—",
            "status": sub_status,
            "badge_type": badge_type,
            "geofence_site": att.geofence_site_name if att else "—",
            "in_latitude": att.in_latitude if (att and att.in_latitude is not None) else None,
            "in_longitude": att.in_longitude if (att and att.in_longitude is not None) else None,
            "out_latitude": att.out_latitude if (att and att.out_latitude is not None) else None,
            "out_longitude": att.out_longitude if (att and att.out_longitude is not None) else None,
            "is_geofence_verified": att.is_geofence_verified if att else False,
            "dar_submitted": len(dars_sub) > 0,
            "dar_tasks_count": len(all_sub_tasks),
        })

    return {
        "date": target_date.strftime("%B %d, %Y"),
        "raw_date": target_date.isoformat(),
        "is_holiday": bool(target_holiday),
        "holiday_name": target_holiday.name if target_holiday else None,
        "holiday_type": target_holiday.holiday_type if target_holiday else None,
        "is_work_suspended": is_work_suspended_holiday,
        "holiday_description": target_holiday.description if target_holiday else None,
        "total_subordinates": len(subordinates),
        "present_count": total_present,
        "late_count": total_late,
        "on_leave_count": total_on_leave,
        "pending_count": total_pending,
        "roster": roster,
    }


# ---------------------------------------------------------------------------
# HR Personnel: University-Wide Attendance Overview
# ---------------------------------------------------------------------------
@router.get("/campus-overview")
def get_campus_attendance_overview(
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns campus-wide live attendance overview for HR Personnel.
    Breaks down present, late, on-leave, and pending counts per department.
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to HR Personnel.",
        )

    target_date = datetime.date.fromisoformat(date) if date else get_pht_now().date()
    target_holiday = (
        db.query(models.InstitutionalHoliday)
        .filter(models.InstitutionalHoliday.holiday_date == target_date)
        .first()
    )
    departments = db.query(models.Department).order_by(models.Department.name.asc()).all()

    dept_summaries = []
    campus_total_cos = 0
    campus_present = 0
    campus_late = 0
    campus_on_leave = 0

    for dept in departments:
        cos_users = (
            db.query(models.UserAccount)
            .filter(
                models.UserAccount.department_id == dept.id,
                models.UserAccount.role == "COS Employee",
                models.UserAccount.is_active == True,
            )
            .all()
        )
        if not cos_users:
            continue

        dept_cos_count = len(cos_users)
        campus_total_cos += dept_cos_count
        dept_user_ids = [u.id for u in cos_users]

        # Present / Late today
        att_logs = (
            db.query(models.AttendanceLog)
            .filter(
                models.AttendanceLog.user_id.in_(dept_user_ids),
                models.AttendanceLog.log_date == target_date,
            )
            .all()
        )
        dept_present = len([a for a in att_logs if a.time_in])
        dept_late = len([a for a in att_logs if a.status == "LATE"])

        # Leaves
        leaves = (
            db.query(models.LeaveRequest)
            .filter(
                models.LeaveRequest.user_id.in_(dept_user_ids),
                models.LeaveRequest.status == "APPROVED",
                models.LeaveRequest.start_date <= target_date,
                models.LeaveRequest.end_date >= target_date,
            )
            .count()
        )

        campus_present += dept_present
        campus_late += dept_late
        campus_on_leave += leaves

        dept_summaries.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "is_maintenance": (dept.id == 22 or "maintenance" in dept.name.lower() or "janitorial" in dept.name.lower()),
            "is_meso": (dept.id == 22 or "maintenance" in dept.name.lower() or "janitorial" in dept.name.lower()),
            "total_cos": dept_cos_count,
            "present": dept_present,
            "late": dept_late,
            "on_leave": leaves,
            "pending": max(0, dept_cos_count - dept_present - leaves),
        })

    return {
        "date": target_date.strftime("%B %d, %Y"),
        "raw_date": target_date.isoformat(),
        "is_holiday": bool(target_holiday),
        "holiday_name": target_holiday.name if target_holiday else None,
        "holiday_type": target_holiday.holiday_type if target_holiday else None,
        "is_work_suspended": bool(target_holiday and target_holiday.is_work_suspended),
        "holiday_description": target_holiday.description if target_holiday else None,
        "total_active_cos": campus_total_cos,
        "total_present_today": campus_present,
        "total_late_today": campus_late,
        "total_on_leave_today": campus_on_leave,
        "total_pending_today": max(0, campus_total_cos - campus_present - campus_on_leave),
        "department_summaries": dept_summaries,
    }


# ---------------------------------------------------------------------------
# Semi-Monthly 15-Day Payroll & DTR Packet Generator
# (1st Quincena: 1-15 | 2nd Quincena: 16-30/31)
# ---------------------------------------------------------------------------
@router.get("/payroll-packet")
def get_payroll_dtr_packet(
    cutoff: str = Query("1st_half", pattern="^(1st_half|2nd_half)$"),
    month: Optional[int] = None,
    year: Optional[int] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Compiles the official semi-monthly 15-day DTR (Form 48) and DAR Accomplishment packet
    required for Philippine government COS salary disbursement.
    - 1st_half: Days 1 to 15 of the target month.
    - 2nd_half: Days 16 to end of month.
    """
    pht_now = get_pht_now()
    target_year = year or pht_now.year
    target_month = month or pht_now.month

    # Target employee resolution
    if employee_id and current_user.role in ["HR Personnel", "Department Head"]:
        target_user = db.query(models.UserAccount).filter(models.UserAccount.id == employee_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Employee record not found.")
        # SEC-07: Department Head boundary scoping check
        if current_user.role == "Department Head" and target_user.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department Heads can only access payroll packets and DTR records for employees within their assigned department.",
            )
    else:
        target_user = current_user

    # Determine date range
    days_in_month = calendar.monthrange(target_year, target_month)[1]
    if cutoff == "1st_half":
        start_day, end_day = 1, 15
        cutoff_label = f"{datetime.date(target_year, target_month, 1).strftime('%B')} 01–15, {target_year} (1st Quincena)"
    else:
        start_day, end_day = 16, days_in_month
        cutoff_label = f"{datetime.date(target_year, target_month, 1).strftime('%B')} 16–{days_in_month}, {target_year} (2nd Quincena)"

    start_date = datetime.date(target_year, target_month, start_day)
    end_date = datetime.date(target_year, target_month, end_day)

    shift = get_user_shift_schedule(target_user, db)

    # Pre-fetch attendance logs for target range
    att_logs = (
        db.query(models.AttendanceLog)
        .filter(
            models.AttendanceLog.user_id == target_user.id,
            models.AttendanceLog.log_date >= start_date,
            models.AttendanceLog.log_date <= end_date,
        )
        .all()
    )
    att_map = {log.log_date: log for log in att_logs}

    # Pre-fetch DARs for target range (grouping all DARs per date)
    dar_logs = (
        db.query(models.DailyAccomplishmentReport)
        .filter(
            models.DailyAccomplishmentReport.user_id == target_user.id,
            models.DailyAccomplishmentReport.log_date >= start_date,
            models.DailyAccomplishmentReport.log_date <= end_date,
        )
        .all()
    )
    dar_map = {}
    for d in dar_logs:
        if d.log_date not in dar_map:
            dar_map[d.log_date] = []
        dar_map[d.log_date].append(d)

    # Pre-fetch approved leaves
    leaves = (
        db.query(models.LeaveRequest)
        .filter(
            models.LeaveRequest.user_id == target_user.id,
            models.LeaveRequest.status == "APPROVED",
            models.LeaveRequest.start_date <= end_date,
            models.LeaveRequest.end_date >= start_date,
        )
        .all()
    )

    # Pre-fetch institutional holidays and executive work suspensions
    holidays = (
        db.query(models.InstitutionalHoliday)
        .filter(
            models.InstitutionalHoliday.holiday_date >= start_date,
            models.InstitutionalHoliday.holiday_date <= end_date,
        )
        .all()
    )
    holiday_map = {h.holiday_date: h for h in holidays}

    daily_records = []
    total_working_days = 0
    days_present = 0
    days_on_time = 0
    days_late = 0
    total_late_minutes = 0
    total_undertime_minutes = 0
    total_overtime_hours = 0.0
    approved_leave_days = 0
    total_accomplishment_tasks = 0

    curr_date = start_date
    today = pht_now.date()
    account_created_date = None
    if target_user.created_at:
        account_created_pht = target_user.created_at + datetime.timedelta(hours=8)
        account_created_date = account_created_pht.date()
    contract_start = target_user.contract_start_date

    while curr_date <= end_date:
        weekday = curr_date.weekday()
        is_weekend = weekday in (5, 6)
        is_sat = (weekday == 5)
        is_future = curr_date > today

        att = att_map.get(curr_date)
        day_dars = dar_map.get(curr_date, [])
        all_day_tasks = []
        for d in day_dars:
            if d.tasks:
                all_day_tasks.extend(d.tasks)
        has_dar = len(day_dars) > 0
        leave = next((l for l in leaves if l.start_date <= curr_date <= l.end_date), None)

        # Date precedes onboarding if prior to account creation or contract start
        is_before_onboarding = False
        if not att and not leave:
            if account_created_date and curr_date < account_created_date:
                is_before_onboarding = True
            if contract_start and curr_date < contract_start:
                is_before_onboarding = True

        day_holiday = holiday_map.get(curr_date)
        is_holiday_suspended = bool(day_holiday and day_holiday.is_work_suspended)

        # CSC/SUC Rule: Official holidays and executive suspensions do not count as required working days for absent deductions
        if not is_weekend and not is_before_onboarding and not is_holiday_suspended:
            total_working_days += 1

        time_in_str = att.time_in.strftime("%I:%M %p") if (att and att.time_in) else "—"
        time_out_str = att.time_out.strftime("%I:%M %p") if (att and att.time_out) else "—"
        dtr_cred_str, dtr_early_flag, dtr_early_mins = resolve_normalized_time_in(
            att.time_in if att else None, shift, is_overtime=bool(att and (att.is_overtime or is_weekend or is_holiday_suspended))
        )

        discrepancy = None
        if leave:
            day_status = f"Approved {leave.leave_type}"
            approved_leave_days += 1
            badge_type = "leave"
        elif att and att.time_in:
            days_present += 1
            if is_holiday_suspended:
                day_status = f"Holiday Duty: {day_holiday.name}"
                total_overtime_hours += (att.overtime_hours or 0.0)
                badge_type = "holiday_duty"
            elif att.is_overtime or is_weekend:
                day_status = "Authorized Overtime"
                total_overtime_hours += (att.overtime_hours or 0.0)
                badge_type = "overtime"
            elif att.status == "UNDERTIME" or att.undertime_minutes > 0:
                day_status = f"Undertime ({att.undertime_minutes}m)"
                badge_type = "undertime"
            elif att.status == "LATE":
                day_status = f"Late ({att.minutes_late}m)"
                days_late += 1
                total_late_minutes += att.minutes_late
                badge_type = "late"
            else:
                day_status = "On-Time"
                days_on_time += 1
                badge_type = "on_time"

            if att.undertime_minutes > 0:
                total_undertime_minutes += att.undertime_minutes

            if not has_dar and not is_weekend and not is_future and not is_holiday_suspended:
                discrepancy = "Time-In logged but no Daily Accomplishment Report submitted."
        else:
            if is_holiday_suspended:
                day_status = f"Official Holiday: {day_holiday.name}"
                badge_type = "holiday"
            elif is_weekend:
                day_status = "Weekend Rest Day"
                badge_type = "weekend"
            elif is_before_onboarding:
                day_status = "N/A"
                badge_type = "na"
            elif is_future:
                day_status = "N/A"
                badge_type = "na"
            elif curr_date == today:
                day_status = "Pending Punch"
                badge_type = "pending"
            else:
                day_status = "Absent"
                badge_type = "absent"
                if has_dar:
                    discrepancy = "Accomplishment reported on a day with no verified campus punch."

        task_list = all_day_tasks
        total_accomplishment_tasks += len(task_list)

        daily_records.append({
            "date": curr_date.strftime("%Y-%m-%d"),
            "display_date": curr_date.strftime("%b %d (%a)"),
            "day_of_week": curr_date.strftime("%A"),
            "is_weekend": is_weekend,
            "is_future": is_future,
            "is_holiday": bool(day_holiday),
            "holiday_name": day_holiday.name if day_holiday else None,
            "holiday_type": day_holiday.holiday_type if day_holiday else None,
            "is_work_suspended": is_holiday_suspended,
            "shift_type": shift["shift_type"],
            "time_in": time_in_str,
            "credited_time_in": dtr_cred_str or "—",
            "is_early": dtr_early_flag,
            "early_minutes": dtr_early_mins,
            "time_out": time_out_str,
            "status": day_status,
            "badge_type": badge_type,
            "minutes_late": att.minutes_late if att else 0,
            "undertime_minutes": att.undertime_minutes if att else 0,
            "overtime_hours": att.overtime_hours if att else 0.0,
            "geofence_verified": att.is_geofence_verified if att else False,
            "geofence_site": att.geofence_site_name if att else "—",
            "in_latitude": att.in_latitude if (att and att.in_latitude is not None) else None,
            "in_longitude": att.in_longitude if (att and att.in_longitude is not None) else None,
            "out_latitude": att.out_latitude if (att and att.out_latitude is not None) else None,
            "out_longitude": att.out_longitude if (att and att.out_longitude is not None) else None,
            "dar_submitted": has_dar,
            "dar_tasks": task_list,
            "dar_tasks_count": len(task_list),
            "discrepancy_flag": discrepancy,
        })

        curr_date += datetime.timedelta(days=1)

    attendance_rate = (
        round(((days_present + approved_leave_days) / max(1, total_working_days)) * 100.0, 1)
        if total_working_days > 0
        else 100.0
    )

    return {
        "cutoff_label": cutoff_label,
        "cutoff_code": cutoff,
        "year": target_year,
        "month": target_month,
        "employee": {
            "id": target_user.id,
            "name": target_user.full_name,
            "employee_id": target_user.employee_id_number or f"D0105{target_user.id}",
            "job_title": target_user.job_title or "COS Staff",
            "department": target_user.department.name if target_user.department else "Unassigned",
            "shift_type": shift["shift_type"],
            "official_time": shift["official_time"],
        },
        "summary": {
            "total_working_days": total_working_days,
            "days_present": days_present,
            "days_on_time": days_on_time,
            "days_late": days_late,
            "total_late_minutes": total_late_minutes,
            "total_undertime_minutes": total_undertime_minutes,
            "total_overtime_hours": round(total_overtime_hours, 2),
            "approved_leave_days": approved_leave_days,
            "total_accomplishment_tasks": total_accomplishment_tasks,
            "attendance_rate_pct": min(100.0, attendance_rate),
        },
        "records": daily_records,
    }


@router.get("/employee/{employee_id}/stats")
def get_employee_attendance_stats(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns attendance punctuality, tardiness, leaves, and DAR statistics for an employee,
    used during supervisory performance evaluation and AI performance summarization.
    """
    if current_user.role == "COS Employee" and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    emp = db.query(models.UserAccount).filter(models.UserAccount.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    logs = (
        db.query(models.AttendanceLog)
        .filter(models.AttendanceLog.user_id == employee_id)
        .order_by(models.AttendanceLog.log_date.asc())
        .all()
    )

    total_days = len(logs)
    on_time = sum(1 for l in logs if l.status in ["ON_TIME", "OVERTIME", "Present"])
    late = sum(1 for l in logs if l.status in ["LATE", "Late"])
    undertime = sum(1 for l in logs if l.status in ["UNDERTIME", "Undertime"] or l.undertime_minutes > 0)
    punctuality_rate = round((on_time / total_days * 100), 1) if total_days > 0 else 100.0

    approved_leaves = (
        db.query(models.LeaveRequest)
        .filter(
            models.LeaveRequest.user_id == employee_id,
            models.LeaveRequest.status.in_(["APPROVED", "Approved"]),
        )
        .all()
    )
    total_approved_leaves = sum(int(l.days_count or 1) for l in approved_leaves)

    dar_tasks = (
        db.query(models.DailyAccomplishmentReport)
        .filter(models.DailyAccomplishmentReport.user_id == employee_id)
        .count()
    )

    rating_suggestion = (
        "5 - Outstanding (95%-100% on-time arrival rate)"
        if punctuality_rate >= 95
        else "4 - Very Satisfactory (85%-94% on-time arrival rate)"
        if punctuality_rate >= 85
        else "3 - Satisfactory (75%-84% on-time arrival rate)"
        if punctuality_rate >= 75
        else "2 - Unsatisfactory (Frequent Tardiness)"
    )

    ai_bullet = (
        f"Maintained a {punctuality_rate}% on-time arrival rate across {total_days} logged working days "
        f"with {late} tardy arrival(s), {total_approved_leaves} approved excused leave(s), and {dar_tasks} verified daily accomplishment task(s)."
        if total_days > 0
        else f"Completed {dar_tasks} verified daily accomplishment task(s) with {total_approved_leaves} approved excused leave(s) and zero attendance infractions."
    )

    return {
        "employee_id": employee_id,
        "employee_name": emp.full_name,
        "total_days_logged": total_days,
        "on_time_days": on_time,
        "late_days": late,
        "punctuality_rate": punctuality_rate,
        "total_approved_leaves": total_approved_leaves,
        "total_dar_tasks": dar_tasks,
        "attendance_rating_suggestion": rating_suggestion,
        "ai_attendance_summary": ai_bullet,
    }


# ---------------------------------------------------------------------------
# Leave Management Endpoints (Apply, Review, List)
# ---------------------------------------------------------------------------
@router.post("/leaves/apply")
def apply_for_leave(
    payload: LeaveApplyRequest,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Submits a formal leave request from a COS employee.
    Notifies the supervisor/Department Head for institutional review.
    """
    if current_user.role != "COS Employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leave, Overtime, and Official Business requests are designated exclusively for Contract of Service (COS) personnel.",
        )

    is_overtime = "overtime" in payload.leave_type.lower()
    is_ob = "official business" in payload.leave_type.lower() or "ob" in payload.leave_type.lower()

    try:
        start_d = datetime.date.fromisoformat(payload.start_date)
        if payload.end_date:
            end_d = datetime.date.fromisoformat(payload.end_date)
        else:
            end_d = start_d
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if end_d < start_d:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date.")

    days_cnt = (end_d - start_d).days + 1

    ot_hours = payload.hours if is_overtime else None
    if is_overtime and payload.hours:
        is_weekend_ot = (start_d.weekday() in (5, 6))
        if not is_weekend_ot and payload.hours > 5.0:
            raise HTTPException(
                status_code=400,
                detail="Weekday evening overtime cannot exceed 5.0 hours (5:00 PM to 10:00 PM campus night closing).",
            )

    leave_entry = models.LeaveRequest(
        user_id=current_user.id,
        department_id=current_user.department_id,
        leave_type=payload.leave_type,
        start_date=start_d,
        end_date=end_d,
        days_count=days_cnt,
        hours=ot_hours,
        reason=payload.reason.strip(),
        attachment_url=payload.attachment_url,
        status="PENDING_DEPT_HEAD",
    )
    db.add(leave_entry)
    db.commit()
    db.refresh(leave_entry)

    # Notify Department Head (primary or overseeing assignment) (LOG-08)
    if current_user.department_id:
        dept_heads = (
            db.query(models.UserAccount)
            .filter(
                models.UserAccount.department_id == current_user.department_id,
                models.UserAccount.role == "Department Head",
                models.UserAccount.is_active == True,
                models.UserAccount.is_archived == False,
            )
            .all()
        )
        overseeing_assignments = (
            db.query(models.UserDepartmentAssignment)
            .filter(
                models.UserDepartmentAssignment.department_id == current_user.department_id,
                models.UserDepartmentAssignment.assignment_type == "overseeing",
            )
            .all()
        )
        overseeing_ids = {a.user_id for a in overseeing_assignments}
        if overseeing_ids:
            overseeing_heads = (
                db.query(models.UserAccount)
                .filter(
                    models.UserAccount.id.in_(overseeing_ids),
                    models.UserAccount.role == "Department Head",
                    models.UserAccount.is_active == True,
                    models.UserAccount.is_archived == False,
                )
                .all()
            )
            all_dept_heads = list({dh.id: dh for dh in dept_heads + overseeing_heads}.values())
        else:
            all_dept_heads = dept_heads

        req_label = "Overtime Request" if is_overtime else ("Official Business (OB) Slip" if is_ob else "Leave Request")
        hours_info = f" ({payload.hours} hr(s))" if is_overtime and payload.hours else f" ({days_cnt} day(s))"
        for dh in all_dept_heads:
            notif = models.Notification(
                user_id=dh.id,
                target_role=None,
                title=f"{req_label}: {current_user.full_name}",
                message=f"{current_user.full_name} submitted a {payload.leave_type} request for {start_d}{hours_info}. Reason: {payload.reason.strip()[:80]}",
                category="leave_request",
                is_read=False,
                action_view="department_leaves",
                created_at=datetime.datetime.utcnow(),
            )
            db.add(notif)
        db.commit()

    action_label = "OVERTIME_REQUEST_FILED" if is_overtime else ("OFFICIAL_BUSINESS_FILED" if is_ob else "LEAVE_APPLICATION_FILED")
    log_audit(
        db=db,
        action=action_label,
        target_scope=f"{payload.leave_type} ({days_cnt} day(s))",
        operation_details=f"{current_user.full_name} applied for {payload.leave_type} for {start_d} to {end_d}.",
        user=current_user,
    )

    return {
        "status": "success",
        "message": f"{payload.leave_type} request filed successfully ({days_cnt} day(s)). Awaiting supervisor review.",
        "leave_id": leave_entry.id,
    }


def _format_pht(dt: Optional[datetime.datetime], fmt: str = "%b %d, %Y %I:%M %p") -> Optional[str]:
    """Formats a UTC timestamp to Philippine Standard Time (PHT, UTC+8)."""
    if not dt:
        return None
    return (dt + datetime.timedelta(hours=8)).strftime(fmt)


def _parse_reason_and_hours(raw_reason: Optional[str], db_hours: Optional[float] = None) -> Tuple[str, Optional[float]]:
    """
    Strips legacy bracketed prefix like '[5.0 hr(s) Overtime]' or '[Weekend OT · 4.0 hr(s)]'
    from the reason string and resolves the overtime hours.
    """
    if not raw_reason:
        return "", db_hours
    hours = db_hours
    match = re.search(r"\[(?:Weekend OT · )?([0-9.]+)\s*hr\(s\)[^\]]*\]", raw_reason)
    if match:
        if hours is None:
            try:
                hours = float(match.group(1))
            except ValueError:
                pass
        clean_reason = re.sub(r"\[(?:Weekend OT · )?[0-9.]+\s*hr\(s\)[^\]]*\]\s*", "", raw_reason).strip()
        return clean_reason, hours
    return raw_reason.strip(), hours


@router.get("/leaves/my-requests")
def get_my_leave_requests(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Returns all leave applications filed by the current logged-in employee."""
    leaves = (
        db.query(models.LeaveRequest)
        .filter(models.LeaveRequest.user_id == current_user.id)
        .order_by(desc(models.LeaveRequest.created_at))
        .all()
    )
    res = []
    for l in leaves:
        clean_reason, ot_hours = _parse_reason_and_hours(l.reason, getattr(l, "hours", None))
        res.append({
            "id": l.id,
            "leave_type": l.leave_type,
            "start_date": str(l.start_date),
            "end_date": str(l.end_date),
            "days_count": l.days_count,
            "hours": ot_hours,
            "reason": clean_reason,
            "status": l.status,
            "review_notes": l.review_notes,
            "reviewed_at": _format_pht(l.reviewed_at, "%b %d, %Y"),
            "created_at": _format_pht(l.created_at, "%b %d, %Y"),
        })
    return res


@router.get("/leaves/department-queue")
def get_department_leave_queue(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Returns pending and reviewed leave requests for Department Heads across overseen departments."""
    if current_user.role not in ["Department Head", "HR Personnel"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    overseeing_ids = get_overseeing_department_ids(current_user, db)
    query = db.query(models.LeaveRequest)
    if current_user.role == "Department Head":
        if department_id:
            if department_id not in overseeing_ids:
                raise HTTPException(status_code=403, detail="Cannot access department outside supervisory scope.")
            query = query.filter(models.LeaveRequest.department_id == department_id)
        else:
            query = query.filter(models.LeaveRequest.department_id.in_(overseeing_ids))
    elif department_id:
        query = query.filter(models.LeaveRequest.department_id == department_id)

    leaves = query.order_by(desc(models.LeaveRequest.created_at)).all()

    res = []
    for l in leaves:
        clean_reason, ot_hours = _parse_reason_and_hours(l.reason, getattr(l, "hours", None))
        res.append({
            "id": l.id,
            "employee_id": l.user_id,
            "employee_name": l.user.full_name if l.user else "Unknown Employee",
            "employee_id_number": l.user.employee_id_number if l.user else "—",
            "department": l.department.name if l.department else "Unassigned",
            "leave_type": l.leave_type,
            "start_date": str(l.start_date),
            "end_date": str(l.end_date),
            "days_count": l.days_count,
            "hours": ot_hours,
            "reason": clean_reason,
            "status": l.status,
            "review_notes": l.review_notes,
            "reviewed_by": l.reviewer.full_name if l.reviewer else None,
            "created_at": _format_pht(l.created_at, "%b %d, %Y %I:%M %p"),
        })
    return res


@router.put("/leaves/{leave_id}/review")
def review_leave_request(
    leave_id: int,
    payload: LeaveReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Allows Department Head (or HR) to approve or reject a subordinate's leave request."""
    if current_user.role not in ["Department Head", "HR Personnel"]:
        raise HTTPException(status_code=403, detail="Access restricted to supervisors and HR.")

    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    # SEC-07: Department Head scoping check on leave review across overseen departments
    if current_user.role == "Department Head":
        overseeing_ids = get_overseeing_department_ids(current_user, db)
        leave_emp = db.query(models.UserAccount).filter(models.UserAccount.id == leave.user_id).first()
        if not leave_emp or leave_emp.department_id not in overseeing_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department Heads can only review leave requests for employees within their assigned departments.",
            )

    if payload.action not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT.")

    new_status = "APPROVED" if payload.action == "APPROVE" else "REJECTED"
    leave.status = new_status
    leave.reviewed_by_id = current_user.id
    leave.review_notes = payload.review_notes
    leave.reviewed_at = datetime.datetime.utcnow()
    db.commit()

    # Notify employee
    is_overtime = "overtime" in (leave.leave_type or "").lower()
    req_label = "Overtime Request" if is_overtime else "Leave Request"
    status_label = "Approved" if new_status == "APPROVED" else "Disapproved"
    notif = models.Notification(
        user_id=leave.user_id,
        target_role=None,
        title=f"{req_label} {status_label}",
        message=f"Your {leave.leave_type} request ({leave.start_date} to {leave.end_date}) was {status_label.lower()} by {current_user.full_name}. Notes: {payload.review_notes or 'None'}",
        category="leave_status",
        is_read=False,
        action_view="leave_filing",
        created_at=datetime.datetime.utcnow(),
    )
    db.add(notif)
    db.commit()

    log_audit(
        db=db,
        action=f"LEAVE_REQUEST_{new_status}",
        target_scope=f"{leave.user.full_name if leave.user else 'Employee'} ({leave.leave_type})",
        operation_details=f"Decision: {new_status} by {current_user.full_name}. Notes: {payload.review_notes}",
        user=current_user,
    )

    return {
        "status": "success",
        "message": f"Leave request #{leave_id} has been {new_status.lower()}.",
        "new_status": new_status,
    }


# ---------------------------------------------------------------------------
# Institutional Holidays & Executive Work Suspensions Management
# ---------------------------------------------------------------------------
@router.get("/holidays")
def get_institutional_holidays(
    year: Optional[int] = None,
    month: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns the calendar of official Philippine national, regional,
    and EVSU institutional holidays and executive work suspensions.
    """
    query = db.query(models.InstitutionalHoliday)
    if date:
        target_d = datetime.date.fromisoformat(date)
        holiday = query.filter(models.InstitutionalHoliday.holiday_date == target_d).first()
        return {
            "date": date,
            "is_holiday": bool(holiday),
            "holiday": {
                "id": holiday.id,
                "name": holiday.name,
                "holiday_date": str(holiday.holiday_date),
                "holiday_type": holiday.holiday_type,
                "description": holiday.description,
                "is_work_suspended": holiday.is_work_suspended,
            } if holiday else None,
        }

    if year:
        if month:
            num_days = calendar.monthrange(year, month)[1]
            s_date = datetime.date(year, month, 1)
            e_date = datetime.date(year, month, num_days)
            query = query.filter(models.InstitutionalHoliday.holiday_date >= s_date, models.InstitutionalHoliday.holiday_date <= e_date)
        else:
            s_date = datetime.date(year, 1, 1)
            e_date = datetime.date(year, 12, 31)
            query = query.filter(models.InstitutionalHoliday.holiday_date >= s_date, models.InstitutionalHoliday.holiday_date <= e_date)

    holidays = query.order_by(models.InstitutionalHoliday.holiday_date.asc()).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "holiday_date": str(h.holiday_date),
            "holiday_type": h.holiday_type,
            "description": h.description,
            "is_work_suspended": h.is_work_suspended,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in holidays
    ]


@router.post("/holidays")
def create_institutional_holiday(
    payload: HolidayCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Declares an institutional holiday or executive work suspension (e.g. Typhoon/Weather emergency).
    Restricted to HR Personnel and Super Admin.
    """
    if current_user.role not in ["HR Personnel", "Super Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to HR Personnel and Super Administrators.",
        )

    try:
        parsed_date = datetime.date.fromisoformat(payload.holiday_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid holiday_date format. Must be YYYY-MM-DD.")

    existing = (
        db.query(models.InstitutionalHoliday)
        .filter(models.InstitutionalHoliday.holiday_date == parsed_date)
        .first()
    )
    if existing:
        existing.name = payload.name
        existing.holiday_type = payload.holiday_type or "REGULAR"
        existing.description = payload.description
        existing.is_work_suspended = payload.is_work_suspended if payload.is_work_suspended is not None else True
        db.commit()
        db.refresh(existing)
        holiday_obj = existing
        action_name = "UPDATED"
    else:
        holiday_obj = models.InstitutionalHoliday(
            name=payload.name,
            holiday_date=parsed_date,
            holiday_type=payload.holiday_type or "REGULAR",
            description=payload.description,
            is_work_suspended=payload.is_work_suspended if payload.is_work_suspended is not None else True,
            created_by_id=current_user.id,
        )
        db.add(holiday_obj)
        db.commit()
        db.refresh(holiday_obj)
        action_name = "CREATED"

    log_audit(
        db=db,
        action=f"INSTITUTIONAL_HOLIDAY_{action_name}",
        target_scope=f"{holiday_obj.name} ({holiday_obj.holiday_date})",
        operation_details=f"Type: {holiday_obj.holiday_type}, Work Suspended: {holiday_obj.is_work_suspended}. Declared by {current_user.full_name}.",
        user=current_user,
    )

    return {
        "status": "success",
        "message": f"Institutional holiday '{holiday_obj.name}' successfully {action_name.lower()}.",
        "holiday": {
            "id": holiday_obj.id,
            "name": holiday_obj.name,
            "holiday_date": str(holiday_obj.holiday_date),
            "holiday_type": holiday_obj.holiday_type,
            "description": holiday_obj.description,
            "is_work_suspended": holiday_obj.is_work_suspended,
        },
    }


@router.delete("/holidays/{holiday_id}")
def delete_institutional_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Revokes or removes an institutional holiday or declared suspension.
    Restricted to HR Personnel and Super Admin.
    """
    if current_user.role not in ["HR Personnel", "Super Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to HR Personnel and Super Administrators.",
        )

    holiday = db.query(models.InstitutionalHoliday).filter(models.InstitutionalHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Institutional holiday record not found.")

    h_name = holiday.name
    h_date = str(holiday.holiday_date)
    db.delete(holiday)
    db.commit()

    log_audit(
        db=db,
        action="INSTITUTIONAL_HOLIDAY_DELETED",
        target_scope=f"{h_name} ({h_date})",
        operation_details=f"Revoked by {current_user.full_name}.",
        user=current_user,
    )

    return {
        "status": "success",
        "message": f"Institutional holiday '{h_name}' on {h_date} revoked successfully.",
    }
