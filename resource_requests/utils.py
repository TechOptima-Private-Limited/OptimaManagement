import uuid
import datetime
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import DeliveryRequest, ResourceRequest
import logging

logger = logging.getLogger(__name__)

def send_email(subject, body, recipients, html_message=None):
    """Send an email to a list of recipients"""
    try:
        email = EmailMessage(
            subject=subject,
            body=html_message or body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients
        )
        if html_message:
            email.content_subtype = "html"
        email.send()
        logger.info(f"Email sent successfully to {', '.join(recipients)} with subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

def generate_approval_token(delivery_request):
    """Generate a secure token for PMO approval/rejection links"""
    return urlsafe_base64_encode(force_bytes(f"{delivery_request.id}-{uuid.uuid4().hex}"))

def get_approval_urls(delivery_request_id, token):
    """Generate approval and rejection URLs for PMO"""
    base_url = settings.SITE_URL.rstrip('/')
    approve_url = f"{base_url}/api/pmo-approve/{delivery_request_id}/{token}/approve/"
    reject_url = f"{base_url}/api/pmo-approve/{delivery_request_id}/{token}/reject/"
    logger.debug(f"Generated Approve URL: {approve_url}")
    logger.debug(f"Generated Reject URL: {reject_url}")
    return approve_url, reject_url

def send_pmo_approval_request(delivery_request):
    """Send approval request email to PMO"""
    try:
        if not delivery_request.approval_token:
            delivery_request.approval_token = generate_approval_token(delivery_request)
            delivery_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)
            delivery_request.save(update_fields=['approval_token', 'approval_token_expiry'])
            logger.debug(f"Generated approval token for DeliveryRequest {delivery_request.id}")

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
            'bill_rate_sow_usd_hr': delivery_request.bill_rate_sow_usd_hr,
            'buy_rate_guidance_from_usd_hr': delivery_request.buy_rate_guidance_from_usd_hr,
            'buy_rate_guidance_to_usd_hr': delivery_request.buy_rate_guidance_to_usd_hr,
            'delivery_buy_rate_tag_usd_hr': delivery_request.delivery_buy_rate_tag_usd_hr,
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

        send_email(
            subject=f"Resource Request {delivery_request.id} Approval Required",
            body=plain_message,
            recipients=settings.PMO_EMAILS,
            html_message=html_message
        )
        logger.info(f"Sent PMO approval email for DeliveryRequest {delivery_request.id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send PMO approval email: {str(e)}")
        return False