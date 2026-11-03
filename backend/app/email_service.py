"""
email_service.py — Resend-powered email delivery for PerformaCOS.
"""
import resend
from .config import settings

resend.api_key = settings.RESEND_API_KEY


def _dispatch_resend(payload: dict) -> bool:
    """
    Sends email via Resend with graceful fallback to onboarding@resend.dev
    if the custom domain is not yet verified.
    """
    if not resend.api_key:
        print("[email_service] Warning: RESEND_API_KEY is not set.")
        return False

    try:
        resend.Emails.send(payload)
        return True
    except Exception as e:
        err_msg = str(e)
        # If unverified domain, fallback to Resend testing sandbox
        if ("domain is not verified" in err_msg or "not verified" in err_msg) and payload.get("from") != "onboarding@resend.dev":
            print(f"[email_service] Unverified domain warning ({payload.get('from')}). Falling back to onboarding@resend.dev...")
            payload["from"] = "onboarding@resend.dev"
            try:
                resend.Emails.send(payload)
                return True
            except Exception as retry_err:
                print(f"[email_service] Sandbox fallback notice: {retry_err}")
                return False

        print(f"[email_service] Delivery notice: {e}")
        return False


def send_otp_email(to: str, otp_code: str, name: str = "") -> bool:
    greeting = f"Hello {name}," if name else "Hello,"
    payload = {
        "from": settings.RESEND_FROM_EMAIL or "onboarding@resend.dev",
        "to": [to],
        "subject": "PerformaCOS — Your OTP Code",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#1e3a5f;">PerformaCOS</h2>
          <p>{greeting}</p>
          <p>Use the following One-Time Password (OTP) to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;text-align:center;padding:24px;background:#f3f4f6;border-radius:8px;margin:24px 0;">{otp_code}</div>
          <p style="color:#6b7280;font-size:12px;">If you did not request this, please ignore this email. Do not share this code with anyone.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:11px;">EVSU Ormoc Campus · PerformaCOS System</p>
        </div>
        """,
    }
    return _dispatch_resend(payload)


def send_invitation_email(to: str, token: str, role: str, invited_by: str = "HR Personnel") -> bool:
    registration_url = f"{settings.APP_FRONTEND_URL}/?token={token}"
    role_label = "COS Employee" if "COS" in role else "Administrator / Department Head"
    payload = {
        "from": settings.RESEND_FROM_EMAIL or "onboarding@resend.dev",
        "to": [to],
        "subject": f"PerformaCOS — Invitation to Register as {role_label}",
        "html": f"""
        <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;color:#1e293b;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="color:#7a1128;margin:0 0 4px;font-size:24px;font-weight:800;">PerformaCOS</h2>
            <p style="color:#64748b;font-size:13px;margin:0;">Eastern Visayas State University</p>
          </div>
          <p style="font-size:15px;line-height:1.6;">Hello,</p>
          <p style="font-size:15px;line-height:1.6;">You have been officially invited by <strong>{invited_by}</strong> to join the PerformaCOS platform as an institutional <strong>{role}</strong>.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="{registration_url}" style="display:inline-block;background-color:#7a1128;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(122,17,40,0.25);">Complete Your Registration</a>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Your Official Invitation Token</div>
            <code style="font-size:16px;font-weight:800;color:#0f172a;letter-spacing:1.5px;">{token}</code>
          </div>
          <p style="font-size:12px;color:#64748b;line-height:1.5;">This registration token is valid for 30 days. If the button above does not work, copy and paste this address into your browser:<br><a href="{registration_url}" style="color:#7a1128;word-break:break-all;">{registration_url}</a></p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
          <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">Eastern Visayas State University · Performance Management System</p>
        </div>
        """,
    }
    return _dispatch_resend(payload)


def send_welcome_email(to: str, name: str, role: str) -> bool:
    payload = {
        "from": settings.RESEND_FROM_EMAIL or "onboarding@resend.dev",
        "to": [to],
        "subject": "Welcome to PerformaCOS",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#1e3a5f;">Welcome to PerformaCOS, {name}!</h2>
          <p>Your account has been successfully created as <strong>{role}</strong>.</p>
          <p>You can now log in to the PerformaCOS system using your institutional email and password.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:11px;">EVSU Ormoc Campus · PerformaCOS System</p>
        </div>
        """,
    }
    return _dispatch_resend(payload)
