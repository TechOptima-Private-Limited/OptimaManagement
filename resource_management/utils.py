# import uuid
# import base64
# import datetime
# from django.core.mail import EmailMessage
# from django.conf import settings
# from django.template.loader import render_to_string
# from django.utils.html import strip_tags
# from django.utils import timezone
# from django.utils.http import urlsafe_base64_encode
# from django.utils.encoding import force_bytes
# from .models import Resource, EmailThread


# def get_or_create_thread_index(ticket_number):
#     thread, created = EmailThread.objects.get_or_create(
#         ticket_number=ticket_number,
#         defaults={'thread_index': base64.b64encode(f"thread-{ticket_number}".encode()).decode()}
#     )
#     return thread.thread_index

# def generate_message_id(ticket_number):
#     domain = 'techoptima.ai'
#     return f'<access-request-{ticket_number}@{domain}>'

# def generate_thread_index(ticket_number):
#     thread_id = f"thread-{ticket_number}-{uuid.uuid4().hex[:8]}"
#     return base64.b64encode(thread_id.encode()).decode()

# def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
#     try:
#         base_message_id = generate_message_id(ticket_number)
#         message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
#         thread_index = generate_thread_index(ticket_number)

#         if subject.startswith("Welcome to Optima Hub Management"):
#             subject = subject
#         else:
#             base_subject = f"Access Request {ticket_number}"
#             if not subject.startswith(base_subject):
#                 subject = base_subject if not is_reply else f"Re: {base_subject}"

#         headers = {
#             'Message-ID': message_id,
#             'References': base_message_id,
#             'In-Reply-To': base_message_id if is_reply else None,
#             'Thread-Index': thread_index,
#             'Subject': subject,
#         }

#         email = EmailMessage(
#             subject=subject,
#             body=html_message or body,
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             to=recipients,
#             headers=headers
#         )

#         if html_message:
#             email.content_subtype = "html"

#         email.send()
#         print(f"Email sent successfully to {', '.join(recipients)} with Message-ID: {message_id} and Thread-Index: {thread_index}")
#         return True
#     except Exception as e:
#         print(f"Failed to send email: {str(e)}")
#         return False

# def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
#     return send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=html_message)

# def generate_approval_token(access_request):
#     """Generate a secure token for approval/rejection links"""
#     return urlsafe_base64_encode(force_bytes(f"{access_request.id}-{access_request.ticket_number}-{uuid.uuid4().hex}"))

# def get_approval_urls(request_id, token, for_resource_owner=False):
#     """Generate approval and rejection URLs"""
#     base_url = settings.SITE_URL.rstrip('/')
#     if for_resource_owner:
#         approve_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/approve/"
#         reject_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/reject/"
#     else:
#         approve_url = f"{base_url}/api/approve-request/{request_id}/{token}/approve/"
#         reject_url = f"{base_url}/api/approve-request/{request_id}/{token}/reject/"
#     print(f"Generated Approve URL: {approve_url}")
#     print(f"Generated Reject URL: {reject_url}")
#     return approve_url, reject_url

# def get_user_role(user):
#     if user.is_superuser:
#         return 'superuser'
#     if Resource.objects.filter(resource_team_email=user.email).exists():
#         return 'resource_owner'
#     return 'employee'

# def send_email_notification(obj, subject, template_name, context, recipients=None, is_reply=True):
#     try:
#         if recipients is None:
#             if obj is None:
#                 raise ValueError("Recipients must be provided if obj is None")
#             recipients = [obj.user.email]
#             if obj.resource.resource_team_email:
#                 recipients.append(obj.resource.resource_team_email)

#         html_message = render_to_string(f'resource_management/emails/{template_name}', context)
#         plain_message = strip_tags(html_message)
#         print("Subject :", subject)
#         # Use ticket_number from obj if available, otherwise generate a unique message ID
#         ticket_number = f"employee-{context['user'].id}" if obj is None else obj.ticket_number
        
#         send_threaded_email(
#             subject=subject,
#             body=plain_message,
#             recipients=recipients,
#             ticket_number=ticket_number,
#             is_reply=is_reply,
#             html_message=html_message
#         )

#         print(f"Email sent successfully to {', '.join(recipients)}")
#         return True
#     except Exception as e:
#         print(f"Failed to send email: {str(e)}")
#         return False

