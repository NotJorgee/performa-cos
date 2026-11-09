"""
email_service.py — Direct SMTP-powered email delivery for PerformaCOS.
Uses Python's standard smtplib and email.mime for zero-dependency,
unrestricted delivery to any email domain (Gmail, EVSU, Outlook, etc.).
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from .config import settings


def _dispatch_smtp(to: str, subject: str, html: str) -> bool:
    """
    Dispatches an HTML email via SMTP using settings configured in .env.
    Supports TLS (Port 587) and SSL (Port 465) with graceful failure handling.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[email_service] Warning: SMTP not fully configured (HOST={settings.SMTP_HOST}, USER={settings.SMTP_USER}). Skipped dispatch to {to}.")
        return False

    sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    sender_name = settings.SMTP_FROM_NAME or "EVSU PerformaCOS"
    # Auto-strip spaces if user pasted a formatted Google App Password (e.g. "abcd efgh ijkl mnop")
    password = (settings.SMTP_PASSWORD or "").replace(" ", "")

    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((sender_name, sender_email))
    msg["To"] = to
    msg["Subject"] = subject

    html_part = MIMEText(html, "html", "utf-8")
    msg.attach(html_part)

    try:
        if settings.SMTP_USE_SSL or settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                if settings.SMTP_USER and password:
                    server.login(settings.SMTP_USER, password)
                server.sendmail(sender_email, [to], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                if settings.SMTP_USE_TLS or settings.SMTP_PORT == 587:
                    server.starttls()
                if settings.SMTP_USER and password:
                    server.login(settings.SMTP_USER, password)
                server.sendmail(sender_email, [to], msg.as_string())

        print(f"[email_service] Successfully dispatched '{subject}' to {to} via SMTP ({settings.SMTP_HOST}).")
        return True
    except Exception as exc:
        print(f"[email_service] SMTP delivery failed to {to}: {exc}")
        return False


def send_otp_email(to: str, otp_code: str, name: str = "") -> bool:
    """Sends a 6-digit password reset OTP code with role-appropriate salutation."""
    salutation = f"Dear <strong>{name}</strong>," if name else "Dear User,"
    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <p style="font-size:14px;line-height:1.6;margin-bottom:12px;">{salutation}</p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">Use the following One-Time Password (OTP) to securely reset your PerformaCOS account credentials. This code expires in <strong>10 minutes</strong>.</p>
      <div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:24px 0;color:#0f172a;font-family:monospace;">
        {otp_code}
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">If you did not initiate this password reset request, you can safely disregard this email. Your account credentials will remain unchanged.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · PerformaCOS Performance Evaluation System</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject="PerformaCOS — Your One-Time Password (OTP)", html=html)


def send_invitation_email(to: str, token: str, role: str, invited_by: str = "HR Personnel") -> bool:
    """Sends an official institutional onboarding invitation with tokenized registration link and role-specific salutation."""
    registration_url = f"{settings.APP_FRONTEND_URL}/?token={token}"
    role_label = "COS Employee" if "COS" in role else "Administrator / Department Head"
    if "Department Head" in role or "Dept" in role:
        salutation = "Dear Department Head,"
    elif "HR" in role:
        salutation = "Dear HR Personnel,"
    elif "COS" in role:
        salutation = "Dear COS Personnel,"
    else:
        salutation = "Dear Colleague,"

    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:24px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <p style="font-size:14px;line-height:1.6;margin-bottom:12px;">{salutation}</p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        You have been officially invited by <strong>{invited_by}</strong> to join the PerformaCOS portal as an authorized <strong>{role}</strong>.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{registration_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(122,17,40,0.25);">Complete Your Registration</a>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Official Invitation Token</div>
        <code style="font-size:16px;font-weight:800;color:#0f172a;letter-spacing:1.5px;font-family:monospace;">{token}</code>
      </div>
      <p style="font-size:12px;color:#64748b;line-height:1.5;">This registration token is valid for 30 days. If the button above does not open directly, copy and paste this address into your browser:<br><a href="{registration_url}" style="color:#7a1128;word-break:break-all;">{registration_url}</a></p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">Eastern Visayas State University · Performance Management System</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject=f"PerformaCOS — Invitation to Register as {role_label}", html=html)


def send_welcome_email(to: str, name: str, role: str) -> bool:
    """Sends an official account onboarding confirmation upon registration completion."""
    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <h3 style="color:#0f172a;margin:0 0 12px;font-size:16px;font-weight:700;">Account Onboarding Finalized</h3>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Dear <strong>{name}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Your institutional account has been successfully verified and registered as <strong>{role}</strong>.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        You can now sign in to the PerformaCOS portal using your institutional credentials to access your dashboard, monitor performance records, and participate in evaluation workflows.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="{settings.APP_FRONTEND_URL}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;">Go to Login Portal</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · PerformaCOS System</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject="Welcome to PerformaCOS", html=html)


def send_renewal_intent_submitted_email(to: str, emp_name: str, dept_name: str, period: str, dept_head_name: str = "") -> bool:
    """Dispatches notice to Department Head when a subordinate files renewal intent."""
    portal_url = f"{settings.APP_FRONTEND_URL}/"
    salutation = f"Dear <strong>{dept_head_name}</strong>," if dept_head_name else "Dear Department Head,"
    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <h3 style="color:#0f172a;margin:0 0 12px;font-size:16px;font-weight:700;">Subordinate Renewal Intent Filed</h3>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        {salutation}
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        COS Personnel <strong>{emp_name}</strong> from <strong>{dept_name}</strong> has submitted their formal Contract Renewal Intent for the period of <strong>{period}</strong>.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Their accumulated Daily Accomplishment Reports (DAR) and Monthly Accomplishment Report (MAR) are now ready for supervisory review and endorsement.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="{portal_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:14px;">Review Intent in Portal</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · PerformaCOS System</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject=f"PerformaCOS — Subordinate Renewal Intent: {emp_name}", html=html)


