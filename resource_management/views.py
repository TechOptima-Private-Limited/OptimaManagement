from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import *
from .serializers import *
from .utils import send_request_notification, send_status_notification, send_email_notification, get_approval_urls

@login_required
def resource_owner_dashboard(request):
    user = request.user
    resources = Resource.objects.filter(resource_team_email=user.email)
    access_requests = AccessRequest.objects.filter(resource__in=resources).order_by('-requested_at')
    return render(request, 'resource_management/resource_owner_dashboard.html', {'access_requests': access_requests})

def approval_confirmation(request, request_id, token):
    access_request = get_object_or_404(AccessRequest, id=request_id)
    
    if access_request.approval_token != token:
        return HttpResponse('Invalid or expired approval link.', status=403)

    if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
        return HttpResponse('Approval link has expired.', status=403)

    if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
        return HttpResponse('This request has already been processed.')

    context = {
        'access_request': access_request,
        'approve_url': f"/api/approve-request/{request_id}/{token}/approve/",
        'reject_url': f"/api/approve-request/{request_id}/{token}/reject/",
    }
    return render(request, 'resource_management/approval_confirmation.html', context)

@api_view(['GET'])
def handle_resource_owner_approval(request, request_id, token, action):
    try:
        access_request = get_object_or_404(AccessRequest, id=request_id)
        
        print(f"Received token (resource owner): {token}")
        print(f"Stored token (resource owner): {access_request.approval_token}")
        print(f"Token expiry (resource owner): {access_request.approval_token_expiry}")
        print(f"Current time (resource owner): {timezone.now()}")

        if access_request.approval_token != token:
            print("Token mismatch detected (resource owner)")
            return HttpResponse('Invalid or expired approval link.', status=403)

        if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
            print("Token has expired (resource owner)")
            return HttpResponse('Approval link has expired.', status=403)

        if access_request.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
            print(f"Request not in correct state for resource owner action, current status: {access_request.status}")
            return HttpResponse('This request is not ready for final approval.')

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
            return HttpResponse('Invalid action')

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

        return HttpResponse(f'Request has been {status_text} by the resource owner.')
    except Exception as e:
        print(f"Error in handle_resource_owner_approval: {str(e)}")
        return HttpResponse(f'Error processing request: {str(e)}', status=500)

@api_view(['GET'])
def handle_approval(request, request_id, token, action):
    try:
        access_request = get_object_or_404(AccessRequest, id=request_id)
        
        print(f"Received token: {token}")
        print(f"Stored token: {access_request.approval_token}")
        print(f"Token expiry: {access_request.approval_token_expiry}")
        print(f"Current time: {timezone.now()}")

        if access_request.approval_token != token:
            print("Token mismatch detected")
            return HttpResponse('Invalid or expired approval link.', status=403)

        if access_request.approval_token_expiry and access_request.approval_token_expiry < timezone.now():
            print("Token has expired")
            return HttpResponse('Approval link has expired.', status=403)

        if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
            print(f"Request already processed, current status: {access_request.status}")
            return HttpResponse('This request has already been processed.')

        # Process the approver's action
        old_status = access_request.status
        if action == 'approve':
            access_request.status = 'APPROVER_APPROVED'
            action_text = 'APPROVER_APPROVED'
            status_text = 'recommended for approval'
        elif action == 'reject':
            access_request.status = 'APPROVER_REJECTED'
            action_text = 'APPROVER_REJECTED'
            status_text = 'recommended for rejection'
        else:
            return HttpResponse('Invalid action')

        # Clear the approval token after use
        access_request.approval_token = None
        access_request.approval_token_expiry = None

        # Generate a new token for the resource owner
        access_request.approval_token = uuid.uuid4().hex
        access_request.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
        access_request.save()

        # Log the approver's action
        ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
        AccessHistory.objects.create(
            access_request=access_request,
            action=action_text,
            performed_by=None,
            notes=f"Processed via approval link on {timezone.now()}"
        )

        # Send notifications to requester, assignee, and resource team
        send_status_notification(access_request, old_status, notes=f"Processed via approval link on {timezone.now()}")

        # Notify the resource owner (without approval/rejection links)
        context = {
            'ticket': access_request.ticket_number,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'requester_employee_id': access_request.user.username,  # Add the requester's username as employee_id
            'resource': access_request.resource.name,
            'access_level': access_request.access_level.name,
            'justification': access_request.justification,
            'status': status_text,
        }

        send_email_notification(
            access_request,
            f"Access Request {access_request.ticket_number}",
            'resource_owner_approval.html',
            context,
            [access_request.resource.resource_team_email],
            is_reply=True
        )
        print(f"Sent resource owner notification to: {access_request.resource.resource_team_email}")

        return HttpResponse(f'Request has been {status_text} by the approver. The resource owner has been notified.')
    except Exception as e:
        print(f"Error in handle_approval: {str(e)}")
        return HttpResponse(f'Error processing request: {str(e)}', status=500)

class ResourceTypeViewSet(viewsets.ModelViewSet):
    queryset = ResourceType.objects.all()
    serializer_class = ResourceTypeSerializer
    permission_classes = [IsAuthenticated]

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True)
    def access_requests(self, request, pk=None):
        resource = self.get_object()
        requests = AccessRequest.objects.filter(resource=resource)
        serializer = AccessRequestSerializer(requests, many=True)
        return Response(serializer.data)

class AccessRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AccessRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.groups.filter(name='Resource Team').exists():
            return AccessRequest.objects.all()
        return AccessRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        send_request_notification(instance)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        access_request = self.get_object()
        if not request.user.groups.filter(name='Resource Team').exists():
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
        if not request.user.groups.filter(name='Resource Team').exists():
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
        if not request.user.groups.filter(name='Resource Team').exists():
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
        if user.is_staff or user.groups.filter(name='Resource Team').exists():
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