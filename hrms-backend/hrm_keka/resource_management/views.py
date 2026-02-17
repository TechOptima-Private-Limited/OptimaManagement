# from rest_framework import viewsets, status
# from rest_framework.decorators import action, api_view
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from django.utils import timezone
# from django.shortcuts import get_object_or_404, render
# from django.http import HttpResponse
# from django.contrib.auth.decorators import login_required
# from django.conf import settings
# import uuid
# import datetime
# from .models import *
# from .serializers import *
# from .utils import send_request_notification, send_status_notification, send_email_notification, get_approval_urls
# import base64
# from django.core.files.base import ContentFile
# from django.core.files.storage import default_storage

# @login_required
# def resource_owner_dashboard(request):
#     user = request.user
#     resources = Resource.objects.filter(resource_team_email=user.email)
#     access_requests = AccessRequest.objects.filter(resource__in=resources).order_by('-requested_at')
#     return render(request, 'resource_management/resource_owner_dashboard.html', {'access_requests': access_requests})

# def approval_confirmation(request, request_id, token):
#     access_request = get_object_or_404(AccessRequest, id=request_id)
    
#     if access_request.approval_token != token:
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': 'Invalid or expired approval link.',
#             'ticket': access_request.ticket_number
#         })

#     if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': 'Approval link has expired.',
#             'ticket': access_request.ticket_number
#         })

#     if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': 'This request has already been processed.',
#             'ticket': access_request.ticket_number
#         })

#     context = {
#         'access_request': access_request,
#         'approve_url': f"/api/resource-management/approve-request/{request_id}/{token}/approve/",
#         'reject_url': f"/api/resource-management/approve-request/{request_id}/{token}/reject/",
#     }
#     return render(request, 'resource_management/emails/approval_confirmation.html', context)

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def handle_resource_owner_approval(request, request_id, token, action):
#     try:
#         access_request = get_object_or_404(AccessRequest, id=request_id)
        
#         print(f"Received token (resource owner): {token}")
#         print(f"Stored token (resource owner): {access_request.approval_token}")
#         print(f"Token expiry (resource owner): {access_request.approval_token_expiry}")
#         print(f"Current time (resource owner): {timezone.now()}")

#         if access_request.approval_token != token:
#             print("Token mismatch detected (resource owner)")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid or expired approval link.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#             print("Token has expired (resource owner)")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Approval link has expired.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
#             print(f"Request not in correct state for resource owner action, current status: {access_request.status}")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'This request is not ready for final approval.',
#                 'ticket': access_request.ticket_number
#             })

#         # Process the resource owner's action
#         old_status = access_request.status
#         if action == 'approve':
#             access_request.status = 'APPROVED'
#             access_request.approved_by = None
#             access_request.approved_at = timezone.now()
#             status_text = 'approved'
#             action_text = 'APPROVED'
#         elif action == 'reject':
#             access_request.status = 'REJECTED'
#             status_text = 'rejected'
#             action_text = 'REJECTED'
#         else:
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid action requested.',
#                 'ticket': access_request.ticket_number
#             })

#         # Clear the approval token after use
#         access_request.approval_token = None
#         access_request.approval_token_expiry = None
#         access_request.save()

#         # Log the resource owner's action
#         ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
#         AccessHistory.objects.create(
#             access_request=access_request,
#             action=action_text,
#             performed_by=None,
#             notes=f"Processed by resource owner via link on {timezone.now()}"
#         )

#         # Send notifications to requester, assignee, and resource team
#         send_status_notification(access_request, old_status, notes=f"Processed by resource owner via link on {timezone.now()}")

#         # Send confirmation email to the person who approved/rejected
#         send_approval_confirmation_email(access_request, action, "Resource Owner")

#         return render(request, 'resource_management/approval_success.html', {
#             'action': action,
#             'ticket': access_request.ticket_number,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'approver_name': 'Resource Owner',
#             'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
#         })
        
#     except Exception as e:
#         print(f"Error in handle_resource_owner_approval: {str(e)}")
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': f'Error processing request: {str(e)}',
#             'ticket': request_id
#         })



# def send_approval_confirmation_email(access_request, action, approver_type):
#     """Send confirmation email to the person who approved/rejected the request"""
#     try:
#         context = {
#             'ticket': access_request.ticket_number,
#             'action': action,
#             'approver_type': approver_type,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
#             'justification': access_request.justification,
#         }

#         # Get the approver's email from the request
#         approver_email = getattr(access_request, 'approver_email', None)
#         if not approver_email:
#             print("No approver email found for confirmation")
#             return False

#         subject = f"Confirmation: Access Request {access_request.ticket_number} {action.title()}"
        
#         result = send_email_notification(
#             access_request,
#             subject,
#             'approval_notification.html',
#             context,
#             [approver_email],
#             is_reply=True
#         )
        
#         if result:
#             print(f"Confirmation email sent to approver: {approver_email}")
#         else:
#             print(f"Failed to send confirmation email to approver: {approver_email}")
            
#         return result
        
#     except Exception as e:
#         print(f"Error sending approval confirmation email: {str(e)}")
#         return False


