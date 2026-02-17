# # from rest_framework import viewsets, status
# # from rest_framework.decorators import action, api_view
# # from rest_framework.response import Response
# # from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
# # from django.utils import timezone
# # from django.shortcuts import get_object_or_404, render
# # from django.http import HttpResponse
# # from django.contrib.auth.decorators import login_required
# # from .models import *
# # from .serializers import *
# # from .utils import send_request_notification, send_status_notification, send_email_notification, get_approval_urls
# # import base64
# # from django.core.files.base import ContentFile
# # from django.core.files.storage import default_storage

# # import uuid, os  # ✅ ADD THIS
# # import datetime  # ✅ ADD THIS
# # templates_path = os.path.join(settings.BASE_DIR, 'templates/resource_management/emails/')

# # @login_required
# # def resource_owner_dashboard(request):
# #     user = request.user
# #     resources = Resource.objects.filter(resource_team_email=user.email)
# #     access_requests = AccessRequest.objects.filter(resource__in=resources).order_by('-requested_at')
# #     return render(request, f'{templates_path}resource_owner_dashboard.html', {'access_requests': access_requests})

# # def approval_confirmation(request, request_id, token):
# #     access_request = get_object_or_404(AccessRequest, id=request_id)
    
# #     if access_request.approval_token != token:
# #         return HttpResponse('Invalid or expired approval link.', status=403)

# #     if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
# #         return HttpResponse('Approval link has expired.', status=403)

# #     if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
# #         return HttpResponse('This request has already been processed.')

# #     context = {
# #         'access_request': access_request,
# #         'approve_url': f"/api/approve-request/{request_id}/{token}/approve/",
# #         'reject_url': f"/api/approve-request/{request_id}/{token}/reject/",
# #     }
# #     return render(request, f'{templates_path}approval_confirmation.html', context)

# # @api_view(['GET'])
# # def handle_resource_owner_approval(request, request_id, token, action):
# #     try:
# #         access_request = get_object_or_404(AccessRequest, id=request_id)
        
# #         print(f"Received token (resource owner): {token}")
# #         print(f"Stored token (resource owner): {access_request.approval_token}")
# #         print(f"Token expiry (resource owner): {access_request.approval_token_expiry}")
# #         print(f"Current time (resource owner): {timezone.now()}")

# #         if access_request.approval_token != token:
# #             print("Token mismatch detected (resource owner)")
# #             return HttpResponse('Invalid or expired approval link.', status=403)

# #         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
# #             print("Token has expired (resource owner)")
# #             return HttpResponse('Approval link has expired.', status=403)

# #         if access_request.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
# #             print(f"Request not in correct state for resource owner action, current status: {access_request.status}")
# #             return HttpResponse('This request is not ready for final approval.')

# #         # Process the resource owner's action
# #         old_status = access_request.status
# #         if action == 'approve':
# #             access_request.status = 'APPROVED'
# #             access_request.approved_by = None
# #             access_request.approved_at = timezone.now()
# #             status_text = 'approved'
# #             action_text = 'APPROVED'
# #         elif action == 'reject':
# #             access_request.status = 'REJECTED'
# #             status_text = 'rejected'
# #             action_text = 'REJECTED'
# #         else:
# #             return HttpResponse('Invalid action')

# #         # Clear the approval token after use
# #         access_request.approval_token = None
# #         access_request.approval_token_expiry = None
# #         access_request.save()

# #         # Log the resource owner's action
# #         ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
# #         AccessHistory.objects.create(
# #             access_request=access_request,
# #             action=action_text,
# #             performed_by=None,
# #             notes=f"Processed by resource owner via link on {timezone.now()}"
# #         )

# #         # Send notifications to requester, assignee, and resource team
# #         send_status_notification(access_request, old_status, notes=f"Processed by resource owner via link on {timezone.now()}")

# #         return HttpResponse(f'Request has been {status_text} by the resource owner.')
# #     except Exception as e:
# #         print(f"Error in handle_resource_owner_approval: {str(e)}")
# #         return HttpResponse(f'Error processing request: {str(e)}', status=500)

# # @api_view(['GET'])
# # def handle_approval(request, request_id, token, action):
# #     try:
# #         access_request = get_object_or_404(AccessRequest, id=request_id)
        
