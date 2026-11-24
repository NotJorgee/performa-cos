"""
routers/invitations.py — Invitation token management & onboarding for PerformaCOS.
"""
import secrets
import time
import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import settings
from .. import models, schemas
from ..auth import get_current_user, resolve_onboarding_department_id
from ..email_service import send_invitation_email
from .audit import log_audit

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])


def _build_invite_url(token: str) -> str:
    """Build the frontend invitation onboarding URL using configured base URL."""
    return f"{settings.frontend_base_url}/?token={token}"


@router.post("", response_model=schemas.InvitationTokenOut, status_code=status.HTTP_201_CREATED)
def create_invitation(
    payload: schemas.InvitationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Generate an invitation token for a new COS Employee or Administrator (HR only).
    Optionally sends an invitation email via SMTP if email is provided.
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR Personnel can issue invitation tokens.",
        )

    # Prefix based on role with cryptographically secure random token (SEC-01: 64-bit entropy)
    role_prefix = "COS" if payload.role == "COS Employee" else "ADM"
    token_str = f"EVSU-INV-{role_prefix}-{secrets.token_hex(8).upper()}"

    # Ensure uniqueness
    while db.query(models.InvitationToken).filter(models.InvitationToken.token == token_str).first():
        token_str = f"EVSU-INV-{role_prefix}-{secrets.token_hex(8).upper()}"

    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    dept_id = resolve_onboarding_department_id(db, payload.role, payload.department_id, payload.department_name)

    # Prevent issuing Department Head invitations for departments with an active Department Head
    if payload.role == "Department Head" and dept_id:
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
                detail=f"Cannot issue invitation: {existing_dh.full_name} is currently the active Department Head for this department. The incumbent must be reassigned or archived before a new Department Head can be invited.",
            )

    invitation = models.InvitationToken(
        token=token_str,
        email=payload.email,
        role=payload.role,
        department_id=dept_id,
        expires_at=expires_at,
        created_by_user_id=current_user.id,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    if payload.email:
        background_tasks.add_task(
            send_invitation_email,
            payload.email,
            token_str,
            payload.role,
            current_user.full_name,
        )

    log_audit(
        db=db,
        action="INVITATION_CREATED",
        target_scope=f"{payload.role} token {token_str}",
        operation_details=f"Generated registration invite for {payload.email or 'link sharing'} by {current_user.full_name}.",
        user=current_user,
        request=None,
    )

    # Attach computed invite_url
    invitation.invite_url = _build_invite_url(invitation.token)
    return invitation


@router.get("", response_model=List[schemas.InvitationTokenOut])
def list_invitations(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """List all invitations (HR Personnel only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR Personnel can view invitation tokens.",
        )
    invites = db.query(models.InvitationToken).order_by(models.InvitationToken.created_at.desc()).all()
    for inv in invites:
        inv.invite_url = _build_invite_url(inv.token)
    return invites


@router.delete("/{invitation_id}")
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Revoke an unused invitation token (HR Personnel only)."""
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR Personnel can revoke invitation tokens.",
        )

    invite = db.query(models.InvitationToken).filter(models.InvitationToken.id == invitation_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation token not found.")

    if invite.used_at is not None:
        raise HTTPException(status_code=400, detail="Cannot revoke an already used invitation token.")

    token_name = invite.token
    db.delete(invite)
    db.commit()

    log_audit(
        db=db,
        action="INVITATION_REVOKED",
        target_scope=f"Token {token_name}",
        operation_details=f"Revoked registration invitation token {token_name}.",
        user=current_user,
        request=None,
    )

    return {"message": "Invitation token revoked successfully."}


_VALIDATE_RATE_LIMIT: Dict[str, List[float]] = {}
_MAX_VALIDATE_PER_MINUTE = 30


def _check_validate_rate_limit(client_ip: str) -> None:
    now = time.time()
    cutoff = now - 60.0
    attempts = [t for t in _VALIDATE_RATE_LIMIT.get(client_ip, []) if t > cutoff]
    if len(attempts) >= _MAX_VALIDATE_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many invitation validation requests. Please wait a minute before retrying.",
        )
    attempts.append(now)
    _VALIDATE_RATE_LIMIT[client_ip] = attempts


@router.get("/validate")
def validate_invitation(token: str, request: Request, db: Session = Depends(get_db)):
    """Public endpoint — validates an invitation token without requiring authentication (SEC-01: Rate Limited)."""
    client_ip = request.client.host if request.client else "unknown"
    _check_validate_rate_limit(client_ip)

    clean_token = (token or "").strip()
    invite = (
        db.query(models.InvitationToken)
        .filter(
            models.InvitationToken.token == clean_token,
            models.InvitationToken.used_at == None,
        )
        .first()
    )

    if not invite:
        raise HTTPException(status_code=400, detail="Invitation token is invalid or has already been used.")

    if invite.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation token has expired.")

    dept_name = None
    current_dept_head = None
    if invite.department_id:
        dept = db.query(models.Department).filter(models.Department.id == invite.department_id).first()
        if dept:
            dept_name = dept.name
        # Find active Department Head in this department
        dh = (
            db.query(models.UserAccount)
            .filter(
                models.UserAccount.department_id == invite.department_id,
                models.UserAccount.role == "Department Head",
                models.UserAccount.is_active == True,
            )
            .first()
        )
        if dh:
            current_dept_head = {
                "id": dh.id,
                "full_name": dh.full_name,
                "email": dh.email,
                "employee_id_number": dh.employee_id_number,
            }

    return {
        "valid": True,
        "role": invite.role,
        "department_id": invite.department_id,
        "department_name": dept_name,
        "current_department_head": current_dept_head,
        "email": invite.email,
        "token": invite.token,
        "invite_url": _build_invite_url(invite.token),
    }
