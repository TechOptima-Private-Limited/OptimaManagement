
# from django.contrib import admin
# from django.utils import timezone
# from django.utils.html import strip_tags, format_html
# from django.utils.safestring import mark_safe

# from .models import *
# from .utils import send_request_notification, send_email_notification, send_status_notification, send_final_approval_notification
# from .forms import CustomUserCreationForm, AccessRequestForm  # Import AccessRequestForm from forms.py
# from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# from django.contrib.auth.models import User

# class UserAdmin(BaseUserAdmin):
#     add_form = CustomUserCreationForm
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
#         }),
#     )
#     search_fields = ('username', 'email', 'first_name', 'last_name')

# # Re-register the User model with the updated UserAdmin
# admin.site.unregister(User)
# admin.site.register(User, UserAdmin)

# @admin.register(ResourceType)
# class ResourceTypeAdmin(admin.ModelAdmin):
#     list_display = ('name', 'description', 'is_active')
#     search_fields = ('name',)
#     list_filter = ('is_active',)

# @admin.register(Resource)
# class ResourceAdmin(admin.ModelAdmin):
#     list_display = ('name', 'resource_type', 'environment', 'resource_team_email', 
#                    'requires_approval', 'is_active')
#     list_filter = ('resource_type', 'environment', 'requires_approval', 'is_active')
#     search_fields = ('name', 'description', 'endpoint')

# @admin.register(AccessLevel)
# class AccessLevelAdmin(admin.ModelAdmin):
#     list_display = ('name', 'description')
#     search_fields = ('name',)

# class AccessHistoryInline(admin.TabularInline):
#     model = AccessHistory
#     extra = 0
#     readonly_fields = ('performed_by', 'performed_at', 'action', 'notes')
#     can_delete = False

#     def has_add_permission(self, request, obj=None):
#         return False

#     def has_view_or_change_permission(self, request, obj=None):
#         if request.user.is_superuser or request.user.email in Resource.objects.values_list('resource_team_email', flat=True):
#             return True
#         if obj:
#             return obj.user == request.user or obj.assigned_to == request.user
#         return False

# @admin.register(AccessRequest)
# class AccessRequestAdmin(admin.ModelAdmin):
#     form = AccessRequestForm  # Use the form from forms.py
#     # ⭐ CHANGED: Use custom method for justification display
#     list_display = ('ticket_number', 'user', 'request_type','resource', 'access_level','justification_preview', 'priority', 'status', 'requested_at', 'expires_at', 'assigned_to')
#     list_filter = ('status', 'priority', 'request_type','resource__resource_type', 'access_level', 'assigned_to')
#     search_fields = ('ticket_number', 'user__username', 'resource__name', 'assigned_to__username')
#     readonly_fields = ('ticket_number', 'requested_at')
#     inlines = [AccessHistoryInline]

#     # class Media:
#     #     js = ('resource_management/js/hide_fields.js',)
#     #     css = {
#     #         'all': ('resource_management/css/custom_admin.css',)
#     #     }
#     class Media:
#         js = (
#             'resource_management/js/hide_fields.js',
#             'resource_management/js/ckeditor5-csrf-fix.js',  # ✅ Add this line
#         )
#         css = {
#             'all': ('resource_management/css/custom_admin.css',)
#         }


#     # ⭐ NEW: Custom method to display justification preview in list view
#     def justification_preview(self, obj):
#         """Display a clean text preview of justification in the admin list view"""
#         if obj.justification:
#             # Strip HTML tags and get clean text
#             clean_text = strip_tags(obj.justification)
#             # Truncate to 100 characters for better display in list
#             if len(clean_text) > 100:
#                 preview = clean_text[:100] + "..."
#             else:
#                 preview = clean_text
#             # Return as safe HTML to prevent escaping
#             return format_html('<span title="{}">{}</span>', clean_text, preview)
#         return "-"
    
