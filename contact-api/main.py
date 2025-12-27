"""
Contact Form API for itsjesse.dev
Routes inquiries to hire@ (full-time) or projects@ (freelance)
"""

import os
import re
import time
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

import aiosmtplib
from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="itsjesse.dev Contact API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://itsjesse.dev",
        "https://www.itsjesse.dev",
        "http://localhost:3000",  # Local dev
    ],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================================
# SPAM PROTECTION
# ============================================================================

# Rate limiting: track submissions per IP
rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 3  # Max submissions per window
RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds

# Time-based check: form must be open for at least this many seconds
MIN_FORM_TIME = 3

# Blocked patterns in message content
SPAM_PATTERNS = [
    r'(?i)\bcrypto\b.*\binvest',
    r'(?i)\bbitcoin\b.*\bprofit',
    r'(?i)\bmake\s+\$?\d+.*\bday\b',
    r'(?i)\bviagra\b',
    r'(?i)\bcasino\b',
    r'(?i)\bSEO\s+service',
    r'(?i)\bbuy\s+followers',
    r'(?i)\bbacklink',
    r'(?i)click\s+here.*\bhttp',
]


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(ip: str) -> bool:
    """Check if IP has exceeded rate limit. Returns True if allowed."""
    now = time.time()
    # Clean old entries
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]

    if len(rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        return False

    rate_limit_store[ip].append(now)
    return True


def check_honeypot(honeypot_value: str) -> bool:
    """Returns True if honeypot is empty (not a bot)."""
    return not honeypot_value or honeypot_value.strip() == ""


def check_form_time(form_loaded_at: int) -> bool:
    """Check if form was open long enough. Returns True if valid."""
    now = int(time.time())
    return (now - form_loaded_at) >= MIN_FORM_TIME


def check_spam_content(text: str) -> bool:
    """Check for spam patterns. Returns True if clean."""
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text):
            return False
    return True


def validate_email_domain(email: str) -> bool:
    """Basic check for suspicious email domains."""
    suspicious_domains = [
        'tempmail', 'throwaway', 'guerrilla', 'mailinator',
        'fakeinbox', '10minute', 'temp-mail', 'disposable'
    ]
    domain = email.split('@')[-1].lower()
    return not any(s in domain for s in suspicious_domains)


# ============================================================================
# EMAIL SENDING
# ============================================================================

async def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    reply_to: str,
    attachments: list[tuple[str, bytes]] = None
):
    """Send email via Google Workspace SMTP."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("FROM_EMAIL", "noreply@itsjesse.dev")

    if not smtp_user or not smtp_pass:
        raise HTTPException(status_code=500, detail="Email configuration error")

    msg = MIMEMultipart()
    msg["From"] = f"itsjesse.dev Contact <{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Reply-To"] = reply_to

    msg.attach(MIMEText(body_html, "html"))

    # Handle attachments
    if attachments:
        for filename, content in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={filename}")
            msg.attach(part)

    await aiosmtplib.send(
        msg,
        hostname=smtp_host,
        port=smtp_port,
        username=smtp_user,
        password=smtp_pass,
        start_tls=True,
    )


# ============================================================================
# CONTACT ENDPOINT
# ============================================================================

# Allowed file types and max size
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILES = 3


@app.post("/contact")
async def submit_contact(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    inquiry_type: str = Form(...),  # "fulltime" or "project"
    company: Optional[str] = Form(None),
    message: str = Form(...),
    form_loaded_at: int = Form(...),  # Timestamp when form was loaded
    website: str = Form(""),  # Honeypot field
    attachments: list[UploadFile] = File(default=[]),
):
    """
    Process contact form submission with spam protection.
    Routes to hire@ for full-time, projects@ for freelance.
    """
    client_ip = get_client_ip(request)

    # ---- SPAM CHECKS ----

    # 1. Honeypot check
    if not check_honeypot(website):
        # Silently reject - don't tell bots they failed
        return {"success": True, "message": "Thank you for your message!"}

    # 2. Rate limit check
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many submissions. Please try again later."
        )

    # 3. Form timing check
    if not check_form_time(form_loaded_at):
        # Submitted too fast - likely a bot
        return {"success": True, "message": "Thank you for your message!"}

    # 4. Spam content check
    full_text = f"{name} {company or ''} {message}"
    if not check_spam_content(full_text):
        return {"success": True, "message": "Thank you for your message!"}

    # 5. Disposable email check
    if not validate_email_domain(email):
        raise HTTPException(
            status_code=400,
            detail="Please use a valid business or personal email address."
        )

    # ---- VALIDATION ----

    # Validate inquiry type
    if inquiry_type not in ("fulltime", "project"):
        raise HTTPException(status_code=400, detail="Invalid inquiry type")

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Validate message length
    if len(message.strip()) < 20:
        raise HTTPException(status_code=400, detail="Please provide more details in your message")

    if len(message) > 10000:
        raise HTTPException(status_code=400, detail="Message too long")

    # ---- PROCESS ATTACHMENTS ----

    if len(attachments) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES} attachments allowed")

    processed_attachments = []
    for file in attachments:
        if file.filename:
            # Check extension
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
                )

            # Read and check size
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large (max 10MB)")

            processed_attachments.append((file.filename, content))

    # ---- ROUTE EMAIL ----

    if inquiry_type == "fulltime":
        to_email = "hire@itsjesse.dev"
        subject_prefix = "[Full-Time Opportunity]"
        inquiry_label = "Full-Time Employment"
    else:
        to_email = "projects@itsjesse.dev"
        subject_prefix = "[Project Inquiry]"
        inquiry_label = "Freelance Project"

    subject = f"{subject_prefix} New inquiry from {name}"

    # Build HTML email
    company_line = f"<p><strong>Company:</strong> {company}</p>" if company else ""
    attachments_line = f"<p><strong>Attachments:</strong> {len(processed_attachments)} file(s)</p>" if processed_attachments else ""

    body_html = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1a1a1a; margin-top: 0;">New {inquiry_label} Inquiry</h2>

            <p><strong>From:</strong> {name}</p>
            <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
            {company_line}
            <p><strong>Type:</strong> {inquiry_label}</p>
            {attachments_line}

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

            <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
            <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap;">{message}</div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

            <p style="font-size: 12px; color: #6b7280;">
                Submitted from itsjesse.dev contact form<br>
                IP: {client_ip}<br>
                Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
            </p>
        </div>
    </body>
    </html>
    """

    try:
        await send_email(
            to_email=to_email,
            subject=subject,
            body_html=body_html,
            reply_to=email,
            attachments=processed_attachments if processed_attachments else None
        )
    except Exception as e:
        print(f"Email send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again.")

    return {
        "success": True,
        "message": "Thank you for reaching out! I'll get back to you soon."
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
