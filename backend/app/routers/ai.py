"""
routers/ai.py - AI Services and Intelligent Text Assistance for PerformaCOS.
Handles contextual predictive text autocomplete, smart suggestion chips, and Gemini DAR synthesis.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..ai_service import generate_predictive_completion

router = APIRouter(prefix="/api/ai", tags=["AI Services"])


@router.post("/predictive-text", response_model=schemas.PredictiveTextResponse)
def get_predictive_text_completion(
    payload: schemas.PredictiveTextRequest,
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns real-time predictive ghost text autocomplete and contextual suggestion chips
    for evaluation qualitative remarks and employee daily accomplishment reporting (DAR).
    """
    try:
        user_role = payload.employee_role or (current_user.job_title if current_user else "COS Personnel")
        dept_name = payload.department or (current_user.department.name if current_user and current_user.department else "Academic Affairs")

        result = generate_predictive_completion(
            context_type=payload.context_type,
            current_text=payload.current_text,
            field_name=payload.field_name or "strengths",
            employee_role=user_role,
            department=dept_name,
            dimension_scores=payload.dimension_scores,
            recent_tasks=payload.recent_tasks,
        )

        return schemas.PredictiveTextResponse(
            ghost_text=result.get("ghost_text", ""),
            suggestion_chips=result.get("suggestion_chips", []),
            source=result.get("source", "gemini"),
        )
    except Exception as e:
        # Fallback guarantee so user input is never interrupted
        return schemas.PredictiveTextResponse(
            ghost_text="",
            suggestion_chips=[
                "complies with institutional standard procedures",
                "delivers verified work deliverables on time",
                "demonstrates proactive departmental support",
            ],
            source="error_fallback",
        )