# #         print(f"Received token: {token}")
# #         print(f"Stored token: {access_request.approval_token}")
# #         print(f"Token expiry: {access_request.approval_token_expiry}")
# #         print(f"Current time: {timezone.now()}")

# #         if access_request.approval_token != token:
# #             print("Token mismatch detected")
# #             return HttpResponse('Invalid or expired approval link.', status=403)

# #         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
# #             print("Token has expired")
# #             return HttpResponse('Approval link has expired.', status=403)

# #         if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
# #             print(f"Request already processed, current status: {access_request.status}")
# #             return HttpResponse('This request has already been processed.')

# #         # Process the approver's action
# #         old_status = access_request.status
# #         if action == 'approve':
# #             access_request.status = 'APPROVER_APPROVED'
# #             action_text = 'APPROVER_APPROVED'
# #             status_text = 'recommended for approval'
# #         elif action == 'reject':
# #             access_request.status = 'APPROVER_REJECTED'
# #             action_text = 'APPROVER_REJECTED'
# #             status_text = 'recommended for rejection'
# #         else:
# #             return HttpResponse('Invalid action')

# #         # Clear the approval token after use
# #         access_request.approval_token = None
# #         access_request.approval_token_expiry = None

# #         # Generate a new token for the resource owner
# #         access_request.approval_token = uuid.uuid4().hex
# #         access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
# #         access_request.save()

# #         # Log the approver's action
# #         ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
# #         AccessHistory.objects.create(
# #             access_request=access_request,
# #             action=action_text,
# #             performed_by=None,
# #             notes=f"Processed via approval link on {timezone.now()}"
# #         )

# #         # Send notifications to requester, assignee, and resource team
# #         send_status_notification(access_request, old_status, notes=f"Processed via approval link on {timezone.now()}")

# #         # Notify the resource owner (without approval/rejection links)
# #         context = {
# #             'ticket': access_request.ticket_number,
# #             'requester': access_request.user.get_full_name() or access_request.user.username,
# #             'requester_employee_id': access_request.user.username,  # Add the requester's username as employee_id
# #             'resource': access_request.resource.name,
# #             'access_level': access_request.access_level.name,
# #             'justification': access_request.justification,
# #             'status': status_text,
# #         }

# #         send_email_notification(
# #             access_request,
# #             f"Access Request {access_request.ticket_number}",
# #             f'{templates_path}resource_owner_approval.html',
# #             context,
# #             [access_request.resource.resource_team_email],
# #             is_reply=True
# #         )
# #         print(f"Sent resource owner notification to: {access_request.resource.resource_team_email}")

# #         return HttpResponse(f'Request has been {status_text} by the approver. The resource owner has been notified.')
# #     except Exception as e:
# #         print(f"Error in handle_approval: {str(e)}")
# #         return HttpResponse(f'Error processing request: {str(e)}', status=500)

# # class ResourceTypeViewSet(viewsets.ModelViewSet):
# #     queryset = ResourceType.objects.all()
# #     serializer_class = ResourceTypeSerializer
# #     permission_classes = [IsAuthenticated]

# # class ResourceViewSet(viewsets.ModelViewSet):
# #     queryset = Resource.objects.all()
# #     serializer_class = ResourceSerializer
# #     permission_classes = [IsAuthenticated]

# #     @action(detail=True)
# #     def access_requests(self, request, pk=None):
# #         resource = self.get_object()
# #         requests = AccessRequest.objects.filter(resource=resource)
# #         serializer = AccessRequestSerializer(requests, many=True)
# #         return Response(serializer.data)

# # class AccessRequestViewSet(viewsets.ModelViewSet):
# #     serializer_class = AccessRequestSerializer
# #     permission_classes = [IsAuthenticated]

# #     def get_queryset(self):
# #         user = self.request.user
# #         if user.is_staff or user.groups.filter(name='Resource Team').exists():
# #             return AccessRequest.objects.all()
# #         return AccessRequest.objects.filter(user=user)

# #     def perform_create(self, serializer):
# #         print("perform_create called") 
# #         instance = serializer.save(user=self.request.user)
# #         send_request_notification(instance)

