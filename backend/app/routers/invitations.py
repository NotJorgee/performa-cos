"""
routers/invitations.py — Invitation token management & onboarding for PerformaCOS.
"""
import random
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import settings
from .. import models, schemas
from ..auth import get_current_user
from ..email_service import send_invitation_email

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])


@router.post("", response_model=schemas.InvitationTokenOut, status_code=status.HTTP_201_CREATED)
def create_invitation(
    payload: schemas.InvitationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Generate an invitation token for a new COS Employee or Administrator (HR only).
    Optionally sends an invitation email via Resend if email is provided.
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR Personnel can issue invitation tokens.",
        )

    # Prefix based on role
    role_prefix = "COS" if payload.role == "COS Employee" else "ADM"
    token_str = f"EVSU-INV-{role_prefix}-{random.randint(10000, 99999)}"

    # Ensure uniqueness
    while db.query(models.InvitationToken).filter(models.InvitationToken.token == token_str).first():
        token_str = f"EVSU-INV-{role_prefix}-{random.randint(10000, 99999)}"

    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)

    dept_id = payload.department_id
    if not dept_id and payload.department_name:
        dept = db.query(models.Department).filter(models.Department.name == payload.department_name).first()
        if dept:
            dept_id = dept.id

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

    # Attach computed invite_url
    invitation.invite_url = f"{settings.APP_FRONTEND_URL}/?token={invitation.token}"
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
        inv.invite_url = f"{settings.APP_FRONTEND_URL}/?token={inv.token}"
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

    db.delete(invite)
    db.commit()
    return {"message": "Invitation token revoked successfully."}


@router.get("/validate")
def validate_invitation(token: str, db: Session = Depends(get_db)):
    """Public endpoint — validates an invitation token without requiring authentication."""
    invite = (
        db.query(models.InvitationToken)
        .filter(
            models.InvitationToken.token == token,
            models.InvitationToken.used_at == None,
        )
        .first()
    )

    if not invite:
        raise HTTPException(status_code=400, detail="Invitation token is invalid or has already been used.")

    if invite.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation token has expired.")

    dept_name = None
    if invite.department_id:
        dept = db.query(models.Department).filter(models.Department.id == invite.department_id).first()
        if dept:
            dept_name = dept.name

    return {
        "valid": True,
        "role": invite.role,
        "department_id": invite.department_id,
        "department_name": dept_name,
        "email": invite.email,
        "token": invite.token,
        "invite_url": f"{settings.APP_FRONTEND_URL}/?token={invite.token}",
    }
