from typing import List, Dict, Any, Optional
import datetime
from sqlalchemy.orm import Session
from . import models


def get_overseeing_department_ids(user: models.UserAccount, db: Session) -> List[int]:
    """
    Returns all department IDs that this user supervises.
    Includes their primary/home department plus any additional designated overseeing departments.
    """
    dept_ids: List[int] = []
    if user.department_id:
        dept_ids.append(user.department_id)

    if user.role == "Department Head":
        assignments = (
            db.query(models.UserDepartmentAssignment.department_id)
            .filter(
                models.UserDepartmentAssignment.user_id == user.id,
                models.UserDepartmentAssignment.assignment_type == "overseeing",
            )
            .all()
        )
        for (d_id,) in assignments:
            if d_id not in dept_ids:
                dept_ids.append(d_id)

    return dept_ids


def get_secondary_department_ids(user: models.UserAccount, db: Session) -> List[int]:
    """
    Returns all secondary department IDs where this COS employee provides operational support.
    Note: Their official evaluated workload remains anchored strictly to their primary department.
    """
    assignments = (
        db.query(models.UserDepartmentAssignment.department_id)
        .filter(
            models.UserDepartmentAssignment.user_id == user.id,
            models.UserDepartmentAssignment.assignment_type == "secondary",
        )
        .all()
    )
    return [d_id for (d_id,) in assignments]


def get_user_department_details(user: models.UserAccount, db: Session) -> Dict[str, Any]:
    """
    Serializes a user's primary, secondary, and overseeing department details.
    """
    secondary_ids = get_secondary_department_ids(user, db)
    secondary_depts = []
    if secondary_ids:
        s_objs = db.query(models.Department).filter(models.Department.id.in_(secondary_ids)).all()
        secondary_depts = [{"id": d.id, "name": d.name, "college": d.college} for d in s_objs]

    overseeing_ids = get_overseeing_department_ids(user, db)
    overseeing_depts = []
    if overseeing_ids:
        o_objs = db.query(models.Department).filter(models.Department.id.in_(overseeing_ids)).all()
        overseeing_depts = [{"id": d.id, "name": d.name, "college": d.college} for d in o_objs]

    return {
        "primary_department": {
            "id": user.department.id,
            "name": user.department.name,
            "college": user.department.college,
        } if user.department else None,
        "secondary_departments": secondary_depts,
        "overseeing_departments": overseeing_depts,
    }


def seed_institutional_holidays(db: Session) -> None:
    """
    Seeds official Philippine National, Special Non-Working, and EVSU Institutional
    holidays for 2026 and 2027 if none exist in the database.
    """
    count = db.query(models.InstitutionalHoliday).count()
    if count > 0:
        return

    official_holidays = [
        # 2026
        ("New Year's Day", "2026-01-01", "REGULAR", "National Regular Holiday"),
        ("Chinese Lunar New Year", "2026-02-17", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("EDSA People Power Revolution Anniversary", "2026-02-25", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Maundy Thursday", "2026-04-02", "REGULAR", "National Regular Holiday - Holy Week"),
        ("Good Friday", "2026-04-03", "REGULAR", "National Regular Holiday - Holy Week"),
        ("Black Saturday", "2026-04-04", "SPECIAL_NON_WORKING", "Special Non-Working Holiday - Holy Week"),
        ("Araw ng Kagitingan (Day of Valor)", "2026-04-09", "REGULAR", "National Regular Holiday"),
        ("Labor Day", "2026-05-01", "REGULAR", "National Regular Holiday"),
        ("Independence Day", "2026-06-12", "REGULAR", "National Regular Holiday"),
        ("EVSU University Charter Day", "2026-06-19", "LOCAL", "Institutional University Holiday"),
        ("Ninoy Aquino Day", "2026-08-21", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("National Heroes Day", "2026-08-31", "REGULAR", "National Regular Holiday"),
        ("Leyte Landing & Ormoc City Charter Day", "2026-10-20", "LOCAL", "Provincial / Local Special Holiday"),
        ("All Saints' Day", "2026-11-01", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("All Souls' Day", "2026-11-02", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Bonifacio Day", "2026-11-30", "REGULAR", "National Regular Holiday"),
        ("Feast of the Immaculate Conception", "2026-12-08", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Christmas Eve", "2026-12-24", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Christmas Day", "2026-12-25", "REGULAR", "National Regular Holiday"),
        ("Rizal Day", "2026-12-30", "REGULAR", "National Regular Holiday"),
        ("Last Day of the Year", "2026-12-31", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        # 2027
        ("New Year's Day", "2027-01-01", "REGULAR", "National Regular Holiday"),
        ("Chinese Lunar New Year", "2027-02-06", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("EDSA People Power Revolution Anniversary", "2027-02-25", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Maundy Thursday", "2027-03-25", "REGULAR", "National Regular Holiday - Holy Week"),
        ("Good Friday", "2027-03-26", "REGULAR", "National Regular Holiday - Holy Week"),
        ("Black Saturday", "2027-03-27", "SPECIAL_NON_WORKING", "Special Non-Working Holiday - Holy Week"),
        ("Araw ng Kagitingan (Day of Valor)", "2027-04-09", "REGULAR", "National Regular Holiday"),
        ("Labor Day", "2027-05-01", "REGULAR", "National Regular Holiday"),
        ("Independence Day", "2027-06-12", "REGULAR", "National Regular Holiday"),
        ("EVSU University Charter Day", "2027-06-19", "LOCAL", "Institutional University Holiday"),
        ("Ninoy Aquino Day", "2027-08-21", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("National Heroes Day", "2027-08-30", "REGULAR", "National Regular Holiday"),
        ("Leyte Landing & Ormoc City Charter Day", "2027-10-20", "LOCAL", "Provincial / Local Special Holiday"),
        ("All Saints' Day", "2027-11-01", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("All Souls' Day", "2027-11-02", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Bonifacio Day", "2027-11-30", "REGULAR", "National Regular Holiday"),
        ("Feast of the Immaculate Conception", "2027-12-08", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Christmas Eve", "2027-12-24", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
        ("Christmas Day", "2027-12-25", "REGULAR", "National Regular Holiday"),
        ("Rizal Day", "2027-12-30", "REGULAR", "National Regular Holiday"),
        ("Last Day of the Year", "2027-12-31", "SPECIAL_NON_WORKING", "Special Non-Working Holiday"),
    ]

    for name, date_str, h_type, desc in official_holidays:
        h_date = datetime.date.fromisoformat(date_str)
        record = models.InstitutionalHoliday(
            name=name,
            holiday_date=h_date,
            holiday_type=h_type,
            description=desc,
            is_work_suspended=True,
        )
        db.add(record)
    db.commit()