# #     @action(detail=False, methods=['post'])
# #     def upload_image(self, request):
# #         try:
# #             image_data = request.data.get('image')
# #             filename = request.data.get('filename')
# #             if not image_data or not filename:
# #                 return Response({'error': 'Image data or filename missing.'}, status=400)
# #             if ';base64,' not in image_data:
# #                 return Response({'error': 'Invalid image data format.'}, status=400)
# #             format, imgstr = image_data.split(';base64,')
# #             ext = format.split('/')[-1]  # e.g., 'png', 'jpeg'
# #             if not ext or ext.lower() not in ['jpg', 'jpeg', 'png', 'gif']:
# #                 return Response({'error': 'Unsupported image format.'}, status=400)
# #             # Save the file
# #             data = ContentFile(base64.b64decode(imgstr))
# #             file_path = f'page_images/{filename}'
# #             saved_path = default_storage.save(file_path, data)
# #             # Return full media URL
# #             image_url = default_storage.url(saved_path)
# #             return Response({'url': image_url})
# #         except Exception as e:
# #             return Response({'error': str(e)}, status=500)

# #     @action(detail=True, methods=['post'])
# #     def approve(self, request, pk=None):
# #         access_request = self.get_object()
# #         if not request.user.groups.filter(name='Resource Team').exists():
# #             return Response({'error': 'Unauthorized'}, status=403)

# #         old_status = access_request.status
# #         access_request.status = 'APPROVED'
# #         access_request.approved_by = request.user
# #         access_request.approved_at = timezone.now()
# #         access_request.save()

# #         AccessHistory.objects.create(
# #             access_request=access_request,
# #             action='APPROVED',
# #             performed_by=request.user,
# #             notes=request.data.get('notes', '')
# #         )

# #         send_status_notification(access_request, old_status, notes=request.data.get('notes', ''))

# #         return Response({'status': 'approved'})

# #     @action(detail=True, methods=['post'])
# #     def reject(self, request, pk=None):
# #         access_request = self.get_object()
# #         if not request.user.groups.filter(name='Resource Team').exists():
# #             return Response({'error': 'Unauthorized'}, status=403)

# #         old_status = access_request.status
# #         access_request.status = 'REJECTED'
# #         access_request.save()

# #         AccessHistory.objects.create(
# #             access_request=access_request,
# #             action='REJECTED',
# #             performed_by=request.user,
# #             notes=request.data.get('notes', '')
# #         )

# #         send_status_notification(access_request, old_status, notes=request.data.get('notes', ''))

# #         return Response({'status': 'rejected'})

# #     @action(detail=True, methods=['post'])
# #     def request_approval(self, request, pk=None):
# #         access_request = self.get_object()
# #         if not request.user.groups.filter(name='Resource Team').exists():
# #             return Response({'error': 'Unauthorized'}, status=403)

# #         try:
# #             old_status = access_request.status
# #             access_request.status = 'APPROVAL_REQUIRED'
# #             access_request.approver_email = request.data.get('approver_email')
# #             access_request.approval_token = uuid.uuid4().hex
# #             access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
# #             access_request.save()

# #             AccessHistory.objects.create(
# #                 access_request=access_request,
# #                 action='APPROVAL_REQUESTED',
# #                 performed_by=request.user,
# #                 notes=f"Approval requested from {access_request.approver_email}"
# #             )

# #             send_status_notification(access_request, old_status, notes=f"Approval requested from {access_request.approver_email}")

# #             return Response({'status': 'approval requested'})
# #         except Exception as e:
# #             print(f"Error requesting approval: {str(e)}")
# #             return Response({'error': str(e)}, status=500)

# #     @action(detail=False)
# #     def dashboard(self, request):
# #         user = request.user
# #         if user.is_staff or user.groups.filter(name='Resource Team').exists():
# #             pending = AccessRequest.objects.filter(status='PENDING').count()
# #             approval_required = AccessRequest.objects.filter(status='APPROVAL_REQUIRED').count()
# #             approved = AccessRequest.objects.filter(status='APPROVED').count()
# #             rejected = AccessRequest.objects.filter(status='REJECTED').count()
# #         else:
# #             pending = AccessRequest.objects.filter(user=user, status='PENDING').count()
# #             approval_required = AccessRequest.objects.filter(user=user, status='APPROVAL_REQUIRED').count()
# #             approved = AccessRequest.objects.filter(user=user, status='APPROVED').count()
# #             rejected = AccessRequest.objects.filter(user=user, status='REJECTED').count()

# #         return Response({
# #             'pending': pending,
# #             'approval_required': approval_required,
# #             'approved': approved,
# #             'rejected': rejected
# #         })



