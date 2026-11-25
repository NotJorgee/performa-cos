"""
routers/auth.py — Authentication routes for PerformaCOS.
"""
import random
import string
import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from jose import jwt as jose_jwt, JWTError
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from .. import models, schemas
from ..auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    hash_token,
    validate_password_complexity,
    resolve_onboarding_department_id,
)
from ..email_service import send_otp_email, send_welcome_email, send_new_registration_hr_notice_email
from ..id_generator import generate_evsu_employee_id
from .audit import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _add_six_months(d: datetime.date) -> datetime.date:
    """Calculates default COS contract term end date inclusive (e.g. July 5, 2026 -> Jan 4, 2027)."""
    month = d.month + 6
    year = d.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    is_leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    days_in_month = [31, 29 if is_leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    day = min(d.day, days_in_month[month - 1])
    target = datetime.date(year, month, day)
    return target - datetime.timedelta(days=1)


def _build_user_response(user: models.UserAccount) -> dict:
    start_date = user.contract_start_date or user.date_appointed
    secondary_depts = []
    overseeing_depts = []
    if user.department and user.role == "Department Head":
        overseeing_depts.append({"id": user.department.id, "name": user.department.name, "college": user.department.college})

    for a in getattr(user, "department_assignments", []):
        if a.department:
            dept_obj = {"id": a.department.id, "name": a.department.name, "college": a.department.college}
            if a.assignment_type == "secondary":
                secondary_depts.append(dept_obj)
            elif a.assignment_type == "overseeing":
                if not any(d["id"] == a.department.id for d in overseeing_depts):
                    overseeing_depts.append(dept_obj)

    overseeing_ids = [user.department_id] if user.department_id else []
    for d in overseeing_depts:
        if d["id"] not in overseeing_ids:
            overseeing_ids.append(d["id"])

    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "role": user.role,
        "department": user.department.name if user.department else "Unassigned",
        "departmentId": user.department_id,
        "department_id": user.department_id,
        "secondaryDepartments": secondary_depts,
        "overseeingDepartments": overseeing_depts,
        "secondary_departments": secondary_depts,
        "overseeing_departments": overseeing_depts,
        "secondaryDepartmentIds": [d["id"] for d in secondary_depts],
        "overseeingDepartmentIds": overseeing_ids,
        "secondary_department_ids": [d["id"] for d in secondary_depts],
        "overseeing_department_ids": overseeing_ids,
        "employeeIdNumber": user.employee_id_number,
        "jobTitle": user.job_title,
        "avatarUrl": user.avatar_url,
        "isActive": user.is_active,
        "totalContracts": user.total_contracts,
        "dateAppointed": user.date_appointed.isoformat() if user.date_appointed else None,
        "contractStartDate": start_date.isoformat() if start_date else None,
        "contractEndDate": user.contract_end_date.isoformat() if user.contract_end_date else None,
        "contactNumber": user.contact_number or "",
        "alternateEmail": user.alternate_email or "",
        "emergencyContact": user.emergency_contact or "",
        "officeLocation": user.office_location or "",
    }


