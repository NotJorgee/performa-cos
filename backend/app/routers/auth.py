"""
routers/auth.py — Authentication routes for PerformaCOS.
"""
import random
import string
import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from jose import jwt as jose_jwt, JWTError
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_access_token, get_current_user, hash_token
from ..email_service import send_otp_email, send_welcome_email
from ..id_generator import generate_evsu_employee_id
from .audit import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _build_user_response(user: models.UserAccount) -> dict:
    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "role": user.role,
        "department": user.department.name if user.department else "Unassigned",
        "departmentId": user.department_id,
        "cosCategory": user.cos_category,
        "employeeIdNumber": user.employee_id_number,
        "jobTitle": user.job_title,
        "avatarUrl": user.avatar_url,
        "isActive": user.is_active,
        "totalContracts": user.total_contracts,
    }


@router.post("/login")
def login(creds: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == creds.email,
        models.UserAccount.is_archived == False,
    ).first()

    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact HR.",
        )

    token = create_access_token({"user_id": user.id, "role": user.role})

    # Record session
    session = models.UserSession(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        device_description=request.headers.get("User-Agent", "Unknown device")[:255],
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

    # 2. Check email uniqueness
    if db.query(models.UserAccount).filter(models.UserAccount.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # 3. Determine role and department strictly bound to HR invite
    role = invite.role or payload.role or "COS Employee"
    dept_id = invite.department_id or payload.department_id

    # 4. Starting date & contract expiration logic
    starting_date = payload.starting_date or datetime.date.today()
    contract_end_date = payload.contract_end_date

    if role == "COS Employee":
        active_contract_start = payload.contract_start_date or starting_date
        if not contract_end_date:
            contract_end_date = active_contract_start + datetime.timedelta(days=182)  # standard 6-month contract cycle

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
        cos_category=payload.cos_category or "Administrative",
        job_title=payload.job_title,
        contact_number=payload.contact_number,
        date_appointed=starting_date,
        contract_end_date=contract_end_date,
        is_active=True,
        is_archived=False,
        total_contracts=1 if role == "COS Employee" else 0,
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

    # 8. Send welcome email in background
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.full_name, new_user.role)

    token = create_access_token({"user_id": new_user.id, "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": _build_user_response(new_user)}


@router.post("/forgot-password")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == payload.email,
        models.UserAccount.is_archived == False,
    ).first()

    # Always return same message — don't reveal whether email exists
    generic_response = {"message": "If that email is registered, an OTP has been sent."}

    if not user:
        return generic_response

    # Generate 6-digit OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    # Invalidate previous unused OTPs for this email
    db.query(models.OTPCode).filter(
        models.OTPCode.email == payload.email,
        models.OTPCode.used == False,
    ).update({"used": True})

    db.add(models.OTPCode(email=payload.email, code=otp_code, expires_at=expires_at))
    db.commit()

    background_tasks.add_task(send_otp_email, payload.email, otp_code, user.full_name)
    return generic_response


@router.post("/verify-otp")
def verify_otp(payload: schemas.VerifyOtpRequest, db: Session = Depends(get_db)):
    otp = (
        db.query(models.OTPCode)
        .filter(
            models.OTPCode.email == payload.email,
            models.OTPCode.code == payload.otp_code,
            models.OTPCode.used == False,
        )
        .order_by(models.OTPCode.created_at.desc())
        .first()
    )

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
    if otp.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

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

    user.password_hash = hash_password(payload.new_password)
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