# from rest_framework import viewsets, status
# from rest_framework.decorators import action, api_view
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.utils import timezone
# from django.shortcuts import get_object_or_404, render
# from django.http import HttpResponse
# from django.contrib.auth.decorators import login_required
# from django.conf import settings
# from .models import *
# from .serializers import *
# from .utils import send_request_notification, send_status_notification, send_email_notification, get_approval_urls
# import base64
# from django.core.files.base import ContentFile
# from django.core.files.storage import default_storage
# import uuid
# import datetime

# @login_required
# def resource_owner_dashboard(request):
#     user = request.user
#     resources = Resource.objects.filter(resource_team_email=user.email)
#     access_requests = AccessRequest.objects.filter(resource__in=resources).order_by('-requested_at')
#     return render(request, 'resource_management/resource_owner_dashboard.html', {'access_requests': access_requests})

# def approval_confirmation(request, request_id, token):
#     access_request = get_object_or_404(AccessRequest, id=request_id)
    
#     if access_request.approval_token != token:
#         return HttpResponse('Invalid or expired approval link.', status=403)

#     if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#         return HttpResponse('Approval link has expired.', status=403)

#     if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
#         return HttpResponse('This request has already been processed.')

#     context = {
#         'access_request': access_request,
#         'approve_url': f"/api/approve-request/{request_id}/{token}/approve/",
#         'reject_url': f"/api/approve-request/{request_id}/{token}/reject/",
#     }
#     return render(request, 'resource_management/approval_confirmation.html', context)

# @api_view(['GET'])
# def handle_resource_owner_approval(request, request_id, token, action):
#     try:
#         access_request = get_object_or_404(AccessRequest, id=request_id)
        
#         print(f"Received token (resource owner): {token}")
#         print(f"Stored token (resource owner): {access_request.approval_token}")
#         print(f"Token expiry (resource owner): {access_request.approval_token_expiry}")
#         print(f"Current time (resource owner): {timezone.now()}")

#         if access_request.approval_token != token:
#             print("Token mismatch detected (resource owner)")
#             return HttpResponse('Invalid or expired approval link.', status=403)

#         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#             print("Token has expired (resource owner)")
#             return HttpResponse('Approval link has expired.', status=403)

#         if access_request.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
#             print(f"Request not in correct state for resource owner action, current status: {access_request.status}")
#             return HttpResponse('This request is not ready for final approval.')

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
#             return HttpResponse('Invalid action')

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

#         return HttpResponse(f'Request has been {status_text} by the resource owner.')
#     except Exception as e:
#         print(f"Error in handle_resource_owner_approval: {str(e)}")
#         return HttpResponse(f'Error processing request: {str(e)}', status=500)

# @api_view(['GET'])
# def handle_approval(request, request_id, token, action):
#     try:
#         access_request = get_object_or_404(AccessRequest, id=request_id)
        
#         print(f"Received token: {token}")
#         print(f"Stored token: {access_request.approval_token}")
#         print(f"Token expiry: {access_request.approval_token_expiry}")
#         print(f"Current time: {timezone.now()}")

#         if access_request.approval_token != token:
#             print("Token mismatch detected")
#             return HttpResponse('Invalid or expired approval link.', status=403)

#         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#             print("Token has expired")
#             return HttpResponse('Approval link has expired.', status=403)

#         if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
#             print(f"Request already processed, current status: {access_request.status}")
#             return HttpResponse('This request has already been processed.')

#         # Process the approver's action
#         old_status = access_request.status
#         if action == 'approve':
#             access_request.status = 'APPROVER_APPROVED'
#             action_text = 'APPROVER_APPROVED'
#             status_text = 'recommended for approval'
#         elif action == 'reject':
#             access_request.status = 'APPROVER_REJECTED'
#             action_text = 'APPROVER_REJECTED'
#             status_text = 'recommended for rejection'
#         else:
#             return HttpResponse('Invalid action')

#         # Clear the approval token after use
#         access_request.approval_token = None
#         access_request.approval_token_expiry = None

#         # Generate a new token for the resource owner
#         access_request.approval_token = uuid.uuid4().hex
#         access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
#         access_request.save()

#         # Log the approver's action
#         ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
#         AccessHistory.objects.create(
#             access_request=access_request,
#             action=action_text,
#             performed_by=None,
#             notes=f"Processed via approval link on {timezone.now()}"
#         )