# def send_request_notification(access_request):
#     """Send email notification for new access request"""
#     print("Sending email notification...") 
#     try:
#         if access_request.request_type == 'IT':
#             # IT support-specific context
#             it_support_context = {
#                 'ticket': access_request.ticket_number,
#                 'user': access_request.user,
#                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
#                 'priority': access_request.get_priority_display(),
#                 'justification': access_request.justification,
#             }
#             print(f"Sending IT support email with context: {it_support_context}")
#             send_email_notification(
#                 access_request,
#                 f"New IT Support Ticket - ID {access_request.ticket_number}",
#                 'it_support_user.html',
#                 it_support_context,
#                 [access_request.user.email],
#                 is_reply=False
#             )
#             print("Successfully sent IT support email")
#         else:
#             user_context = {
#                 'ticket': access_request.ticket_number,
#                 'user': access_request.user,
#                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
#                 'resource': getattr(access_request.resource, 'name', 'N/A') if access_request.resource else "N/A",
#                 'access_level': getattr(access_request.access_level, 'name', 'N/A') if access_request.access_level else "N/A",
#                 'priority': access_request.get_priority_display(),
#                 'justification': access_request.justification,
#                 'resource_type': getattr(access_request.resource.resource_type, 'name', 'N/A') if access_request.resource and access_request.resource.resource_type else "N/A",
#                 'duration': access_request.duration,
#                 'approval_token_expiry': access_request.approval_token_expiry,
#             }
#             print(f"Sending user email with context: {user_context}")
#             send_email_notification(
#                 access_request,
#                 f"Access Request {access_request.ticket_number}",
#                 'new_request_user.html',
#                 user_context,
#                 [access_request.user.email],
#                 is_reply=False
#             )
#             print("Successfully sent email to user")

#     except Exception as e:
#         print(f"Failed to send user notification: {str(e)}")

#     try:
#         if access_request.request_type == 'IT':
#             team_context = it_support_context.copy()
#             team_context['requester'] = team_context['user_name']
#             send_email_notification(
#                 access_request,
#                 f"Access Request {access_request.ticket_number}",
#                 'it_support_team.html',
#                 team_context,
#                 [getattr(access_request.resource, 'resource_team_email', 'default@example.com')],
#                 is_reply=True
#             )
#         else:
#             team_context = user_context.copy()
#             team_context['requester'] = user_context['user_name']
#             send_email_notification(
#                 access_request,
#                 f"Access Request {access_request.ticket_number}",
#                 'new_request_team.html',
#                 team_context,
#                 [getattr(access_request.resource, 'resource_team_email', 'default@example.com')],
#                 is_reply=True
#             )
#         return True
#     except Exception as e:
#         print(f"Failed to send team notification: {str(e)}")
#         return False


# def send_approval_request_notification(obj, notes):
#     """Send approval request with proper URLs"""
#     try:
#         if not obj.approval_token:
#             obj.approval_token = uuid.uuid4().hex
#             obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
#             obj.save()
#             print(f"Generated and saved token: {obj.approval_token}")

#         approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)

#         context = {
#             'ticket': obj.ticket_number,
#             'requester': obj.user,  # Pass the User object instead of a string
#             'resource': obj.resource.name,
#             'access_level': obj.access_level.name,
#             'justification': obj.justification,
#             'notes': notes,
#             'approve_url': approve_url,
#             'reject_url': reject_url,
#             'approval_token_expiry': obj.approval_token_expiry,  # Add expiry date to context
#         }

#         print(f"Sending approval email with context: {context}")

#         html_message = render_to_string('resource_management/emails/approval_required_approver.html', context)
        
#         send_threaded_email(
#             subject=f"Access Request {obj.ticket_number}",
#             body='',
#             recipients=[obj.approver_email],
#             ticket_number=obj.ticket_number,
#             html_message=html_message,
#             is_reply=False
#         )
#         return True
#     except Exception as e:
#         print(f"Failed to send approval request email: {str(e)}")
#         return False

