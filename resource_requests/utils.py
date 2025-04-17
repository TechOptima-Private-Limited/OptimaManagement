import uuid
import base64
import datetime
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import DeliveryRequest, ResourceRequest


# Existing functions (unchanged)
def get_or_create_thread_index(ticket_number):
    thread, created = EmailThread.objects.get_or_create(
        ticket_number=ticket_number,
        defaults={'thread_index': base64.b64encode(f"thread-{ticket_number}".encode()).decode()}
    )
    return thread.thread_index

def generate_message_id(ticket_number):
    domain = 'techoptima.ai'
    return f'<access-request-{ticket_number}@{domain}>'

def generate_thread_index(ticket_number):
    thread_id = f"thread-{ticket_number}-{uuid.uuid4().hex[:8]}"
    return base64.b64encode(thread_id.encode()).decode()

def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
    try:
        base_message_id = generate_message_id(ticket_number)
        message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
        thread_index = generate_thread_index(ticket_number)

        if subject.startswith("Welcome to Optima Hub Management"):
            subject = subject
        else:
            base_subject = f"Resource Request {ticket_number}"
            if not subject.startswith(base_subject):
                subject = base_subject if not is_reply else f"Re: {base_subject}"

        headers = {
            'Message-ID': message_id,
            'References': base_message_id,
            'In-Reply-To': base_message_id if is_reply else None,
            'Thread-Index': thread_index,
            'Subject': subject,
        }

        email = EmailMessage(
            subject=subject,
            body=html_message or body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
            headers=headers
        )

        if html_message:
            email.content_subtype = "html"

        email.send()
        print(f"Email sent successfully to {', '.join(recipients)} with Message-ID: {message_id} and Thread-Index: {thread_index}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None, is_reply=False):
    return send_threaded_email(subject, body, recipients, ticket_number, is_reply=False, html_message=html_message)

def generate_approval_token(delivery_request):
    """Generate a secure token for PMO approval/rejection links"""
    return urlsafe_base64_encode(force_bytes(f"{delivery_request.id}-{uuid.uuid4().hex}"))

# In utils.py - Ensure this function is properly generating URLs

def get_approval_urls(delivery_request_id, token):
    """Generate approval and rejection URLs for PMO"""
    # Make sure SITE_URL is defined in settings.py
    base_url = settings.SITE_URL.rstrip('/')
    approve_url = f"{base_url}/api/pmo-approve/{delivery_request_id}/{token}/approve/"
    reject_url = f"{base_url}/api/pmo-approve/{delivery_request_id}/{token}/reject/"
    print(f"Generated Approve URL: {approve_url}")
    print(f"Generated Reject URL: {reject_url}")
    return approve_url, reject_url

def send_pmo_approval_request(delivery_request):
    """Send approval request email to PMO"""
    try:
        if not delivery_request.approval_token:
            delivery_request.approval_token = generate_approval_token(delivery_request)
            delivery_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)
            delivery_request.save(update_fields=['approval_token', 'approval_token_expiry'])

        approve_url, reject_url = get_approval_urls(delivery_request.id, delivery_request.approval_token)

        context = {
            'ticket': delivery_request.id,
            'requester': delivery_request.resource_request.request_owner,
            'account_name': delivery_request.resource_request.account_name,
            'competency_group': delivery_request.competency_group,
            'primary_skill': delivery_request.primary_skill,
            'secondary_skill': delivery_request.secondary_skill,
            'education_qualification': delivery_request.education_qualification,
            'experience_in_years': delivery_request.experience_in_years,
            'certifications': delivery_request.certifications,
            'job_description': delivery_request.job_description_text,
            'number_of_positions': delivery_request.number_of_positions,
            'designation': delivery_request.designation,
            'allocation_start_date': delivery_request.allocation_start_date,
            'allocation_end_date': delivery_request.allocation_end_date,
            'resource_required_date': delivery_request.resource_required_date,
            'location': delivery_request.location,
            'business_type': delivery_request.business_type,
            'opportunity_probability': delivery_request.opportunity_probability,
            'approve_url': approve_url,
            'reject_url': reject_url,
            'approval_token_expiry': delivery_request.approval_token_expiry,
        }

        html_message = render_to_string('resource_requests/emails/approval_required_approver.html', context)
        plain_message = strip_tags(html_message)

        # Send email
        send_threaded_email(
            subject=f"Resource Request {delivery_request.id} Approval Required",
            body=plain_message,
            recipients=['gbvmanikanta13@gmail.com'],  # PMO email address
            ticket_number=str(delivery_request.id),
            html_message=html_message,
            is_reply=False
        )
        return True
    except Exception as e:
        print(f"Failed to send PMO approval email: {str(e)}")
        return False