#         # Send notifications to requester, assignee, and resource team
#         send_status_notification(access_request, old_status, notes=f"Processed via approval link on {timezone.now()}")

#         # Notify the resource owner (without approval/rejection links)
#         context = {
#             'ticket': access_request.ticket_number,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'requester_employee_id': access_request.user.username,
#             'resource': access_request.resource.name,
#             'access_level': access_request.access_level.name,
#             'justification': access_request.justification,
#             'status': status_text,
#         }

#         send_email_notification(
#             access_request,
#             f"Access Request {access_request.ticket_number}",
#             'emails/resource_owner_approval.html',
#             context,
#             [access_request.resource.resource_team_email],
#             is_reply=True
#         )
#         print(f"Sent resource owner notification to: {access_request.resource.resource_team_email}")

#         return HttpResponse(f'Request has been {status_text} by the approver. The resource owner has been notified.')
#     except Exception as e:
#         print(f"Error in handle_approval: {str(e)}")
#         return HttpResponse(f'Error processing request: {str(e)}', status=500)

# class ResourceTypeViewSet(viewsets.ModelViewSet):
#     queryset = ResourceType.objects.all()
#     serializer_class = ResourceTypeSerializer
#     permission_classes = [IsAuthenticated]

# class ResourceViewSet(viewsets.ModelViewSet):
#     queryset = Resource.objects.all()
#     serializer_class = ResourceSerializer
#     permission_classes = [IsAuthenticated]

#     @action(detail=True)
#     def access_requests(self, request, pk=None):
#         resource = self.get_object()
#         requests = AccessRequest.objects.filter(resource=resource)
#         serializer = AccessRequestSerializer(requests, many=True)
#         return Response(serializer.data)

# class AccessRequestViewSet(viewsets.ModelViewSet):
#     serializer_class = AccessRequestSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff or user.groups.filter(name='Resource Team').exists():
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
#         if not request.user.groups.filter(name='Resource Team').exists():
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
#         if not request.user.groups.filter(name='Resource Team').exists():
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
#         if not request.user.groups.filter(name='Resource Team').exists():
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
#         if user.is_staff or user.groups.filter(name='Resource Team').exists():
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
from rest_framework import permissions

class IsResourceAdmin(permissions.BasePermission):
    """
    Custom permission to only allow Admins, HR Managers, and IT Supporters to edit resources.
    """
    def has_permission(self, request, view):
        # Allow read-only access to authenticated users if needed (or restrict fully)
        # For now, we restrict fully to admin types for modification
        if not request.user.is_authenticated:
            return False
            
        # Superusers and staff always allowed
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # Check user profile role
        user_role = getattr(request.user.profile, 'role', None) if hasattr(request.user, 'profile') else None
        if user_role in ['ADMIN', 'HR_MANAGER', 'IT_SUPPORTER']:
            return True
            
        # Check groups
        user_groups = request.user.groups.values_list('name', flat=True)
        if any(g in user_groups for g in ['Resource Team', 'Admin', 'HR Manager', 'IT Supporter']):
            return True
            
        # Allow safe methods (GET, HEAD, OPTIONS) for authenticated users? 
        # The user requirement implies full management access for IT Supporter.
        
        return False

@login_required
def resource_owner_dashboard(request):
    user = request.user
    resources = Resource.objects.filter(resource_team_email=user.email)
    access_requests = AccessRequest.objects.filter(resource__in=resources).order_by('-requested_at')
    return render(request, 'resource_management/resource_owner_dashboard.html', {'access_requests': access_requests})

def approval_confirmation(request, request_id, token):
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
        ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
        AccessHistory.objects.create(
            access_request=access_request,
            action=action_text,
            performed_by=None,
            notes=f"Processed by resource owner via link on {timezone.now()}"
        )

        # Send notifications to requester, assignee, and resource team
        send_status_notification(access_request, old_status, notes=f"Processed by resource owner via link on {timezone.now()}")

        # Send confirmation email to the person who approved/rejected
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

# @api_view(['GET'])
# def handle_approval(request, request_id, token, action):
#     try:
#         access_request = get_object_or_404(AccessRequest, id=request_id)
        
#         print(f"Received token: {token}")
#         print(f"Stored token: {access_request.approval_token}")
#         print(f"Token expiry: {access_request.approval_token_expiry}")
#         print(f"Current time: {timezone.now()}")