# @api_view(['GET'])
# @permission_classes([AllowAny])  # Allow anyone to access this
# def handle_approval(request, request_id, token, action):
#     try:
#         print(f"Processing approval: request_id={request_id}, action={action}")
        
#         access_request = get_object_or_404(AccessRequest, id=request_id)
        
#         # Validate token and expiry
#         if access_request.approval_token != token:
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid or expired approval link.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Approval link has expired.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'This request has already been processed.',
#                 'ticket': access_request.ticket_number
#             })

#         # Store old status for history
#         old_status = access_request.status
        
#         # Process the action AUTOMATICALLY
#         if action == 'approve':
#             # Set to APPROVED directly (skip intermediate steps)
#             access_request.status = 'APPROVED'
#             access_request.approved_at = timezone.now()
#             action_text = 'APPROVED'
#             display_action = 'approved'
#             print(f"✅ Auto-approved request {access_request.ticket_number}")
#         elif action == 'reject':
#             access_request.status = 'REJECTED'
#             action_text = 'REJECTED'
#             display_action = 'rejected'
#             print(f"❌ Auto-rejected request {access_request.ticket_number}")
#         else:
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid action requested.',
#                 'ticket': access_request.ticket_number
#             })

#         # Clear the approval token after use
#         access_request.approval_token = None
#         access_request.approval_token_expiry = None
#         access_request.save()
        
#         print(f"💾 Request {access_request.ticket_number} status updated to {access_request.status}")

#         # Log the action in history
#         AccessHistory.objects.create(
#             access_request=access_request,
#             action=action_text,
#             performed_by=None,  # External approver
#             notes=f"Automatically {action_text.lower()} via email approval link on {timezone.now()}"
#         )

#         # Send notifications to all relevant parties (with error handling)
#         try:
#             send_approval_completion_notifications(access_request, old_status, display_action)
#         except Exception as notification_error:
#             print(f"Warning: Notification failed: {str(notification_error)}")
#             # Continue execution even if notifications fail

#         return render(request, 'resource_management/approval_success.html', {
#             'action': display_action,
#             'ticket': access_request.ticket_number,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'approver_name': 'Approver',
#             'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
#         })
        
#     except Exception as e:
#         print(f"Error in handle_approval: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': f'Error processing request: {str(e)}',
#             'ticket': request_id
#         })


# def send_approval_completion_notifications(access_request, old_status, action):
#     """
#     Send notifications to all relevant parties after approval/rejection
#     """
#     try:
#         print(f"📧 Sending completion notifications for {access_request.ticket_number}")
        
#         # 1. Notify the requester (employee who made the request)
#         send_requester_notification(access_request, action)
        
#         # 2. Notify IT Support/Resource Team  
#         send_it_support_notification(access_request, action)
        
#         # 3. Notify assignee if there is one
#         send_assignee_notification(access_request, action)
        
#         # 4. Send confirmation to approver
#         send_approval_confirmation_email(access_request, action, "Approver")
        
#         print("✅ All completion notifications sent successfully")
        
#     except Exception as e:
#         print(f"Error sending completion notifications: {str(e)}")
#         import traceback
#         traceback.print_exc()


# def send_requester_notification(access_request, action):
#     """Send notification to the person who requested access"""
#     try:
#         if action == 'approved':
#             subject = f"Access Request {access_request.ticket_number} - APPROVED"
#             template = 'approval_notification.html'
#         else:
#             subject = f"Access Request {access_request.ticket_number} - REJECTED"  
#             template = 'rejection_notification.html'
            
#         context = {
#             'ticket': access_request.ticket_number,
#             'user': access_request.user,
#             'user_name': access_request.user.get_full_name() or access_request.user.username,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'status': access_request.get_status_display(),
#             'request_type': access_request.request_type,
#         }
        
#         result = send_email_notification(
#             access_request,
#             subject,
#             template,
#             context,
#             [access_request.user.email],
#             is_reply=True
#         )
        
#         if result:
#             print(f"✅ Requester notification sent to: {access_request.user.email}")
#         else:
#             print(f"❌ Failed to send requester notification")
            
#     except Exception as e:
#         print(f"Error sending requester notification: {str(e)}")


# def send_it_support_notification(access_request, action):
#     """Send notification to IT Support/Resource Team"""
#     try:
#         # Determine who to notify
#         recipients = []
        
#         # Always include IT Support email from settings for approval/rejection actions
#         from django.conf import settings
#         if hasattr(settings, 'IT_SUPPORT_EMAIL') and settings.IT_SUPPORT_EMAIL:
#             recipients.append(settings.IT_SUPPORT_EMAIL)
#             print(f"📧 Added IT Support email: {settings.IT_SUPPORT_EMAIL}")
        
#         # If it's an IT request, notify the IT team
#         if access_request.request_type == 'IT':
#             if access_request.resource and access_request.resource.resource_team_email:
#                 recipients.append(access_request.resource.resource_team_email)
#             else:
#                 # Fallback - you might want to set a default IT email
#                 print("⚠️ No IT team email found for IT request")
        
