"""
routers/users.py — User account management & profile endpoints for PerformaCOS.
"""
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, hash_password, verify_password
from ..id_generator import generate_evsu_employee_id
from .audit import log_audit

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[schemas.UserAccountOut])
def list_users(
    role: Optional[str] = None,
    department_id: Optional[int] = None,
    is_archived: Optional[bool] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    List user accounts with filters.
    HR can view all. Dept Heads view their own department. COS employees view themselves.
    """
    query = db.query(models.UserAccount)

    if current_user.role == "Department Head":
        query = query.filter(models.UserAccount.department_id == current_user.department_id)
    elif current_user.role == "COS Employee":
        query = query.filter(models.UserAccount.id == current_user.id)

    if role:
        query = query.filter(models.UserAccount.role == role)
    if department_id:
        query = query.filter(models.UserAccount.department_id == department_id)
    if is_archived is not None:
        query = query.filter(models.UserAccount.is_archived == is_archived)
    if is_active is not None:
        query = query.filter(models.UserAccount.is_active == is_active)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.UserAccount.full_name.ilike(search_filter),
                models.UserAccount.email.ilike(search_filter),
                models.UserAccount.employee_id_number.ilike(search_filter),
                models.UserAccount.job_title.ilike(search_filter),
            )
        )

    return query.order_by(models.UserAccount.full_name.asc()).all()


@router.get("/{user_id}", response_model=schemas.UserAccountOut)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Get single user profile."""
    # Authorization: self, HR, or their department head
    if current_user.role == "COS Employee" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other user profiles.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if current_user.role == "Department Head" and user.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized to view users outside your department.")

    return user


@router.post("", response_model=schemas.UserAccountOut, status_code=status.HTTP_201_CREATED)
def create_user_manual(
    payload: schemas.UserAccountCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Manually creates an employee or administrator account without an invitation token (HR only).
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can manually create accounts.")

    existing = db.query(models.UserAccount).filter(models.UserAccount.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institutional email is already registered.")

    emp_id = payload.employee_id_number
    if not emp_id:
        emp_id = generate_evsu_employee_id(
            db=db,
            full_name=payload.full_name,
            contract_start_date=payload.date_appointed or datetime.date.today(),
        )

    new_user = models.UserAccount(
        employee_id_number=emp_id,
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        department_id=payload.department_id,
        job_title=payload.job_title,
        contact_number=payload.contact_number,
        date_appointed=payload.date_appointed or datetime.date.today(),
        contract_end_date=payload.contract_end_date,
        is_active=payload.is_active,
        is_archived=False,
        total_contracts=0,
    )
    db.add(new_user)
    db.flush()

    # Create default notification preference
    db.add(models.NotificationPreference(user_id=new_user.id))
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=schemas.UserAccountOut)
def update_user_contact(
    user_id: int,
    payload: schemas.UserUpdateContact,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Update contact information and avatar for a user profile (Self or HR)."""
    if current_user.role != "HR Personnel" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's profile.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.contact_number is not None:
        user.contact_number = payload.contact_number
    if payload.alternate_email is not None:
        user.alternate_email = payload.alternate_email
    if payload.emergency_contact is not None:
        user.emergency_contact = payload.emergency_contact
    if payload.office_location is not None:
        user.office_location = payload.office_location
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(user)

    log_audit(
        db=db,
        action="PROFILE_UPDATED",
        target_scope=f"User #{user.id} ({user.full_name})",
        operation_details="Updated personal contact, emergency phone, or office station details.",
        user=current_user,
    )

    return user


@router.patch("/{user_id}/admin-update", response_model=schemas.UserAccountOut)
def admin_update_user(
    user_id: int,
    payload: schemas.UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Update employee official records: title, name, role, department (HR only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can update official records.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.employee_id_number is not None:
        user.employee_id_number = payload.employee_id_number
    if payload.job_title is not None:
        user.job_title = payload.job_title
    if payload.role is not None:
        user.role = payload.role
    if payload.department_id is not None:
        user.department_id = payload.department_id

    db.commit()
    db.refresh(user)

    log_audit(
        db=db,
        action="ADMIN_PROFILE_UPDATE",
        target_scope=f"User #{user.id} ({user.full_name})",
        operation_details=f"Administrative profile updated (Role: {user.role}, Dept ID: {user.department_id}, Title: {user.job_title}).",
        user=current_user,
    )

    return user


@router.patch("/{user_id}/department", response_model=schemas.UserAccountOut)
def transfer_department(
    user_id: int,
    payload: schemas.UserTransferDepartment,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Department transfer (HR Personnel only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can transfer employee departments.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    dept = db.query(models.Department).filter(models.Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Target department not found.")

    old_dept_id = user.department_id
    user.department_id = payload.department_id
    db.commit()
    db.refresh(user)

    log_audit(
        db=db,
        action="DEPARTMENT_TRANSFER",
        target_scope=f"User #{user.id} ({user.full_name})",
        operation_details=f"Transferred employee assignment from Dept #{old_dept_id} to Dept #{payload.department_id} ({dept.name}).",
        user=current_user,
    )

    return user


@router.patch("/{user_id}/archive")
def archive_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Archive an employee account (HR Personnel only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can archive accounts.")

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot archive your own account.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_archived = True
    user.is_active = False
    db.commit()

    log_audit(
        db=db,
        action="USER_ARCHIVED",
        target_scope=f"User #{user.id} ({user.full_name})",
        operation_details=f"Deactivated and archived user account ({user.email}).",
        user=current_user,
    )

    return {"message": f"User '{user.full_name}' archived successfully.", "user_id": user_id}


@router.patch("/{user_id}/restore")
def restore_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Restore an archived employee account (HR Personnel only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Only HR Personnel can restore accounts.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_archived = False
    user.is_active = True
    db.commit()

    log_audit(
        db=db,
        action="USER_RESTORED",
        target_scope=f"User #{user.id} ({user.full_name})",
        operation_details=f"Reactivated and restored user account ({user.email}).",
        user=current_user,
    )

    return {"message": f"User '{user.full_name}' restored successfully.", "user_id": user_id}


@router.patch("/me/password")
def change_own_password(
    payload: schemas.UserChangePassword,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Change currently authenticated user's own password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    log_audit(
        db=db,
        action="PASSWORD_RESET_COMPLETED",
        target_scope=f"User #{current_user.id} ({current_user.email})",
        operation_details="Account credentials updated via authenticated profile security settings.",
        user=current_user,
    )

    return {"message": "Password updated successfully."}


@router.patch("/{user_id}/password")
def change_password(
    user_id: int,
    payload: schemas.UserChangePassword,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Change authenticated user password."""
    if current_user.id != user_id and current_user.role != "HR Personnel":
        raise HTTPException(status_code=403, detail="Not authorized to change another user's password.")

    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if current_user.id == user_id:
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password does not match.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    log_audit(
        db=db,
        action="PASSWORD_RESET_COMPLETED",
        target_scope=f"User #{user.id} ({user.email})",
        operation_details="Account credentials updated via authenticated profile security settings.",
        user=current_user,
    )

    return {"message": "Password updated successfully."}