# def send_status_notification(obj, old_status, notes=''):
#     base_context = {
#         'ticket': obj.ticket_number,
#         'user': obj.user,  # Pass the User object
#         'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name separately
#         'resource': obj.resource.name,
#         'access_level': obj.access_level.name,
#         'old_status': old_status,
#         'new_status': obj.get_status_display(),
#         'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
#         'notes': notes
#     }

#     # Notify the requester
#     user_context = base_context.copy()
#     if obj.status == 'APPROVED':
#         template = 'approval_notification.html'
#     elif obj.status == 'REJECTED':
#         template = 'rejection_notification.html'
#     elif obj.status == 'APPROVAL_REQUIRED':
#         template = 'approval_request.html'
#     else:
#         template = 'status_update.html'

#     send_email_notification(
#         obj,
#         f"Access Request {obj.ticket_number}",
#         template,
#         user_context,
#         [obj.user.email],
#         is_reply=True
#     )

#     # Notify the resource team (only skip for APPROVER_APPROVED and APPROVER_REJECTED)
#     if obj.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
#         team_context = base_context.copy()
#         team_context['requester'] = base_context['user_name']
#         if obj.status == 'APPROVAL_REQUIRED':
#             template = 'approval_required_team.html'
#         else:
#             template = 'status_update.html'

#         send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number}",
#             template,
#             team_context,
#             [obj.resource.resource_team_email],
#             is_reply=True
#         )

#     # Notify the assignee for any status change
#     if obj.assigned_to:
#         assignee_context = base_context.copy()
#         assignee_context['assignee'] = obj.assigned_to.get_full_name() or obj.assigned_to.username
#         assignee_context['assignee_employee_id'] = obj.assigned_to.username
#         template = 'status_update_assignee.html' if obj.status == 'APPROVED' else 'rejection_notification_assignee.html' if obj.status == 'REJECTED' else 'status_update_assignee.html'
#         send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number} - {obj.get_status_display()}",
#             template,
#             assignee_context,
#             [obj.assigned_to.email],
#             is_reply=True
#         )

#     # Notify the approver if the status is APPROVAL_REQUIRED
#     if obj.status == 'APPROVAL_REQUIRED' and obj.approver_email:
#         approver_context = base_context.copy()
#         approver_context['requester'] = base_context['user_name']
#         send_approval_request_notification(obj, notes)

# def send_final_approval_notification(obj):
#     """Send a final approval notification to the employee when the request is approved"""
#     try:
#         context = {
#             'ticket': obj.ticket_number,
#             'user': obj.user,  # Pass the User object
#             'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name
#             'resource': obj.resource.name,
#             'access_level': obj.access_level.name,
#             'status': obj.get_status_display(),
#             'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
#         }

#         send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number} - Final Approval",
#             'final_approval_notification.html',
#             context,
#             [obj.user.email],
#             is_reply=True
#         )
#         return True
#     except Exception as e:
#         print(f"Failed to send final approval notification: {str(e)}")
#         return False



import uuid
import base64
import datetime
import os
import re
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Resource, EmailThread


def extract_images_from_html(html_content):
    """
    Extract all image sources from HTML content
    Returns list of image paths found in the HTML
    """
    if not html_content:
        return []
    
    # Find all img tags with src attributes
    img_pattern = r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>'
    matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
    image_paths = []
    for src in matches:
        # Handle both relative and absolute URLs
        if src.startswith('/media/'):
            # Remove leading slash and media/ for default_storage
            clean_path = src.replace('/media/', '')
            image_paths.append(clean_path)
        elif src.startswith(settings.MEDIA_URL):
            # Handle full media URLs
            clean_path = src.replace(settings.MEDIA_URL, '')
            image_paths.append(clean_path)
    
    return image_paths


def process_html_for_email(html_content, ticket_number):
    """
    Process HTML content to handle images for email
    Returns updated HTML and list of image attachments
    """
    if not html_content:
        return html_content, []
    
    image_paths = extract_images_from_html(html_content)
    image_attachments = []
    
    for image_path in image_paths:
        try:
            if default_storage.exists(image_path):
                # Read the image file
                with default_storage.open(image_path, 'rb') as image_file:
                    image_data = image_file.read()
                
                # Get filename and extension
                filename = os.path.basename(image_path)
                file_ext = filename.split('.')[-1].lower()
                
                # Create attachment info
                image_attachments.append({
                    'filename': filename,
                    'data': image_data,
                    'content_type': f'image/{file_ext}',
                    'path': image_path
                })
                
                print(f"Found image for email: {image_path}")
            else:
                print(f"Image not found in storage: {image_path}")
        except Exception as e:
            print(f"Error processing image {image_path}: {str(e)}")
    
    return html_content, image_attachments