#         # If it's a regular access request, notify the resource team
#         elif access_request.resource and access_request.resource.resource_team_email:
#             recipients.append(access_request.resource.resource_team_email)
            
#         # Always notify assigned person if there is one
#         if access_request.assigned_to:
#             recipients.append(access_request.assigned_to.email)
#             print(f"📧 Added assignee email: {access_request.assigned_to.email}")
            
#         if not recipients:
#             print("⚠️ No IT/Resource team recipients found")
#             return
            
#         # Remove duplicates
#         recipients = list(set(recipients))
        
#         print(f"📧 IT Support notification recipients: {recipients}")
        
#         subject = f"Access Request {access_request.ticket_number} - {action.upper()} - Action Required"
        
#         context = {
#             'ticket': access_request.ticket_number,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'requester_employee_id': access_request.user.username,
#             'requester_email': access_request.user.email,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'action': action,
#             'status': access_request.get_status_display(),
#             'request_type': access_request.request_type,
#             'justification': access_request.justification,
#             'priority': access_request.get_priority_display(),
#         }
        
#         # Choose template based on request type and action
#         if access_request.request_type == 'IT':
#             if action == 'approved':
#                 template = 'approval_notification.html'
#             else:
#                 template = 'rejection_notification.html'
#         else:
#             if action == 'approved':
#                 template = 'approval_notification.html' 
#             else:
#                 template = 'rejection_notification.html'
        
#         print(f"📧 Attempting to send IT notification to: {recipients}")
#         print(f"📧 Subject: {subject}")
#         print(f"📧 Template: {template}")
        
#         result = send_email_notification(
#             access_request,
#             subject,
#             template,
#             context,
#             recipients,
#             is_reply=True
#         )
        
#         if result:
#             print(f"✅ IT/Resource team notification sent to: {', '.join(recipients)}")
#         else:
#             print(f"❌ Failed to send IT/Resource team notification")
            
#     except Exception as e:
#         print(f"Error sending IT/Resource team notification: {str(e)}")


# def send_assignee_notification(access_request, action):
#     """Send notification to the assigned person"""
#     try:
#         # Check if there's an assignee
#         if not access_request.assigned_to:
#             print("📧 No assignee found for this request")
#             return
            
#         print(f"📧 Sending assignee notification to: {access_request.assigned_to.email}")
        
#         if action == 'approved':
#             subject = f"Access Request {access_request.ticket_number} - APPROVED - Action Required"
#             template = 'status_update_assignee.html'
#         else:
#             subject = f"Access Request {access_request.ticket_number} - REJECTED - Action Required"
#             template = 'rejection_notification_assignee.html'
            
#         context = {
#             'ticket': access_request.ticket_number,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'requester_employee_id': access_request.user.username,
#             'requester_email': access_request.user.email,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'action': action,
#             'status': access_request.get_status_display(),
#             'request_type': access_request.request_type,
#             'justification': access_request.justification,
#             'priority': access_request.get_priority_display(),
#             'assignee': access_request.assigned_to.get_full_name() or access_request.assigned_to.username,
#         }
        
#         print(f"📧 Attempting to send assignee notification to: {access_request.assigned_to.email}")
#         print(f"📧 Subject: {subject}")
#         print(f"📧 Template: {template}")
        
#         result = send_email_notification(
#             access_request,
#             subject,
#             template,
#             context,
#             [access_request.assigned_to.email],
#             is_reply=True
#         )
        
#         if result:
#             print(f"✅ Assignee notification sent to: {access_request.assigned_to.email}")
#         else:
#             print(f"❌ Failed to send assignee notification")
            
#     except Exception as e:
#         print(f"Error sending assignee notification: {str(e)}")

# # Rest of the ViewSets remain the same...
# class ResourceTypeViewSet(viewsets.ModelViewSet):
#     queryset = ResourceType.objects.all()
#     serializer_class = ResourceTypeSerializer
#     # Admin-oriented endpoints: honor Django model permissions so extras grant access
#     permission_classes = [IsAuthenticated, DjangoModelPermissions]

# class ResourceViewSet(viewsets.ModelViewSet):
#     queryset = Resource.objects.all()
#     serializer_class = ResourceSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         qs = Resource.objects.all()
#         resource_type = self.request.query_params.get('resource_type')
#         is_active = self.request.query_params.get('is_active')

#         if resource_type:
#             try:
#                 qs = qs.filter(resource_type_id=int(resource_type))
#             except (ValueError, TypeError):
#                 qs = qs.none()

#         if is_active in ['true', '1', 'True']:
#             qs = qs.filter(is_active=True)

#         return qs.order_by('name')

#     @action(detail=True)
#     def access_requests(self, request, pk=None):
#         resource = self.get_object()
#         user = request.user
#         is_admin = (
#             user.is_superuser
#             or (
#                 hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'ADMIN'
#             )
#         )
#         qs = AccessRequest.objects.filter(resource=resource)
#         if not is_admin:
#             qs = qs.filter(user=user)
#         serializer = AccessRequestSerializer(qs, many=True)
#         return Response(serializer.data)

