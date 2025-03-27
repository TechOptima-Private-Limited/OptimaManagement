from django.contrib import admin
from django import forms
from django.utils import timezone
from .models import *
from .utils import send_request_notification, send_email_notification, send_status_notification
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .forms import CustomUserCreationForm

class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

# Re-register the User model with the updated UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

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
        # Allow SuperUsers, resource owners, and assignees to view history
        if request.user.is_superuser or request.user.email in Resource.objects.values_list('resource_team_email', flat=True):
            return True
        # Allow employees to view history only for their own tickets or tickets assigned to them
        if obj:
            return obj.user == request.user or obj.assigned_to == request.user
        return False

# Custom form to dynamically hide fields based on user role
class AccessRequestForm(forms.ModelForm):
    class Meta:
        model = AccessRequest
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        # Extract user from kwargs if provided, otherwise set to None
        self.user = kwargs.pop('user', None)
        # Extract the object (AccessRequest instance) if available
        self.obj = kwargs.get('instance', None)
        super().__init__(*args, **kwargs)
        
        # Debug log to verify user and role
        print(f"Form initialized with user: {self.user}")
        if self.user:
            print(f"User is superuser: {self.user.is_superuser}")
            print(f"User email: {self.user.email}")
            print(f"Resource owner emails: {list(self.get_resource_owner_emails())}")
            if self.obj:
                print(f"User is assignee: {self.obj.assigned_to == self.user}")

        # Check if the user is an employee (not a SuperUser, not a resource owner, and not the assignee)
        if self.user and not (self.user.is_superuser or self.user.email in self.get_resource_owner_emails() or (self.obj and self.obj.assigned_to == self.user)):
            print("Hiding fields for employee in AccessRequestForm")
            # Hide fields for employees
            self.fields.pop('user', None)
            self.fields.pop('status', None)
            self.fields.pop('requires_approval', None)
            self.fields.pop('notes', None)
            self.fields.pop('approver_email', None)
            self.fields.pop('approved_by', None)
            self.fields.pop('approved_at', None)
            self.fields.pop('expires_at', None)
            self.fields.pop('approval_token', None)
            self.fields.pop('approval_token_expiry', None)
            self.fields.pop('assigned_to', None)  # Hide assigned_to for employees
        else:
            print("Showing all fields for SuperUser, Resource Team member, or Assignee in AccessRequestForm")

    def get_resource_owner_emails(self):
        # Get all resource owner emails
        return Resource.objects.values_list('resource_team_email', flat=True)

@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    form = AccessRequestForm
    list_display = ('ticket_number', 'user', 'resource', 'access_level', 'priority', 'status', 'requested_at', 'expires_at', 'assigned_to')
    list_filter = ('status', 'priority', 'resource__resource_type', 'access_level', 'assigned_to')
    search_fields = ('ticket_number', 'user__username', 'resource__name', 'assigned_to__username')
    readonly_fields = ('ticket_number', 'requested_at')
    inlines = [AccessHistoryInline]

    def get_form(self, request, obj=None, **kwargs):
        # Get the form class and pass the user to the form
        Form = super().get_form(request, obj, **kwargs)
        # Ensure the user is passed to the form during instantiation
        kwargs['form'] = Form
        kwargs['user'] = request.user  # Pass the user to the form
        # Debug log to verify form class and user
        print(f"Form class: {Form}")
        print(f"User passed to form: {request.user}")
        return Form

    def get_fields(self, request, obj=None):
        # Check if the user is an employee (not a SuperUser, not a resource owner, and not the assignee)
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True) and (not obj or obj.assigned_to != request.user):
            print("Returning limited fields for employee in get_fields")
            return ['resource', 'access_level', 'priority', 'justification', 'duration']
        fields = super().get_fields(request, obj)
        print(f"Returning all fields for SuperUser, resource owner, or assignee: {fields}")
        return fields

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = super().get_readonly_fields(request, obj)
        # Check if the user is an employee (not a SuperUser, not a resource owner, and not the assignee)
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True) and (not obj or obj.assigned_to != request.user):
            return readonly_fields + ('user', 'status', 'requires_approval', 'approver_email', 
                                     'approved_by', 'approved_at', 'expires_at', 'approval_token', 
                                     'approval_token_expiry', 'assigned_to')
        if not request.user.is_staff and (not obj or obj.assigned_to != request.user):
            return readonly_fields + ('status', 'approved_by', 'approved_at')
        return readonly_fields

    def has_change_permission(self, request, obj=None):
        if obj and obj.assigned_to and obj.assigned_to != request.user:
            # Only the assignee, SuperUsers, or resource owners can modify the ticket
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                return False
        if obj and not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
            return obj.user == request.user or obj.assigned_to == request.user
        return super().has_change_permission(request, obj)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
            # Employees can see their own tickets and tickets assigned to them
            # This also acts as an "Assignee Dashboard" by showing assigned tickets
            return qs.filter(user=request.user) | qs.filter(assigned_to=request.user)
        if not request.user.is_superuser:
            # For resource owners, show only requests for their resources
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
                old_assigned_to = old_obj.assigned_to  # Track the previous assignee
            except AccessRequest.DoesNotExist:
                pass

        if not change:  # New request
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                # For employees, set the user to the logged-in user
                obj.user = request.user
                print(f"Set user to logged-in user: {obj.user}")
            else:
                # For SuperUsers and resource owners, allow user selection
                obj.user = form.cleaned_data.get('user', request.user)
                print(f"Set user from form: {obj.user}")

        # Check if the assigned_to field has changed
        if change and old_assigned_to != obj.assigned_to:
            # Only SuperUsers and resource owners can assign tickets
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                self.message_user(request, "You do not have permission to assign tickets.", level='ERROR')
                return

            # Log the assignment in AccessHistory with reason from notes
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

            # Send notification to the new assignee and the requester
            if obj.assigned_to:
                self.send_assignment_notification(obj, request.user)

        super().save_model(request, obj, form, change)

        try:
            if is_new:
                # Send new request notification
                send_request_notification(obj)
            elif change and old_status and old_status != obj.status:
                notes = form.cleaned_data.get('justification', '')
                # Create history entry for status change
                AccessHistory.objects.create(
                    access_request=obj,
                    action=f"Status changed from {old_status} to {obj.status}",
                    performed_by=request.user,
                    notes=notes
                )
                # Send status update notifications
                send_status_notification(obj, old_status, notes)
        except Exception as e:
            print(f"Error sending notification: {str(e)}")

    def send_assignment_notification(self, obj, assigned_by):
        """Send notification to the user to whom the ticket is assigned and the requester."""
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
        # Notify the assignee
        if obj.assigned_to:
            send_email_notification(obj, subject, 'assignment_notification.html', context, [obj.assigned_to.email])
        # Notify the requester
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
            # Employees can see history only for their own tickets or tickets assigned to them
            return qs.filter(access_request__user=request.user) | qs.filter(access_request__assigned_to=request.user)
        if not request.user.is_superuser:
            # For resource owners, show only history for their resources
            resource_emails = Resource.objects.filter(resource_team_email=request.user.email).values_list('id', flat=True)
            return qs.filter(access_request__resource__id__in=resource_emails)
        return qs