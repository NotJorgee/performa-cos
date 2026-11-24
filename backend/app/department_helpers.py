from typing import List, Dict, Any, Optional
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
