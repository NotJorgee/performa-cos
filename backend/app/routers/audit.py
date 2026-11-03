import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Trail"])


def log_audit(
    db: Session,
    action: str,
    target_scope: Optional[str] = None,
    operation_details: Optional[str] = None,
    user: Optional[models.UserAccount] = None,
    request: Optional[Request] = None,
):
    """Utility helper to synchronously record an immutable audit event."""
    try:
        ip_addr = "127.0.0.1"
        if request:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                ip_addr = forwarded.split(",")[0].strip()
            elif request.client:
                ip_addr = request.client.host

        user_id = user.id if user else None
        user_name = user.full_name if user else "System Automated"
        role = user.role if user else "System"

        log_entry = models.AuditLog(
            timestamp=datetime.datetime.utcnow(),
            user_id=user_id,
            user_name=user_name,
            role=role,
            action=action,
            target_scope=target_scope,
            ip_address=ip_addr,
            operation_details=operation_details,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"[Audit Log Error] Failed to write audit event: {e}")
        db.rollback()


@router.get("")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Retrieve system security audit logs (HR Personnel & Administrators only)."""
    if current_user.role not in ["HR Personnel", "Department Head"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only HR and University Administrators can access security audit logs.",
        )

    query = db.query(models.AuditLog)

    if action:
        query = query.filter(models.AuditLog.action == action)
    if role:
        query = query.filter(models.AuditLog.role == role)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.AuditLog.user_name.ilike(search_pattern))
            | (models.AuditLog.target_scope.ilike(search_pattern))
            | (models.AuditLog.operation_details.ilike(search_pattern))
            | (models.AuditLog.ip_address.ilike(search_pattern))
        )

    if start_date:
        try:
            start_dt = datetime.datetime.fromisoformat(start_date)
            query = query.filter(models.AuditLog.timestamp >= start_dt)
        except Exception:
            pass

    if end_date:
        try:
            end_dt = datetime.datetime.fromisoformat(end_date)
            query = query.filter(models.AuditLog.timestamp <= end_dt)
        except Exception:
            pass

    total = query.count()
    logs = (
        query.order_by(desc(models.AuditLog.timestamp))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    formatted = []
    for item in logs:
        ts = item.timestamp or datetime.datetime.utcnow()
        formatted.append({
            "id": item.id,
            "isoDate": ts.isoformat(),
            "timestamp": ts.strftime("%b %d, %Y %H:%M:%S"),
            "user": item.user_name or "Unknown User",
            "role": item.role or "COS Employee",
            "action": item.action,
            "targetScope": item.target_scope or "N/A",
            "ipAddress": item.ip_address or "127.0.0.1",
            "operationDetails": item.operation_details or "",
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "logs": formatted,
    }
