from django.contrib import admin
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.core.mail import EmailMessage
from .models import *
from .utils import send_request_notification, send_email_with_threading, send_threaded_email, generate_message_id, get_approval_urls


@admin.register(ResourceType)
class ResourceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'resource_type', 'environment', 'resource_team_email', 
                   'requires_approval', 'is_active')
    list_filter = ('resource_type', 'environment', 'requires_approval', 'is_active')
    search_fields = ('name', 'description', 'endpoint')

@admin.register(AccessLevel)
class AccessLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

class AccessHistoryInline(admin.TabularInline):
    model = AccessHistory
    extra = 0
    readonly_fields = ('performed_by', 'performed_at', 'action', 'notes')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'user', 'resource', 'access_level', 'priority',
                   'status', 'requested_at', 'expires_at')
    list_filter = ('status', 'priority', 'resource__resource_type', 'access_level')
    search_fields = ('ticket_number', 'user__username', 'resource__name')
    readonly_fields = ('ticket_number', 'requested_at')
    inlines = [AccessHistoryInline]

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if request.user.groups.filter(name='Employees').exists():
            return ['resource', 'access_level', 'priority', 'justification', 'duration']
        return fields

    def get_readonly_fields(self, request, obj=None):
        if request.user.groups.filter(name='Employees').exists():
            return self.readonly_fields + ('status', 'requires_approval', 'approver_email', 
                                        'approved_by', 'approved_at', 'user')
        if not request.user.is_staff and not request.user.groups.filter(name='Resource Team').exists():
            return self.readonly_fields + ('status', 'approved_by', 'approved_at')
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        is_new = not obj.pk
        old_status = None
        
        if change:
            try:
                old_obj = AccessRequest.objects.get(pk=obj.pk)
                old_status = old_obj.status
                
                # Prevent editing closed/rejected tickets
                if old_obj.status in ['REJECTED', 'CLOSED']:
                    self.message_user(request, "Cannot edit closed or rejected tickets", level='ERROR')
                    return
                    
            except AccessRequest.DoesNotExist:
                pass

        if not change:  # New request
            obj.user = request.user

        super().save_model(request, obj, form, change)

        try:
            if is_new:
                # Send new request notification
                self.send_initial_notifications(obj)
            elif change and old_status and old_status != obj.status:
                notes = form.cleaned_data.get('justification', '')
                
                # Create history entry
                AccessHistory.objects.create(
                    access_request=obj,
                    action=f"Status changed from {old_status} to {obj.status}",
                    performed_by=request.user,
                    notes=notes
                )
                
                # Send status update notifications
                self.send_status_notification(obj, old_status, notes)
        except Exception as e:
            print(f"Error sending notification: {str(e)}")


    def has_change_permission(self, request, obj=None):
       if obj and request.user.groups.filter(name='Employees').exists():
           return obj.user == request.user
       return super().has_change_permission(request, obj)

    def get_queryset(self, request):
       qs = super().get_queryset(request)
       if request.user.groups.filter(name='Employees').exists():
           return qs.filter(user=request.user)
       return qs

    def send_rejection_notification(self, obj, notes):
        subject = f'Access Request Rejected - {obj.ticket_number}'
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name,
            'reason': notes or 'No reason provided'
        }
        self.send_email_notification(obj, subject, 'rejection_notification.html', context)

    def send_approval_notification(self, obj, notes):
        subject = f'Access Request Approved - {obj.ticket_number}'
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name,
            'access_level': obj.access_level.name,
            'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
            'expires_at': obj.expires_at,
            'notes': notes
        }
        self.send_email_notification(obj, subject, 'approval_notification.html', context)

    # def send_approval_request_notification(self, obj, notes):
    #     if obj.approver_email:
    #         subject = f'Approval Required - Access Request {obj.ticket_number}'
    #         context = {
    #             'ticket': obj.ticket_number,
    #             'user': obj.user.get_full_name() or obj.user.username,
    #             'resource': obj.resource.name,
    #             'access_level': obj.access_level.name,
    #             'justification': obj.justification,
    #             'notes': notes
    #         }
    #         self.send_email_notification(obj, subject, 'approval_request.html', context, [obj.approver_email])

    def send_status_update_notification(self, obj, old_status, notes):
        subject = f'Access Request Status Updated - {obj.ticket_number}'
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name,
            'old_status': old_status,
            'new_status': obj.status,
            'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
            'notes': notes
        }
        self.send_email_notification(obj, subject, 'status_update.html', context)

    def send_initial_notifications(self, obj):
        """Send initial notifications to all parties"""
        # Context for user email
        user_context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name,
            'access_level': obj.access_level.name,
            'priority': obj.get_priority_display(),
            'justification': obj.justification
        }

        # Send to user
        self.send_email_notification(
            obj,
            f'Access Request Created - {obj.ticket_number}',
            'new_request_user.html',
            user_context,
            [obj.user.email]
        )

        # Send to resource team with additional details
        team_context = user_context.copy()
        team_context['requester'] = user_context['user']
        self.send_email_notification(
            obj,
            f'New Access Request - {obj.ticket_number}',
            'new_request_team.html',
            team_context,
            [obj.resource.resource_team_email]
        )

    def send_status_notification(self, obj, old_status, notes=''):
        """Send appropriate email notification based on status change"""
        base_context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name,
            'access_level': obj.access_level.name,
            'old_status': old_status,
            'new_status': obj.get_status_display(),
            'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
            'notes': notes
        }

        # Send to user
        user_context = base_context.copy()
        if obj.status == 'APPROVED':
            template = 'approval_notification.html'
            subject = f'Re: Access Request {obj.ticket_number} - Approved'
        elif obj.status == 'REJECTED':
            template = 'rejection_notification.html'
            subject = f'Re: Access Request {obj.ticket_number} - Rejected'
        elif obj.status == 'APPROVAL_REQUIRED':
            template = 'approval_request.html'
            subject = f'Re: Access Request {obj.ticket_number} - Pending Approval'
        else:
            template = 'status_update.html'
            subject = f'Re: Access Request {obj.ticket_number} - Status Update'

        self.send_email_notification(
            obj,
            subject,
            template,
            user_context,
            [obj.user.email]
        )

        # Send to resource team
        team_context = base_context.copy()
        team_context['requester'] = base_context['user']
        
        if obj.status == 'APPROVAL_REQUIRED':
            template = 'approval_required_team.html'
            subject = f'Re: Access Request {obj.ticket_number} - Approval Required'
        else:
            template = 'status_update.html'
            subject = f'Re: Access Request {obj.ticket_number} - Status Updated'

        self.send_email_notification(
            obj,
            subject,
            template,
            team_context,
            [obj.resource.resource_team_email]
        )

        # Send to approver if approval required
        if obj.status == 'APPROVAL_REQUIRED' and obj.approver_email:
            approver_context = base_context.copy()
            approver_context['requester'] = base_context['user']
            self.send_email_notification(
                obj,
                f'Re: Access Request {obj.ticket_number} - Approval Required',
                'approval_required_approver.html',
                approver_context,
                [obj.approver_email]
            )

    def send_email_notification(self, obj, subject, template_name, context, recipients):
        try:
            # Generate message ID once and store it
            is_initial_request = 'new_request' in template_name 
            if not hasattr(obj, '_message_id'):
                obj._message_id = generate_message_id(obj.ticket_number)

            html_message = render_to_string(f'resource_management/emails/{template_name}', context)
            plain_message = strip_tags(html_message)

            headers = {
                'Message-ID': obj._message_id,
                'References': obj._message_id,
                'In-Reply-To': obj._message_id,
                'Thread-Topic': f'Access Request - {obj.ticket_number}'
            }

            send_threaded_email(
                subject=subject,
                body=plain_message,
                recipients=recipients,
                ticket_number=obj.ticket_number,
                is_reply=not is_initial_request,  # False for new requests, True for updates
                html_message=html_message
            )

            # email = EmailMessage(
            #     subject=subject,
            #     body=html_message,
            #     from_email=settings.DEFAULT_FROM_EMAIL,
            #     to=recipients,
            #     headers=headers
            # )
            # email.content_subtype = "html"
            # email.send()
            
            print(f"Email sent successfully to {', '.join(recipients)}")
        except Exception as e:
            print(f"Failed to send email: {str(e)}")

    def send_status_email(self, obj, old_status):
        try:
            context = {
                'ticket': obj.ticket_number,
                'user': obj.user.get_full_name() or obj.user.username,
                'resource': obj.resource.name,
                'old_status': old_status,
                'new_status': obj.get_status_display(),
                'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
                'justification': obj.justification,
                'ticket_number': obj.ticket_number
            }

            # Different templates based on status
            if obj.status == 'APPROVED':
                template = 'resource_management/emails/approval_notification.html'
                subject = f'Re: Access Request {obj.ticket_number} - Approved'
            elif obj.status == 'REJECTED':
                template = 'resource_management/emails/rejection_notification.html'
                subject = f'Re: Access Request {obj.ticket_number} - Rejected'
            else:
                template = 'resource_management/emails/status_update.html'
                subject = f'Re: Access Request {obj.ticket_number} - Status Update'

            html_message = render_to_string(template, context)
            plain_message = strip_tags(html_message)

            # Send to both user and resource team
            recipients = [obj.user.email]
            if obj.resource.resource_team_email:
                recipients.append(obj.resource.resource_team_email)

            send_email_with_threading(
                subject=subject,
                body=plain_message,
                recipients=recipients,
                ticket_number=obj.ticket_number,
                html_message=html_message
            )
            print(f"Status update email sent successfully to {', '.join(recipients)}")
        except Exception as e:
            print(f"Failed to send status update email: {str(e)}")

    def send_approval_request_notification(self, obj, notes):
        """Send approval request with proper URLs"""
        try:
            token = urlsafe_base64_encode(force_bytes(f"{obj.id}-{obj.ticket_number}"))
            base_url = settings.SITE_URL.rstrip('/')  # Remove trailing slash if present
            
            context = {
                'ticket': obj.ticket_number,
                'requester': obj.user.get_full_name() or obj.user.username,
                'resource': obj.resource.name,
                'access_level': obj.access_level.name,
                'justification': obj.justification,
                'notes': notes,
                'approve_url': f"{base_url}/api/approve-request/{obj.id}/{token}/approve/",
                'reject_url': f"{base_url}/api/approve-request/{obj.id}/{token}/reject/"
            }

            # Log the URLs for verification
            print(f"Approve URL: {context['approve_url']}")
            print(f"Reject URL: {context['reject_url']}")

            html_message = render_to_string('resource_management/emails/approval_required_approver.html', context)
            
            send_threaded_email(
                subject=f'Access Request {obj.ticket_number} - Approval Required',
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


@admin.register(AccessHistory)
class AccessHistoryAdmin(admin.ModelAdmin):
    list_display = ('access_request', 'action', 'performed_by', 'performed_at')
    list_filter = ('action', 'performed_at')
    search_fields = ('access_request__ticket_number', 'performed_by__username')
    readonly_fields = ('access_request', 'action', 'performed_by', 'performed_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False