#     justification_preview.short_description = "Justification"  # Column header name
#     justification_preview.admin_order_field = 'justification'  # Allow sorting by this field

#     # ⭐ NEW: Custom method to display full justification with images in detail view
#     def get_readonly_fields(self, request, obj=None):
#         readonly_fields = list(super().get_readonly_fields(request, obj))
#         if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True) and (not obj or obj.assigned_to != request.user):
#             return readonly_fields + ['user', 'status', 'requires_approval', 'approver_email', 
#                                      'approved_by', 'approved_at', 'expires_at', 'approval_token', 
#                                      'approval_token_expiry', 'assigned_to']
#         if not request.user.is_staff and (not obj or obj.assigned_to != request.user):
#             return readonly_fields + ['status', 'approved_by', 'approved_at']
#         return readonly_fields

#     def get_form(self, request, obj=None, **kwargs):
#         Form = super().get_form(request, obj, **kwargs)
#         kwargs['form'] = Form
#         kwargs['user'] = request.user
#         print(f"Form class: {Form}")
#         print(f"User passed to form: {request.user}")
#         return Form

#     def get_fields(self, request, obj=None):
#         print(f"🔧 ADMIN get_fields: User: {request.user}")
#         print(f"🔧 ADMIN get_fields: Obj: {obj}")
#         print(f"🔧 ADMIN get_fields: Obj request_type: {obj.request_type if obj else 'None'}")
        
#         # Check if user is an employee (not superuser, not resource owner, not assignee)
#         is_employee = not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True) and (not obj or obj.assigned_to != request.user)
        
#         # Check if this is an IT request
#         is_it_request = obj and obj.request_type == 'IT'
        
#         print(f"🔧 ADMIN get_fields: is_employee: {is_employee}")
#         print(f"🔧 ADMIN get_fields: is_it_request: {is_it_request}")
        
#         if is_employee:
#             print("Returning limited fields for employee in get_fields")
#             base_fields = ['request_type', 'priority', 'justification', 'duration']
            
#             # Only include resource-related fields for non-IT requests
#             if not is_it_request:
#                 base_fields.insert(1, 'resource_type')  # Insert after request_type
#                 base_fields.insert(2, 'resource')       # Insert after resource_type
#                 base_fields.insert(3, 'access_level')   # Insert after resource
            
#             print(f"🔧 ADMIN get_fields: Employee fields: {base_fields}")
#             return base_fields
        
#         # For superusers, resource owners, and assignees, get all fields first
#         fields = list(super().get_fields(request, obj))
#         print(f"🔧 ADMIN get_fields: All fields before IT check: {fields}")
        
#         # Remove resource-related fields for IT requests regardless of user type
#         if is_it_request:
#             print("Removing resource-related fields for IT request")
#             fields_to_remove = ['resource_type', 'resource', 'access_level']
#             for field in fields_to_remove:
#                 if field in fields:
#                     fields.remove(field)
#                     print(f"  Removed admin field: {field}")
#                 else:
#                     print(f"  Field {field} not found in admin fields")
        
#         print(f"🔧 ADMIN get_fields: Final fields: {fields}")
#         return fields

#     def has_change_permission(self, request, obj=None):
#         if obj and obj.assigned_to and obj.assigned_to != request.user:
#             if not request.user.is_superuser and not request.user.is_staff and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
#                 return False
#         if obj and not (request.user.is_superuser or request.user.is_staff or request.user.email in Resource.objects.values_list('resource_team_email', flat=True)):
#             return obj.user == request.user or obj.assigned_to == request.user
#         return super().has_change_permission(request, obj)

#     def get_queryset(self, request):
#         qs = super().get_queryset(request)
#         if request.user.is_superuser or request.user.is_staff:
#             return qs
#         if request.user.email in Resource.objects.values_list('resource_team_email', flat=True):
#             resource_emails = Resource.objects.filter(resource_team_email=request.user.email).values_list('id', flat=True)
#             return qs.filter(resource__id__in=resource_emails)
#         return qs.filter(user=request.user) | qs.filter(assigned_to=request.user)

