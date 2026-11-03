"""
routers/sessions.py — Active user sessions & device security management for PerformaCOS.
"""
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..auth import get_current_user, hash_token
from .. import models, schemas
from .audit import log_audit

router = APIRouter(prefix="/api/sessions", tags=["Session Security"])


def _parse_device_string(ua: str) -> str:
    if not ua:
        return "Unknown Device"
    ua_lower = ua.lower()
    os_name = "Unknown OS"
    if "windows" in ua_lower:
        os_name = "Windows PC"
    elif "macintosh" in ua_lower or "mac os" in ua_lower:
        os_name = "macOS"
    elif "android" in ua_lower:
        os_name = "Android Device"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        os_name = "iOS Device"
    elif "linux" in ua_lower:
        os_name = "Linux PC"

    browser = "Web Browser"
    if "edg" in ua_lower:
        browser = "Microsoft Edge"
    elif "chrome" in ua_lower:
        browser = "Google Chrome"
    elif "firefox" in ua_lower:
        browser = "Mozilla Firefox"
    elif "safari" in ua_lower:
        browser = "Apple Safari"

    return f"{os_name} · {browser}"


@router.get("")
def list_active_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Retrieve all active concurrent sessions for the authenticated user."""
    auth_header = request.headers.get("Authorization", "")
    current_token_hash = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        current_token_hash = hash_token(token)

    sessions = (
        db.query(models.UserSession)
        .filter(
            models.UserSession.user_id == current_user.id,
            models.UserSession.is_revoked == False,
        )
        .order_by(desc(models.UserSession.last_active))
        .all()
    )

    result = []
    for s in sessions:
        is_current = (s.token_hash == current_token_hash) if current_token_hash else False
        device_label = _parse_device_string(s.device_description or "")

        result.append({
            "id": s.id,
            "deviceDescription": device_label,
            "rawUserAgent": s.device_description or "",
            "ipAddress": s.ip_address or "127.0.0.1",
            "networkInfo": s.network_info or "EVSU Campus Network / Direct",
            "lastActive": s.last_active.isoformat() if s.last_active else None,
            "createdAt": s.created_at.isoformat() if s.created_at else None,
            "isCurrentSession": is_current,
        })

    return result


@router.delete("/{session_id}")
def revoke_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Revoke a specific session, forcing immediate logout on that device."""
    sess = (
        db.query(models.UserSession)
        .filter(
            models.UserSession.id == session_id,
            models.UserSession.user_id == current_user.id,
        )
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    sess.is_revoked = True
    db.commit()

    log_audit(
        db=db,
        action="SESSION_REVOKED",
        target_scope=f"Session #{session_id}",
        operation_details=f"User {current_user.email} terminated remote session #{session_id}.",
        user=current_user,
        request=None,
    )

    return {"message": "Session revoked successfully.", "sessionId": session_id}


@router.delete("/all/others")
def revoke_all_other_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Revoke all sessions except the current active session."""
    auth_header = request.headers.get("Authorization", "")
    current_token_hash = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        current_token_hash = hash_token(token)

    query = db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.id,
        models.UserSession.is_revoked == False,
    )
    if current_token_hash:
        query = query.filter(models.UserSession.token_hash != current_token_hash)

    revoked_count = query.update({"is_revoked": True}, synchronize_session=False)
    db.commit()

    log_audit(
        db=db,
        action="ALL_OTHER_SESSIONS_REVOKED",
        target_scope=f"User #{current_user.id}",
        operation_details=f"User {current_user.email} revoked {revoked_count} other active device sessions.",
        user=current_user,
        request=None,
    )

    return {"message": f"Successfully terminated {revoked_count} other sessions."}
