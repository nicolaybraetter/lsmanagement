import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def _send(to: str, subject: str, html: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL] SMTP not configured — skipping email to {to}: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))
        context = ssl.create_default_context()
        port = int(settings.SMTP_PORT)
        if port == 465:
            # Direct SSL connection (e.g. Gmail SMTPS, Strato, IONOS)
            with smtplib.SMTP_SSL(settings.SMTP_HOST, port, context=context) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], to, msg.as_string())
        else:
            # STARTTLS connection (e.g. port 587, 25)
            with smtplib.SMTP(settings.SMTP_HOST, port, timeout=15) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], to, msg.as_string())
        print(f"[EMAIL] Sent '{subject}' to {to}")
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to}: {type(e).__name__}: {e}")


def send_farm_invitation(invitee_email: str, invitee_name: str, inviter_name: str, farm_name: str, role: str, personal_msg: str = ""):
    role_labels = {"owner": "Eigentümer", "manager": "Manager", "worker": "Mitarbeiter", "viewer": "Beobachter"}
    role_de = role_labels.get(role, role)
    personal_block = f'<p style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px;border-radius:6px;margin:16px 0;color:#166534;font-style:italic;">"{personal_msg}"</p>' if personal_msg else ""
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#16a34a,#059669);padding:32px 24px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">&#x1F69C;</div>
        <h1 style="color:#fff;margin:0;font-size:22px;">Hofeinladung</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">LSManagement</p>
      </div>
      <div style="padding:28px 24px;">
        <p style="color:#374151;font-size:16px;">Hallo <strong>{invitee_name}</strong>,</p>
        <p style="color:#6b7280;line-height:1.6;">
          <strong>{inviter_name}</strong> laedt dich ein, dem Hof <strong>{farm_name}</strong>
          als <strong>{role_de}</strong> beizutreten.
        </p>
        {personal_block}
        <p style="color:#6b7280;line-height:1.6;">
          Melde dich in LSManagement an und beantworte die Einladung in deinem Dashboard.
        </p>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin:20px 0;border:1px solid #e5e7eb;">
          <p style="margin:0;color:#374151;font-size:13px;"><strong>Hof:</strong> {farm_name}</p>
          <p style="margin:4px 0 0;color:#374151;font-size:13px;"><strong>Rolle:</strong> {role_de}</p>
          <p style="margin:4px 0 0;color:#374151;font-size:13px;"><strong>Eingeladen von:</strong> {inviter_name}</p>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">Diese E-Mail wurde automatisch von LSManagement gesendet.</p>
      </div>
    </div>
    """
    _send(invitee_email, f"Einladung: {farm_name}", html)


def send_support_notification(operator_email: str, category: str, subject: str, message: str, sender_email: str):
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#16a34a,#059669);padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">&#x1F4EC; Neue Supportbox-Nachricht</h1>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#6b7280;padding:6px 0;width:100px;"><strong>Kategorie</strong></td><td style="color:#111827;">{category}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;"><strong>Betreff</strong></td><td style="color:#111827;">{subject}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;"><strong>Absender</strong></td><td style="color:#111827;">{sender_email}</td></tr>
        </table>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-top:16px;border:1px solid #e5e7eb;">
          <p style="margin:0;color:#374151;white-space:pre-wrap;line-height:1.6;">{message}</p>
        </div>
      </div>
    </div>
    """
    _send(operator_email, f"[Supportbox] {category}: {subject}", html)