#     # def save_model(self, request, obj, form, change):
#     #     is_new = not obj.pk
#     #     old_status = None
#     #     old_assigned_to = None
        
#     #     if change:
#     #         try:
#     #             old_obj = AccessRequest.objects.get(pk=obj.pk)
#     #             old_status = old_obj.status
#     #             old_assigned_to = old_obj.assigned_to
#     #         except AccessRequest.DoesNotExist:
#     #             pass

#     #     if not change:
#     #         if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
#     #             obj.user = request.user
#     #             print(f"Set user to logged-in user: {obj.user}")
#     #         else:
#     #             obj.user = form.cleaned_data.get('user', request.user)
#     #             print(f"Set user from form: {obj.user}")

#     #     if change and old_assigned_to != obj.assigned_to:
#     #         if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
#     #             self.message_user(request, "You do not have permission to assign tickets.", level='ERROR')
#     #             return

#     #         action = f"Ticket assigned to {obj.assigned_to.get_full_name() if obj.assigned_to else 'None'}"
#     #         if old_assigned_to:
#     #             action += f" (previously assigned to {old_assigned_to.get_full_name()})"
#     #         notes = form.cleaned_data.get('notes', '')
#     #         if notes:
#     #             action += f" - Reason: {notes}"
#     #         AccessHistory.objects.create(
#     #             access_request=obj,
#     #             action=action,
#     #             performed_by=request.user,
#     #             notes=notes
#     #         )

#     #         if obj.assigned_to:
#     #             self.send_assignment_notification(obj, request.user)

#     #     super().save_model(request, obj, form, change)

#     #     try:
#     #         if is_new:
#     #             print("yes called")
#     #             send_request_notification(obj)
#     #         elif change and old_status and old_status != obj.status:
#     #             notes = form.cleaned_data.get('justification', '')
#     #             AccessHistory.objects.create(
#     #                 access_request=obj,
#     #                 action=f"Status changed from {old_status} to {obj.status}",
#     #                 performed_by=request.user,
#     #                 notes=notes
#     #             )
#     #             send_status_notification(obj, old_status, notes)
#     #             # Send final approval notification to the employee if the status is APPROVED
#     #             if obj.status == 'APPROVED':
#     #                 send_final_approval_notification(obj)
#     #     except Exception as e:
#     #         print(f"Error sending notification: {str(e)}")
#     def save_model(self, request, obj, form, change):
#         import uuid
#         import datetime
        
#         is_new = not obj.pk
#         old_status = None
#         old_assigned_to = None
#         old_approver_email = None
        
#         if change:
#             try:
#                 old_obj = AccessRequest.objects.get(pk=obj.pk)
#                 old_status = old_obj.status
#                 old_assigned_to = old_obj.assigned_to
#                 old_approver_email = old_obj.approver_email
#                 print(f"DEBUG: old_approver_email = {old_approver_email}")
#                 print(f"DEBUG: new_approver_email = {obj.approver_email}")
#             except AccessRequest.DoesNotExist:
#                 pass

#         if not change:
#             if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
#                 obj.user = request.user
#                 print(f"Set user to logged-in user: {obj.user}")
#             else:
#                 obj.user = form.cleaned_data.get('user', request.user)
#                 print(f"Set user from form: {obj.user}")

#         # Handle assignment changes
#         if change and old_assigned_to != obj.assigned_to:
#             if not request.user.is_superuser and not request.user.is_staff and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
#                 self.message_user(request, "You do not have permission to assign tickets.", level='ERROR')
#                 return