# class AccessRequestViewSet(viewsets.ModelViewSet):
#     serializer_class = AccessRequestSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         is_admin = (
#             user.is_superuser
#             or (
#                 hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'ADMIN'
#             )
#         )
#         if is_admin:
#             return AccessRequest.objects.all()
#         return AccessRequest.objects.filter(user=user)

#     def perform_create(self, serializer):
#         print("perform_create called") 
#         instance = serializer.save(user=self.request.user)
#         send_request_notification(instance)

#     @action(detail=False, methods=['post'])
#     def upload_image(self, request):
#         try:
#             image_data = request.data.get('image')
#             filename = request.data.get('filename')
#             if not image_data or not filename:
#                 return Response({'error': 'Image data or filename missing.'}, status=400)
#             if ';base64,' not in image_data:
#                 return Response({'error': 'Invalid image data format.'}, status=400)
#             format, imgstr = image_data.split(';base64,')
#             ext = format.split('/')[-1]  # e.g., 'png', 'jpeg'
#             if not ext or ext.lower() not in ['jpg', 'jpeg', 'png', 'gif']:
#                 return Response({'error': 'Unsupported image format.'}, status=400)
#             # Save the file
#             data = ContentFile(base64.b64decode(imgstr))
#             file_path = f'page_images/{filename}'
#             saved_path = default_storage.save(file_path, data)
#             # Return full media URL
#             image_url = default_storage.url(saved_path)
#             return Response({'url': image_url})
#         except Exception as e:
#             return Response({'error': str(e)}, status=500)

#     @action(detail=True, methods=['post'])
#     def approve(self, request, pk=None):
#         access_request = self.get_object()
#         allowed = (
#             request.user.is_superuser
#             or request.user.is_staff
#             or request.user.groups.filter(name='Resource Team').exists()
#             or request.user.has_perm('resource_management.change_accessrequest')
#         )
#         if not allowed:
#             return Response({'error': 'Unauthorized'}, status=403)

#         old_status = access_request.status
#         access_request.status = 'APPROVED'
#         access_request.approved_by = request.user
#         access_request.approved_at = timezone.now()
#         access_request.save()

#         AccessHistory.objects.create(
#             access_request=access_request,
#             action='APPROVED',
#             performed_by=request.user,
#             notes=request.data.get('notes', '')
#         )

#         send_status_notification(access_request, old_status, notes=request.data.get('notes', ''))

#         return Response({'status': 'approved'})

#     @action(detail=True, methods=['post'])
#     def reject(self, request, pk=None):
#         access_request = self.get_object()
#         allowed = (
#             request.user.is_superuser
#             or request.user.is_staff
#             or request.user.groups.filter(name='Resource Team').exists()
#             or request.user.has_perm('resource_management.change_accessrequest')
#         )
#         if not allowed:
#             return Response({'error': 'Unauthorized'}, status=403)

#         old_status = access_request.status
#         access_request.status = 'REJECTED'
#         access_request.save()

#         AccessHistory.objects.create(
#             access_request=access_request,
#             action='REJECTED',
#             performed_by=request.user,
#             notes=request.data.get('notes', '')
#         )

#         send_status_notification(access_request, old_status, notes=request.data.get('notes', ''))

#         return Response({'status': 'rejected'})

#     @action(detail=True, methods=['post'])
#     def request_approval(self, request, pk=None):
#         access_request = self.get_object()
#         allowed = (
#             request.user.is_superuser
#             or request.user.is_staff
#             or request.user.groups.filter(name='Resource Team').exists()
#             or request.user.has_perm('resource_management.change_accessrequest')
#         )
#         if not allowed:
#             return Response({'error': 'Unauthorized'}, status=403)

#         try:
#             old_status = access_request.status
#             access_request.status = 'APPROVAL_REQUIRED'
#             access_request.approver_email = request.data.get('approver_email')
#             access_request.approval_token = uuid.uuid4().hex
#             access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
#             access_request.save()

#             AccessHistory.objects.create(
#                 access_request=access_request,
#                 action='APPROVAL_REQUESTED',
#                 performed_by=request.user,
#                 notes=f"Approval requested from {access_request.approver_email}"
#             )

#             send_status_notification(access_request, old_status, notes=f"Approval requested from {access_request.approver_email}")

#             return Response({'status': 'approval requested'})
#         except Exception as e:
#             print(f"Error requesting approval: {str(e)}")
#             return Response({'error': str(e)}, status=500)

#     @action(detail=False)
#     def dashboard(self, request):
#         user = request.user
#         is_admin = (
#             user.is_superuser
#             or (
#                 hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'ADMIN'
#             )
#         )
#         if is_admin:
#             pending = AccessRequest.objects.filter(status='PENDING').count()
#             approval_required = AccessRequest.objects.filter(status='APPROVAL_REQUIRED').count()
#             approved = AccessRequest.objects.filter(status='APPROVED').count()
#             rejected = AccessRequest.objects.filter(status='REJECTED').count()
#         else:
#             pending = AccessRequest.objects.filter(user=user, status='PENDING').count()
#             approval_required = AccessRequest.objects.filter(user=user, status='APPROVAL_REQUIRED').count()
#             approved = AccessRequest.objects.filter(user=user, status='APPROVED').count()
#             rejected = AccessRequest.objects.filter(user=user, status='REJECTED').count()