def send_endorsement_decision_email(to: str, emp_name: str, dept_name: str, status: str, notes_or_grounds: str, dept_head_name: str, hr_name: str = "") -> bool:
    """Dispatches supervisory endorsement notice to HR Personnel."""
    portal_url = f"{settings.APP_FRONTEND_URL}/"
    is_recommended = "Recommend" in status and "Not" not in status
    status_color = "#15803d" if is_recommended else "#b91c1c"
    status_bg = "#f0fdf4" if is_recommended else "#fef2f2"
    status_border = "#bbf7d0" if is_recommended else "#fecaca"
    status_label = "RECOMMENDED FOR RENEWAL" if is_recommended else "NOT RECOMMENDED FOR RENEWAL"
    salutation = f"Dear <strong>{hr_name}</strong>," if hr_name else "Dear HR Personnel,"

    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <h3 style="color:#0f172a;margin:0 0 12px;font-size:16px;font-weight:700;">Supervisory Renewal Endorsement Filed</h3>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        {salutation}
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Department Head <strong>{dept_head_name}</strong> has submitted a formal renewal endorsement review for <strong>{emp_name}</strong> ({dept_name}).
      </p>
      <div style="background:{status_bg};border:1px solid {status_border};border-radius:8px;padding:14px;text-align:center;margin:18px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Supervisor Recommendation</div>
        <b style="font-size:14px;color:{status_color};">{status_label}</b>
      </div>
      {f'<p style="font-size:13px;line-height:1.5;color:#475569;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;"><strong>Notes / Grounds:</strong> {notes_or_grounds}</p>' if notes_or_grounds else ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="{portal_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:14px;">Open HR Evaluation Portal</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · PerformaCOS System</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject=f"PerformaCOS — Renewal Endorsement: {emp_name} ({status})", html=html)


