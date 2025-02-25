# resource_management/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
from django.template.loader import render_to_string
from .utils import send_request_notification, send_approval_request, send_threaded_email, generate_message_id
from .models import AccessRequest
from django.http import HttpResponse



@api_view(['GET'])
def handle_approval(request, request_id, action):
    try:
        access_request = get_object_or_404(AccessRequest, id=request_id)
        
        # Check if request can be processed
        if access_request.status not in ['PENDING', 'APPROVAL_REQUIRED']:
            return HttpResponse('This request has already been processed.')

        # Process the approval/rejection
        if action == 'approve':
            access_request.status = 'APPROVED'
            status_text = 'approved'
        elif action == 'reject':
            access_request.status = 'REJECTED'
            status_text = 'rejected'
        else:
            return HttpResponse('Invalid action')

        access_request.save()

        # Send notification emails
        context = {
            'ticket': access_request.ticket_number,
            'requester': access_request.user.get_full_name() or access_request.user.username,
            'resource': access_request.resource.name,
            'status': status_text
        }

        # Send notifications
        recipients = [access_request.user.email, access_request.resource.resource_team_email]
        for recipient in recipients:
            send_threaded_email(
                subject=f'Re: Access Request {access_request.ticket_number} - {status_text.capitalize()}',
                body='',
                recipients=[recipient],
                ticket_number=access_request.ticket_number,
                html_message=render_to_string('resource_management/emails/approval_result.html', context),
                is_reply=True
            )

        return HttpResponse(f'Request has been {status_text} successfully.')
    except Exception as e:
        return HttpResponse(f'Error processing request: {str(e)}')

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

        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        access_request = self.get_object()
        if not request.user.groups.filter(name='Resource Team').exists():
            return Response({'error': 'Unauthorized'}, status=403)

        access_request.status = 'REJECTED'
        access_request.save()

        AccessHistory.objects.create(
            access_request=access_request,
            action='REJECTED',
            performed_by=request.user,
            notes=request.data.get('notes', '')
        )

        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def request_approval(self, request, pk=None):
        access_request = self.get_object()
        if not request.user.groups.filter(name='Resource Team').exists():
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            access_request.status = 'APPROVAL_REQUIRED'
            access_request.approver_email = request.data.get('approver_email')
            access_request.save()

            # Generate approval URLs
            base_url = settings.SITE_URL
            approve_url = f"{base_url}/api/approve-request/{access_request.id}/approve"
            reject_url = f"{base_url}/api/approve-request/{access_request.id}/reject"

            # Context for email
            context = {
                'ticket': access_request.ticket_number,
                'requester': access_request.user.get_full_name() or access_request.user.username,
                'resource': access_request.resource.name,
                'access_level': access_request.access_level.name,
                'justification': access_request.justification,
                'approve_url': approve_url,
                'reject_url': reject_url
            }

            # Send email
            html_message = render_to_string('resource_management/emails/approval_required_approver.html', context)
            subject = f'Access Request {access_request.ticket_number} - Approval Required'
            
            send_threaded_email(
                subject=subject,
                body='',
                recipients=[access_request.approver_email],
                ticket_number=access_request.ticket_number,
                html_message=html_message,
                is_reply=False
            )

            # Create history entry
            AccessHistory.objects.create(
                access_request=access_request,
                action='APPROVAL_REQUESTED',
                performed_by=request.user,
                notes=f"Approval requested from {access_request.approver_email}"
            )

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