@router.post("/login")
def login(creds: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    login_ident = (creds.email or "").strip()
    user = db.query(models.UserAccount).filter(
        or_(
            models.UserAccount.email.ilike(login_ident),
            models.UserAccount.employee_id_number.ilike(login_ident),
        ),
        models.UserAccount.is_archived == False,
    ).first()

    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/ID number or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact HR.",
        )

    token = create_access_token({"user_id": user.id, "role": user.role})

    # Auto-prune expired or duplicate sessions on same device for this user
    cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    db.query(models.UserSession).filter(
        models.UserSession.user_id == user.id,
        models.UserSession.is_revoked == False,
        models.UserSession.last_active < cutoff_time,
    ).update({"is_revoked": True}, synchronize_session=False)

    dev_desc = request.headers.get("User-Agent", "Unknown device")[:255]
    client_ip = request.client.host if request.client else None

    # Revoke older sessions from the exact same device/IP to prevent duplicates
    if client_ip:
        db.query(models.UserSession).filter(
            models.UserSession.user_id == user.id,
            models.UserSession.is_revoked == False,
            models.UserSession.ip_address == client_ip,
            models.UserSession.device_description == dev_desc,
        ).update({"is_revoked": True}, synchronize_session=False)

    # Record fresh session
    session = models.UserSession(
        user_id=user.id,
        ip_address=client_ip,
        device_description=dev_desc,
        token_hash=hash_token(token),
        last_active=datetime.datetime.utcnow(),
    )
    db.add(session)
    db.commit()

    log_audit(
        db=db,
        action="USER_LOGGED_IN",
        target_scope=f"User #{user.id} ({user.email})",
        operation_details="Authenticated via secure institutional credential handshake.",
        user=user,
        request=request,
    )

    return {"access_token": token, "token_type": "bearer", "user": _build_user_response(user)}


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Revokes the current active session in the database upon client logout.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        token_hash = hash_token(token)
        db.query(models.UserSession).filter(
            models.UserSession.user_id == current_user.id,
            models.UserSession.token_hash == token_hash,
        ).update({"is_revoked": True}, synchronize_session=False)
        db.commit()

    log_audit(
        db=db,
        action="USER_LOGGED_OUT",
        target_scope=f"User #{current_user.id} ({current_user.email})",
        operation_details="User gracefully logged out; device session revoked.",
        user=current_user,
        request=request,
    )

    return {"message": "Logged out successfully."}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: schemas.RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # 1. Validate invitation token
    invite = db.query(models.InvitationToken).filter(
        models.InvitationToken.token == payload.invitation_token,
        models.InvitationToken.used_at == None,
    ).first()
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or already-used invitation token.")
    if invite.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation token has expired.")

    # 2. Strict invitation email binding (LOG-01)
    clean_signup_email = (payload.email or "").strip().lower()
    if invite.email:
        clean_invite_email = invite.email.strip().lower()
        if clean_signup_email != clean_invite_email:
            raise HTTPException(
                status_code=400,
                detail=f"Registration email mismatch: This invitation token was issued specifically for {clean_invite_email}.",
            )

    # 3. Check email uniqueness (case-insensitive)
    if db.query(models.UserAccount).filter(func.lower(models.UserAccount.email) == clean_signup_email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # 4. Institutional password complexity validation
    validate_password_complexity(payload.password)

    # 5. Determine role and department strictly bound to HR invite
    role = invite.role or payload.role or "COS Employee"
    dept_id = resolve_onboarding_department_id(db, role, invite.department_id or payload.department_id)

    # Enforce single Department Head per department constraint
    if role == "Department Head" and dept_id:
        existing_dh = (
            db.query(models.UserAccount)
            .filter(
                models.UserAccount.department_id == dept_id,
                models.UserAccount.role == "Department Head",
                models.UserAccount.is_active == True,
                models.UserAccount.is_archived == False,
            )
            .first()
        )
        if existing_dh:
            raise HTTPException(
                status_code=400,
                detail=f"Registration blocked: This department already has an active Department Head ({existing_dh.full_name}). A new Department Head cannot be assigned until the incumbent is reassigned or archived by HR.",
            )

    # 4. Starting date & contract initialization
    # Date appointed seeds the institutional employee ID. Contract term is left unassigned until HR sets it.
    starting_date = payload.starting_date or datetime.date.today()
    contract_start_date = None
    contract_end_date = None
    total_contracts = 0

    # 5. Generate employee ID using campus starting date
    emp_id = generate_evsu_employee_id(
        db=db,
        full_name=payload.full_name,
        contract_start_date=starting_date,
        first_name=payload.first_name,
        middle_name=payload.middle_initial,
        last_name=payload.last_name,
    )

    # 6. Create user
    new_user = models.UserAccount(
        employee_id_number=emp_id,
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role,
        department_id=dept_id,
        job_title=payload.job_title,
        contact_number=payload.contact_number,
        date_appointed=starting_date,
        contract_start_date=contract_start_date,
        contract_end_date=contract_end_date,
        is_active=True,
        is_archived=False,
        total_contracts=total_contracts,
    )
    db.add(new_user)
    db.flush()  # get new_user.id before commit

    # 6. Mark invite as used
    invite.used_at = datetime.datetime.utcnow()
    invite.used_by_user_id = new_user.id

    # 7. Create default notification preferences
    prefs = models.NotificationPreference(user_id=new_user.id)
    db.add(prefs)

    db.commit()
    db.refresh(new_user)

    log_audit(
        db=db,
        action="USER_REGISTERED",
        target_scope=f"User #{new_user.id} ({new_user.email})",
        operation_details=f"Completed institutional registration via invitation token {payload.invitation_token}.",
        user=new_user,
        request=None,
    )

    # 8. Notify active HR Personnel of new registration (so contract dates can be assigned)
    dept_name = new_user.department.name if new_user.department else "Unassigned Department"
    hr_users = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "HR Personnel",
            models.UserAccount.is_active == True,
            models.UserAccount.is_archived == False,
            models.UserAccount.id != new_user.id,
        )
        .all()
    )

    is_cos = new_user.role == "COS Employee"
    notif_title = (
        f"New COS Employee Registered: {new_user.full_name}"
        if is_cos
        else f"New {new_user.role} Registered: {new_user.full_name}"
    )
    notif_msg = (
        f"{new_user.full_name} ({dept_name}, ID: {new_user.employee_id_number}) just registered. Please assign their official contract start and end dates in User Management."
        if is_cos
        else f"{new_user.full_name} ({dept_name}, ID: {new_user.employee_id_number}) has completed account registration."
    )
    notif_cat = "contract" if is_cos else "records"
    now_utc = datetime.datetime.utcnow()

    if hr_users:
        for hr in hr_users:
            db.add(
                models.Notification(
                    user_id=hr.id,
                    target_role=None,
                    title=notif_title,
                    message=notif_msg,
                    category=notif_cat,
                    is_read=False,
                    action_view="user_management",
                    created_at=now_utc,
                )
            )
            if hr.email:
                background_tasks.add_task(
                    send_new_registration_hr_notice_email,
                    to=hr.email,
                    hr_name=hr.full_name,
                    new_user_name=new_user.full_name,
                    new_user_email=new_user.email,
                    new_user_role=new_user.role,
                    emp_id_number=new_user.employee_id_number,
                    dept_name=dept_name,
                )
    else:
        db.add(
            models.Notification(
                user_id=None,
                target_role="HR Personnel",
                title=notif_title,
                message=notif_msg,
                category=notif_cat,
                is_read=False,
                action_view="user_management",
                created_at=now_utc,
            )
        )
    db.commit()

    # 9. Send welcome email in background
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.full_name, new_user.role)

    token = create_access_token({"user_id": new_user.id, "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": _build_user_response(new_user)}


@router.post("/forgot-password")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ident = (payload.email or "").strip()
    user = db.query(models.UserAccount).filter(
        or_(
            models.UserAccount.email.ilike(ident),
            models.UserAccount.employee_id_number.ilike(ident),
        ),
        models.UserAccount.is_archived == False,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active account registered with that email address. Please check your spelling or contact HR.",
        )

    # SEC-05: Cooldown check — prevent OTP flooding (60-second limit)
    recent_otp = (
        db.query(models.OTPCode)
        .filter(
            models.OTPCode.email == user.email,
            models.OTPCode.created_at >= datetime.datetime.utcnow() - datetime.timedelta(seconds=60),
        )
        .first()
    )
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 60 seconds before requesting another verification code.",
        )

    # Generate 6-digit OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    # Invalidate previous unused OTPs for this email
    db.query(models.OTPCode).filter(
        models.OTPCode.email == user.email,
        models.OTPCode.used == False,
    ).update({"used": True})

    db.add(models.OTPCode(email=user.email, code=otp_code, expires_at=expires_at, failed_attempts=0))
    db.commit()

    # SEC-04: Mask email and omit plaintext OTP code from console logs
    at_pos = user.email.find("@")
    masked_email = user.email[:2] + "***" + (user.email[at_pos:] if at_pos != -1 else "")
    print(f"[AUTH OTP] Verification code dispatched for {masked_email} (expires in {settings.OTP_EXPIRE_MINUTES}m)")
    background_tasks.add_task(send_otp_email, user.email, otp_code, user.full_name)
    return {"message": f"Verification code sent to {masked_email}."}