#         if access_request.approval_token != token:
#             print("Token mismatch detected")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid or expired approval link.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#             print("Token has expired")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Approval link has expired.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
#             print(f"Request already processed, current status: {access_request.status}")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'This request has already been processed.',
#                 'ticket': access_request.ticket_number
#             })

#         # Process the approver's action
#         old_status = access_request.status
#         if action == 'approve':
#             access_request.status = 'APPROVER_APPROVED'
#             action_text = 'APPROVER_APPROVED'
#             status_text = 'approved'
#             display_action = 'approved'
#         elif action == 'reject':
#             access_request.status = 'APPROVER_REJECTED'
#             action_text = 'APPROVER_REJECTED'
#             status_text = 'rejected'
#             display_action = 'rejected'
#         else:
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid action requested.',
#                 'ticket': access_request.ticket_number
#             })

#         # Clear the approval token after use
#         access_request.approval_token = None
#         access_request.approval_token_expiry = None

#         # Generate a new token for the resource owner
#         access_request.approval_token = uuid.uuid4().hex
#         access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
#         access_request.save()

#         # Log the approver's action
#         ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
#         AccessHistory.objects.create(
#             access_request=access_request,
#             action=action_text,
#             performed_by=None,
#             notes=f"Processed via approval link on {timezone.now()}"
#         )

#         # Send notifications to requester, assignee, and resource team
#         send_status_notification(access_request, old_status, notes=f"Processed via approval link on {timezone.now()}")

#         # Send confirmation email to the person who approved/rejected
#         send_approval_confirmation_email(access_request, display_action, "Approver")

#         # Notify the resource owner (without approval/rejection links)
#         context = {
#             'ticket': access_request.ticket_number,
#             'requester': access_request.user.get_full_name() or access_request.user.username,
#             'requester_employee_id': access_request.user.username,
#             'resource': access_request.resource.name if access_request.resource else 'N/A',
#             'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#             'justification': access_request.justification,
#             'status': status_text,
#         }

#         send_email_notification(
#             access_request,
#             f"Access Request {access_request.ticket_number}",
#             'emails/resource_owner_approval.html',
#             context,
#             [access_request.resource.resource_team_email],
#             is_reply=True
#         )
#         print(f"Sent resource owner notification to: {access_request.resource.resource_team_email}")

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
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': f'Error processing request: {str(e)}',
#             'ticket': request_id
#         })


# @api_view(['GET'])
# def handle_approval(request, request_id, token, action):
#     try:
#         print(f"🔍 handle_approval called with:")
#         print(f"  - request_id: {request_id}")
#         print(f"  - token: {token}")
#         print(f"  - action: {action}")
        
#         access_request = get_object_or_404(AccessRequest, id=request_id)
        
#         print(f"📋 Found access request: {access_request.ticket_number}")
#         print(f"🔑 Received token: {token}")
#         print(f"🔑 Stored token: {access_request.approval_token}")
#         print(f"⏰ Token expiry: {access_request.approval_token_expiry}")
#         print(f"⏰ Current time: {timezone.now()}")
#         print(f"📊 Current status: {access_request.status}")

#         if access_request.approval_token != token:
#             print("❌ Token mismatch detected")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid or expired approval link.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
#             print("⏰ Token has expired")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Approval link has expired.',
#                 'ticket': access_request.ticket_number
#             })

#         if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
#             print(f"📊 Request already processed, current status: {access_request.status}")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'This request has already been processed.',
#                 'ticket': access_request.ticket_number
#             })

#         # Process the approver's action
#         old_status = access_request.status
#         if action == 'approve':
#             access_request.status = 'APPROVER_APPROVED'
#             action_text = 'APPROVER_APPROVED'
#             status_text = 'approved'
#             display_action = 'approved'
#             print("✅ Processing approval...")
#         elif action == 'reject':
#             access_request.status = 'APPROVER_REJECTED'
#             action_text = 'APPROVER_REJECTED'
#             status_text = 'rejected'
#             display_action = 'rejected'
#             print("❌ Processing rejection...")
#         else:
#             print(f"⚠️ Invalid action: {action}")
#             return render(request, 'resource_management/approval_success.html', {
#                 'action': 'error',
#                 'message': 'Invalid action requested.',
#                 'ticket': access_request.ticket_number
#             })

