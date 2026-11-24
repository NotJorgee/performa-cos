"""
routers/system_settings.py — Institutional System Settings & Policy Configuration for PerformaCOS.
Provides centralized endpoints for managing institutional policies, including the Standard COS Contract Length Policy.
"""
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from .audit import log_audit

router = APIRouter(prefix="/api/system-settings", tags=["System Settings & Institutional Policies"])


def calculate_contract_end_date(start_date: datetime.date, duration_months: int) -> datetime.date:
    """Calculates inclusive contract end date based on duration_months (inclusive contract term math)."""
    month = start_date.month + duration_months
    year = start_date.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    is_leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    days_in_month = [31, 29 if is_leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    day = min(start_date.day, days_in_month[month - 1])
    target = datetime.date(year, month, day)
    return target - datetime.timedelta(days=1)


def get_system_setting(db: Session, key: str, default: str = "") -> str:
    s = db.query(models.SystemSetting).filter(models.SystemSetting.setting_key == key).first()
    return s.setting_value if s else default


def set_system_setting(
    db: Session,
    key: str,
    value: str,
    description: Optional[str] = None,
    user_id: Optional[int] = None,
) -> models.SystemSetting:
    s = db.query(models.SystemSetting).filter(models.SystemSetting.setting_key == key).first()
    now = datetime.datetime.utcnow()
    if not s:
        s = models.SystemSetting(
            setting_key=key,
            setting_value=value,
            description=description,
            updated_by_id=user_id,
            updated_at=now,
        )
        db.add(s)
    else:
        s.setting_value = value
        if description:
            s.description = description
        s.updated_by_id = user_id
        s.updated_at = now
    db.commit()
    db.refresh(s)
    return s


def _format_policy_name(months: int) -> str:
    return f"{months} Months"


@router.get("/contract-policy", response_model=schemas.ContractPolicyOut)
def get_contract_policy(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns the current university standard COS contract length policy.
    Accessible to all authenticated users so the frontend can display and compute dates accurately.
    """
    months_setting = db.query(models.SystemSetting).filter(
        models.SystemSetting.setting_key == "cos_contract_duration_months"
    ).first()
    memo_setting = db.query(models.SystemSetting).filter(
        models.SystemSetting.setting_key == "cos_contract_policy_memo"
    ).first()

    duration_months = 6
    if months_setting and months_setting.setting_value.isdigit():
        duration_months = int(months_setting.setting_value)

    memo = memo_setting.setting_value if memo_setting else "EVSU Institutional Standard COS Contract Policy"
    policy_name = _format_policy_name(duration_months)

    updated_by_name = None
    updated_at = None
    if months_setting:
        updated_at = months_setting.updated_at
        if months_setting.updated_by:
            updated_by_name = months_setting.updated_by.full_name

    return schemas.ContractPolicyOut(
        duration_months=duration_months,
        policy_name=policy_name,
        memo=memo,
        updated_at=updated_at,
        updated_by_name=updated_by_name or "Human Resource Management Development Office (HRMDO)",
    )


@router.post("/contract-policy", response_model=schemas.ContractPolicyOut)
def update_contract_policy(
    payload: schemas.ContractPolicyUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Updates the university standard COS contract length policy (HR Personnel only).
    Logs the update in the audit trail and broadcasts an institutional directive notification to all users.
    Applies to upcoming contract renewal cycles and subsequent appointments (active contracts remain intact).
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only HR Personnel can configure institutional contract duration policies.",
        )

    if payload.duration_months < 1 or payload.duration_months > 60:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract duration must be between 1 and 60 months.",
        )

    memo_text = (payload.memo or "").strip() or "EVSU Institutional Standard COS Contract Policy Directive"

    # Save settings
    set_system_setting(
        db=db,
        key="cos_contract_duration_months",
        value=str(payload.duration_months),
        description="Standard duration of Contract of Service terms in months",
        user_id=current_user.id,
    )
    set_system_setting(
        db=db,
        key="cos_contract_policy_memo",
        value=memo_text,
        description="Official administrative directive reference for standard COS duration",
        user_id=current_user.id,
    )

    policy_name = _format_policy_name(payload.duration_months)
    now = datetime.datetime.utcnow()

    # Log to audit trail
    log_audit(
        db=db,
        action="CONTRACT_POLICY_UPDATED",
        target_scope="COS Contract Policy",
        operation_details=(
            f"HR Personnel {current_user.full_name} updated standard COS contract length policy to {payload.duration_months} months. "
            f"Directive Reference: {memo_text}. Effect: Upcoming contract renewals and subsequent appointments will adopt {payload.duration_months} months."
        ),
        user=current_user,
    )

    # Broadcast institutional directive notification to all users
    broadcast_title = "University Directive: Standard COS Contract Duration Updated"
    broadcast_msg = (
        f"The HRMDO has updated the standard Contract of Service (COS) contract duration to {payload.duration_months} months. "
        f"In accordance with university policy, currently active contracts remain intact until their scheduled expiration date. "
        f"Upcoming renewal contracts will adopt this new {payload.duration_months}-month term."
    )

    # 1. Global campus broadcast (unassigned user_id / target_role)
    db.add(
        models.Notification(
            user_id=None,
            target_role=None,
            title=broadcast_title,
            message=broadcast_msg,
            category="system",
            is_read=False,
            action_view="contract_length",
            created_at=now,
        )
    )

    # 2. Targeted direct notification rows for each active account to ensure immediate UI presentation
    active_users = db.query(models.UserAccount).filter(models.UserAccount.is_archived == False).all()
    for u in active_users:
        db.add(
            models.Notification(
                user_id=u.id,
                title=broadcast_title,
                message=broadcast_msg,
                category="system",
                is_read=False,
                action_view="contract_length",
                created_at=now,
            )
        )

    db.commit()

    return schemas.ContractPolicyOut(
        duration_months=payload.duration_months,
        policy_name=policy_name,
        memo=memo_text,
        updated_at=now,
        updated_by_name=current_user.full_name,
    )