def process_base64_images(html_content, ticket_number):
    """
    Process base64 embedded images and save them to storage
    Returns updated HTML with saved image URLs
    """
    if not html_content:
        return html_content, []
    
    # Find all base64 images
    img_pattern = r'<img[^>]*src="data:image/([^;]+);base64,([^"]+)"[^>]*>'
    saved_images = []
    
    def replace_image(match):
        img_format = match.group(1)  # jpeg, png, etc.
        img_data = match.group(2)    # base64 data
        
        try:
            # Decode base64
            image_data = base64.b64decode(img_data)
            
            # Generate unique filename
            filename = f"email_images/{ticket_number}/{uuid.uuid4().hex}.{img_format}"
            
            # Save to storage
            path = default_storage.save(filename, ContentFile(image_data))
            
            # Generate URL for email
            if settings.DEBUG:
                image_url = f"http://127.0.0.1:8000{settings.MEDIA_URL}{path}"
            else:
                image_url = default_storage.url(path)
            
            saved_images.append({
                'filename': os.path.basename(filename),
                'data': image_data,
                'content_type': f'image/{img_format}',
                'path': path
            })
            
            # Replace with new img tag
            return f'<img src="{image_url}" style="max-width: 100%; height: auto;">'
            
        except Exception as e:
            print(f"Error processing base64 image: {str(e)}")
            return match.group(0)  # Return original if error
    
    # Replace all base64 images
    updated_html = re.sub(img_pattern, replace_image, html_content)
    
    return updated_html, saved_images


def send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
    """
    Enhanced email sending function that handles images from media folder
    """
    try:
        base_message_id = generate_message_id(ticket_number)
        message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
        thread_index = generate_thread_index(ticket_number)

        if subject.startswith("Welcome to Optima Hub Management"):
            subject = subject
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

        all_attachments = []
        processed_html = html_message

        if html_message:
            # First, process any base64 images
            processed_html, base64_images = process_base64_images(html_message, ticket_number)
            all_attachments.extend(base64_images)
            
            # Then, find and attach existing images from media folder
            final_html, media_images = process_html_for_email(processed_html, ticket_number)
            all_attachments.extend(media_images)
            
            processed_html = final_html

        # Create email with attachments
        if processed_html and all_attachments:
            # Use EmailMultiAlternatives for HTML with attachments
            email = EmailMultiAlternatives(
                subject=subject,
                body=strip_tags(processed_html) if processed_html else body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
                headers=headers
            )
            
            # Attach HTML version
            email.attach_alternative(processed_html, "text/html")
            
            # Attach all images
            for attachment in all_attachments:
                email.attach(
                    attachment['filename'],
                    attachment['data'],
                    attachment['content_type']
                )
                print(f"Attached image: {attachment['filename']}")
                
        elif processed_html:
            # HTML email without attachments
            email = EmailMultiAlternatives(
                subject=subject,
                body=strip_tags(processed_html),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
                headers=headers
            )
            email.attach_alternative(processed_html, "text/html")
        else:
            # Plain text email
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
                headers=headers
            )

        email.send()
        print(f"Email sent successfully to {', '.join(recipients)} with {len(all_attachments)} image attachments")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# Keep your existing utility functions
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

# Replace your existing send_threaded_email function with this enhanced version
def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
    """
    Updated to use the enhanced image-aware email function
    """
    return send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply, html_message)

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
            print(f"🔍 DEBUG: obj.resource = {obj.resource}")
            print(f"🔍 DEBUG: obj.resource.name = {obj.resource.name if obj.resource else 'No Resource'}")
            
            if obj.resource.resource_team_email:
                print(f"🔍 DEBUG: Found resource_team_email = {obj.resource.resource_team_email}")
                recipients.append(obj.resource.resource_team_email)
                print(f"🔍 DEBUG: Added to recipients. Final recipients = {recipients}")
            else:
                print(f"🔍 DEBUG: No resource_team_email found for resource {obj.resource.name if obj.resource else 'None'}")

            # if obj.resource.resource_team_email:
            #     recipients.append(obj.resource.resource_team_email)

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