#         # Clear the approval token after use
#         access_request.approval_token = None
#         access_request.approval_token_expiry = None

#         # Generate a new token for the resource owner
#         access_request.approval_token = uuid.uuid4().hex
#         access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
#         access_request.save()
        
#         print("💾 Access request updated and saved")

#         # Log the approver's action
#         ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
#         AccessHistory.objects.create(
#             access_request=access_request,
#             action=action_text,
#             performed_by=None,
#             notes=f"Processed via approval link on {timezone.now()} from IP {ip_address}"
#         )
#         print("📝 Action logged in AccessHistory")

#         # Send notifications to requester, assignee, and resource team
#         print("📧 Sending status notifications...")
#         send_status_notification(access_request, old_status, 
#                                 notes=f"Processed via approval link on {timezone.now()}")

#         # Send confirmation email to the person who approved/rejected
#         print("📧 Sending confirmation email to approver...")
#         send_approval_confirmation_email(access_request, display_action, "Approver")

#         # Notify the resource owner (without approval/rejection links)
#         if access_request.resource and access_request.resource.resource_team_email:
#             print(f"📧 Sending resource owner notification to: {access_request.resource.resource_team_email}")
#             context = {
#                 'ticket': access_request.ticket_number,
#                 'requester': access_request.user.get_full_name() or access_request.user.username,
#                 'requester_employee_id': access_request.user.username,
#                 'resource': access_request.resource.name if access_request.resource else 'N/A',
#                 'access_level': access_request.access_level.name if access_request.access_level else 'N/A',
#                 'justification': access_request.justification,
#                 'status': status_text,
#             }

#             send_email_notification(
#                 access_request,
#                 f"Access Request {access_request.ticket_number}",
#                 'emails/resource_owner_approval.html',
#                 context,
#                 [access_request.resource.resource_team_email],
#                 is_reply=True
#             )

#         print("✅ All notifications sent successfully")

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
#         print(f"💥 Error in handle_approval: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return render(request, 'resource_management/approval_success.html', {
#             'action': 'error',
#             'message': f'Error processing request: {str(e)}',
#             'ticket': request_id
#         })



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

        # Get the approver's email from the request
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
@permission_classes([AllowAny])  # Allow anyone to access this
def handle_approval(request, request_id, token, action):
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
        
        # Process the action AUTOMATICALLY
        if action == 'approve':
            # Set to APPROVED directly (skip intermediate steps)
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

        # Log the action in history
        AccessHistory.objects.create(
            access_request=access_request,
            action=action_text,
            performed_by=None,  # External approver
            notes=f"Automatically {action_text.lower()} via email approval link on {timezone.now()}"
        )

        # Send notifications to all relevant parties (with error handling)
        try:
            send_approval_completion_notifications(access_request, old_status, display_action)
        except Exception as notification_error:
            print(f"Warning: Notification failed: {str(notification_error)}")
            # Continue execution even if notifications fail

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
    """
    Send notifications to all relevant parties after approval/rejection
    """
    try:
        print(f"📧 Sending completion notifications for {access_request.ticket_number}")
        
        # 1. Notify the requester (employee who made the request)
        send_requester_notification(access_request, action)
        
        # 2. Notify IT Support/Resource Team  
        send_it_support_notification(access_request, action)
        
        # 3. Notify assignee if there is one
        send_assignee_notification(access_request, action)
        
        # 4. Send confirmation to approver
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
        # Determine who to notify
        recipients = []
        
        # Always include IT Support email from settings for approval/rejection actions
        from django.conf import settings
        if hasattr(settings, 'IT_SUPPORT_EMAIL') and settings.IT_SUPPORT_EMAIL:
            recipients.append(settings.IT_SUPPORT_EMAIL)
            print(f"📧 Added IT Support email: {settings.IT_SUPPORT_EMAIL}")
        
        # If it's an IT request, notify the IT team
        if access_request.request_type == 'IT':
            if access_request.resource and access_request.resource.resource_team_email:
                recipients.append(access_request.resource.resource_team_email)
            else:
                # Fallback - you might want to set a default IT email
                print("⚠️ No IT team email found for IT request")
        
        # If it's a regular access request, notify the resource team
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
        
        # Choose template based on request type and action
        if access_request.request_type == 'IT':
            if action == 'approved':
                template = 'approval_notification.html'
            else:
                template = 'rejection_notification.html'
        else:
            if action == 'approved':
                template = 'approval_notification.html' 
            else:
                template = 'rejection_notification.html'
        
        print(f"📧 Attempting to send IT notification to: {recipients}")
        print(f"📧 Subject: {subject}")
        print(f"📧 Template: {template}")
        
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
        # Check if there's an assignee
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
        
        print(f"📧 Attempting to send assignee notification to: {access_request.assigned_to.email}")
        print(f"📧 Subject: {subject}")
        print(f"📧 Template: {template}")
        
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