#         return Response({
#             'pending': pending,
#             'approval_required': approval_required,
#             'approved': approved,
#             'rejected': rejected
#         })


from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.conf import settings
import uuid
import datetime
from .models import *
from .serializers import *
from .utils import send_request_notification, send_status_notification, send_email_notification, get_approval_urls
import base64
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from utils.roles import (
    has_executive_access,
    has_management_access,
    can_manage_hr,
    can_manage_assets,
    get_permission_level,
    PERMISSION_LEVELS,
    ROLE_CATEGORIES
)


# Helper functions for resource management permissions
def can_manage_resources(user):
    """Check if user can manage resources (view/approve requests)"""
    user_profile = getattr(user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    return (
        user.is_superuser or
        user.is_staff or
        user.has_perm('resource_management.change_accessrequest') or
        user.groups.filter(name='Resource Team').exists() or
        has_executive_access(user_role) or
        can_manage_hr(user_role) or
        can_manage_assets(user_role) or
        user_role in ROLE_CATEGORIES['IT_SUPPORT'] or
        user_role in ROLE_CATEGORIES['DEVOPS'] or
        user_role in ROLE_CATEGORIES['ADMIN_STAFF']
    )


def can_view_all_requests(user):
    """Check if user can view all resource requests (not just their own)"""
    user_profile = getattr(user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    permission_level = get_permission_level(user_role) if user_role else 0
    
    return (
        user.is_superuser or
        user.has_perm('resource_management.view_accessrequest') or
        permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or
        can_manage_hr(user_role) or
        can_manage_assets(user_role) or
        user_role in ROLE_CATEGORIES['IT_SUPPORT'] or
        user_role in ROLE_CATEGORIES['DEVOPS'] or
        user_role in ROLE_CATEGORIES['ADMIN_STAFF']
    )


@login_required
def resource_owner_dashboard(request):
    """Dashboard for resource owners to manage access requests"""
    user = request.user
    
    # Check if user has permission to view resource dashboard
    if not can_manage_resources(user):
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden("You don't have permission to access the resource owner dashboard.")
    
    resources = Resource.objects.filter(resource_team_email=user.email)
    access_requests = AccessRequest.objects.filter(resource__in=resources).order_by('-requested_at')
    
    return render(request, 'resource_management/resource_owner_dashboard.html', {
        'access_requests': access_requests
    })


def approval_confirmation(request, request_id, token):
    """Confirmation page for email-based approval"""
    access_request = get_object_or_404(AccessRequest, id=request_id)
    
    if access_request.approval_token != token:
        return render(request, 'resource_management/approval_success.html', {
            'action': 'error',
            'message': 'Invalid or expired approval link.',
            'ticket': access_request.ticket_number
        })

    if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
        return render(request, 'resource_management/approval_success.html', {
            'action': 'error',
            'message': 'Approval link has expired.',
            'ticket': access_request.ticket_number
        })

    if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
        return render(request, 'resource_management/approval_success.html', {
            'action': 'error',
            'message': 'This request has already been processed.',
            'ticket': access_request.ticket_number
        })

    context = {
        'access_request': access_request,
        'approve_url': f"/api/resource-management/approve-request/{request_id}/{token}/approve/",
        'reject_url': f"/api/resource-management/approve-request/{request_id}/{token}/reject/",
    }
    return render(request, 'resource_management/emails/approval_confirmation.html', context)


@api_view(['GET'])
@permission_classes([AllowAny])
def handle_resource_owner_approval(request, request_id, token, action):
    """Handle resource owner approval via email link"""
    try:
        access_request = get_object_or_404(AccessRequest, id=request_id)
        
        print(f"Received token (resource owner): {token}")
        print(f"Stored token (resource owner): {access_request.approval_token}")
        print(f"Token expiry (resource owner): {access_request.approval_token_expiry}")
        print(f"Current time (resource owner): {timezone.now()}")

        if access_request.approval_token != token:
            print("Token mismatch detected (resource owner)")
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'Invalid or expired approval link.',
                'ticket': access_request.ticket_number
            })

        if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
            print("Token has expired (resource owner)")
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'Approval link has expired.',
                'ticket': access_request.ticket_number
            })

        if access_request.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
            print(f"Request not in correct state for resource owner action, current status: {access_request.status}")
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'This request is not ready for final approval.',
                'ticket': access_request.ticket_number
            })

        # Process the resource owner's action
        old_status = access_request.status
        if action == 'approve':
            access_request.status = 'APPROVED'
            access_request.approved_by = None
            access_request.approved_at = timezone.now()
            status_text = 'approved'
            action_text = 'APPROVED'
        elif action == 'reject':
            access_request.status = 'REJECTED'
            status_text = 'rejected'
            action_text = 'REJECTED'
        else:
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'Invalid action requested.',
                'ticket': access_request.ticket_number
            })

        # Clear the approval token after use
        access_request.approval_token = None
        access_request.approval_token_expiry = None
        access_request.save()

        # Log the resource owner's action
        AccessHistory.objects.create(
            access_request=access_request,
            action=action_text,
            performed_by=None,
            notes=f"Processed by resource owner via link on {timezone.now()}"
        )

        # Send notifications
        send_status_notification(access_request, old_status, notes=f"Processed by resource owner via link on {timezone.now()}")
        send_approval_confirmation_email(access_request, action, "Resource Owner")

        return render(request, 'resource_management/approval_success.html', {
            'action': action,
            'ticket': access_request.ticket_number,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name if access_request.resource else 'N/A',
            'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
            'approver_name': 'Resource Owner',
            'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        print(f"Error in handle_resource_owner_approval: {str(e)}")
        return render(request, 'resource_management/approval_success.html', {
            'action': 'error',
            'message': f'Error processing request: {str(e)}',
            'ticket': request_id
        })


def send_approval_confirmation_email(access_request, action, approver_type):
    """Send confirmation email to the person who approved/rejected the request"""
    try:
        context = {
            'ticket': access_request.ticket_number,
            'action': action,
            'approver_type': approver_type,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name if access_request.resource else 'N/A',
            'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
            'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'justification': access_request.justification,
        }

        approver_email = getattr(access_request, 'approver_email', None)
        if not approver_email:
            print("No approver email found for confirmation")
            return False

        subject = f"Confirmation: Access Request {access_request.ticket_number} {action.title()}"
        
        result = send_email_notification(
            access_request,
            subject,
            'approval_notification.html',
            context,
            [approver_email],
            is_reply=True
        )
        
        if result:
            print(f"Confirmation email sent to approver: {approver_email}")
        else:
            print(f"Failed to send confirmation email to approver: {approver_email}")
            
        return result
        
    except Exception as e:
        print(f"Error sending approval confirmation email: {str(e)}")
        return False


@api_view(['GET'])
@permission_classes([AllowAny])
def handle_approval(request, request_id, token, action):
    """Handle approval via email link"""
    try:
        print(f"Processing approval: request_id={request_id}, action={action}")
        
        access_request = get_object_or_404(AccessRequest, id=request_id)
        
        # Validate token and expiry
        if access_request.approval_token != token:
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'Invalid or expired approval link.',
                'ticket': access_request.ticket_number
            })

        if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'Approval link has expired.',
                'ticket': access_request.ticket_number
            })

        if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'This request has already been processed.',
                'ticket': access_request.ticket_number
            })

        # Store old status for history
        old_status = access_request.status
        
        # Process the action
        if action == 'approve':
            access_request.status = 'APPROVED'
            access_request.approved_at = timezone.now()
            action_text = 'APPROVED'
            display_action = 'approved'
            print(f"✅ Auto-approved request {access_request.ticket_number}")
        elif action == 'reject':
            access_request.status = 'REJECTED'
            action_text = 'REJECTED'
            display_action = 'rejected'
            print(f"❌ Auto-rejected request {access_request.ticket_number}")
        else:
            return render(request, 'resource_management/approval_success.html', {
                'action': 'error',
                'message': 'Invalid action requested.',
                'ticket': access_request.ticket_number
            })

        # Clear the approval token after use
        access_request.approval_token = None
        access_request.approval_token_expiry = None
        access_request.save()
        
        print(f"💾 Request {access_request.ticket_number} status updated to {access_request.status}")

        # Log the action
        AccessHistory.objects.create(
            access_request=access_request,
            action=action_text,
            performed_by=None,
            notes=f"Automatically {action_text.lower()} via email approval link on {timezone.now()}"
        )

        # Send notifications
        try:
            send_approval_completion_notifications(access_request, old_status, display_action)
        except Exception as notification_error:
            print(f"Warning: Notification failed: {str(notification_error)}")

        return render(request, 'resource_management/approval_success.html', {
            'action': display_action,
            'ticket': access_request.ticket_number,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name if access_request.resource else 'N/A',
            'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
            'approver_name': 'Approver',
            'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        print(f"Error in handle_approval: {str(e)}")
        import traceback
        traceback.print_exc()
        return render(request, 'resource_management/approval_success.html', {
            'action': 'error',
            'message': f'Error processing request: {str(e)}',
            'ticket': request_id
        })


def send_approval_completion_notifications(access_request, old_status, action):
    """Send notifications to all relevant parties after approval/rejection"""
    try:
        print(f"📧 Sending completion notifications for {access_request.ticket_number}")
        
        send_requester_notification(access_request, action)
        send_it_support_notification(access_request, action)
        send_assignee_notification(access_request, action)
        send_approval_confirmation_email(access_request, action, "Approver")
        
        print("✅ All completion notifications sent successfully")
        
    except Exception as e:
        print(f"Error sending completion notifications: {str(e)}")
        import traceback
        traceback.print_exc()


def send_requester_notification(access_request, action):
    """Send notification to the person who requested access"""
    try:
        if action == 'approved':
            subject = f"Access Request {access_request.ticket_number} - APPROVED"
            template = 'approval_notification.html'
        else:
            subject = f"Access Request {access_request.ticket_number} - REJECTED"  
            template = 'rejection_notification.html'
            
        context = {
            'ticket': access_request.ticket_number,
            'user': access_request.user,
            'user_name': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name if access_request.resource else 'N/A',
            'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
            'status': access_request.get_status_display(),
            'request_type': access_request.request_type,
        }
        
        result = send_email_notification(
            access_request,
            subject,
            template,
            context,
            [access_request.user.email],
            is_reply=True
        )
        
        if result:
            print(f"✅ Requester notification sent to: {access_request.user.email}")
        else:
            print(f"❌ Failed to send requester notification")
            
    except Exception as e:
        print(f"Error sending requester notification: {str(e)}")


def send_it_support_notification(access_request, action):
    """Send notification to IT Support/Resource Team"""
    try:
        recipients = []
        
        # Always include IT Support email
        if hasattr(settings, 'IT_SUPPORT_EMAIL') and settings.IT_SUPPORT_EMAIL:
            recipients.append(settings.IT_SUPPORT_EMAIL)
            print(f"📧 Added IT Support email: {settings.IT_SUPPORT_EMAIL}")
        
        # If it's an IT request, notify the IT team
        if access_request.request_type == 'IT':
            if access_request.resource and access_request.resource.resource_team_email:
                recipients.append(access_request.resource.resource_team_email)
            else:
                print("⚠️ No IT team email found for IT request")
        elif access_request.resource and access_request.resource.resource_team_email:
            recipients.append(access_request.resource.resource_team_email)
            
        # Always notify assigned person if there is one
        if access_request.assigned_to:
            recipients.append(access_request.assigned_to.email)
            print(f"📧 Added assignee email: {access_request.assigned_to.email}")
            
        if not recipients:
            print("⚠️ No IT/Resource team recipients found")
            return
            
        # Remove duplicates
        recipients = list(set(recipients))
        
        print(f"📧 IT Support notification recipients: {recipients}")
        
        subject = f"Access Request {access_request.ticket_number} - {action.upper()} - Action Required"
        
        context = {
            'ticket': access_request.ticket_number,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'requester_employee_id': access_request.user.username,
            'requester_email': access_request.user.email,
            'resource': access_request.resource.name if access_request.resource else 'N/A',
            'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
            'action': action,
            'status': access_request.get_status_display(),
            'request_type': access_request.request_type,
            'justification': access_request.justification,
            'priority': access_request.get_priority_display(),
        }
        
        if access_request.request_type == 'IT':
            template = 'approval_notification.html' if action == 'approved' else 'rejection_notification.html'
        else:
            template = 'approval_notification.html' if action == 'approved' else 'rejection_notification.html'
        
        print(f"📧 Attempting to send IT notification to: {recipients}")
        
        result = send_email_notification(
            access_request,
            subject,
            template,
            context,
            recipients,
            is_reply=True
        )
        
        if result:
            print(f"✅ IT/Resource team notification sent to: {', '.join(recipients)}")
        else:
            print(f"❌ Failed to send IT/Resource team notification")
            
    except Exception as e:
        print(f"Error sending IT/Resource team notification: {str(e)}")


def send_assignee_notification(access_request, action):
    """Send notification to the assigned person"""
    try:
        if not access_request.assigned_to:
            print("📧 No assignee found for this request")
            return
            
        print(f"📧 Sending assignee notification to: {access_request.assigned_to.email}")
        
        if action == 'approved':
            subject = f"Access Request {access_request.ticket_number} - APPROVED - Action Required"
            template = 'status_update_assignee.html'
        else:
            subject = f"Access Request {access_request.ticket_number} - REJECTED - Action Required"
            template = 'rejection_notification_assignee.html'
            
        context = {
            'ticket': access_request.ticket_number,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'requester_employee_id': access_request.user.username,
            'requester_email': access_request.user.email,
            'resource': access_request.resource.name if access_request.resource else 'N/A',
            'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
            'action': action,
            'status': access_request.get_status_display(),
            'request_type': access_request.request_type,
            'justification': access_request.justification,
            'priority': access_request.get_priority_display(),
            'assignee': access_request.assigned_to.get_full_name() or access_request.assigned_to.username,
        }
        
        result = send_email_notification(
            access_request,
            subject,
            template,
            context,
            [access_request.assigned_to.email],
            is_reply=True
        )
        
        if result:
            print(f"✅ Assignee notification sent to: {access_request.assigned_to.email}")
        else:
            print(f"❌ Failed to send assignee notification")
            
    except Exception as e:
        print(f"Error sending assignee notification: {str(e)}")


class ResourceTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing resource types"""
    queryset = ResourceType.objects.all()
    serializer_class = ResourceTypeSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class ResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing resources"""
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Resource.objects.all()
        resource_type = self.request.query_params.get('resource_type')
        is_active = self.request.query_params.get('is_active')

        if resource_type:
            try:
                qs = qs.filter(resource_type_id=int(resource_type))
            except (ValueError, TypeError):
                qs = qs.none()

        if is_active in ['true', '1', 'True']:
            qs = qs.filter(is_active=True)

        return qs.order_by('name')

    @action(detail=True)
    def access_requests(self, request, pk=None):
        """Get access requests for a specific resource"""
        resource = self.get_object()
        user = request.user
        
        # Check if user can view all requests
        if can_view_all_requests(user):
            qs = AccessRequest.objects.filter(resource=resource)
        else:
            # Regular users see only their own requests
            qs = AccessRequest.objects.filter(resource=resource, user=user)
        
        serializer = AccessRequestSerializer(qs, many=True)
        return Response(serializer.data)


class AccessRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing access requests"""
    serializer_class = AccessRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Check if user can view all requests
        if can_view_all_requests(user):
            return AccessRequest.objects.all()
        
        # Regular users see only their own requests
        return AccessRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        """Create a new access request and send notifications"""
        print("perform_create called") 
        instance = serializer.save(user=self.request.user)
        send_request_notification(instance)

    @action(detail=False, methods=['post'])
    def upload_image(self, request):
        """Upload image for access request documentation"""
        try:
            image_data = request.data.get('image')
            filename = request.data.get('filename')
            if not image_data or not filename:
                return Response({'error': 'Image data or filename missing.'}, status=400)
            if ';base64,' not in image_data:
                return Response({'error': 'Invalid image data format.'}, status=400)
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            if not ext or ext.lower() not in ['jpg', 'jpeg', 'png', 'gif']:
                return Response({'error': 'Unsupported image format.'}, status=400)
            
            data = ContentFile(base64.b64decode(imgstr))
            file_path = f'page_images/{filename}'
            saved_path = default_storage.save(file_path, data)
            image_url = default_storage.url(saved_path)
            return Response({'url': image_url})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an access request"""
        access_request = self.get_object()
        
        # Check if user has permission to approve
        if not can_manage_resources(request.user):
            return Response(
                {'error': 'Unauthorized. Only resource managers and IT staff can approve requests.'}, 
                status=403
            )

        old_status = access_request.status
        access_request.status = 'APPROVED'
        access_request.approved_by = request.user
        access_request.approved_at = timezone.now()
        access_request.save()

        AccessHistory.objects.create(
            access_request=access_request,
            action='APPROVED',
            performed_by=request.user,
            notes=request.data.get('notes', '')
        )

        send_status_notification(access_request, old_status, notes=request.data.get('notes', ''))

        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an access request"""
        access_request = self.get_object()
        
        # Check if user has permission to reject
        if not can_manage_resources(request.user):
            return Response(
                {'error': 'Unauthorized. Only resource managers and IT staff can reject requests.'}, 
                status=403
            )

        old_status = access_request.status
        access_request.status = 'REJECTED'
        access_request.save()

        AccessHistory.objects.create(
            access_request=access_request,
            action='REJECTED',
            performed_by=request.user,
            notes=request.data.get('notes', '')
        )

        send_status_notification(access_request, old_status, notes=request.data.get('notes', ''))

        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def request_approval(self, request, pk=None):
        """Request external approval for an access request"""
        access_request = self.get_object()
        
        # Check if user has permission to request approval
        if not can_manage_resources(request.user):
            return Response(
                {'error': 'Unauthorized. Only resource managers and IT staff can request approval.'}, 
                status=403
            )

        try:
            old_status = access_request.status
            access_request.status = 'APPROVAL_REQUIRED'
            access_request.approver_email = request.data.get('approver_email')
            access_request.approval_token = uuid.uuid4().hex
            access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
            access_request.save()

            AccessHistory.objects.create(
                access_request=access_request,
                action='APPROVAL_REQUESTED',
                performed_by=request.user,
                notes=f"Approval requested from {access_request.approver_email}"
            )

            send_status_notification(
                access_request, 
                old_status, 
                notes=f"Approval requested from {access_request.approver_email}"
            )

            return Response({'status': 'approval requested'})
        except Exception as e:
            print(f"Error requesting approval: {str(e)}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False)
    def dashboard(self, request):
        """Get dashboard statistics for access requests"""
        user = request.user
        
        # Check if user can view all requests
        if can_view_all_requests(user):
            pending = AccessRequest.objects.filter(status='PENDING').count()
            approval_required = AccessRequest.objects.filter(status='APPROVAL_REQUIRED').count()
            approved = AccessRequest.objects.filter(status='APPROVED').count()
            rejected = AccessRequest.objects.filter(status='REJECTED').count()
        else:
            # Regular users see only their own request stats
            pending = AccessRequest.objects.filter(user=user, status='PENDING').count()
            approval_required = AccessRequest.objects.filter(user=user, status='APPROVAL_REQUIRED').count()
            approved = AccessRequest.objects.filter(user=user, status='APPROVED').count()
            rejected = AccessRequest.objects.filter(user=user, status='REJECTED').count()

        return Response({
            'pending': pending,
            'approval_required': approval_required,
            'approved': approved,
            'rejected': rejected
        })