# Keep all your other existing functions (send_request_notification, etc.)
def send_request_notification(access_request):
    """Send email notification for new access request"""
    print("Sending email notification...") 
    """Send email notification for new access request"""
    print("Sending email notification...") 
    
    # 🔍 ADD THIS DEBUG BLOCK
    print(f"🔍 DEBUG: access_request.resource = {access_request.resource}")
    if access_request.resource:
        print(f"🔍 DEBUG: resource.name = {access_request.resource.name}")
        print(f"🔍 DEBUG: resource.resource_team_email = {access_request.resource.resource_team_email}")
    else:
        print(f"🔍 DEBUG: No resource found for this request")

    try:
        if access_request.request_type == 'IT':
            # IT support-specific context
            it_support_context = {
                'ticket': access_request.ticket_number,
                'user': access_request.user,
                'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
                'priority': access_request.get_priority_display(),
                'justification': access_request.justification,
            }
            team_email = getattr(access_request.resource, 'resource_team_email', 'default@example.com')
            print(f"🔍 DEBUG: Sending IT team email to: {team_email}")
            send_email_notification(
                access_request,
                f"New IT Support Ticket - ID {access_request.ticket_number}",
                'it_support_user.html',
                it_support_context,
                [access_request.user.email],
                is_reply=False
            )
            print("Successfully sent IT support email")
        else:
            user_context = {
                'ticket': access_request.ticket_number,
                'user': access_request.user,
                'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
                'resource': getattr(access_request.resource, 'name', 'N/A') if access_request.resource else "N/A",
                'access_level': getattr(access_request.access_level, 'name', 'N/A') if access_request.access_level else "N/A",
                'priority': access_request.get_priority_display(),
                'justification': access_request.justification,
                'resource_type': getattr(access_request.resource.resource_type, 'name', 'N/A') if access_request.resource and access_request.resource.resource_type else "N/A",
                'duration': access_request.duration,
                'approval_token_expiry': access_request.approval_token_expiry,
            }
            print(f"Sending user email with context: {user_context}")
            send_email_notification(
                access_request,
                f"Access Request {access_request.ticket_number}",
                'new_request_user.html',
                user_context,
                [access_request.user.email],
                is_reply=False
            )
            print("Successfully sent email to user")

    except Exception as e:
        print(f"Failed to send user notification: {str(e)}")

    try:
        if access_request.request_type == 'IT':
            team_context = it_support_context.copy()
            team_context['requester'] = team_context['user_name']
            send_email_notification(
                access_request,
                f"Access Request {access_request.ticket_number}",
                'it_support_team.html',
                team_context,
                [getattr(access_request.resource, 'resource_team_email', 'default@example.com')],
                is_reply=True
            )
        else:
            team_context = user_context.copy()
            team_context['requester'] = user_context['user_name']
            send_email_notification(
                access_request,
                f"Access Request {access_request.ticket_number}",
                'new_request_team.html',
                team_context,
                [getattr(access_request.resource, 'resource_team_email', 'default@example.com')],
                is_reply=True
            )
        return True
    except Exception as e:
        print(f"Failed to send team notification: {str(e)}")
        return False


def send_approval_request_notification(obj, notes):
    """Send approval request with proper URLs"""
    try:
        if not obj.approval_token:
            obj.approval_token = uuid.uuid4().hex
            obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
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
            'reject_url': reject_url,
            'approval_token_expiry': obj.approval_token_expiry,  # Add expiry date to context
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

def send_final_approval_notification(obj):
    """Send a final approval notification to the employee when the request is approved"""
    try:
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user,  # Pass the User object
            'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name
            'resource': obj.resource.name,
            'access_level': obj.access_level.name,
            'status': obj.get_status_display(),
            'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
        }

        send_email_notification(
            obj,
            f"Access Request {obj.ticket_number} - Final Approval",
            'final_approval_notification.html',
            context,
            [obj.user.email],
            is_reply=True
        )
        return True
    except Exception as e:
        print(f"Failed to send final approval notification: {str(e)}")
        return False