#             action = f"Ticket assigned to {obj.assigned_to.get_full_name() if obj.assigned_to else 'None'}"
#             if old_assigned_to:
#                 action += f" (previously assigned to {old_assigned_to.get_full_name()})"
#             notes = form.cleaned_data.get('notes', '')
#             if notes:
#                 action += f" - Reason: {notes}"
#             AccessHistory.objects.create(
#                 access_request=obj,
#                 action=action,
#                 performed_by=request.user,
#                 notes=notes
#             )

#             if obj.assigned_to:
#                 self.send_assignment_notification(obj, request.user)

#         # Handle approver email assignment - ENHANCED LOGIC
#         approver_changed = False
#         if change and obj.approver_email:
#             print(f"APPROVER DEBUG: Checking approver assignment")
#             print(f"APPROVER DEBUG: old_approver_email = '{old_approver_email}'")
#             print(f"APPROVER DEBUG: obj.approver_email = '{obj.approver_email}'")
            
#             # Check if this is a new assignment or re-assignment to same person
#             if old_approver_email != obj.approver_email:
#                 approver_changed = True
#                 print(f"APPROVER DEBUG: NEW approver assigned: {obj.approver_email}")
#             elif old_approver_email == obj.approver_email and obj.status != 'APPROVAL_REQUIRED':
#                 # Same approver but status is not APPROVAL_REQUIRED - treat as re-send
#                 approver_changed = True
#                 print(f"APPROVER DEBUG: RE-SENDING to same approver: {obj.approver_email}")
            
#             if approver_changed:
#                 print(f"APPROVER DEBUG: Setting up approval process")
                
#                 # Set status to APPROVAL_REQUIRED and generate token
#                 obj.status = 'APPROVAL_REQUIRED'
#                 obj.approval_token = uuid.uuid4().hex
#                 obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
                
#                 # Log the approval request
#                 action_text = "APPROVAL_REQUESTED" if old_approver_email != obj.approver_email else "APPROVAL_RESENT"
#                 AccessHistory.objects.create(
#                     access_request=obj,
#                     action=action_text,
#                     performed_by=request.user,
#                     notes=f"Approval requested from {obj.approver_email}"
#                 )

#         super().save_model(request, obj, form, change)

#         try:
#             if is_new:
#                 print("Sending notification for new request")
#                 send_request_notification(obj)
#             elif change:
#                 # Handle status changes
#                 if old_status and old_status != obj.status:
#                     notes = form.cleaned_data.get('notes', '')
#                     AccessHistory.objects.create(
#                         access_request=obj,
#                         action=f"Status changed from {old_status} to {obj.status}",
#                         performed_by=request.user,
#                         notes=notes
#                     )
#                     send_status_notification(obj, old_status, notes)
                    
#                     # Send final approval notification if approved
#                     if obj.status == 'APPROVED':
#                         send_final_approval_notification(obj)
                
#                 # Handle approver assignment (send approval email)
#                 if approver_changed:
#                     print(f"APPROVER DEBUG: Sending approval request email to: {obj.approver_email}")
#                     from .utils import send_approval_request_notification
#                     result = send_approval_request_notification(obj, form.cleaned_data.get('notes', ''))
#                     if result:
#                         self.message_user(request, f"Approval request sent to {obj.approver_email}")
#                         print(f"APPROVER DEBUG: Email sent successfully")
#                     else:
#                         self.message_user(request, f"Failed to send approval request to {obj.approver_email}", level='ERROR')
#                         print(f"APPROVER DEBUG: Email sending failed")
                        
#         except Exception as e:
#             print(f"Error sending notification: {str(e)}")
#             import traceback
#             traceback.print_exc()

