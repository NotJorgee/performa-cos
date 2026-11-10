"""
routers/templates.py — Evaluation Rubric Template Architecture for PerformaCOS.
Manages institutional evaluation forms, dynamic criteria rows, rating scales, and versioning.
"""
import datetime
import re
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from .audit import log_audit

router = APIRouter(prefix="/api/evaluation-templates", tags=["Evaluation Form Templates"])

# Official Institutional EVSU Rubric Criteria Standard
DEFAULT_EVSU_CRITERIA = [
    {
        "id": "job_knowledge",
        "title": "Job Knowledge",
        "description": "Understands duties, responsibilities, has ability to use materials needed, and has the level of proficiency required to accomplish the work.",
    },
    {
        "id": "work_quality",
        "title": "Work Quality",
        "description": "Accuracy, thoroughness, dependability of result.",
    },
    {
        "id": "attendance",
        "title": "Attendance",
        "description": "Reports to work as scheduled. Follows established procedures for breaks. Notifies supervisor in advance of scheduling changes.",
    },
    {
        "id": "initiative",
        "title": "Initiative",
        "description": "Ability to be self-directed, efficient, creative and resourceful. Assumes extra work on own initiative, adapts quickly to new responsibilities.",
    },
    {
        "id": "work_attitude",
        "title": "Work Attitude and Cooperation",
        "description": "Extent to which employee demonstrates a positive attitude and promotes cooperation with supervisors, peers, and others.",
    },
    {
        "id": "dependability",
        "title": "Dependability",
        "description": "Extent to which employee can be counted on to carry out instructions and fulfill job responsibilities.",
    },
]

DEFAULT_RATING_SCALE = [
    {
        "rating": 10,
        "label": "Outstanding",
        "desc": "Performance consistently exceeds expectations",
        "color": "#16a34a",
        "bg": "#f0fdf4",
        "border": "#bbf7d0",
    },
    {
        "rating": 8,
        "label": "Very Satisfactory",
        "desc": "Frequently exceeds expectations",
        "color": "#2563eb",
        "bg": "#eff6ff",
        "border": "#bfdbfe",
    },
    {
        "rating": 6,
        "label": "Satisfactory",
        "desc": "Meets expectations",
        "color": "#0284c7",
        "bg": "#f0f9ff",
        "border": "#bae6fd",
    },
    {
        "rating": 4,
        "label": "Needs Improvement",
        "desc": "Sometimes fails to meet expectations",
        "color": "#d97706",
        "bg": "#fffbeb",
        "border": "#fde68a",
    },
    {
        "rating": 2,
        "label": "Unsatisfactory",
        "desc": "Frequently fails to meet expectations",
        "color": "#dc2626",
        "bg": "#fef2f2",
        "border": "#fca5a5",
    },
]

DEFAULT_QUALITATIVE_PROMPTS = {
    "strengthsPrompt": "Major Strengths / Significant Accomplishments",
    "recommendationsPrompt": "Areas for Development / Official Action Recommendation",
}

DEFAULT_RECOMMENDATIONS = [
    "Recommended for Renewal",
    "Recommended for Non-Renewal",
    "Needs Performance Improvement Plan",
]


def get_next_template_version(current_version: Optional[str] = None) -> str:
    """
    Computes next template version string under EVSU institutional convention (Convention 1):
    - Initial format: Form Series of YYYY (e.g. Form Series of 2026)
    - Mid-year revisions: Form Series of YYYY (Rev. 1), (Rev. 2), etc.
    - New calendar year: Form Series of <NEW_YEAR>
    """
    current_year = datetime.datetime.utcnow().year
    if not current_version:
        return f"Form Series of {current_year}"

    match = re.search(r"Form Series of (\d{4})(?:\s*\(Rev\.\s*(\d+)\))?", current_version, re.IGNORECASE)
    if match:
        year = int(match.group(1))
        rev = int(match.group(2)) if match.group(2) else 0
        if year == current_year:
            return f"Form Series of {year} (Rev. {rev + 1})"
        return f"Form Series of {current_year}"

    if "v1." in current_version or "Standard" in current_version:
        return f"Form Series of {current_year}"

    return f"Form Series of {current_year} (Rev. 1)"


