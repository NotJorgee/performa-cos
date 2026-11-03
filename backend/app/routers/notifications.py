"""
routers/notifications.py — In-app notification center & delivery for PerformaCOS.
"""
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas
from .audit import log_audit

router = APIRouter(prefix="/api/notifications", tags=["In-App Notifications"])


def create_notification(
    db: Session,
    title: str,
    message: str,
    category: str = "system",
    user_id: Optional[int] = None,
    target_role: Optional[str] = None,
    action_view: Optional[str] = None,
):
    """Utility helper to synchronously generate an in-app notification."""
    try:
        notif = models.Notification(
            user_id=user_id,
            target_role=target_role,
            title=title,
            message=message,
            category=category,
            is_read=False,
            action_view=action_view,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        print(f"[Notification Error] Failed to generate notification: {e}")
        db.rollback()


def _format_time_ago(dt: Optional[datetime.datetime]) -> str:
    if not dt:
        return "Just now"
    now = datetime.datetime.utcnow()
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} min{'s' if minutes > 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif seconds < 172800:
        return f"Yesterday, {dt.strftime('%I:%M %p')}"
    else:
        days = seconds // 86400
        return f"{days} days ago"


@router.get("/preferences", response_model=schemas.NotificationPreferenceOut)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Retrieve delivery and alert preferences for the authenticated user."""
    prefs = (
        db.query(models.NotificationPreference)
        .filter(models.NotificationPreference.user_id == current_user.id)
        .first()
    )
    if not prefs:
        prefs = models.NotificationPreference(
            user_id=current_user.id,
            deadline_alerts=True,
            contract_notices=True,
            approval_alerts=True,
            sms_alerts=True,
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


@router.patch("/preferences", response_model=schemas.NotificationPreferenceOut)
def update_notification_preferences(
    payload: schemas.NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Update delivery and alert preferences for the authenticated user."""
    prefs = (
        db.query(models.NotificationPreference)
        .filter(models.NotificationPreference.user_id == current_user.id)
        .first()
    )
    if not prefs:
        prefs = models.NotificationPreference(user_id=current_user.id)
        db.add(prefs)

    if current_user.role == "COS Employee":
        # Institutional compliance: all alerts remain statutory and mandatory for COS employees
        prefs.deadline_alerts = True
        prefs.contract_notices = True
        prefs.approval_alerts = True
        prefs.sms_alerts = True
    else:
        if payload.deadline_alerts is not None:
            prefs.deadline_alerts = payload.deadline_alerts
        if payload.contract_notices is not None:
            prefs.contract_notices = payload.contract_notices
        if payload.approval_alerts is not None:
            prefs.approval_alerts = payload.approval_alerts
        if payload.sms_alerts is not None:
            prefs.sms_alerts = payload.sms_alerts

    db.commit()
    db.refresh(prefs)

    log_audit(
        db=db,
        action="NOTIFICATION_PREFERENCES_UPDATED",
        target_scope=f"User #{current_user.id} ({current_user.email})",
        operation_details="Updated delivery preferences for contract notices, deadline alerts, or SMS alerts.",
        user=current_user,
    )

    return prefs


@router.get("")
def list_user_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Fetch notifications relevant to the logged-in user or their institutional role."""
    query = db.query(models.Notification).filter(
        or_(
            models.Notification.user_id == current_user.id,
            models.Notification.target_role == current_user.role,
            (models.Notification.user_id == None) & (models.Notification.target_role == None),
        )
    )

    if unread_only:
        query = query.filter(models.Notification.is_read == False)

    notifications = query.order_by(desc(models.Notification.created_at)).limit(100).all()

    formatted = []
    for n in notifications:
        action_label = "View"
        if n.action_view == "daily_report":
            action_label = "Submit DAR"
        elif n.action_view == "peer_evaluations":
            action_label = "Evaluate Peer"
        elif n.action_view == "contract_status":
            action_label = "Check Contract Status"
        elif n.action_view == "monthly_report":
            action_label = "View Compiled MAR"
        elif n.action_view == "pending_evaluations":
            action_label = "Open Roster"
        elif n.action_view == "intent_review":
            action_label = "Review Intents"
        elif n.action_view == "evaluation_management":
            action_label = "Manage Renewals" if "renewal" in (n.category or "") else "Open Mediation"
        elif n.action_view == "hr_evaluations_proxy":
            action_label = "Input HR Scores"

        formatted.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category or "system",
            "unread": not n.is_read,
            "time": _format_time_ago(n.created_at),
            "actionView": n.action_view,
            "actionLabel": action_label,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        })

    return formatted


@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read.", "id": notification_id}


@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Mark all matching user notifications as read."""
    db.query(models.Notification).filter(
        or_(
            models.Notification.user_id == current_user.id,
            models.Notification.target_role == current_user.role,
        )
    ).update({"is_read": True}, synchronize_session=False)

    db.commit()
    return {"message": "All notifications marked as read."}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Dismiss or delete a notification."""
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    db.delete(notif)
    db.commit()
    return {"message": "Notification removed.", "id": notification_id}