#     def send_assignment_notification(self, obj, assigned_by):
#         subject = f'Access Request Assigned - {obj.ticket_number}'
#         context = {
#             'ticket': obj.ticket_number,
#             'user': obj.user.get_full_name() or obj.user.username,
#             'resource': obj.resource.name if obj.resource else 'N/A',
#             'access_level': obj.access_level.name if obj.access_level else 'N/A',
#             'assigned_by': assigned_by.get_full_name() or assigned_by.username,
#             'assigned_to': obj.assigned_to.get_full_name() or obj.assigned_to.username if obj.assigned_to else 'None',
#             'status': obj.get_status_display(),
#         }
#         if obj.assigned_to:
#             send_email_notification(obj, subject, 'assignment_notification.html', context, [obj.assigned_to.email])
#         send_email_notification(obj, subject, 'assignment_notification_requester.html', context, [obj.user.email])

# @admin.register(AccessHistory)
# class AccessHistoryAdmin(admin.ModelAdmin):
#     list_display = ('access_request', 'action', 'performed_by', 'performed_at')
#     list_filter = ('action', 'performed_at')
#     search_fields = ('access_request__ticket_number', 'performed_by__username')
#     readonly_fields = ('access_request', 'action', 'performed_by', 'performed_at')

#     def has_add_permission(self, request):
#         return False

#     def has_change_permission(self, request, obj=None):
#         return False

#     def has_delete_permission(self, request, obj=None):
#         return False

#     def get_queryset(self, request):
#         qs = super().get_queryset(request)
#         if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
#             return qs.filter(access_request__user=request.user) | qs.filter(access_request__assigned_to=request.user)
#         if not request.user.is_superuser:
#             resource_emails = Resource.objects.filter(resource_team_email=request.user.email).values_list('id', flat=True)
#             return qs.filter(access_request__resource__id__in=resource_emails)
#         return qs

# # Register EmailThread if not already registered
# @admin.register(EmailThread)
# class EmailThreadAdmin(admin.ModelAdmin):
#     list_display = ('ticket_number', 'thread_index', 'created_at')
#     search_fields = ('ticket_number',)
#     readonly_fields = ('ticket_number', 'thread_index', 'created_at')

#     def has_add_permission(self, request):
#         return False

#     def has_change_permission(self, request, obj=None):
#         return False

#     def has_delete_permission(self, request, obj=None):
#         return False




from django.contrib import admin
from django.utils import timezone
from django.utils.html import strip_tags, format_html
from django.utils.safestring import mark_safe
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.contrib import messages

from .models import *
from .utils import send_request_notification, send_email_notification, send_status_notification, send_final_approval_notification
from .forms import CustomUserCreationForm, AccessRequestForm
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.contrib.admin.sites import NotRegistered, AlreadyRegistered

class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')

# Re-register the User model with the updated UserAdmin (supports custom AUTH_USER_MODEL)
User = get_user_model()
try:
    admin.site.unregister(User)
except NotRegistered:
    pass
try:
    admin.site.register(User, UserAdmin)