def seed_default_template(db: Session, created_by_id: Optional[int] = None) -> models.EvaluationTemplate:
    """Helper to seed and activate the official institutional EVSU default template."""
    now = datetime.datetime.utcnow()
    default_tpl = models.EvaluationTemplate(
        template_key="evsu_default_template",
        title="EVSU Contract of Service (COS) Performance Appraisal Form",
        subtitle="Official Performance Rating Instrument for Non-Regular Personnel",
        instructions="Evaluate the contracted personnel based on verifiable work deliverables, daily accomplishment reports, and departmental contributions during the current rating period.",
        version="Form Series of 2026",
        is_active=True,
        criteria=DEFAULT_EVSU_CRITERIA,
        rating_scale=DEFAULT_RATING_SCALE,
        qualitative_prompts=DEFAULT_QUALITATIVE_PROMPTS,
        recommendations=DEFAULT_RECOMMENDATIONS,
        created_by_id=created_by_id,
        created_at=now,
        updated_at=now,
    )
    db.add(default_tpl)
    db.commit()
    db.refresh(default_tpl)
    return default_tpl


@router.get("/active", response_model=schemas.EvaluationTemplateOut)
def get_active_evaluation_template(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns the currently active evaluation form template.
    If no template exists in the database, automatically seeds and activates the standard EVSU rubric.
    """
    active_tpl = (
        db.query(models.EvaluationTemplate)
        .filter(models.EvaluationTemplate.is_active == True)
        .order_by(desc(models.EvaluationTemplate.id))
        .first()
    )

    if not active_tpl:
        active_tpl = seed_default_template(db, created_by_id=current_user.id)

    return active_tpl


@router.post("", response_model=schemas.EvaluationTemplateOut, status_code=status.HTTP_201_CREATED)
def publish_evaluation_template(
    payload: schemas.EvaluationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Publishes and activates a new evaluation form template (HR Personnel only).
    Deactivates any previously active template and logs the change in the security audit trail.
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only HR Personnel can publish evaluation form templates.",
        )

    if not payload.criteria or len(payload.criteria) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The evaluation rubric must contain at least one criterion row.",
        )

    # Fetch currently active template to derive revision counter
    active_tpl = (
        db.query(models.EvaluationTemplate)
        .filter(models.EvaluationTemplate.is_active == True)
        .order_by(desc(models.EvaluationTemplate.id))
        .first()
    )

    # Deactivate existing active templates
    db.query(models.EvaluationTemplate).filter(models.EvaluationTemplate.is_active == True).update(
        {"is_active": False}
    )

    now = datetime.datetime.utcnow()
    if payload.version and payload.version.strip() and not payload.version.strip().startswith("v"):
        version_to_use = payload.version.strip()
    else:
        version_to_use = get_next_template_version(active_tpl.version if active_tpl else None)

    new_tpl = models.EvaluationTemplate(
        template_key=payload.template_key or "evsu_custom_template",
        title=payload.title,
        subtitle=payload.subtitle or "Official Performance Rating Instrument for Non-Regular Personnel",
        instructions=payload.instructions or "Evaluate the contracted personnel based on verifiable work deliverables and departmental contributions.",
        version=version_to_use,
        is_active=True,
        criteria=payload.criteria,
        rating_scale=payload.rating_scale or DEFAULT_RATING_SCALE,
        qualitative_prompts=payload.qualitative_prompts or DEFAULT_QUALITATIVE_PROMPTS,
        recommendations=payload.recommendations or DEFAULT_RECOMMENDATIONS,
        created_by_id=current_user.id,
        created_at=now,
        updated_at=now,
    )

    db.add(new_tpl)
    db.commit()
    db.refresh(new_tpl)

    log_audit(
        db=db,
        action="EVALUATION_TEMPLATE_PUBLISHED",
        target_scope=f"Template #{new_tpl.id} ({new_tpl.title})",
        operation_details=f"HR Personnel {current_user.full_name} published a new evaluation form rubric containing {len(payload.criteria)} criteria rows.",
        user=current_user,
    )

    return new_tpl


@router.post("/reset", response_model=schemas.EvaluationTemplateOut)
def reset_evaluation_template_to_default(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Restores the evaluation form rubric back to the institutional EVSU default standard (HR Personnel only).
    """
    if current_user.role != "HR Personnel":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only HR Personnel can reset the evaluation form template.",
        )

    # Deactivate existing active templates
    db.query(models.EvaluationTemplate).filter(models.EvaluationTemplate.is_active == True).update(
        {"is_active": False}
    )

    fresh_default = seed_default_template(db, created_by_id=current_user.id)

    log_audit(
        db=db,
        action="EVALUATION_TEMPLATE_RESET",
        target_scope=f"Template #{fresh_default.id}",
        operation_details=f"HR Personnel {current_user.full_name} reset the active evaluation rubric to official EVSU standard default.",
        user=current_user,
    )

    return fresh_default