# Rest of the ViewSets remain the same...
class AccessLevelViewSet(viewsets.ModelViewSet):
    queryset = AccessLevel.objects.all()
    serializer_class = AccessLevelSerializer
    permission_classes = [IsAuthenticated, IsResourceAdmin]

class ResourceTypeViewSet(viewsets.ModelViewSet):
    queryset = ResourceType.objects.all()
    serializer_class = ResourceTypeSerializer
    # Admin-oriented endpoints: honor Django model permissions so extras grant access
    permission_classes = [IsAuthenticated, IsResourceAdmin]

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated, IsResourceAdmin]

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
        resource = self.get_object()
        user = request.user
        is_admin = (
            user.is_superuser
            or (
                hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'ADMIN'
            )
        )
        qs = AccessRequest.objects.filter(resource=resource)
        if not is_admin:
            qs = qs.filter(user=user)
        serializer = AccessRequestSerializer(qs, many=True)
        return Response(serializer.data)

class AccessRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AccessRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = (
            user.is_superuser
            or (
                hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'ADMIN'
            )
        )
        if is_admin:
            return AccessRequest.objects.all()
        return AccessRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        print("perform_create called") 
        instance = serializer.save(user=self.request.user)
        send_request_notification(instance)

    @action(detail=False, methods=['post'])
    def upload_image(self, request):
        try:
            image_data = request.data.get('image')
            filename = request.data.get('filename')
            if not image_data or not filename:
                return Response({'error': 'Image data or filename missing.'}, status=400)
            if ';base64,' not in image_data:
                return Response({'error': 'Invalid image data format.'}, status=400)
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]  # e.g., 'png', 'jpeg'
            if not ext or ext.lower() not in ['jpg', 'jpeg', 'png', 'gif']:
                return Response({'error': 'Unsupported image format.'}, status=400)
            # Save the file
            data = ContentFile(base64.b64decode(imgstr))
            file_path = f'page_images/{filename}'
            saved_path = default_storage.save(file_path, data)
            # Return full media URL
            image_url = default_storage.url(saved_path)
            return Response({'url': image_url})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        access_request = self.get_object()
        allowed = (
            request.user.is_superuser
            or request.user.is_staff
            or request.user.groups.filter(name='Resource Team').exists()
            or request.user.has_perm('resource_management.change_accessrequest')
        )
        if not allowed:
            return Response({'error': 'Unauthorized'}, status=403)

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
        access_request = self.get_object()
        allowed = (
            request.user.is_superuser
            or request.user.is_staff
            or request.user.groups.filter(name='Resource Team').exists()
            or request.user.has_perm('resource_management.change_accessrequest')
        )
        if not allowed:
            return Response({'error': 'Unauthorized'}, status=403)

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
        access_request = self.get_object()
        allowed = (
            request.user.is_superuser
            or request.user.is_staff
            or request.user.groups.filter(name='Resource Team').exists()
            or request.user.has_perm('resource_management.change_accessrequest')
        )
        if not allowed:
            return Response({'error': 'Unauthorized'}, status=403)

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

            send_status_notification(access_request, old_status, notes=f"Approval requested from {access_request.approver_email}")

            return Response({'status': 'approval requested'})
        except Exception as e:
            print(f"Error requesting approval: {str(e)}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False)
    def dashboard(self, request):
        user = request.user
        is_admin = (
            user.is_superuser
            or (
                hasattr(user, 'profile') and getattr(user.profile, 'role', None) == 'ADMIN'
            )
        )
        if is_admin:
            pending = AccessRequest.objects.filter(status='PENDING').count()
            approval_required = AccessRequest.objects.filter(status='APPROVAL_REQUIRED').count()
            approved = AccessRequest.objects.filter(status='APPROVED').count()
            rejected = AccessRequest.objects.filter(status='REJECTED').count()
        else:
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