except AlreadyRegistered:
    pass

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
    form = AccessRequestForm
    # Updated list_display to include delete button
    list_display = ('ticket_number', 'user', 'request_type','resource', 'access_level','justification_preview', 'priority', 'status', 'requested_at', 'expires_at', 'assigned_to', 'delete_button')
    list_filter = ('status', 'priority', 'request_type','resource__resource_type', 'access_level', 'assigned_to')
    search_fields = ('ticket_number', 'user__username', 'resource__name', 'assigned_to__username')
    readonly_fields = ('ticket_number', 'requested_at')
    inlines = [AccessHistoryInline]

    class Media:
        js = (
            'resource_management/js/hide_fields.js',
            'resource_management/js/ckeditor5-csrf-fix.js',
        )
        #css = {
        #   'all': ('resource_management/css/custom_admin.css',)
        #}

    def justification_preview(self, obj):
        """Display a clean text preview of justification in the admin list view"""
        if obj.justification:
            clean_text = strip_tags(obj.justification)
            if len(clean_text) > 100:
                preview = clean_text[:100] + "..."
            else:
                preview = clean_text
            return format_html('<span title="{}">{}</span>', clean_text, preview)
        return "-"
    
    justification_preview.short_description = "Justification"
    justification_preview.admin_order_field = 'justification'

    def delete_button(self, obj):
        """Display delete button for each row"""
        if self.has_delete_permission_for_obj(None, obj):  # Check permission first
            delete_url = reverse('admin:resource_management_accessrequest_delete', args=[obj.pk])
            return format_html(
                '<a href="{}" onclick="return confirm(\'Are you sure you want to delete request {}? This action cannot be undone.\')" '
                'style="background-color: #dc3545; color: white; padding: 5px 10px; text-decoration: none; '
                'border-radius: 3px; font-size: 12px; border: none; cursor: pointer;">'
                '🗑️ Delete</a>',
                delete_url, obj.ticket_number
            )
        else:
            return format_html(
                '<span style="color: #999; font-size: 12px;">No Permission</span>'
            )
    
    delete_button.short_description = "Actions"
    delete_button.allow_tags = True

    def has_delete_permission_for_obj(self, request, obj=None):
        """Check delete permission for specific object - reused from previous implementation"""
        if not request:
            # When called from delete_button, we need to check differently
            # This is a simplified check - you might want to get the current request differently
            return True  # For now, show button and handle permission in the actual delete
            
        if request.user.is_superuser:
            return True
        
        if obj is None:
            if request.user.email in Resource.objects.values_list('resource_team_email', flat=True):
                return True
            return False
        
        resource_owner_emails = Resource.objects.values_list('resource_team_email', flat=True)
        is_resource_owner = request.user.email in resource_owner_emails
        is_request_owner = obj.user == request.user
        is_assignee = obj.assigned_to == request.user
        
        # Resource owners can delete requests for their resources
        if is_resource_owner:
            if obj.resource and obj.resource.resource_team_email == request.user.email:
                return True
        
        # Users can delete their own requests only if they're in PENDING status
        if is_request_owner and obj.status == 'PENDING':
            return True
        
        # Assignees can delete requests assigned to them
        if is_assignee:
            return True
        
        return False

    def has_delete_permission(self, request, obj=None):
        """Control who can delete access requests"""
        return self.has_delete_permission_for_obj(request, obj)

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(super().get_readonly_fields(request, obj))
        # Employees (non-staff, non-resource owners, non-assignees) have restricted fields
        if (
            not request.user.is_superuser
            and not request.user.is_staff
            and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True)
            and (not obj or obj.assigned_to != request.user)
        ):
            return readonly_fields + ['user', 'status', 'requires_approval', 'approver_email',
                                      'approved_by', 'approved_at', 'expires_at', 'approval_token',
                                      'approval_token_expiry', 'assigned_to']
        # Non-staff assignees cannot alter status/approval fields
        if not request.user.is_staff and (not obj or obj.assigned_to != request.user):
            return readonly_fields + ['status', 'approved_by', 'approved_at']
        return readonly_fields

    def get_form(self, request, obj=None, **kwargs):
        Form = super().get_form(request, obj, **kwargs)
        kwargs['form'] = Form
        kwargs['user'] = request.user
        return Form

    def get_fields(self, request, obj=None):
        is_employee = (
            not request.user.is_superuser
            and not request.user.is_staff
            and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True)
            and (not obj or obj.assigned_to != request.user)
        )
        is_it_request = obj and obj.request_type == 'IT'
        
        if is_employee:
            base_fields = ['request_type', 'priority', 'justification', 'duration']
            if not is_it_request:
                base_fields.insert(1, 'resource_type')
                base_fields.insert(2, 'resource')
                base_fields.insert(3, 'access_level')
            return base_fields
        
        fields = list(super().get_fields(request, obj))
        if is_it_request:
            fields_to_remove = ['resource_type', 'resource', 'access_level']
            for field in fields_to_remove:
                if field in fields:
                    fields.remove(field)
        
        return fields

    def has_change_permission(self, request, obj=None):
        if obj and obj.assigned_to and obj.assigned_to != request.user:
            if not request.user.is_superuser and not request.user.is_staff and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                return False
        if obj and not (request.user.is_superuser or request.user.is_staff or request.user.email in Resource.objects.values_list('resource_team_email', flat=True)):
            return obj.user == request.user or obj.assigned_to == request.user
        return super().has_change_permission(request, obj)

    def delete_model(self, request, obj):
        """Custom delete method to handle related objects and logging"""
        print(f"DEBUG: delete_model called for {obj.ticket_number}")
        
        # Check permission again
        if not self.has_delete_permission_for_obj(request, obj):
            messages.error(request, f"You don't have permission to delete request {obj.ticket_number}")
            return
        
        # Log the deletion
        try:
            AccessHistory.objects.create(
                access_request=obj,
                action='DELETED',
                performed_by=request.user,
                notes=f"Request deleted by {request.user.get_full_name() or request.user.username}"
            )
            print("DEBUG: Logged deletion in AccessHistory")
        except Exception as e:
            print(f"DEBUG: Failed to log deletion: {str(e)}")
        
        # Store info for success message
        ticket_number = obj.ticket_number
        
        # Delete the object
        super().delete_model(request, obj)
        
        # Success message
        messages.success(request, f"Access request {ticket_number} has been deleted successfully.")
        print("DEBUG: Object deleted successfully")

    def delete_queryset(self, request, queryset):
        """Custom bulk delete method"""
        print(f"DEBUG: delete_queryset called for {queryset.count()} objects")
        
        deleted_tickets = []
        
        # Check permissions and log for each object
        for obj in queryset:
            if self.has_delete_permission_for_obj(request, obj):
                try:
                    AccessHistory.objects.create(
                        access_request=obj,
                        action='BULK_DELETED',
                        performed_by=request.user,
                        notes=f"Request bulk deleted by {request.user.get_full_name() or request.user.username}"
                    )
                    deleted_tickets.append(obj.ticket_number)
                except Exception as e:
                    print(f"DEBUG: Failed to log bulk deletion for {obj.ticket_number}: {str(e)}")
            else:
                messages.warning(request, f"Skipped {obj.ticket_number} - insufficient permissions")
        
        # Perform bulk delete only on allowed objects
        allowed_objects = [obj for obj in queryset if self.has_delete_permission_for_obj(request, obj)]
        if allowed_objects:
            super().delete_queryset(request, queryset.filter(pk__in=[obj.pk for obj in allowed_objects]))
            messages.success(request, f"Successfully deleted {len(deleted_tickets)} access requests: {', '.join(deleted_tickets)}")
        
        print("DEBUG: Bulk delete completed")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.is_staff:
            return qs
        if request.user.email in Resource.objects.values_list('resource_team_email', flat=True):
            resource_emails = Resource.objects.filter(resource_team_email=request.user.email).values_list('id', flat=True)
            return qs.filter(resource__id__in=resource_emails)
        return qs.filter(user=request.user) | qs.filter(assigned_to=request.user)

    def save_model(self, request, obj, form, change):
        import uuid
        import datetime
        
        is_new = not obj.pk
        old_status = None
        old_assigned_to = None
        old_approver_email = None
        
        if change:
            try:
                old_obj = AccessRequest.objects.get(pk=obj.pk)
                old_status = old_obj.status
                old_assigned_to = old_obj.assigned_to
                old_approver_email = old_obj.approver_email
            except AccessRequest.DoesNotExist:
                pass

        if not change:
            if not request.user.is_superuser and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
                obj.user = request.user
            else:
                obj.user = form.cleaned_data.get('user', request.user)

        # Handle assignment changes
        if change and old_assigned_to != obj.assigned_to:
            if not request.user.is_superuser and not request.user.is_staff and request.user.email not in Resource.objects.values_list('resource_team_email', flat=True):
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

        # Handle approver email assignment
        approver_changed = False
        if change and obj.approver_email:
            if old_approver_email != obj.approver_email:
                approver_changed = True
            elif old_approver_email == obj.approver_email and obj.status != 'APPROVAL_REQUIRED':
                approver_changed = True
            
            if approver_changed:
                obj.status = 'APPROVAL_REQUIRED'
                obj.approval_token = uuid.uuid4().hex
                obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
                
                action_text = "APPROVAL_REQUESTED" if old_approver_email != obj.approver_email else "APPROVAL_RESENT"
                AccessHistory.objects.create(
                    access_request=obj,
                    action=action_text,
                    performed_by=request.user,
                    notes=f"Approval requested from {obj.approver_email}"
                )

        super().save_model(request, obj, form, change)

        try:
            if is_new:
                send_request_notification(obj)
            elif change:
                if old_status and old_status != obj.status:
                    notes = form.cleaned_data.get('notes', '')
                    AccessHistory.objects.create(
                        access_request=obj,
                        action=f"Status changed from {old_status} to {obj.status}",
                        performed_by=request.user,
                        notes=notes
                    )
                    send_status_notification(obj, old_status, notes)
                    
                    if obj.status == 'APPROVED':
                        send_final_approval_notification(obj)
                
                if approver_changed:
                    from .utils import send_approval_request_notification
                    result = send_approval_request_notification(obj, form.cleaned_data.get('notes', ''))
                    if result:
                        self.message_user(request, f"Approval request sent to {obj.approver_email}")
                    else:
                        self.message_user(request, f"Failed to send approval request to {obj.approver_email}", level='ERROR')
                        
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            import traceback
            traceback.print_exc()

    def response_change(self, request, obj):
        """Handle custom submit buttons on the change form."""
        import uuid
        import datetime
        from .utils import send_approval_request_notification

        if "_send_approval" in request.POST:
            if not obj.approver_email:
                self.message_user(request, "Set Approver Email before sending approval request.", level='ERROR')
                return super().response_change(request, obj)

            old_status = obj.status
            obj.status = 'APPROVAL_REQUIRED'
            obj.approval_token = uuid.uuid4().hex
            obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=1)
            obj.save()

            AccessHistory.objects.create(
                access_request=obj,
                action='APPROVAL_REQUESTED',
                performed_by=request.user,
                notes=f"Approval requested from {obj.approver_email}"
            )

            notes = request.POST.get('notes', '')
            send_approval_request_notification(obj, notes)
            self.message_user(request, f"Approval request sent to {obj.approver_email}")
            return HttpResponseRedirect(".")

        if "_approve_now" in request.POST:
            old_status = obj.status
            obj.status = 'APPROVED'
            obj.approved_by = request.user
            obj.approved_at = timezone.now()
            obj.save()

            AccessHistory.objects.create(
                access_request=obj,
                action='APPROVED',
                performed_by=request.user,
                notes=request.POST.get('notes', '')
            )

            send_status_notification(obj, old_status, request.POST.get('notes', ''))
            self.message_user(request, "Request approved.")
            return HttpResponseRedirect(".")

        if "_reject_now" in request.POST:
            old_status = obj.status
            obj.status = 'REJECTED'
            obj.save()

            AccessHistory.objects.create(
                access_request=obj,
                action='REJECTED',
                performed_by=request.user,
                notes=request.POST.get('notes', '')
            )

            send_status_notification(obj, old_status, request.POST.get('notes', ''))
            self.message_user(request, "Request rejected.")
            return HttpResponseRedirect(".")

        return super().response_change(request, obj)

    def send_assignment_notification(self, obj, assigned_by):
        subject = f'Access Request Assigned - {obj.ticket_number}'
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user.get_full_name() or obj.user.username,
            'resource': obj.resource.name if obj.resource else 'N/A',
            'access_level': obj.access_level.name if obj.access_level else 'N/A',
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