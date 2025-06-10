from django.contrib import admin
from django.utils import timezone

from .models import *
from .utils import send_request_notification, send_email_notification, send_status_notification, send_final_approval_notification
from .forms import CustomUserCreationForm, AccessRequestForm  # Import AccessRequestForm from forms.py
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')

# Re-register the User model with the updated UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

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

    def has_view_or_change_permission(self, request, obj=None):
        if request.user.is_superuser or request.user.email in Resource.objects.values_list('resource_team_email', flat=True):
            return True
        if obj:
            return obj.user == request.user or obj.assigned_to == request.user
        return False

@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    form = AccessRequestForm  # Use the form from forms.py
    list_display = ('ticket_number', 'user', 'request_type','resource', 'access_level','justification', 'priority', 'status', 'requested_at', 'expires_at', 'assigned_to')
    list_filter = ('status', 'priority', 'request_type','resource__resource_type', 'access_level', 'assigned_to')
    search_fields = ('ticket_number', 'user__username', 'resource__name', 'assigned_to__username')
    readonly_fields = ('ticket_number', 'requested_at')
    inlines = [AccessHistoryInline]

    class Media:
        js = ('resource_management/js/hide_fields.js',)
        css = {
            'all': ('resource_management/css/custom_admin.css',)
        }

    def get_form(self, request, obj=None, **kwargs):
        Form = super().get_form(request, obj, **kwargs)
        kwargs['form'] = Form
        kwargs['user'] = request.user
        print(f"Form class: {Form}")
        print(f"User passed to form: {request.user}")
        return Form

    def get_fields(self, request, obj=None):
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True) and (not obj or obj.assigned_to != request.user):
            print("Returning limited fields for employee in get_fields")
            return ['request_type', 'resource_type', 'resource', 'access_level', 'priority', 'justification', 'duration']
        fields = super().get_fields(request, obj)
        print(f"Returning all fields for SuperUser, resource owner, or assignee: {fields}")
        return fields

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = super().get_readonly_fields(request, obj)
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True) and (not obj or obj.assigned_to != request.user):
            return readonly_fields + ('user', 'status', 'requires_approval', 'approver_email', 
                                     'approved_by', 'approved_at', 'expires_at', 'approval_token', 
                                     'approval_token_expiry', 'assigned_to')
        if not request.user.is_staff and (not obj or obj.assigned_to != request.user):
            return readonly_fields + ('status', 'approved_by', 'approved_at')
        return readonly_fields

    def has_change_permission(self, request, obj=None):
        if obj and obj.assigned_to and obj.assigned_to != request.user:
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                return False
        if obj and not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
            return obj.user == request.user or obj.assigned_to == request.user
        return super().has_change_permission(request, obj)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
            return qs.filter(user=request.user) | qs.filter(assigned_to=request.user)
        if not request.user.is_superuser:
            resource_emails = Resource.objects.filter(resource_team_email=request.user.email).values_list('id', flat=True)
            return qs.filter(resource__id__in=resource_emails)
        return qs

    def save_model(self, request, obj, form, change):
        is_new = not obj.pk
        old_status = None
        old_assigned_to = None
        
        if change:
            try:
                old_obj = AccessRequest.objects.get(pk=obj.pk)
                old_status = old_obj.status
                old_assigned_to = old_obj.assigned_to
            except AccessRequest.DoesNotExist:
                pass

        if not change:
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                obj.user = request.user
                print(f"Set user to logged-in user: {obj.user}")
            else:
                obj.user = form.cleaned_data.get('user', request.user)
                print(f"Set user from form: {obj.user}")

        if change and old_assigned_to != obj.assigned_to:
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                self.message_user(request, "You do not have permission to assign tickets.", level='ERROR')
                return

            action = f"Ticket assigned to {obj.assigned_to.get_full_name() if obj.assigned_to else 'None'}"
            if old_assigned_to:
                action += f" (previously assigned to {old_assigned_to.get_full_name()})"
            notes = form.cleaned_data.get('notes', '')
            if notes:
                action += f" - Reason: {notes}"
            AccessHistory.objects.create(
                access_request=obj,
                action=action,
                performed_by=request.user,
                notes=notes
            )

            if obj.assigned_to:
                self.send_assignment_notification(obj, request.user)

        super().save_model(request, obj, form, change)

        try:
            if is_new:
                print("yes called")
                send_request_notification(obj)
            elif change and old_status and old_status != obj.status:
                notes = form.cleaned_data.get('justification', '')
                AccessHistory.objects.create(
                    access_request=obj,
                    action=f"Status changed from {old_status} to {obj.status}",
                    performed_by=request.user,
                    notes=notes
                )
                send_status_notification(obj, old_status, notes)
                # Send final approval notification to the employee if the status is APPROVED
                if obj.status == 'APPROVED':
                    send_final_approval_notification(obj)
        except Exception as e:
            print(f"Error sending notification: {str(e)}")

    def send_assignment_notification(self, obj, assigned_by):
        subject = f'Access Request Assigned - {obj.ticket_number}'
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name,
            'access_level': obj.access_level.name,
            'assigned_by': assigned_by.get_full_name() or assigned_by.username,
            'assigned_to': obj.assigned_to.get_full_name() or obj.assigned_to.username if obj.assigned_to else 'None',
            'status': obj.get_status_display(),
        }
        if obj.assigned_to:
            send_email_notification(obj, subject, 'assignment_notification.html', context, [obj.assigned_to.email])
        send_email_notification(obj, subject, 'assignment_notification_requester.html', context, [obj.user.email])
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

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
            return qs.filter(access_request__user=request.user) | qs.filter(access_request__assigned_to=request.user)
        if not request.user.is_superuser:
            resource_emails = Resource.objects.filter(resource_team_email=request.user.email).values_list('id', flat=True)
            return qs.filter(access_request__resource__id__in=resource_emails)
        return qs

# Register EmailThread if not already registered
@admin.register(EmailThread)
class EmailThreadAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'thread_index', 'created_at')
    search_fields = ('ticket_number',)
    readonly_fields = ('ticket_number', 'thread_index', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False