import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from datetime import datetime

from .config import settings
from . import models

logger = logging.getLogger("ai_service")

# Candidate models ranked by speed, quota efficiency, and availability
CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


def generate_fallback_synthesis(
    employee_name: str,
    department_name: str,
    tasks_count: int,
    top_categories: List[str],
    attendance_stats: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Deterministic institutional performance appraisal generator.
    Serves as an offline or quota fallback guaranteeing high-quality executive synthesis.
    """
    punctuality = attendance_stats.get("punctuality_rate", 100) if attendance_stats else 100
    top_domains = ", ".join(top_categories[:3]) if top_categories else "institutional operational duties"

    narrative = (
        f"{employee_name} has delivered consistent, documented operational contributions to the {department_name} "
        f"at Eastern Visayas State University throughout the contracted service cycle. "
        f"With {tasks_count} verified daily accomplishment task records focused in {top_domains} "
        f"and an exemplary {punctuality}% on-time campus attendance rating, the employee demonstrates high reliability, "
        f"adherence to institutional standards, and strong support for university operations."
    )

    strengths = [
        f"Consistent task execution across {top_domains}",
        f"Demonstrated operational reliability with {punctuality}% punctuality rating",
        "Diligent adherence to daily accomplishment logging and photographic verification protocols",
    ]

    recommendations = [
        f"Continue expanding technical domain proficiencies within {department_name} operational workflows",
        "Maintain proactive coordination with immediate supervisor and peer personnel for cross-functional initiatives",
    ]

    return {
        "narrative_summary": narrative,
        "key_strengths": strengths,
        "recommendations": recommendations,
        "source": "deterministic_synthesis",
        "generated_at": datetime.utcnow().isoformat(),
    }


def generate_gemini_synthesis(
    employee_name: str,
    department_name: str,
    period: str,
    tasks: List[Dict[str, Any]],
    attendance_stats: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generates an executive narrative appraisal using the Google Gemini Flash API.
    Uses zero extra dependencies (standard library urllib) and requests structured JSON output.
    Falls back to deterministic synthesis upon error or missing API key.
    """
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""

    # Aggregate categories for fallback or prompt context
    category_counts: Dict[str, int] = {}
    for t in tasks:
        cat = (t.get("category") or t.get("title") or "General Duty").strip()
        category_counts[cat] = category_counts.get(cat, 0) + 1
    sorted_cats = [c for c, _ in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)]

    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Using deterministic synthesis.")
        return generate_fallback_synthesis(
            employee_name=employee_name,
            department_name=department_name,
            tasks_count=len(tasks),
            top_categories=sorted_cats,
            attendance_stats=attendance_stats,
        )

    # Format sample of up to 15 distinct tasks for token efficiency
    sampled_tasks_desc = []
    seen = set()
    for t in tasks:
        title = t.get("title") or t.get("job_description") or "Operational Duty"
        work = t.get("work") or t.get("workAccomplished") or ""
        qty = t.get("quantity") or ""
        line = f"- {title}: {work} ({qty})" if qty else f"- {title}: {work}"
        if line not in seen:
            seen.add(line)
            sampled_tasks_desc.append(line)
        if len(sampled_tasks_desc) >= 15:
            break

    tasks_text = "\n".join(sampled_tasks_desc) if sampled_tasks_desc else "Standard campus operational assignments fulfilled."

    punctuality_rate = attendance_stats.get("punctuality_rate", 100) if attendance_stats else 100
    late_days = attendance_stats.get("late_days", 0) if attendance_stats else 0
    days_logged = attendance_stats.get("total_days_logged", len(tasks)) if attendance_stats else len(tasks)

    prompt = f"""
You are an executive evaluator for Eastern Visayas State University (EVSU).
Review the following Contract of Service (COS) personnel performance records for the term: {period}.

Employee Name: {employee_name}
Department / Office: {department_name}
Total Verified Daily Accomplishment Reports (DAR): {len(tasks)} logged tasks
On-Campus Attendance: {punctuality_rate}% punctuality rate, {days_logged} active day(s) logged, {late_days} late arrival(s).

Sample Accomplished Tasks & Deliverables:
{tasks_text}

Instructions:
1. Formulate a 2 to 3 sentence formal, professional Executive Performance Appraisal summarizing the employee's demonstrated competency, work output, and dedication to university service.
2. Extract 3 specific Key Demonstrated Competencies / Strengths based directly on their completed tasks.
3. Formulate 2 constructive Growth Recommendations for their upcoming contract renewal term.

You MUST return strictly valid JSON matching this exact structure with NO markdown formatting, NO backticks:
{{
  "narrative_summary": "2-3 formal sentences providing the executive appraisal.",
  "key_strengths": ["Competency 1", "Competency 2", "Competency 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        },
    }
    encoded_payload = json.dumps(payload).encode("utf-8")

    for model_name in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=encoded_payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                result_raw = json.loads(resp.read().decode("utf-8"))
                text_content = result_raw["candidates"][0]["content"]["parts"][0]["text"].strip()
                parsed = json.loads(text_content)

                if "narrative_summary" in parsed and "key_strengths" in parsed:
                    parsed["source"] = f"gemini_{model_name}"
                    parsed["generated_at"] = datetime.utcnow().isoformat()
                    logger.info(f"Successfully generated Gemini synthesis via {model_name} for employee {employee_name}.")
                    return parsed
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")[:200]
            logger.warning(f"Gemini API model {model_name} returned HTTP {e.code}: {err_body}")
            continue
        except Exception as e:
            logger.warning(f"Gemini API request failed for {model_name}: {e}")
            continue

    logger.warning("All Gemini candidate models failed or returned non-JSON. Falling back to deterministic synthesis.")
    return generate_fallback_synthesis(
        employee_name=employee_name,
        department_name=department_name,
        tasks_count=len(tasks),
        top_categories=sorted_cats,
        attendance_stats=attendance_stats,
    )


def synthesize_and_cache_renewal_dar(
    db_session_factory,
    employee_id: int,
    renewal_id: int,
) -> None:
    """
    Background worker task executed once when an employee confirms their renewal intent.
    Synthesizes DAR portfolio with Google Gemini and writes the result to RenewalApplication.ai_synthesis.
    Ensures 0 recurring token consumption on subsequent views.
    """
    db = db_session_factory()
    try:
        emp = db.query(models.UserAccount).filter(models.UserAccount.id == employee_id).first()
        renewal = db.query(models.RenewalApplication).filter(models.RenewalApplication.id == renewal_id).first()

        if not emp or not renewal:
            logger.error(f"Cannot synthesize DAR: Employee #{employee_id} or Renewal #{renewal_id} not found.")
            return

        # Fetch DARs for this employee
        dars = (
            db.query(models.DailyAccomplishmentReport)
            .filter(models.DailyAccomplishmentReport.user_id == employee_id)
            .order_by(models.DailyAccomplishmentReport.log_date.desc())
            .all()
        )

        tasks_list = []
        for d in dars:
            raw_tasks = d.tasks or []
            if isinstance(raw_tasks, list):
                for t in raw_tasks:
                    if isinstance(t, dict):
                        title = (t.get("title") or t.get("job_description") or "Assigned Task").strip()
                        work = (t.get("workAccomplished") or t.get("work_accomplished") or "").strip()
                        cat = (t.get("category") or "General Support").strip()
                        qty = (t.get("quantity") or "").strip()
                        tasks_list.append({
                            "title": title,
                            "work": work,
                            "category": cat,
                            "quantity": qty,
                            "date": str(d.log_date),
                        })

        # Fetch attendance stats
        from .routers.attendance import get_employee_attendance_stats
        att_stats = None
        try:
            att_stats = get_employee_attendance_stats(employee_id=employee_id, db=db, current_user=emp)
        except Exception as e:
            logger.warning(f"Could not compute attendance stats for employee #{employee_id}: {e}")

        dept_name = emp.department.name if emp.department else "Academic / Administrative Unit"
        period = renewal.period or "Current Term"

        # Generate synthesis (Gemini with automatic fallback)
        synthesis = generate_gemini_synthesis(
            employee_name=emp.full_name,
            department_name=dept_name,
            period=period,
            tasks=tasks_list,
            attendance_stats=att_stats,
        )

        # Cache permanently in RenewalApplication
        renewal.ai_synthesis = synthesis
        db.add(renewal)
        db.commit()
        logger.info(f"Cached AI DAR synthesis for Renewal #{renewal_id} (Employee #{employee_id}).")

    except Exception as e:
        logger.error(f"Error during background DAR synthesis for employee #{employee_id}: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


def generate_fallback_prediction(
    context_type: str = "evaluation",
    current_text: str = "",
    field_name: str = "strengths",
    employee_role: str = "COS Personnel",
    department: str = "Academic Affairs",
    dimension_scores: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Deterministic predictive text generator when API is offline or latency threshold is reached.
    Guarantees formal civil-service phrased completions and contextual suggestion chips.
    """
    text_lower = current_text.lower().strip()
    
    if context_type == "dar":
        chips = [
            "conducted routine maintenance and operational verification",
            "assisted campus personnel with technical requirements",
            "prepared official documentation and verified deliverables",
            "updated institutional records and digital filing systems",
        ]
        if len(text_lower) < 3:
            ghost = ""
        elif text_lower.endswith("completed") or text_lower.endswith("performed"):
            ghost = " routine maintenance and inspection of assigned departmental facilities."
        elif text_lower.endswith("assisted") or text_lower.endswith("coordinated with"):
            ghost = " faculty members and colleagues regarding operational task requirements."
        elif text_lower.endswith("and"):
            ghost = " verified task deliverables for compliance with institutional standards."
        elif text_lower.endswith("in"):
            ghost = " executing daily operational responsibilities and assigned targets."
        elif text_lower.endswith("to"):
            ghost = " support departmental operational requirements in a timely manner."
        else:
            ghost = " in accordance with university standard operating procedures."
    elif context_type == "leave":
        chips = []
        if len(text_lower) < 3:
            ghost = ""
        elif "medical" in text_lower or "doctor" in text_lower or "clinic" in text_lower:
            ghost = " consultation and prescribed medical rest as advised by physician."
        elif "family" in text_lower or "emergency" in text_lower:
            ghost = " emergency requiring personal presence and immediate attention."
        elif "personal" in text_lower or "official" in text_lower:
            ghost = " administrative appointments with prior notice to immediate supervisor."
        elif text_lower.endswith("and"):
            ghost = " will resume all contracted duties promptly upon completion."
        elif text_lower.endswith("to"):
            ghost = " attend to urgent personal obligations with supervisor notice."
        else:
            ghost = " with formal notice submitted to Department Head for official review."
    elif context_type == "fast_track":
        chips = []
        if len(text_lower) < 3:
            ghost = ""
        elif "incompetence" in text_lower or "poor" in text_lower:
            ghost = " and persistent inability to meet contracted departmental deliverables."
        elif "deliverables" in text_lower or "abandonment" in text_lower:
            ghost = " and failure to fulfill required daily accomplishment deliverables on time."
        elif "insubordination" in text_lower or "conduct" in text_lower:
            ghost = " in violation of established institutional service codes and guidelines."
        elif "attendance" in text_lower or "absence" in text_lower or "tardiness" in text_lower:
            ghost = " due to repeated unauthorized absences and tardiness across rating cycle."
        elif text_lower.endswith("and"):
            ghost = " documented failure to improve despite prior supervisory counsel."
        elif text_lower.endswith("to"):
            ghost = " fulfill essential contractual duties and departmental operational standards."
        else:
            ghost = " substantiated by verifiable departmental documentation and supervisory review."
    elif context_type == "leave_review":
        chips = []
        if len(text_lower) < 3:
            ghost = ""
        elif "approved" in text_lower or "favorable" in text_lower or "endorsed" in text_lower:
            ghost = " subject to submission of supporting documentation and operational task handover."
        elif "coverage" in text_lower or "substitute" in text_lower:
            ghost = " provided class coverage and duties are coordinated with designated departmental personnel."
        elif "disapproved" in text_lower or "reject" in text_lower or "denied" in text_lower:
            ghost = " due to critical departmental operational schedule and pending university deliverables."
        elif text_lower.endswith("and"):
            ghost = " endorsed for administrative filing in official departmental attendance records."
        elif text_lower.endswith("to"):
            ghost = " ensure uninterrupted departmental services during the specified absence window."
        else:
            ghost = " with verified operational coverage and compliance with university attendance policies."
    elif context_type == "hr_renewal":
        chips = []
        if len(text_lower) < 3:
            ghost = ""
        elif "renew" in text_lower or "approved" in text_lower or "endorsed" in text_lower:
            ghost = " based on verified satisfactory performance rating and department head endorsement."
        elif "non-renewal" in text_lower or "conclude" in text_lower or "offboard" in text_lower:
            ghost = " finalized; university clearance checklist and separation workflow initiated in HR records."
        elif "condition" in text_lower or "subject to" in text_lower:
            ghost = " fulfillment of updated institutional requirements and supervisory compliance review."
        elif text_lower.endswith("and"):
            ghost = " official contract resolution forwarded for administrative sign-off and archival."
        elif text_lower.endswith("to"):
            ghost = " facilitate seamless contract continuity for the upcoming operational cycle."
        else:
            ghost = " in accordance with Eastern Visayas State University contract-of-service guidelines."
    elif context_type == "exit_reason":
        chips = []
        if len(text_lower) < 3:
            ghost = ""
        elif "graduate" in text_lower or "study" in text_lower or "studies" in text_lower or "master" in text_lower:
            ghost = " commitments and academic advancement requiring full-time personal focus."
        elif "career" in text_lower or "opportunity" in text_lower or "industry" in text_lower or "transition" in text_lower:
            ghost = " and professional growth opportunities in an external institutional sector."
        elif "relocat" in text_lower or "family" in text_lower:
            ghost = " and family obligations outside the campus geographic service area."
        elif "health" in text_lower or "medical" in text_lower or "personal" in text_lower:
            ghost = " considerations requiring an extended hiatus from regular contracted service."
        elif text_lower.endswith("and"):
            ghost = " expressing sincere appreciation for the professional service opportunity with EVSU."
        elif text_lower.endswith("to"):
            ghost = " pursue external professional development and advanced career objectives."
        else:
            ghost = " to pursue external opportunities with formal gratitude to the university."
    else:
        # Evaluation mode (Supervisor rubric qualitative comments)
        chips = [
            "consistently delivers high quality operational outputs",
            "demonstrates proactive initiative in assigned tasks",
            "adheres strictly to institutional procedures and deadlines",
            "maintains effective collaboration with faculty and peers",
        ]
        
        # Check scores context if provided
        scores = dimension_scores or {}
        initiative_score = scores.get("initiative", 6)
        attendance_score = scores.get("attendance", 6)

        if len(text_lower) < 3:
            ghost = ""
        elif "initiative" in text_lower or text_lower.endswith("initiative in"):
            ghost = " proactively solving departmental challenges and supporting team goals."
        elif "dependability" in text_lower or text_lower.endswith("dependable in"):
            ghost = " carrying out instructions and completing assignments on schedule."
        elif "attendance" in text_lower or text_lower.endswith("attendance"):
            if attendance_score <= 4:
                ghost = " with opportunities for focused improvement in punctuality and time management."
            else:
                ghost = " with commendable punctuality and consistent schedule adherence."
        elif text_lower.endswith("and"):
            ghost = " maintaining positive professional collaboration across all assignments."
        elif text_lower.endswith("in"):
            ghost = " delivering high-quality task outputs within required turn-around windows."
        elif text_lower.endswith("to"):
            ghost = " uphold institutional operational excellence and departmental support."
        else:
            ghost = " with high dependability and adherence to institutional standards."

    return {
        "ghost_text": ghost,
        "suggestion_chips": chips[:3],
        "source": "deterministic_rules",
    }


