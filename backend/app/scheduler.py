"""
scheduler.py — Autonomous Background Scheduler & Milestone Automation for PerformaCOS.
Evaluates Contract of Service 30-day and 14-day renewal intent windows based on contract_end_date,
generating in-app notifications and dispatching official SMTP emails.
"""
import asyncio
import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from .database import SessionLocal
from . import models
from .email_service import send_contract_window_alert_email
from .routers.audit import log_audit


def evaluate_contract_deadlines(db: Session) -> Dict[str, Any]:
    """
    Scans all active COS Employee accounts and evaluates contract expiration milestones.
    Dispatches in-app notifications and SMTP emails for the 30-day and 14-day renewal windows.
    Guarantees idempotency (no duplicate spam per cycle).
    """
    today = datetime.date.today()
    now = datetime.datetime.utcnow()

    # Scan active, non-archived COS Employees with valid contract_end_date
    employees = (
        db.query(models.UserAccount)
        .filter(
            models.UserAccount.role == "COS Employee",
            models.UserAccount.is_archived == False,
            models.UserAccount.is_active == True,
            models.UserAccount.contract_end_date.isnot(None),
        )
        .all()
    )

    total_evaluated = len(employees)
    alerts_dispatched = 0
    alert_details = []

    for emp in employees:
        try:
            days_remaining = (emp.contract_end_date - today).days

            # Skip if contract already expired or more than 30 days away
            if days_remaining < 0 or days_remaining > 30:
                continue

            # Check if employee has already submitted their renewal intent
            has_submitted_intent = (
                db.query(models.RenewalApplication)
                .filter(
                    models.RenewalApplication.employee_id == emp.id,
                    models.RenewalApplication.status.in_(["Submitted", "Approved", "In Progress", "Pending HRMO"]),
                )
                .first()
            )
            if has_submitted_intent:
                continue

            # Check user notification preference
            prefs = (
                db.query(models.NotificationPreference)
                .filter(models.NotificationPreference.user_id == emp.id)
                .first()
            )
            if prefs and prefs.contract_notices is False:
                continue

            # 1. 30-Day Window Reminder (between 25 and 30 days)
            if 25 <= days_remaining <= 30:
                # Idempotency check: don't re-alert if notified in the last 15 days
                already_notified = (
                    db.query(models.Notification)
                    .filter(
                        models.Notification.user_id == emp.id,
                        models.Notification.category == "contract_window_30",
                        models.Notification.created_at >= now - datetime.timedelta(days=15),
                    )
                    .first()
                )
                if not already_notified:
                    db.add(
                        models.Notification(
                            user_id=emp.id,
                            title="Contract Renewal Window Open (30 Days Remaining)",
                            message=f"Your Contract of Service concludes on {emp.contract_end_date} ({days_remaining} days remaining). Please log in to submit your renewal declaration.",
                            category="contract_window_30",
                            is_read=False,
                            action_view="contract_status",
                            created_at=now,
                        )
                    )
                    if emp.email:
                        send_contract_window_alert_email(
                            to=emp.email,
                            emp_name=emp.full_name,
                            days_left=days_remaining,
                            end_date=str(emp.contract_end_date),
                        )
                    alerts_dispatched += 1
                    alert_details.append({
                        "employee_id": emp.id,
                        "name": emp.full_name,
                        "type": "30_day_window",
                        "days_remaining": days_remaining,
                    })

            # 2. 14-Day Urgent Reminder (between 10 and 14 days)
            elif 10 <= days_remaining <= 14:
                # Idempotency check: don't re-alert if notified in the last 10 days
                already_notified_14 = (
                    db.query(models.Notification)
                    .filter(
                        models.Notification.user_id == emp.id,
                        models.Notification.category == "contract_window_14",
                        models.Notification.created_at >= now - datetime.timedelta(days=10),
                    )
                    .first()
                )
                if not already_notified_14:
                    db.add(
                        models.Notification(
                            user_id=emp.id,
                            title="Urgent: Contract Renewal Window Closing (14 Days Remaining)",
                            message=f"Urgent Notice: Only {days_remaining} days remain on your Contract of Service (ending {emp.contract_end_date}). Action is required to avoid contract expiration without renewal endorsement.",
                            category="contract_window_14",
                            is_read=False,
                            action_view="contract_status",
                            created_at=now,
                        )
                    )
                    if emp.email:
                        send_contract_window_alert_email(
                            to=emp.email,
                            emp_name=emp.full_name,
                            days_left=days_remaining,
                            end_date=str(emp.contract_end_date),
                        )
                    alerts_dispatched += 1
                    alert_details.append({
                        "employee_id": emp.id,
                        "name": emp.full_name,
                        "type": "14_day_urgent",
                        "days_remaining": days_remaining,
                    })

        except Exception as e:
            print(f"[Scheduler] Error evaluating employee #{emp.id} ({emp.full_name}): {e}")

    if alerts_dispatched > 0:
        db.commit()

    return {
        "status": "completed",
        "evaluated_at": now.isoformat(),
        "total_evaluated": total_evaluated,
        "alerts_dispatched": alerts_dispatched,
        "alert_details": alert_details,
    }


async def start_deadline_scheduler():
    """
    Continuous background daemon running inside the FastAPI lifecycle.
    Executes a deadline evaluation check every 24 hours.
    """
    print("[Scheduler Daemon] Automated Deadline Background Daemon initialized.")
    while True:
        try:
            # Brief delay after startup before first check
            await asyncio.sleep(60)
            with SessionLocal() as db:
                result = evaluate_contract_deadlines(db)
                if result.get("alerts_dispatched", 0) > 0:
                    print(f"[Scheduler Daemon] Dispatched {result['alerts_dispatched']} deadline alerts.")
        except asyncio.CancelledError:
            print("[Scheduler Daemon] Background daemon shutting down.")
            break
        except Exception as err:
            print(f"[Scheduler Daemon] Error during cycle: {err}")

        # Sleep for 24 hours (86,400 seconds)
        await asyncio.sleep(86400)
