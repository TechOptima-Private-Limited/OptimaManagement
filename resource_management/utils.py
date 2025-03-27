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
from .models import Resource, EmailThread

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
            subject =subject
        else:
            base_subject = f"Access Request {ticket_number}"
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

def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
    return send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=html_message)

def generate_approval_token(access_request):
    """Generate a secure token for approval/rejection links"""
    return urlsafe_base64_encode(force_bytes(f"{access_request.id}-{access_request.ticket_number}-{uuid.uuid4().hex}"))

def get_approval_urls(request_id, token, for_resource_owner=False):
    """Generate approval and rejection URLs"""
    base_url = settings.SITE_URL.rstrip('/')
    if for_resource_owner:
        approve_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/approve/"
        reject_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/reject/"
    else:
        approve_url = f"{base_url}/api/approve-request/{request_id}/{token}/approve/"
        reject_url = f"{base_url}/api/approve-request/{request_id}/{token}/reject/"
    print(f"Generated Approve URL: {approve_url}")
    print(f"Generated Reject URL: {reject_url}")
    return approve_url, reject_url

def get_user_role(user):
    if user.is_superuser:
        return 'superuser'
    if Resource.objects.filter(resource_team_email=user.email).exists():
        return 'resource_owner'
    return 'employee'

def send_email_notification(obj, subject, template_name, context, recipients=None, is_reply=True):
    try:
        if recipients is None:
            if obj is None:
                raise ValueError("Recipients must be provided if obj is None")
            recipients = [obj.user.email]
            if obj.resource.resource_team_email:
                recipients.append(obj.resource.resource_team_email)

        html_message = render_to_string(f'resource_management/emails/{template_name}', context)
        plain_message = strip_tags(html_message)
        print("Subject :", subject)
        # Use ticket_number from obj if available, otherwise generate a unique message ID
        ticket_number = f"employee-{context['user'].id}" if obj is None else obj.ticket_number
        
        send_threaded_email(
            subject=subject,
            body=plain_message,
            recipients=recipients,
            ticket_number=ticket_number,
            is_reply=is_reply,
            html_message=html_message
        )

        print(f"Email sent successfully to {', '.join(recipients)}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_request_notification(access_request):
    """Send email notification for new access request"""
    try:
        user_context = {
            'ticket': access_request.ticket_number,
            'user': access_request.user,  # Pass the User object
            'user_name': access_request.user.get_full_name() or access_request.user.username,  # Pass the display name
            'resource': access_request.resource.name,
            'access_level': access_request.access_level.name,
            'priority': access_request.get_priority_display(),
            'justification': access_request.justification,
            'resource_type': access_request.resource.resource_type.name,
            'duration': access_request.duration
        }

        # Notify the requester
        send_email_notification(
            access_request,
            f"Access Request {access_request.ticket_number}",
            'new_request_user.html',
            user_context,
            [access_request.user.email],
            is_reply=False
        )

        # Notify the resource team
        team_context = user_context.copy()
        team_context['requester'] = user_context['user_name']
        send_email_notification(
            access_request,
            f"Access Request {access_request.ticket_number}",
            'new_request_team.html',
            team_context,
            [access_request.resource.resource_team_email],
            is_reply=True
        )
        return True
    except Exception as e:
        print(f"Failed to send request notification: {str(e)}")
        return False

def send_approval_request_notification(obj, notes):
    """Send approval request with proper URLs"""
    try:
        if not obj.approval_token:
            obj.approval_token = uuid.uuid4().hex
            obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
            obj.save()
            print(f"Generated and saved token: {obj.approval_token}")

        approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)

        context = {
            'ticket': obj.ticket_number,
            'requester': obj.user,  # Pass the User object instead of a string
            'resource': obj.resource.name,
            'access_level': obj.access_level.name,
            'justification': obj.justification,
            'notes': notes,
            'approve_url': approve_url,
            'reject_url': reject_url
        }

        print(f"Sending approval email with context: {context}")

        html_message = render_to_string('resource_management/emails/approval_required_approver.html', context)
        
        send_threaded_email(
            subject=f"Access Request {obj.ticket_number}",
            body='',
            recipients=[obj.approver_email],
            ticket_number=obj.ticket_number,
            html_message=html_message,
            is_reply=False
        )
        return True
    except Exception as e:
        print(f"Failed to send approval request email: {str(e)}")
        return False

def send_status_notification(obj, old_status, notes=''):
    base_context = {
        'ticket': obj.ticket_number,
        'user': obj.user,  # Pass the User object
        'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name separately
        'resource': obj.resource.name,
        'access_level': obj.access_level.name,
        'old_status': old_status,
        'new_status': obj.get_status_display(),
        'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
        'notes': notes
    }

    # Notify the requester
    user_context = base_context.copy()
    if obj.status == 'APPROVED':
        template = 'approval_notification.html'
    elif obj.status == 'REJECTED':
        template = 'rejection_notification.html'
    elif obj.status == 'APPROVAL_REQUIRED':
        template = 'approval_request.html'
    else:
        template = 'status_update.html'

    send_email_notification(
        obj,
        f"Access Request {obj.ticket_number}",
        template,
        user_context,
        [obj.user.email],
        is_reply=True
    )

    # Notify the resource team (only skip for APPROVER_APPROVED and APPROVER_REJECTED)
    if obj.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
        team_context = base_context.copy()
        team_context['requester'] = base_context['user_name']
        if obj.status == 'APPROVAL_REQUIRED':
            template = 'approval_required_team.html'
        else:
            template = 'status_update.html'

        send_email_notification(
            obj,
            f"Access Request {obj.ticket_number}",
            template,
            team_context,
            [obj.resource.resource_team_email],
            is_reply=True
        )

    # Notify the assignee for any status change
    if obj.assigned_to:
        assignee_context = base_context.copy()
        assignee_context['assignee'] = obj.assigned_to.get_full_name() or obj.assigned_to.username
        assignee_context['assignee_employee_id'] = obj.assigned_to.username
        template = 'status_update_assignee.html' if obj.status == 'APPROVED' else 'rejection_notification_assignee.html' if obj.status == 'REJECTED' else 'status_update_assignee.html'
        send_email_notification(
            obj,
            f"Access Request {obj.ticket_number} - {obj.get_status_display()}",
            template,
            assignee_context,
            [obj.assigned_to.email],
            is_reply=True
        )

    # Notify the approver if the status is APPROVAL_REQUIRED
    if obj.status == 'APPROVAL_REQUIRED' and obj.approver_email:
        approver_context = base_context.copy()
        approver_context['requester'] = base_context['user_name']
        send_approval_request_notification(obj, notes)