def send_contract_resolution_email(to: str, emp_name: str, decision: str, remarks: str, period: str) -> bool:
    """Dispatches final contract resolution decision from HR to the COS Employee."""
    portal_url = f"{settings.APP_FRONTEND_URL}/"
    is_approved = "Yes" in decision or "Renew" in decision or "Approve" in decision
    decision_color = "#15803d" if is_approved else "#b91c1c"
    decision_bg = "#f0fdf4" if is_approved else "#fef2f2"
    decision_border = "#bbf7d0" if is_approved else "#fecaca"
    decision_title = "CONTRACT RENEWED" if is_approved else "NON-RENEWAL FINALIZED"

    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <h3 style="color:#0f172a;margin:0 0 12px;font-size:16px;font-weight:700;">Official Contract Disposition Notice</h3>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Dear <strong>{emp_name}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        The Human Resource Management Office (HRMO) has officially finalized the institutional disposition for your Contract of Service covering the term <strong>{period}</strong>.
      </p>
      <div style="background:{decision_bg};border:1px solid {decision_border};border-radius:8px;padding:14px;text-align:center;margin:18px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Final Determination</div>
        <b style="font-size:15px;color:{decision_color};">{decision_title}</b>
      </div>
      {f'<p style="font-size:13px;line-height:1.5;color:#475569;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;"><strong>Official Remarks:</strong> {remarks}</p>' if remarks else ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="{portal_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:14px;">Sign in to PerformaCOS</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · Human Resource Management Office</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject=f"PerformaCOS Notice — Official Contract Disposition: {decision_title}", html=html)


def send_dept_head_contract_resolution_email(to: str, dept_head_name: str, emp_name: str, dept_name: str, decision: str, remarks: str, period: str) -> bool:
    """Dispatches contract resolution notice from HR to the Department Head."""
    portal_url = f"{settings.APP_FRONTEND_URL}/"
    is_approved = "Yes" in decision or "Renew" in decision or "Approve" in decision
    decision_color = "#15803d" if is_approved else "#b91c1c"
    decision_bg = "#f0fdf4" if is_approved else "#fef2f2"
    decision_border = "#bbf7d0" if is_approved else "#fecaca"
    decision_title = "CONTRACT RENEWED" if is_approved else "NON-RENEWAL FINALIZED"
    salutation = f"Dear <strong>{dept_head_name}</strong>," if dept_head_name else "Dear Department Head,"

    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <h3 style="color:#0f172a;margin:0 0 12px;font-size:16px;font-weight:700;">Departmental Contract Disposition Notice</h3>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        {salutation}
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        The Human Resource Management Office (HRMO) has officially finalized the institutional contract disposition for departmental personnel <strong>{emp_name}</strong> ({dept_name}) covering the term <strong>{period}</strong>.
      </p>
      <div style="background:{decision_bg};border:1px solid {decision_border};border-radius:8px;padding:14px;text-align:center;margin:18px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Final Determination</div>
        <b style="font-size:15px;color:{decision_color};">{decision_title}</b>
      </div>
      {f'<p style="font-size:13px;line-height:1.5;color:#475569;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;"><strong>Official Remarks:</strong> {remarks}</p>' if remarks else ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="{portal_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:14px;">View Department Records</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · Human Resource Management Office</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject=f"PerformaCOS Notice — Contract Disposition Finalized: {emp_name} ({decision_title})", html=html)


def send_contract_window_alert_email(to: str, emp_name: str, days_left: int, end_date: str) -> bool:
    """Dispatches proactive contract expiration and renewal intent window reminder to employee."""
    portal_url = f"{settings.APP_FRONTEND_URL}/"
    urgency_subject = "Action Required" if days_left <= 14 else "Notice"
    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#7a1128;margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">PerformaCOS</h2>
        <p style="color:#64748b;font-size:12px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Eastern Visayas State University</p>
      </div>
      <h3 style="color:#0f172a;margin:0 0 12px;font-size:16px;font-weight:700;">Contract Renewal Window Open</h3>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Dear <strong>{emp_name}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        Your current Contract of Service term is concluding on <strong>{end_date}</strong> (<strong>{days_left} days remaining</strong>).
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;">
        In accordance with institutional guidelines, please log in to the PerformaCOS portal to formally confirm or decline your contract renewal intent for the upcoming term.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="{portal_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:14px;">Submit Renewal Declaration</a>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">EVSU Ormoc Campus · PerformaCOS System</p>
    </div>
    """
    return _dispatch_smtp(to=to, subject=f"PerformaCOS {urgency_subject} — Contract Renewal Window Open ({days_left} Days Remaining)", html=html)