def generate_predictive_completion(
    context_type: str = "evaluation",
    current_text: str = "",
    field_name: str = "strengths",
    employee_role: str = "COS Personnel",
    department: str = "Academic Affairs",
    dimension_scores: Optional[Dict[str, Any]] = None,
    recent_tasks: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Predictive text autocomplete and chip generator using Gemini Flash Lite with instant deterministic fallback.
    """
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    fallback = generate_fallback_prediction(
        context_type=context_type,
        current_text=current_text,
        field_name=field_name,
        employee_role=employee_role,
        department=department,
        dimension_scores=dimension_scores,
    )

    if not current_text or len(current_text.strip()) < 3:
        return {
            "ghost_text": "",
            "suggestion_chips": [],
            "source": "empty_input",
        }

    if not api_key:
        return fallback

    scores_str = json.dumps(dimension_scores) if dimension_scores else "Standard Universal Criteria"
    tasks_str = ", ".join(recent_tasks[:5]) if recent_tasks else "Standard campus operational assignments"

    context_descriptions = {
        "evaluation": "Official Performance Appraisal Qualitative Evaluation (Strengths / Areas for Improvement)",
        "dar": "Employee Daily Accomplishment Report (DAR) Work Deliverables Entry",
        "leave": "Official Employee Leave of Absence Request Justification",
        "fast_track": "Official Supervisory Recommendation for Contract Non-Renewal / Performance Non-Compliance Justification",
        "leave_review": "Department Head Supervisory Leave Endorsement / Review Remarks",
        "hr_renewal": "HRMO Administrative Contract Finalization and Renewal Resolution Official Remarks",
        "exit_reason": "COS Employee Voluntary Non-Renewal of Contract Statement / Exit Reason",
    }
    ctx_desc = context_descriptions.get(context_type, context_descriptions["evaluation"])

    prompt = f"""
You are an AI inline predictive text engine for Eastern Visayas State University (EVSU).
Predict the immediate inline continuation for the user's current sentence.

Context: {ctx_desc}
Field Name: {field_name}
Employee Role: {employee_role}
Department: {department}
Evaluation Criteria Scores: {scores_str}
Recent Accomplishment Deliverables: {tasks_str}

Current Text Typed By User:
"{current_text}"

Rules:
1. "ghost_text": Predict ONLY the immediate next 6 to 12 words that naturally complete the current sentence or thought.
   - Maintain a formal, objective Philippine Civil Service / State University tone.
   - Do NOT repeat words already typed in the current text.
   - If the current text does not end in a space, start ghost_text with a single space.

Return strictly valid JSON:
{{
  "ghost_text": "..."
}}
"""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "max_output_tokens": 60,
        },
    }

    req_data = json.dumps(payload).encode("utf-8")
    for model_name in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text_part = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_part.strip())
                ghost = parsed.get("ghost_text", "").strip()
                if ghost and not current_text.endswith(" ") and not ghost.startswith(" "):
                    ghost = " " + ghost
                chips = parsed.get("suggestion_chips", [])
                if not isinstance(chips, list) or len(chips) == 0:
                    chips = fallback["suggestion_chips"]
                return {
                    "ghost_text": ghost or fallback["ghost_text"],
                    "suggestion_chips": [str(c).strip() for c in chips[:3]],
                    "source": model_name,
                }
        except Exception as e:
            logger.debug(f"Predictive text call failed for model {model_name}: {e}")
            continue

    return fallback
