# resource_management/utils.py
from django.core.mail import send_mail
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import re

def generate_message_id(ticket_number):
    domain = 'techoptima.in'
    base_message_id = f'<access-request-{ticket_number}@{domain}>'
    return base_message_id

def get_approval_urls(request_id, token):
    """Generate approval and rejection URLs"""
    base_url = settings.SITE_URL  # Add this to your settings.py
    approve_url = f"{base_url}/api/approve-request/{request_id}/{token}/approve/"
    reject_url = f"{base_url}/api/approve-request/{request_id}/{token}/reject/"
    return approve_url, reject_url


def get_thread_headers(ticket_number, is_reply=False):
    message_id = generate_message_id(ticket_number)
    headers = {
        'Thread-Topic': f'Access Request - {ticket_number}',
    }
    
    if is_reply:
        headers['References'] = message_id
        headers['In-Reply-To'] = message_id
    else:
        headers['Message-ID'] = message_id
        
    return headers

def generate_email_references(ticket_number):
    """Generate a unique message ID for email threading"""
    domain = 'techoptima.in'  # Your email domain
    return f'<access-request-{ticket_number}@{domain}>'

def send_request_notification(access_request):
    """Send email notification for new access request"""
    try:
        subject = f'New Access Request - {access_request.ticket_number}'
        context = {
            'ticket': access_request.ticket_number,
            'user': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name,
            'priority': access_request.get_priority_display(),
            'justification': access_request.justification,
            'resource_type': access_request.resource.resource_type.name,
            'access_level': access_request.access_level.name,
            'duration': access_request.duration
        }
        
        # Get resource team email from the resource itself
        to_email = access_request.resource.resource_team_email
        
        html_message = render_to_string('resource_management/emails/request_notification.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_approval_request(access_request):
    subject = f'Approval Required - {access_request.ticket_number}'
    context = {
        'ticket': access_request.ticket_number,
        'user': access_request.user.get_full_name(),
        'resource': access_request.resource.name,
        'approve_url': f"{settings.SITE_URL}/approve/{access_request.ticket_number}"
    }
    
    html_message = render_to_string('resource_management/emails/approval_request.html', context)
    
    send_mail(
        subject=subject,
        message=strip_tags(html_message),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[access_request.approver_email],
        html_message=html_message
    )


def send_status_update_notification(access_request):
    """Send email notification for status updates"""
    try:
        subject = f'Access Request Status Update - {access_request.ticket_number}'
        context = {
            'ticket': access_request.ticket_number,
            'user': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name,
            'status': access_request.get_status_display(),
            'updated_at': access_request.updated_at
        }
        
        html_message = render_to_string('resource_management/emails/status_update.html', context)
        plain_message = strip_tags(html_message)
        
        # Send to the requester
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[access_request.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send status update email: {str(e)}")
        return False


def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
    try:
        message_id = generate_email_references(ticket_number)
        
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
            headers={
                'Message-ID': message_id,
                'References': message_id,
                'In-Reply-To': message_id,
                'Thread-Topic': f'Access Request - {ticket_number}'
            }
        )

        if html_message:
            email.content_subtype = "html"
            email.body = html_message

        email.send(fail_silently=False)
        print(f"Email sent successfully to {', '.join(recipients)}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None, parent_message_id=None):
    try:
        message_id = generate_message_id(ticket_number)
        
        headers = {
            'Message-ID': f"{message_id}-{settings.EMAIL_THREAD_ID}",
            'Thread-Topic': f'Access Request - {ticket_number}'
        }

        if parent_message_id:
            headers['References'] = parent_message_id
            headers['In-Reply-To'] = parent_message_id

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
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False