@router.post("/verify-otp")
def verify_otp(payload: schemas.VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verifies 6-digit OTP code with strict 5-attempt brute-force protection (SEC-05)."""
    ident = (payload.email or "").strip()
    user = db.query(models.UserAccount).filter(
        or_(
            models.UserAccount.email.ilike(ident),
            models.UserAccount.employee_id_number.ilike(ident),
        ),
        models.UserAccount.is_archived == False,
    ).first()
    email_to_check = user.email if user else ident

    otp = (
        db.query(models.OTPCode)
        .filter(
            models.OTPCode.email == email_to_check,
            models.OTPCode.used == False,
        )
        .order_by(models.OTPCode.created_at.desc())
        .first()
    )

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired verification session. Please request a new code.")

    if otp.expires_at < datetime.datetime.utcnow():
        otp.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # SEC-05: Brute-force threshold enforcement
    if (otp.failed_attempts or 0) >= 5:
        otp.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts (5/5). This code has been invalidated for security reasons. Please request a new code.",
        )

    submitted_code = (payload.otp_code or "").strip()
    if otp.code != submitted_code:
        otp.failed_attempts = (otp.failed_attempts or 0) + 1
        if otp.failed_attempts >= 5:
            otp.used = True
            db.commit()
            log_audit(
                db=db,
                action="OTP_BRUTE_FORCE_BLOCKED",
                target_scope=f"OTP {payload.email}",
                operation_details="5 failed OTP verification attempts recorded. Token burned and invalidated.",
                user=None,
                request=None,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts (5/5). This code has been invalidated for security reasons. Please request a new code.",
            )
        db.commit()
        remaining = 5 - otp.failed_attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {remaining} attempt{'s' if remaining > 1 else ''} remaining.",
        )

    otp.used = True
    db.commit()

    # Issue a short-lived (15-minute) password-reset token
    reset_token = jose_jwt.encode(
        {
            "purpose": "password_reset",
            "email": payload.email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return {"reset_token": reset_token}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets user password via verified reset token, enforcing institutional password policy (SEC-06)."""
    try:
        decoded = jose_jwt.decode(
            payload.reset_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if decoded.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid reset token.")
        email = decoded.get("email")
    except JWTError:
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired.")

    user = db.query(models.UserAccount).filter(models.UserAccount.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # SEC-06: Enforce password complexity policy
    validate_password_complexity(payload.new_password)

    user.password_hash = hash_password(payload.new_password)

    # Invalidate all existing sessions for this user on password reset
    db.query(models.UserSession).filter(models.UserSession.user_id == user.id).delete()
    db.commit()

    log_audit(
        db=db,
        action="PASSWORD_RESET_COMPLETED",
        target_scope=f"User #{user.id} ({user.email})",
        operation_details="Account credentials updated via verified OTP reset flow.",
        user=user,
        request=None,
    )

    return {"message": "Password reset successful."}


@router.get("/me")
def get_me(current_user: models.UserAccount = Depends(get_current_user)):
    return _build_user_response(current_user)
