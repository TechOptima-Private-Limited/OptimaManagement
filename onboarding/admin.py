
# from django.contrib import admin
# from django.utils.html import format_html
# from django.urls import reverse, path
# from django.shortcuts import render, redirect
# from django.http import HttpResponse, HttpResponseRedirect
# from django.contrib import messages
# from django.utils import timezone
# from .models import Employee, Offboarding, ITSupporter, OnboardingLink
# import time
# import base64

# class ITSupporterAdmin(admin.ModelAdmin):
#     list_display = ['name', 'email', 'is_active', 'created_at']
#     list_filter = ['is_active', 'created_at']
#     search_fields = ['name', 'email']
#     list_display_links = ['name']
    
#     fieldsets = (
#         ('IT Supporter Information', {
#             'fields': ('name', 'email', 'is_active')
#         }),
#     )

# class EmployeeAdmin(admin.ModelAdmin):
#     list_display = [
#         'full_name_display', 'email', 'company_email_display', 'phone_number', 'department', 'position', 'employee_type', 
#         'submission_status', 'mandatory_docs_status', 'all_docs_status', 'files_status', 'it_status', 'soft_delete_status', 'actions_column'
#     ]
#     list_filter = [
#         'employee_type', 'department', 'position', 'is_self_submitted', 
#         'it_notification_sent', 'submitted_at', 'is_deleted'
#     ]
#     search_fields = ['first_name', 'last_name', 'email', 'company_email', 'phone_number', 'department', 'position']
#     list_display_links = ['full_name_display']
#     date_hierarchy = 'submitted_at'
    
#     # Custom actions
#     actions = ['show_onboarding_employees', 'show_all_employees']
    
#     fieldsets = (
#         ('Basic Information', {
#             'fields': (
#                 'first_name', 'last_name', 'email', 'company_email', 'phone_number', 'employee_type', 'employee_id', 'department', 'position', 
#                 'current_address', 'permanent_address', 'joining_date'
#             )
#         }),
#         ('Submission Information', {
#             'fields': ('is_self_submitted', 'submitted_at'),
#             'classes': ('collapse',),
#             'description': 'Information about employee submission status.'
#         }),
#         ('Mandatory Document Collection', {
#             'fields': (
#                 ('aadhar_pan_collected', 'aadhar_pan_file'),
#                 ('educational_certificates_collected', 'educational_certificates_file'),
#                 ('bank_statements_collected', 'bank_statements_file'),
#                 ('previous_offer_letter_collected', 'previous_offer_letter_file'),
#             ),
#             'classes': ('collapse',),
#             'description': 'MANDATORY documents required for onboarding. Check the box when document is collected and upload the file.'
#         }),
#         ('Optional Document Collection', {
#             'fields': (
#                 ('payslips_collected', 'payslips_file'),
#                 ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
#                 ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
#             ),
#             'classes': ('collapse',),
#             'description': 'OPTIONAL documents. Check the box when document is collected and upload the file.'
#         }),
#         ('IT Notification', {
#             'fields': ('it_notification_sent',),
#             'classes': ('collapse',),
#             'description': 'Track if IT team has been notified for asset assignment.'
#         }),
#         ('Soft Delete Information', {
#             'fields': ('is_deleted', 'deleted_at'),
#             'classes': ('collapse',),
#             'description': 'Soft delete status and information.'
#         }),
#     )
    
#     readonly_fields = ['is_self_submitted', 'submitted_at', 'it_notification_sent', 'deleted_at']
    
#     def get_queryset(self, request):
#         """Override to show all employees including soft-deleted ones in admin"""
#         return Employee.all_objects.filter(is_deleted=False)

    
#     def get_actions(self, request):
#         """Override to remove the default delete action"""
#         actions = super().get_actions(request)
#         if 'delete_selected' in actions:
#             del actions['delete_selected']
#         return actions
    
#     def show_onboarding_employees(self, request, queryset):
#         """Custom action to show only active (onboarding) employees"""
#         # Get counts for the message
#         total_count = Employee.all_objects.count()
#         active_count = Employee.objects.count()
#         deleted_count = total_count - active_count
        
#         # Create informative message
#         if deleted_count > 0:
#             message = (
#                 f"Filtered to show {active_count} active onboarding employees. "
#                 f"{deleted_count} deleted employees are now hidden. "
#                 f"Use the 'is deleted' filter to show all employees again."
#             )
#         else:
#             message = f"Showing all {active_count} onboarding employees (no deleted employees found)."
        
#         self.message_user(request, message, level='info')
        
#         # Redirect to filtered view
#         from django.http import HttpResponseRedirect
#         from django.urls import reverse
        
#         url = reverse('admin:onboarding_employee_changelist')
#         return HttpResponseRedirect(f"{url}?is_deleted__exact=0")
    
#     show_onboarding_employees.short_description = "Show onboarding employees (active only)"
    
#     def response_action(self, request, queryset):
#         """Override to handle our custom actions properly"""
#         action = request.POST.get('action')
        
#         if action == 'show_onboarding_employees':
#             return self.show_onboarding_employees(request, queryset)
#         elif action == 'show_all_employees':
#             return self.show_all_employees(request, queryset)
        
#         return super().response_action(request, queryset)
    
#     def full_name_display(self, obj):
#         name = obj.full_name
#         if obj.is_deleted:
#             return format_html('<span style="color: #dc3545; text-decoration: line-through;">{} [DELETED]</span>', name)
#         return name
#     full_name_display.short_description = 'Name'
    
#     def company_email_display(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
#         elif obj.company_email:
#             return format_html('<span style="color: #007bff; font-weight: bold;">{}</span>', obj.company_email)
#         else:
#             return format_html('<span style="color: #ffc107;">Not Set</span>')
#     company_email_display.short_description = 'Company Email'
#     def formfield_for_dbfield(self, db_field, request, **kwargs):
#         formfield = super().formfield_for_dbfield(db_field, request, **kwargs)

#         # List of file fields where we want to add download links
#         file_fields = [
#             'aadhar_pan_file',
#             'educational_certificates_file',
#             'bank_statements_file',
#             'previous_offer_letter_file',
#             'payslips_file',
#             'relieving_experience_letters_file',
#             'appraisal_hike_letters_file',
#         ]
#         from django.utils.safestring import mark_safe

#         if db_field.name in file_fields:
#             original_help_text = formfield.help_text or ''
#             obj_id = request.resolver_match.kwargs.get('object_id')

#             if obj_id:
#                 from .models import Employee
#                 try:
#                     employee = Employee.all_objects.get(pk=obj_id)
#                     file_field = getattr(employee, db_field.name)
                    
#                     if file_field:
#                         # File exists - show download link
#                         file_url = file_field.url
#                         download_html = f'<br><a href="{file_url}" download style="color: #007bff; font-weight: 600;" target="_blank">⬇ Download current file</a>'
#                         formfield.help_text = mark_safe(original_help_text + download_html)
#                     else:
#                         # No file uploaded yet - show informative message
#                         no_file_html = f'<br><span style="color: #6c757d; font-style: italic;">No file uploaded yet</span>'
#                         formfield.help_text = mark_safe(original_help_text + no_file_html)
                        
#                 except Employee.DoesNotExist:
#                     pass

#         return formfield
#     formfield_for_dbfield.short_description = 'Actions'
#     def submission_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #dc3545;">🗑️ Deleted</span>')
#         elif obj.is_self_submitted:
#             return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
#         else:
#             return format_html('<span style="color: orange;">⏳ Pending</span>')
#     submission_status.short_description = 'Onboarding Status'
    
#     def mandatory_docs_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
#         elif obj.mandatory_documents_collected:
#             return format_html('<span style="color: green;">✓ Complete</span>')
#         else:
#             return format_html('<span style="color: red;">✗ Incomplete</span>')
#     mandatory_docs_status.short_description = 'Mandatory Docs'
    
#     def all_docs_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
#         elif obj.all_documents_collected:
#             return format_html('<span style="color: green;">✓ All Complete</span>')
#         else:
#             return format_html('<span style="color: orange;">⚠ Partial</span>')
#     all_docs_status.short_description = 'All Documents'
    
#     def files_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
            
#         # Count mandatory files
#         mandatory_files_uploaded = 0
#         total_mandatory_files = 4
        
#         if obj.aadhar_pan_file:
#             mandatory_files_uploaded += 1
#         if obj.educational_certificates_file:
#             mandatory_files_uploaded += 1
#         if obj.bank_statements_file:
#             mandatory_files_uploaded += 1
#         if obj.previous_offer_letter_file:
#             mandatory_files_uploaded += 1
            
#         # Count optional files
#         optional_files_uploaded = 0
#         total_optional_files = 3
        
#         if obj.payslips_file:
#             optional_files_uploaded += 1
#         if obj.relieving_experience_letters_file:
#             optional_files_uploaded += 1
#         if obj.appraisal_hike_letters_file:
#             optional_files_uploaded += 1
            
#         if mandatory_files_uploaded == total_mandatory_files:
#             if optional_files_uploaded == total_optional_files:
#                 return format_html('<span style="color: green;">✓ All Files ({}/{}+{}/{})</span>', 
#                                  mandatory_files_uploaded, total_mandatory_files, optional_files_uploaded, total_optional_files)
#             else:
#                 return format_html('<span style="color: #28a745;">✓ Mandatory ({}/{}) + Opt ({}/{})</span>', 
#                                  mandatory_files_uploaded, total_mandatory_files, optional_files_uploaded, total_optional_files)
#         elif mandatory_files_uploaded > 0:
#             return format_html('<span style="color: orange;">⚠ Partial Mandatory ({}/{})</span>', mandatory_files_uploaded, total_mandatory_files)
#         else:
#             return format_html('<span style="color: red;">✗ No Files</span>')
#     files_status.short_description = 'Files Uploaded'
    
#     def it_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
#         elif obj.it_notification_sent:
#             return format_html('<span style="color: green;">✓ Notified</span>')
#         else:
#             return format_html('<span style="color: orange;">⚠ Ready to Notify</span>')
#     it_status.short_description = 'IT Status'
    
#     def soft_delete_status(self, obj):
#         if obj.is_deleted:
#             deleted_date = obj.deleted_at.strftime('%Y-%m-%d %H:%M') if obj.deleted_at else 'Unknown'
#             return format_html('<span style="color: #dc3545;">🗑️ Deleted on {}</span>', deleted_date)
#         else:
#             return format_html('<span style="color: green;">✓ Active</span>')
#     soft_delete_status.short_description = 'Status'
    
#     def actions_column(self, obj):
#         if obj.is_deleted:
#             # Show restore button for deleted employees
#             return format_html(
#                 '<a class="button" href="{}" style="background: #28a745; color: white;">Restore</a>',
#                 reverse('admin:restore_employee', args=[obj.pk])
#             )
#         else:
#             # Show edit and permanent delete buttons for active employees
#             edit_url = reverse('admin:onboarding_employee_change', args=[obj.pk])
#             delete_url = reverse('admin:permanent_delete_employee', args=[obj.pk])
#             return format_html(
#                 '<div style="display: flex; gap: 5px;">'
#                 '<a class="button" href="{}" style="margin-right: 5px;">Edit</a>'
#                 '<a class="button" href="{}" style="background: #dc3545; color: white;" onclick="return confirm(\'⚠️ WARNING: This will PERMANENTLY delete this employee and their user account from the database. This action CANNOT be undone!\\n\\nEmployee: {}\\n\\nAre you absolutely sure you want to continue?\')">Permanent Delete</a>'
#                 '</div>',
#                 edit_url, delete_url, obj.full_name
#             )
#     actions_column.short_description = 'Actions'
#     actions_column.allow_tags = True
    
#     def get_urls(self):
#         urls = super().get_urls()
#         custom_urls = [
#             path('permanent-delete/<int:employee_id>/', self.admin_site.admin_view(self.permanent_delete_employee), name='permanent_delete_employee'),
#             path('restore/<int:employee_id>/', self.admin_site.admin_view(self.restore_employee), name='restore_employee'),
#             path('onboarding-only/', self.admin_site.admin_view(self.onboarding_only_view), name='onboarding_employees_only'),
            
#         ]
#         return custom_urls + urls
    
#     def onboarding_only_view(self, request):
#         """Custom view to show only active onboarding employees"""
#         from django.http import HttpResponseRedirect
#         from django.urls import reverse
        
#         # Redirect to main changelist with filter applied
#         url = reverse('admin:onboarding_employee_changelist')
#         return HttpResponseRedirect(f"{url}?is_deleted__exact=0")
    
#     def changelist_view(self, request, extra_context=None):
#         """Override changelist view to add custom context and helpful information"""
#         extra_context = extra_context or {}
        
#         # Add information about current view
#         is_filtered_active_only = request.GET.get('is_deleted__exact') == '0'
#         is_filtered_deleted_only = request.GET.get('is_deleted__exact') == '1'
        
#         # Get counts
#         total_count = Employee.all_objects.count()
#         active_count = Employee.objects.count()
#         deleted_count = total_count - active_count
        
#         if is_filtered_active_only:
#             extra_context['current_view'] = f'Showing {active_count} Active Onboarding Employees'
#             extra_context['view_info'] = f'{deleted_count} deleted employees are hidden'
#         elif is_filtered_deleted_only:
#             extra_context['current_view'] = f'Showing {deleted_count} Deleted Employees Only'
#             extra_context['view_info'] = f'{active_count} active employees are hidden'
#         else:
#             extra_context['current_view'] = f'Showing All {total_count} Employees'
#             extra_context['view_info'] = f'{active_count} active, {deleted_count} deleted'
        
#         # Add quick action buttons info
#         extra_context['quick_actions_help'] = (
#             'Use the Actions dropdown above to quickly filter employees: '
#             '"Show onboarding employees" for active only, "Show all employees" for complete list.'
#         )
        
#         return super().changelist_view(request, extra_context)
    
#     def permanent_delete_employee(self, request, employee_id):
#         """Custom view to permanently delete an employee and their user account"""
#         try:
#             employee = Employee.all_objects.get(id=employee_id)
#             employee_name = employee.full_name
            
#             # First, delete associated User account (if exists)
#             from django.contrib.auth.models import User
#             user_deleted = False
            
#             # Check company email first, then personal email
#             user = User.objects.filter(email=employee.company_email).first()
#             if not user and employee.email:
#                 user = User.objects.filter(email=employee.email).first()
                
#             if user:
#                 user_email = user.email
#                 user.delete()  # Permanent delete from User table
#                 user_deleted = True
#                 print(f"🗑️ PERMANENTLY DELETED User: {user_email}")
            
#             # Then permanently delete the Employee record
#             employee.delete()  # This is permanent delete, not soft delete
#             print(f"🗑️ PERMANENTLY DELETED Employee: {employee_name}")
            
#             # Success message
#             if user_deleted:
#                 messages.success(
#                     request, 
#                     f'Employee "{employee_name}" and their user account have been permanently deleted from the database.'
#                 )
#             else:
#                 messages.success(
#                     request, 
#                     f'Employee "{employee_name}" has been permanently deleted from the database. No associated user account was found.'
#                 )
                
#         except Employee.DoesNotExist:
#             messages.error(request, 'Employee not found.')
#         except Exception as e:
#             messages.error(request, f'Error deleting employee: {str(e)}')
        
#         return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
#     def restore_employee(self, request, employee_id):
#         """Custom view to restore a soft deleted employee"""
#         try:
#             employee = Employee.all_objects.get(id=employee_id)
#             print("🔁 Restore triggered for employee:", employee.company_email or employee.email)

#             if employee.is_deleted:
#                 employee.restore()
#                 employee.save()  # 🔑 ensure the changes (like `is_deleted = False`) are persisted

#                 # Reactivate associated User (if exists) - check company email first
#                 from django.contrib.auth.models import User
#                 user = User.objects.filter(email=employee.company_email).first()
#                 if not user:
#                     user = User.objects.filter(email=employee.email).first()
                    
#                 if user:
#                     user.is_active = True
#                     user.save()
#                 messages.success(request, f'Employee "{employee.full_name}" has been restored successfully.')
#             else:
#                 messages.warning(request, f'Employee "{employee.full_name}" is not deleted.')
#         except Employee.DoesNotExist:
#             messages.error(request, 'Employee not found.')
        
#         return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
#     def delete_model(self, request, obj):
#         """Override delete_model to perform soft delete instead of hard delete"""
#         if not obj.is_deleted:
#             obj.soft_delete()
#             messages.success(request, f'Employee "{obj.full_name}" has been soft deleted.')
#         else:
#             messages.warning(request, f'Employee "{obj.full_name}" is already deleted.')
    
#     def delete_queryset(self, request, queryset):
#         """Override bulk delete to perform soft delete"""
#         count = 0
#         for obj in queryset:
#             if not obj.is_deleted:
#                 obj.soft_delete()
#                 count += 1
        
#         if count > 0:
#             messages.success(request, f'{count} employee(s) have been soft deleted.')
#         else:
#             messages.warning(request, 'No active employees were selected for deletion.')
    
#     def has_delete_permission(self, request, obj=None):
#         """Allow delete permission (we're doing soft delete anyway)"""
#         return True

#     def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
#         """Add JavaScript for conditional save button with enhanced UI"""
#         response = super().render_change_form(request, context, add, change, form_url, obj)
        
#         if change and obj and obj.is_self_submitted:
#             # Check which fields are missing
#             missing_fields = []
#             if not obj.employee_id:
#                 missing_fields.append('employee_id')
#             if not obj.company_email:
#                 missing_fields.append('company_email')
#             if not obj.department:
#                 missing_fields.append('department')
#             if not obj.position:
#                 missing_fields.append('position')
#             if not obj.employee_type:
#                 missing_fields.append('employee_type')
            
#             has_missing_fields = len(missing_fields) > 0
            
#             additional_js = f"""
#             <script>
#             document.addEventListener('DOMContentLoaded', function() {{
#                 // Configuration
#                 const requiredFields = ['employee_id', 'company_email', 'department', 'position', 'employee_type'];
#                 const fieldLabels = {{
#                     'employee_id': 'Employee ID',
#                     'company_email': 'Company Email',
#                     'department': 'Department',
#                     'position': 'Position',
#                     'employee_type': 'Employee Type'
#                 }};
                
#                 const saveButtons = document.querySelectorAll('input[name="_save"], input[name="_continue"], input[name="_addanother"]');
#                 const hasMissingFields = {str(has_missing_fields).lower()};
                
#                 // Add main status banner
#                 function createStatusBanner() {{
#                     const banner = document.createElement('div');
#                     banner.id = 'hr-completion-banner';
#                     banner.style.cssText = `
#                         margin: 20px 0;
#                         padding: 20px;
#                         border-radius: 10px;
#                         font-size: 16px;
#                         font-weight: 600;
#                         box-shadow: 0 4px 8px rgba(0,0,0,0.1);
#                     `;
                    
#                     const contentDiv = document.querySelector('#content') || document.querySelector('.colM');
#                     if (contentDiv) {{
#                         contentDiv.insertBefore(banner, contentDiv.firstChild);
#                     }}
                    
#                     return banner;
#                 }}
                
#                 // Update banner content
#                 function updateStatusBanner(allComplete, missingFields) {{
#                     let banner = document.getElementById('hr-completion-banner');
#                     if (!banner) {{
#                         banner = createStatusBanner();
#                     }}
                    
#                     if (allComplete) {{
#                         banner.innerHTML = `
#                             <div style="display: flex; align-items: center; gap: 15px;">
#                                 <div style="font-size: 24px;">✅</div>
#                                 <div>
#                                     <strong style="color: #155724;">Employment Details Complete!</strong><br>
#                                     <span style="color: #6c757d; font-weight: normal;">All required HR fields have been filled. You can now save the employee record.</span>
#                                 </div>
#                             </div>
#                         `;
#                         banner.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
#                         banner.style.border = '2px solid #28a745';
#                     }} else {{
#                         const missingList = missingFields.map(field => fieldLabels[field] || field).join(', ');
#                         banner.innerHTML = `
#                             <div style="display: flex; align-items: center; gap: 15px;">
#                                 <div style="font-size: 24px;">⚠️</div>
#                                 <div>
#                                     <strong style="color: #856404;">HR Action Required</strong><br>
#                                     <span style="color: #6c757d; font-weight: normal;">Please complete the following employment details to enable saving:</span><br>
#                                     <em style="color: #856404;">${{missingList}}</em>
#                                 </div>
#                             </div>
#                         `;
#                         banner.style.background = 'linear-gradient(135deg, #fff3cd, #ffeaa7)';
#                         banner.style.border = '2px solid #ffc107';
#                     }}
#                 }}
                
#                 // Enhanced field validation
#                 function checkRequiredFields() {{
#                     let allFieldsFilled = true;
#                     let missingFields = [];
                    
#                     requiredFields.forEach(function(fieldName) {{
#                         const field = document.getElementById('id_' + fieldName);
#                         if (field) {{
#                             const isEmpty = !field.value || field.value.trim() === '';
#                             if (isEmpty) {{
#                                 allFieldsFilled = false;
#                                 missingFields.push(fieldName);
                                
#                                 // Highlight empty required fields
#                                 field.style.cssText += `
#                                     border: 2px solid #dc3545 !important;
#                                     box-shadow: 0 0 8px rgba(220, 53, 69, 0.3) !important;
#                                 `;
                                
#                                 // Add required indicator to label
#                                 const label = document.querySelector(`label[for="id_${{fieldName}}"]`);
#                                 if (label && !label.querySelector('.required-indicator')) {{
#                                     const indicator = document.createElement('span');
#                                     indicator.className = 'required-indicator';
#                                     indicator.innerHTML = ' <strong style="color: #dc3545;">*REQUIRED*</strong>';
#                                     label.appendChild(indicator);
#                                 }}
#                             }} else {{
#                                 // Field is filled - remove highlighting
#                                 field.style.border = '';
#                                 field.style.boxShadow = '';
                                
#                                 // Remove required indicator
#                                 const label = document.querySelector(`label[for="id_${{fieldName}}"]`);
#                                 if (label) {{
#                                     const indicator = label.querySelector('.required-indicator');
#                                     if (indicator) indicator.remove();
#                                 }}
#                             }}
#                         }}
#                     }});
                    
#                     // Update save buttons
#                     saveButtons.forEach(function(button) {{
#                         if (allFieldsFilled) {{
#                             button.disabled = false;
#                             button.style.cssText += `
#                                 opacity: 1 !important;
#                                 cursor: pointer !important;
#                                 background: #28a745 !important;
#                                 border-color: #28a745 !important;
#                             `;
#                             button.title = '';
#                         }} else {{
#                             button.disabled = true;
#                             button.style.cssText += `
#                                 opacity: 0.5 !important;
#                                 cursor: not-allowed !important;
#                                 background: #6c757d !important;
#                                 border-color: #6c757d !important;
#                             `;
#                             button.title = `Please complete: ${{missingFields.map(f => fieldLabels[f] || f).join(', ')}}`;
#                         }}
#                     }});
                    
#                     // Update status banner
#                     updateStatusBanner(allFieldsFilled, missingFields);
#                 }}
                
#                 // Add event listeners
#                 requiredFields.forEach(function(fieldName) {{
#                     const field = document.getElementById('id_' + fieldName);
#                     if (field) {{
#                         field.addEventListener('input', checkRequiredFields);
#                         field.addEventListener('change', checkRequiredFields);
#                         field.addEventListener('blur', checkRequiredFields);
#                     }}
#                 }});
                
#                 // Initial check
#                 if (hasMissingFields) {{
#                     checkRequiredFields();
#                 }}
                
#                 // Add helpful tooltip to Basic Information fieldset
#                 const basicInfoFieldset = document.querySelector('fieldset');
#                 if (basicInfoFieldset && hasMissingFields) {{
#                     const legend = basicInfoFieldset.querySelector('h2');
#                     if (legend) {{
#                         legend.style.cssText += 'color: #dc3545; font-weight: bold;';
#                         legend.innerHTML += ' <span style="font-size: 14px; color: #856404;">(⚠️ HR Completion Required)</span>';
#                     }}
#                 }}
                
#                 // Prevent form submission if fields are incomplete
#                 const form = document.querySelector('#content form');
#                 if (form) {{
#                     form.addEventListener('submit', function(e) {{
#                         let hasIncomplete = false;
#                         requiredFields.forEach(function(fieldName) {{
#                             const field = document.getElementById('id_' + fieldName);
#                             if (field && (!field.value || field.value.trim() === '')) {{
#                                 hasIncomplete = true;
#                             }}
#                         }});
                        
#                         if (hasIncomplete) {{
#                             e.preventDefault();
#                             alert('⚠️ Please complete all required employment details before saving.');
#                             return false;
#                         }}
#                     }});
#                 }}
#             }});
#             </script>
#             """
            
#             # FIXED: Render the response first before accessing content
#             response.render()  # This line fixes the error
            
#             # Now we can safely access and modify the content
#             content = response.content.decode('utf-8')
#             content = content.replace('</body>', additional_js + '</body>')
#             response.content = content.encode('utf-8')
        
#         return response
    
# from django.contrib.auth.models import User

# # In admin.py - Enhanced OffboardingAdmin

# class OffboardingAdmin(admin.ModelAdmin):
#     list_display = ['user_display', 'last_working_date', 'created_at']
#     list_filter = ['last_working_date', 'created_at']
#     search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email']
#     list_display_links = ['user_display']
#     date_hierarchy = 'last_working_date'
    
#     fieldsets = (
#         ('Employee Information', {
#             'fields': ('user', 'last_working_date')
#         }),
#         ('Additional Information', {
#             'fields': ('remarks',),
#             'classes': ('collapse',),
#             'description': 'Optional remarks about the offboarding process.'
#         }),
#     )
    
#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('user')

#     def formfield_for_foreignkey(self, db_field, request, **kwargs):
#         if db_field.name == "user":
#             kwargs["queryset"] = User.objects.filter(is_active=True).order_by('username')
#         return super().formfield_for_foreignkey(db_field, request, **kwargs)

#     def user_display(self, obj):
#         if obj.user.first_name or obj.user.last_name:
#             full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
#             return format_html('<strong>{}</strong><br><small style="color: #666;">@{}</small>', 
#                                full_name, obj.user.username)
#         return format_html('<strong>@{}</strong>', obj.user.username)
#     user_display.short_description = 'Employee'
#     user_display.admin_order_field = 'user__username'

#     def response_add(self, request, obj, post_url_continue=None):
#         self.message_user(
#             request, 
#             f"Offboarding record created for {obj.user.first_name} {obj.user.last_name}. "
#             f"The following actions have been automatically completed: "
#             f"✅ Employee record soft deleted, "
#             f"✅ User account deactivated, "
#             f"✅ IT team notified for asset collection.",
#             level='success'
#         )
#         return super().response_add(request, obj, post_url_continue)

# class OnboardingLinkAdmin(admin.ModelAdmin):
    
#     def changelist_view(self, request, extra_context=None):
#         """Show the link generator instead of a normal list"""
        
#         html_content = '''
#         <!DOCTYPE html>
#         <html>
#         <head>
#             <title>Generate Onboarding Link</title>
#             <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
#             <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
#         </head>
#         <body class="app-onboarding model-onboardinglink change-list">
#             <div id="container">
#                 <div id="header">
#                     <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
#                     <div id="user-tools">
#                         <a href="/admin/">Home</a> / 
#                         <a href="/admin/onboarding/">Onboarding</a> / 
#                         Generate Link
#                     </div>
#                 </div>
                
#                 <div class="breadcrumbs">
#                     <a href="/admin/">Home</a> &rsaquo; 
#                     <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
#                     Onboarding Links
#                 </div>
                
#                 <div id="content" class="colM">
#                    <button onclick="window.history.back()" 
#                             style="margin-bottom: 20px; padding: 10px 20px; font-size: 16px; 
#                                 background: linear-gradient(135deg, #007bff, #0056b3); 
#                                 color: white; border: none; border-radius: 5px; cursor: pointer; 
#                                 font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3);">
#                         ← Back
#                     </button>


                    
#                     <div class="module aligned">
#                         <div style="text-align: center; padding: 60px 40px; background: #f8f9fa; border-radius: 12px; margin: 30px 0; border: 1px solid #e9ecef;">
#                             <h2 style="color: #343a40; margin-bottom: 25px; font-size: 28px;">🔗 Onboarding Link Generator</h2>
#                             <p style="color: #6c757d; margin-bottom: 35px; font-size: 18px; line-height: 1.5;">
#                                 Generate a onboarding link that employees can use to submit their information.<br>
#                                 The link will be valid for 7 days from the time of generation.
#                             </p>
                            
#                             <button onclick="generateNewLink()" id="generate-btn"
#                                 style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 18px 36px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3); transition: all 0.3s ease;">
#                                 Generate New Link
#                             </button>
                            
#                             <div id="generated-link-container" style="display: none; margin-top: 40px; padding: 30px; background: white; border-radius: 10px; border: 2px solid #28a745; box-shadow: 0 6px 20px rgba(40,167,69,0.15);">
#                                 <h3 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">
#                                     ✅ Link Generated Successfully!
#                                 </h3>
                                
#                                 <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
#                                     <div style="color: #0c5460; font-weight: 600; margin-bottom: 5px;">📅 Link Information:</div>
#                                     <div style="color: #0c5460;">
#                                         <strong>Created:</strong> <span id="created-time"></span><br>
#                                         <strong>Expires:</strong> <span id="expiry-time"></span>
#                                     </div>
#                                 </div>
                                
#                                 <div style="text-align: left; margin: 20px 0;">
#                                     <label style="font-weight: 600; color: #495057; display: block; margin-bottom: 8px;">
#                                         Generated Onboarding Link:
#                                     </label>
#                                     <textarea id="generated-link-input" 
#                                         style="width: 100%; height: 100px; padding: 15px; font-family: 'Courier New', monospace; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px; resize: none; background: #f8f9fa;" 
#                                         readonly></textarea>
#                                 </div>
                                
#                                 <div style="margin: 25px 0;">
#                                     <button onclick="copyGeneratedLink()" id="copy-btn"
#                                         style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; margin-right: 15px;">
#                                         📋 Copy Link
#                                     </button>
#                                     <span id="copy-status" style="color: #28a745; font-weight: 600; font-size: 16px;"></span>
#                                 </div>
                                
#                                 <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin-top: 25px; text-align: left;">
#                                     <div style="color: #856404; font-weight: 600; margin-bottom: 8px;">
#                                         ⚠️ Important Instructions:
#                                     </div>
#                                     <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
#                                         <li>This link expires in <strong>7 days</strong></li>
#                                         <li>Send this link to employees via email</li>
#                                         <li>Each employee can use this same link</li>
#                                         <li>Once an employee submits, they cannot submit again</li>
#                                         <li><strong>Note:</strong> Employees will fill personal info and upload documents. HR will complete employment details and set company email after review.</li>
#                                     </ul>
#                                 </div>
#                             </div>
#                         </div>
#                     </div>
#                 </div>
#             </div>
            
#             <script>
#                 function generateNewLink() {
#                     const timestamp = Math.floor(Date.now() / 1000);
#                     const data = "GENERIC_" + timestamp;
#                     const encoded = btoa(data);
#                     const link = window.location.origin + "/en/onboarding/employee-onboarding/" + encoded + "/";
                    
#                     // Show creation and expiry dates
#                     const createdDate = new Date(timestamp * 1000);
#                     const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                    
#                     document.getElementById("created-time").textContent = createdDate.toLocaleString();
#                     document.getElementById("expiry-time").textContent = expiryDate.toLocaleString();
#                     document.getElementById("generated-link-input").value = link;
#                     document.getElementById("generated-link-container").style.display = "block";
                    
#                     const btn = document.getElementById("generate-btn");
#                     btn.innerHTML = "✅ Link Generated!";
#                     btn.style.background = "linear-gradient(135deg, #28a745, #1e7e34)";
                    
#                     setTimeout(function() {
#                         btn.innerHTML = "Generate New Link";
#                         btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
#                     }, 3000);
                    
#                     // Scroll to the generated link
#                     document.getElementById("generated-link-container").scrollIntoView({ 
#                         behavior: 'smooth' 
#                     });
#                 }
                
#                 function copyGeneratedLink() {
#                     const input = document.getElementById("generated-link-input");
#                     input.select();
#                     input.setSelectionRange(0, 99999); // For mobile devices
                    
#                     try {
#                         document.execCommand("copy");
#                         document.getElementById("copy-status").innerHTML = "✅ Copied to Clipboard!";
                        
#                         const copyBtn = document.getElementById("copy-btn");
#                         copyBtn.style.background = "#20c997";
                        
#                         setTimeout(function() {
#                             document.getElementById("copy-status").innerHTML = "";
#                             copyBtn.style.background = "#28a745";
#                         }, 3000);
#                     } catch (err) {
#                         document.getElementById("copy-status").innerHTML = "❌ Copy failed - please select and copy manually";
#                         document.getElementById("copy-status").style.color = "#dc3545";
#                     }
#                 }
                
#                 // Add hover effects
#                 document.addEventListener('DOMContentLoaded', function() {
#                     const generateBtn = document.getElementById('generate-btn');
#                     generateBtn.addEventListener('mouseenter', function() {
#                         this.style.transform = 'translateY(-2px)';
#                         this.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
#                     });
#                     generateBtn.addEventListener('mouseleave', function() {
#                         this.style.transform = 'translateY(0)';
#                         this.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
#                     });
#                 });
#             </script>
#         </body>
#         </html>
#         '''
        
#         return HttpResponse(html_content)
    
#     def has_add_permission(self, request):
#         return False
    
#     def has_change_permission(self, request, obj=None):
#         return False
    
#     def has_delete_permission(self, request, obj=None):
#         return False


# # Register models
# admin.site.register(ITSupporter, ITSupporterAdmin)
# admin.site.register(Employee, EmployeeAdmin)
# admin.site.register(Offboarding, OffboardingAdmin)
# admin.site.register(OnboardingLink, OnboardingLinkAdmin)

# # Customize admin site header
# admin.site.site_header = "Techoptima HR Management"
# admin.site.site_title = "HR Admin"
# admin.site.index_title = "Welcome to HR Management Portal"



from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib import messages
from django.utils import timezone
from .models import Employee, Offboarding, ITSupporter, OnboardingLink
import time
import base64

class ITSupporterAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email']
    list_display_links = ['name']
    
    fieldsets = (
        ('IT Supporter Information', {
            'fields': ('name', 'email', 'is_active')
        }),
    )

class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        'full_name_display', 'email', 'company_email_display', 'phone_number', 'department', 'position', 'employee_type', 
        'submission_status', 'mandatory_docs_status', 'all_docs_status', 'files_status', 'it_status', 'soft_delete_status', 'actions_column'
    ]
    list_filter = [
        'employee_type', 'department', 'position', 'is_self_submitted', 
        'it_notification_sent', 'submitted_at', 'is_deleted'
    ]
    search_fields = ['first_name', 'last_name', 'email', 'company_email', 'phone_number', 'department', 'position']
    list_display_links = ['full_name_display']
    date_hierarchy = 'submitted_at'
    
    # Custom actions
    actions = ['show_onboarding_employees', 'show_all_employees']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'first_name', 'last_name', 'email', 'company_email', 'phone_number', 'employee_type', 'employee_id', 'department', 'position', 
                'current_address', 'permanent_address', 'joining_date'
            )
        }),
        ('Submission Information', {
            'fields': ('is_self_submitted', 'submitted_at'),
            'classes': ('collapse',),
            'description': 'Information about employee submission status.'
        }),
        ('Mandatory Document Collection', {
            'fields': (
                ('aadhar_pan_collected', 'aadhar_pan_file'),
                ('educational_certificates_collected', 'educational_certificates_file'),
                ('bank_statements_collected', 'bank_statements_file'),
                ('previous_offer_letter_collected', 'previous_offer_letter_file'),
            ),
            'classes': ('collapse',),
            'description': 'MANDATORY documents required for onboarding. Check the box when document is collected and upload the file.'
        }),
        ('Optional Document Collection', {
            'fields': (
                ('payslips_collected', 'payslips_file'),
                ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
                ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
            ),
            'classes': ('collapse',),
            'description': 'OPTIONAL documents. Check the box when document is collected and upload the file.'
        }),
        ('IT Notification', {
            'fields': ('it_notification_sent',),
            'classes': ('collapse',),
            'description': 'Track if IT team has been notified for asset assignment.'
        }),
        ('Soft Delete Information', {
            'fields': ('is_deleted', 'deleted_at'),
            'classes': ('collapse',),
            'description': 'Soft delete status and information.'
        }),
    )
    
    readonly_fields = ['is_self_submitted', 'submitted_at', 'it_notification_sent', 'deleted_at']
    
    def get_queryset(self, request):
        """Override to show all employees including soft-deleted ones in admin"""
        return Employee.all_objects.filter(is_deleted=False)

    
    def get_actions(self, request):
        """Override to remove the default delete action"""
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
    
    def show_onboarding_employees(self, request, queryset):
        """Custom action to show only active (onboarding) employees"""
        # Get counts for the message
        total_count = Employee.all_objects.count()
        active_count = Employee.objects.count()
        deleted_count = total_count - active_count
        
        # Create informative message
        if deleted_count > 0:
            message = (
                f"Filtered to show {active_count} active onboarding employees. "
                f"{deleted_count} deleted employees are now hidden. "
                f"Use the 'is deleted' filter to show all employees again."
            )
        else:
            message = f"Showing all {active_count} onboarding employees (no deleted employees found)."
        
        self.message_user(request, message, level='info')
        
        # Redirect to filtered view
        url = reverse('admin:onboarding_employee_changelist')
        return HttpResponseRedirect(f"{url}?is_deleted__exact=0")
    
    show_onboarding_employees.short_description = "Show onboarding employees (active only)"
    
    def show_all_employees(self, request, queryset):
        """Custom action to show all employees including deleted ones"""
        # Get counts for the message
        total_count = Employee.all_objects.count()
        active_count = Employee.objects.count()
        deleted_count = total_count - active_count
        
        # Create informative message
        message = (
            f"Showing all {total_count} employees: "
            f"{active_count} active, {deleted_count} deleted."
        )
        
        self.message_user(request, message, level='info')
        
        # Redirect to unfiltered view
        url = reverse('admin:onboarding_employee_changelist')
        return HttpResponseRedirect(url)
    
    show_all_employees.short_description = "Show all employees (including deleted)"
    
    def response_action(self, request, queryset):
        """Override to handle our custom actions properly"""
        action = request.POST.get('action')
        
        if action == 'show_onboarding_employees':
            return self.show_onboarding_employees(request, queryset)
        elif action == 'show_all_employees':
            return self.show_all_employees(request, queryset)
        
        return super().response_action(request, queryset)
    
    def full_name_display(self, obj):
        name = obj.full_name
        if obj.is_deleted:
            return format_html('<span style="color: #dc3545; text-decoration: line-through;">{} [DELETED]</span>', name)
        return name
    full_name_display.short_description = 'Name'
    
    def company_email_display(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
        elif obj.company_email:
            return format_html('<span style="color: #007bff; font-weight: bold;">{}</span>', obj.company_email)
        else:
            return format_html('<span style="color: #ffc107;">Not Set</span>')
    company_email_display.short_description = 'Company Email'
    
    def formfield_for_dbfield(self, db_field, request, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)

        # List of file fields where we want to add download links
        file_fields = [
            'aadhar_pan_file',
            'educational_certificates_file',
            'bank_statements_file',
            'previous_offer_letter_file',
            'payslips_file',
            'relieving_experience_letters_file',
            'appraisal_hike_letters_file',
        ]
        from django.utils.safestring import mark_safe

        if db_field.name in file_fields:
            original_help_text = formfield.help_text or ''
            obj_id = request.resolver_match.kwargs.get('object_id')

            if obj_id:
                from .models import Employee
                try:
                    employee = Employee.all_objects.get(pk=obj_id)
                    file_field = getattr(employee, db_field.name)
                    
                    if file_field:
                        # File exists - show download link
                        file_url = file_field.url
                        download_html = f'<br><a href="{file_url}" download style="color: #007bff; font-weight: 600;" target="_blank">⬇ Download current file</a>'
                        formfield.help_text = mark_safe(original_help_text + download_html)
                    else:
                        # No file uploaded yet - show informative message
                        no_file_html = f'<br><span style="color: #6c757d; font-style: italic;">No file uploaded yet</span>'
                        formfield.help_text = mark_safe(original_help_text + no_file_html)
                        
                except Employee.DoesNotExist:
                    pass

        return formfield
    
    def submission_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #dc3545;">🗑️ Deleted</span>')
        elif obj.is_self_submitted:
            return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
        else:
            return format_html('<span style="color: orange;">⏳ Pending</span>')
    submission_status.short_description = 'Onboarding Status'
    
    def mandatory_docs_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
        elif obj.mandatory_documents_collected:
            return format_html('<span style="color: green;">✓ Complete</span>')
        else:
            return format_html('<span style="color: red;">✗ Incomplete</span>')
    mandatory_docs_status.short_description = 'Mandatory Docs'
    
    def all_docs_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
        elif obj.all_documents_collected:
            return format_html('<span style="color: green;">✓ All Complete</span>')
        else:
            return format_html('<span style="color: orange;">⚠ Partial</span>')
    all_docs_status.short_description = 'All Documents'
    
    def files_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
            
        # Count mandatory files
        mandatory_files_uploaded = 0
        total_mandatory_files = 4
        
        if obj.aadhar_pan_file:
            mandatory_files_uploaded += 1
        if obj.educational_certificates_file:
            mandatory_files_uploaded += 1
        if obj.bank_statements_file:
            mandatory_files_uploaded += 1
        if obj.previous_offer_letter_file:
            mandatory_files_uploaded += 1
            
        # Count optional files
        optional_files_uploaded = 0
        total_optional_files = 3
        
        if obj.payslips_file:
            optional_files_uploaded += 1
        if obj.relieving_experience_letters_file:
            optional_files_uploaded += 1
        if obj.appraisal_hike_letters_file:
            optional_files_uploaded += 1
            
        if mandatory_files_uploaded == total_mandatory_files:
            if optional_files_uploaded == total_optional_files:
                return format_html('<span style="color: green;">✓ All Files ({}/{}+{}/{})</span>', 
                                 mandatory_files_uploaded, total_mandatory_files, optional_files_uploaded, total_optional_files)
            else:
                return format_html('<span style="color: #28a745;">✓ Mandatory ({}/{}) + Opt ({}/{})</span>', 
                                 mandatory_files_uploaded, total_mandatory_files, optional_files_uploaded, total_optional_files)
        elif mandatory_files_uploaded > 0:
            return format_html('<span style="color: orange;">⚠ Partial Mandatory ({}/{})</span>', mandatory_files_uploaded, total_mandatory_files)
        else:
            return format_html('<span style="color: red;">✗ No Files</span>')
    files_status.short_description = 'Files Uploaded'
    
    def it_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
        elif obj.it_notification_sent:
            return format_html('<span style="color: green;">✓ Notified</span>')
        else:
            return format_html('<span style="color: orange;">⚠ Ready to Notify</span>')
    it_status.short_description = 'IT Status'
    
    def soft_delete_status(self, obj):
        if obj.is_deleted:
            deleted_date = obj.deleted_at.strftime('%Y-%m-%d %H:%M') if obj.deleted_at else 'Unknown'
            return format_html('<span style="color: #dc3545;">🗑️ Deleted on {}</span>', deleted_date)
        else:
            return format_html('<span style="color: green;">✓ Active</span>')
    soft_delete_status.short_description = 'Status'
    
    def actions_column(self, obj):
        if obj.is_deleted:
            # Show restore button for deleted employees
            return format_html(
                '<a class="button" href="{}" style="background: #28a745; color: white;">Restore</a>',
                reverse('admin:restore_employee', args=[obj.pk])
            )
        else:
            # Show edit and permanent delete buttons for active employees
            edit_url = reverse('admin:onboarding_employee_change', args=[obj.pk])
            delete_url = reverse('admin:permanent_delete_employee', args=[obj.pk])
            return format_html(
                '<div style="display: flex; gap: 5px;">'
                '<a class="button" href="{}" style="margin-right: 5px;">Edit</a>'
                '<a class="button" href="{}" style="background: #dc3545; color: white;" onclick="return confirm(\'⚠️ WARNING: This will PERMANENTLY delete this employee and their user account from the database. This action CANNOT be undone!\\n\\nEmployee: {}\\n\\nAre you absolutely sure you want to continue?\')">Permanent Delete</a>'
                '</div>',
                edit_url, delete_url, obj.full_name
            )
    actions_column.short_description = 'Actions'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('permanent-delete/<int:employee_id>/', self.admin_site.admin_view(self.permanent_delete_employee), name='permanent_delete_employee'),
            path('restore/<int:employee_id>/', self.admin_site.admin_view(self.restore_employee), name='restore_employee'),
            path('onboarding-only/', self.admin_site.admin_view(self.onboarding_only_view), name='onboarding_employees_only'),
            path('check-employee-id/', self.admin_site.admin_view(self.check_employee_id_username), name='check_employee_id_username'),
        ]
        return custom_urls + urls
    
    def onboarding_only_view(self, request):
        """Custom view to show only active onboarding employees"""
        url = reverse('admin:onboarding_employee_changelist')
        return HttpResponseRedirect(f"{url}?is_deleted__exact=0")
    
    def changelist_view(self, request, extra_context=None):
        """Override changelist view to add custom context and helpful information"""
        extra_context = extra_context or {}
        
        # Add information about current view
        is_filtered_active_only = request.GET.get('is_deleted__exact') == '0'
        is_filtered_deleted_only = request.GET.get('is_deleted__exact') == '1'
        
        # Get counts
        total_count = Employee.all_objects.count()
        active_count = Employee.objects.count()
        deleted_count = total_count - active_count
        
        if is_filtered_active_only:
            extra_context['current_view'] = f'Showing {active_count} Active Onboarding Employees'
            extra_context['view_info'] = f'{deleted_count} deleted employees are hidden'
        elif is_filtered_deleted_only:
            extra_context['current_view'] = f'Showing {deleted_count} Deleted Employees Only'
            extra_context['view_info'] = f'{active_count} active employees are hidden'
        else:
            extra_context['current_view'] = f'Showing All {total_count} Employees'
            extra_context['view_info'] = f'{active_count} active, {deleted_count} deleted'
        
        # Add quick action buttons info
        extra_context['quick_actions_help'] = (
            'Use the Actions dropdown above to quickly filter employees: '
            '"Show onboarding employees" for active only, "Show all employees" for complete list.'
        )
        
        return super().changelist_view(request, extra_context)
    
    def check_employee_id_username(self, request):
        from django.contrib.auth.models import User
        employee_id = request.GET.get('employee_id', '').strip()
        exists = User.objects.filter(username=employee_id).exists()
        return JsonResponse({'exists': exists})

    def permanent_delete_employee(self, request, employee_id):
        """Custom view to permanently delete an employee and their user account"""
        try:
            employee = Employee.all_objects.get(id=employee_id)
            employee_name = employee.full_name
            
            # First, delete associated User account (if exists)
            from django.contrib.auth.models import User
            user_deleted = False
            
            # Check company email first, then personal email
            user = User.objects.filter(email=employee.company_email).first()
            if not user and employee.email:
                user = User.objects.filter(email=employee.email).first()
                
            if user:
                user_email = user.email
                user.delete()  # Permanent delete from User table
                user_deleted = True
                print(f"🗑️ PERMANENTLY DELETED User: {user_email}")
            
            # Then permanently delete the Employee record
            employee.delete()  # This is permanent delete, not soft delete
            print(f"🗑️ PERMANENTLY DELETED Employee: {employee_name}")
            
            # Success message
            if user_deleted:
                messages.success(
                    request, 
                    f'Employee "{employee_name}" and their user account have been permanently deleted from the database.'
                )
            else:
                messages.success(
                    request, 
                    f'Employee "{employee_name}" has been permanently deleted from the database. No associated user account was found.'
                )
                
        except Employee.DoesNotExist:
            messages.error(request, 'Employee not found.')
        except Exception as e:
            messages.error(request, f'Error deleting employee: {str(e)}')
        
        return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
    def restore_employee(self, request, employee_id):
        """Custom view to restore a soft deleted employee"""
        try:
            employee = Employee.all_objects.get(id=employee_id)
            print("🔁 Restore triggered for employee:", employee.company_email or employee.email)

            if employee.is_deleted:
                employee.restore()
                employee.save()  # Ensure the changes (like `is_deleted = False`) are persisted

                # Reactivate associated User (if exists) - check company email first
                from django.contrib.auth.models import User
                user = User.objects.filter(email=employee.company_email).first()
                if not user:
                    user = User.objects.filter(email=employee.email).first()
                    
                if user:
                    user.is_active = True
                    user.save()
                messages.success(request, f'Employee "{employee.full_name}" has been restored successfully.')
            else:
                messages.warning(request, f'Employee "{employee.full_name}" is not deleted.')
        except Employee.DoesNotExist:
            messages.error(request, 'Employee not found.')
        
        return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
    def delete_model(self, request, obj):
        """Override delete_model to perform soft delete instead of hard delete"""
        if not obj.is_deleted:
            obj.soft_delete()
            messages.success(request, f'Employee "{obj.full_name}" has been soft deleted.')
        else:
            messages.warning(request, f'Employee "{obj.full_name}" is already deleted.')
    
    def delete_queryset(self, request, queryset):
        """Override bulk delete to perform soft delete"""
        count = 0
        for obj in queryset:
            if not obj.is_deleted:
                obj.soft_delete()
                count += 1
        
        if count > 0:
            messages.success(request, f'{count} employee(s) have been soft deleted.')
        else:
            messages.warning(request, 'No active employees were selected for deletion.')
    
    def has_delete_permission(self, request, obj=None):
        """Allow delete permission (we're doing soft delete anyway)"""
        return True

    def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
        """Add JavaScript for conditional save button with enhanced UI"""
        response = super().render_change_form(request, context, add, change, form_url, obj)
        
        if change and obj and obj.is_self_submitted:
            # Check which fields are missing
            missing_fields = []
            if not obj.employee_id:
                missing_fields.append('employee_id')
            if not obj.company_email:
                missing_fields.append('company_email')
            if not obj.department:
                missing_fields.append('department')
            if not obj.position:
                missing_fields.append('position')
            if not obj.employee_type:
                missing_fields.append('employee_type')
            
            has_missing_fields = len(missing_fields) > 0
            
            additional_js = f"""
            <script>
            // Live check for employee_id conflict with User.username
            function validateEmployeeIdConflict() {{
                const empIdInput = document.getElementById('id_employee_id');
                const warningId = 'employee-id-warning';

                if (!empIdInput || !empIdInput.value) return;

                fetch('/admin/onboarding/employee/check-employee-id/?employee_id=' + encodeURIComponent(empIdInput.value))
                    .then(response => response.json())
                    .then(data => {{
                        let existingWarning = document.getElementById(warningId);
                        if (data.exists) {{
                            if (!existingWarning) {{
                                const warning = document.createElement('div');
                                warning.id = warningId;
                                warning.style.color = '#dc3545';
                                warning.style.fontWeight = 'bold';
                                warning.style.marginTop = '6px';
                                warning.textContent = '❌ This Employee ID already exists as a user account (username).';
                                empIdInput.parentNode.appendChild(warning);
                            }}
                        }} else {{
                            if (existingWarning) {{
                                existingWarning.remove();
                            }}
                        }}
                    }});
            }}

            const empIdInput = document.getElementById('id_employee_id');
            if (empIdInput) {{
                empIdInput.addEventListener('blur', validateEmployeeIdConflict);
            }}

            document.addEventListener('DOMContentLoaded', function() {{
                // Configuration
                const requiredFields = ['employee_id', 'company_email', 'department', 'position', 'employee_type'];
                const fieldLabels = {{
                    'employee_id': 'Employee ID',
                    'company_email': 'Company Email',
                    'department': 'Department',
                    'position': 'Position',
                    'employee_type': 'Employee Type'
                }};
                
                const saveButtons = document.querySelectorAll('input[name="_save"], input[name="_continue"], input[name="_addanother"]');
                const hasMissingFields = {str(has_missing_fields).lower()};
                
                // Add main status banner
                function createStatusBanner() {{
                    const banner = document.createElement('div');
                    banner.id = 'hr-completion-banner';
                    banner.style.cssText = `
                        margin: 20px 0;
                        padding: 20px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    `;
                    
                    const contentDiv = document.querySelector('#content') || document.querySelector('.colM');
                    if (contentDiv) {{
                        contentDiv.insertBefore(banner, contentDiv.firstChild);
                    }}
                    
                    return banner;
                }}
                
                // Update banner content
                function updateStatusBanner(allComplete, missingFields) {{
                    let banner = document.getElementById('hr-completion-banner');
                    if (!banner) {{
                        banner = createStatusBanner();
                    }}
                    
                    if (allComplete) {{
                        banner.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="font-size: 24px;">✅</div>
                                <div>
                                    <strong style="color: #155724;">Employment Details Complete!</strong><br>
                                    <span style="color: #6c757d; font-weight: normal;">All required HR fields have been filled. You can now save the employee record.</span>
                                </div>
                            </div>
                        `;
                        banner.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
                        banner.style.border = '2px solid #28a745';
                    }} else {{
                        const missingList = missingFields.map(field => fieldLabels[field] || field).join(', ');
                        banner.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="font-size: 24px;">⚠️</div>
                                <div>
                                    <strong style="color: #856404;">HR Action Required</strong><br>
                                    <span style="color: #6c757d; font-weight: normal;">Please complete the following employment details to enable saving:</span><br>
                                    <em style="color: #856404;">${{missingList}}</em>
                                </div>
                            </div>
                        `;
                        banner.style.background = 'linear-gradient(135deg, #fff3cd, #ffeaa7)';
                        banner.style.border = '2px solid #ffc107';
                    }}
                }}
                
                // Enhanced field validation
                function checkRequiredFields() {{
                    let allFieldsFilled = true;
                    let missingFields = [];
                    
                    requiredFields.forEach(function(fieldName) {{
                        const field = document.getElementById('id_' + fieldName);
                        if (field) {{
                            const isEmpty = !field.value || field.value.trim() === '';
                            if (isEmpty) {{
                                allFieldsFilled = false;
                                missingFields.push(fieldName);
                                
                                // Highlight empty required fields
                                field.style.cssText += `
                                    border: 2px solid #dc3545 !important;
                                    box-shadow: 0 0 8px rgba(220, 53, 69, 0.3) !important;
                                `;
                                
                                // Add required indicator to label
                                const label = document.querySelector(`label[for="id_${{fieldName}}"]`);
                                if (label && !label.querySelector('.required-indicator')) {{
                                    const indicator = document.createElement('span');
                                    indicator.className = 'required-indicator';
                                    indicator.innerHTML = ' <strong style="color: #dc3545;">*REQUIRED*</strong>';
                                    label.appendChild(indicator);
                                }}
                            }} else {{
                                // Field is filled - remove highlighting
                                field.style.border = '';
                                field.style.boxShadow = '';
                                
                                // Remove required indicator
                                const label = document.querySelector(`label[for="id_${{fieldName}}"]`);
                                if (label) {{
                                    const indicator = label.querySelector('.required-indicator');
                                    if (indicator) indicator.remove();
                                }}
                            }}
                        }}
                    }});
                    
                    // Update save buttons
                    saveButtons.forEach(function(button) {{
                        if (allFieldsFilled) {{
                            button.disabled = false;
                            button.style.cssText += `
                                opacity: 1 !important;
                                cursor: pointer !important;
                                background: #28a745 !important;
                                border-color: #28a745 !important;
                            `;
                            button.title = '';
                        }} else {{
                            button.disabled = true;
                            button.style.cssText += `
                                opacity: 0.5 !important;
                                cursor: not-allowed !important;
                                background: #6c757d !important;
                                border-color: #6c757d !important;
                            `;
                            button.title = `Please complete: ${{missingFields.map(f => fieldLabels[f] || f).join(', ')}}`;
                        }}
                    }});
                    
                    // Update status banner
                    updateStatusBanner(allFieldsFilled, missingFields);
                }}
                
                // Add event listeners
                requiredFields.forEach(function(fieldName) {{
                    const field = document.getElementById('id_' + fieldName);
                    if (field) {{
                        field.addEventListener('input', checkRequiredFields);
                        field.addEventListener('change', checkRequiredFields);
                        field.addEventListener('blur', checkRequiredFields);
                    }}
                }});
                
                // Initial check
                if (hasMissingFields) {{
                    checkRequiredFields();
                }}
                
                // Add helpful tooltip to Basic Information fieldset
                const basicInfoFieldset = document.querySelector('fieldset');
                if (basicInfoFieldset && hasMissingFields) {{
                    const legend = basicInfoFieldset.querySelector('h2');
                    if (legend) {{
                        legend.style.cssText += 'color: #dc3545; font-weight: bold;';
                        legend.innerHTML += ' <span style="font-size: 14px; color: #856404;">(⚠️ HR Completion Required)</span>';
                    }}
                }}
                
                // Prevent form submission if fields are incomplete
                const form = document.querySelector('#content form');
                if (form) {{
                    form.addEventListener('submit', function(e) {{
                        let hasIncomplete = false;
                        requiredFields.forEach(function(fieldName) {{
                            const field = document.getElementById('id_' + fieldName);
                            if (field && (!field.value || field.value.trim() === '')) {{
                                hasIncomplete = true;
                            }}
                        }});
                        
                        if (hasIncomplete) {{
                            e.preventDefault();
                            alert('⚠️ Please complete all required employment details before saving.');
                            return false;
                        }}
                    }});
                }}
            }});
            </script>
            """
            
            # Render the response first before accessing content
            if hasattr(response, 'render'):
                response.render()
            
            # Now we can safely access and modify the content
            if hasattr(response, 'content'):
                content = response.content.decode('utf-8')
                content = content.replace('</body>', additional_js + '</body>')
                response.content = content.encode('utf-8')
        
        return response


class OffboardingAdmin(admin.ModelAdmin):
    list_display = ['user_display', 'last_working_date', 'created_at']
    list_filter = ['last_working_date', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email']
    list_display_links = ['user_display']
    date_hierarchy = 'last_working_date'
    
    fieldsets = (
        ('Employee Information', {
            'fields': ('user', 'last_working_date')
        }),
        ('Additional Information', {
            'fields': ('remarks',),
            'classes': ('collapse',),
            'description': 'Optional remarks about the offboarding process.'
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(is_active=True).order_by('username')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def user_display(self, obj):
        if obj.user.first_name or obj.user.last_name:
            full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return format_html('<strong>{}</strong><br><small style="color: #666;">@{}</small>', 
                               full_name, obj.user.username)
        return format_html('<strong>@{}</strong>', obj.user.username)
    user_display.short_description = 'Employee'
    user_display.admin_order_field = 'user__username'

    def response_add(self, request, obj, post_url_continue=None):
        self.message_user(
            request, 
            f"Offboarding record created for {obj.user.first_name} {obj.user.last_name}. "
            f"The following actions have been automatically completed: "
            f"✅ Employee record soft deleted, "
            f"✅ User account deactivated, "
            f"✅ IT team notified for asset collection.",
            level='success'
        )
        return super().response_add(request, obj, post_url_continue)


class OnboardingLinkAdmin(admin.ModelAdmin):
    
    def changelist_view(self, request, extra_context=None):
        """Show the link generator instead of a normal list"""
        
        html_content = '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Generate Onboarding Link</title>
            <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
            <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
        </head>
        <body class="app-onboarding model-onboardinglink change-list">
            <div id="container">
                <div id="header">
                    <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
                    <div id="user-tools">
                        <a href="/admin/">Home</a> / 
                        <a href="/admin/onboarding/">Onboarding</a> / 
                        Generate Link
                    </div>
                </div>
                
                <div class="breadcrumbs">
                    <a href="/admin/">Home</a> &rsaquo; 
                    <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
                    Onboarding Links
                </div>
                
                <div id="content" class="colM">
                   <button onclick="window.history.back()" 
                            style="margin-bottom: 20px; padding: 10px 20px; font-size: 16px; 
                                background: linear-gradient(135deg, #007bff, #0056b3); 
                                color: white; border: none; border-radius: 5px; cursor: pointer; 
                                font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3);">
                        ← Back
                    </button>
                    
                    <div class="module aligned">
                        <div style="text-align: center; padding: 60px 40px; background: #f8f9fa; border-radius: 12px; margin: 30px 0; border: 1px solid #e9ecef;">
                            <h2 style="color: #343a40; margin-bottom: 25px; font-size: 28px;">🔗 Onboarding Link Generator</h2>
                            <p style="color: #6c757d; margin-bottom: 35px; font-size: 18px; line-height: 1.5;">
                                Generate a onboarding link that employees can use to submit their information.<br>
                                The link will be valid for 7 days from the time of generation.
                            </p>
                            
                            <button onclick="generateNewLink()" id="generate-btn"
                                style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 18px 36px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3); transition: all 0.3s ease;">
                                Generate New Link
                            </button>
                            
                            <div id="generated-link-container" style="display: none; margin-top: 40px; padding: 30px; background: white; border-radius: 10px; border: 2px solid #28a745; box-shadow: 0 6px 20px rgba(40,167,69,0.15);">
                                <h3 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">
                                    ✅ Link Generated Successfully!
                                </h3>
                                
                                <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
                                    <div style="color: #0c5460; font-weight: 600; margin-bottom: 5px;">📅 Link Information:</div>
                                    <div style="color: #0c5460;">
                                        <strong>Created:</strong> <span id="created-time"></span><br>
                                        <strong>Expires:</strong> <span id="expiry-time"></span>
                                    </div>
                                </div>
                                
                                <div style="text-align: left; margin: 20px 0;">
                                    <label style="font-weight: 600; color: #495057; display: block; margin-bottom: 8px;">
                                        Generated Onboarding Link:
                                    </label>
                                    <textarea id="generated-link-input" 
                                        style="width: 100%; height: 100px; padding: 15px; font-family: 'Courier New', monospace; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px; resize: none; background: #f8f9fa;" 
                                        readonly></textarea>
                                </div>
                                
                                <div style="margin: 25px 0;">
                                    <button onclick="copyGeneratedLink()" id="copy-btn"
                                        style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; margin-right: 15px;">
                                        📋 Copy Link
                                    </button>
                                    <span id="copy-status" style="color: #28a745; font-weight: 600; font-size: 16px;"></span>
                                </div>
                                
                                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin-top: 25px; text-align: left;">
                                    <div style="color: #856404; font-weight: 600; margin-bottom: 8px;">
                                        ⚠️ Important Instructions:
                                    </div>
                                    <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
                                        <li>This link expires in <strong>7 days</strong></li>
                                        <li>Send this link to employees via email</li>
                                        <li>Each employee can use this same link</li>
                                        <li>Once an employee submits, they cannot submit again</li>
                                        <li><strong>Note:</strong> Employees will fill personal info and upload documents. HR will complete employment details and set company email after review.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                function generateNewLink() {
                    const timestamp = Math.floor(Date.now() / 1000);
                    const data = "GENERIC_" + timestamp;
                    const encoded = btoa(data);
                    const link = window.location.origin + "/en/onboarding/employee-onboarding/" + encoded + "/";
                    
                    // Show creation and expiry dates
                    const createdDate = new Date(timestamp * 1000);
                    const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                    
                    document.getElementById("created-time").textContent = createdDate.toLocaleString();
                    document.getElementById("expiry-time").textContent = expiryDate.toLocaleString();
                    document.getElementById("generated-link-input").value = link;
                    document.getElementById("generated-link-container").style.display = "block";
                    
                    const btn = document.getElementById("generate-btn");
                    btn.innerHTML = "✅ Link Generated!";
                    btn.style.background = "linear-gradient(135deg, #28a745, #1e7e34)";
                    
                    setTimeout(function() {
                        btn.innerHTML = "Generate New Link";
                        btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
                    }, 3000);
                    
                    // Scroll to the generated link
                    document.getElementById("generated-link-container").scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
                
                function copyGeneratedLink() {
                    const input = document.getElementById("generated-link-input");
                    input.select();
                    input.setSelectionRange(0, 99999); // For mobile devices
                    
                    try {
                        document.execCommand("copy");
                        document.getElementById("copy-status").innerHTML = "✅ Copied to Clipboard!";
                        
                        const copyBtn = document.getElementById("copy-btn");
                        copyBtn.style.background = "#20c997";
                        
                        setTimeout(function() {
                            document.getElementById("copy-status").innerHTML = "";
                            copyBtn.style.background = "#28a745";
                        }, 3000);
                    } catch (err) {
                        document.getElementById("copy-status").innerHTML = "❌ Copy failed - please select and copy manually";
                        document.getElementById("copy-status").style.color = "#dc3545";
                    }
                }
                
                // Add hover effects
                document.addEventListener('DOMContentLoaded', function() {
                    const generateBtn = document.getElementById('generate-btn');
                    generateBtn.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-2px)';
                        this.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
                    });
                    generateBtn.addEventListener('mouseleave', function() {
                        this.style.transform = 'translateY(0)';
                        this.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
                    });
                });
            </script>
        </body>
        </html>
        '''
        
        return HttpResponse(html_content)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


# Import User model at the top level for OffboardingAdmin
from django.contrib.auth.models import User

# Register models
admin.site.register(ITSupporter, ITSupporterAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(Offboarding, OffboardingAdmin)
admin.site.register(OnboardingLink, OnboardingLinkAdmin)

# Customize admin site header
admin.site.site_header = "Techoptima HR Management"
admin.site.site_title = "HR Admin"
admin.site.index_title = "Welcome to HR Management Portal"


# ============================================================================
# RESUME MANAGEMENT (Candidate)
# ============================================================================

from .models import Candidate


class CandidateAdmin(admin.ModelAdmin):
    """
    Admin for managing candidate resumes.

    HR staff add candidates via the standard Django admin Add/Edit form.
    The uploaded PDF is saved to local disk (MEDIA_ROOT/cvs/); only the
    relative file path is stored in the database via Django's FileField.
    """

    # ---------- List view ----------
    list_display = [
        'full_name', 'email', 'mobile', 'exp_years_badge',
        'tech_stack_short', 'location', 'cv_view_download_link', 'created_at',
    ]
    list_filter = ['exp_years', 'created_at']
    search_fields = ['full_name', 'first_name', 'last_name', 'email', 'tech_stack', 'location']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    # ---------- Detail / Edit view ----------
    readonly_fields = ['created_at', 'updated_at', 'cv_view_download_link_detail']

    fieldsets = (
        ('Candidate Information', {
            'fields': (
                ('full_name', 'first_name', 'last_name'),
                ('email', 'mobile'),
                ('exp_years', 'tech_stack'),
                ('location', 'preferred_location'),
                'experience',
            ),
        }),
        ('Resume / CV', {
            'fields': ('cv_file', 'cv_view_download_link_detail'),
            'description': (
                'Upload the candidate\'s resume (PDF). '
                'The file is saved on local disk (MEDIA_ROOT/cvs/); '
                'only the file path is stored in the database.'
            ),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    # ---------- List-view column helpers ----------

    def exp_years_badge(self, obj):
        color = '#28a745' if obj.exp_years >= 3 else '#ffc107'
        return format_html(
            '<span style="background:{}; color:white; padding:2px 8px; '
            'border-radius:12px; font-weight:bold;">{} yrs</span>',
            color, obj.exp_years,
        )
    exp_years_badge.short_description = 'Experience'
    exp_years_badge.admin_order_field = 'exp_years'

    def tech_stack_short(self, obj):
        ts = obj.tech_stack or ''
        return ts[:60] + ('…' if len(ts) > 60 else '')
    tech_stack_short.short_description = 'Tech Stack'

    def cv_view_download_link(self, obj):
        """View + Download buttons shown in the changelist."""
        if obj.cv_file:
            return format_html(
                '<a href="{url}" target="_blank" '
                'style="color:#007bff; font-weight:600; margin-right:8px;">👁 View</a>'
                '<a href="{url}" download '
                'style="color:#28a745; font-weight:600;">⬇ Download</a>',
                url=obj.cv_file.url,
            )
        return format_html('<span style="color:#6c757d; font-style:italic;">No file</span>')
    cv_view_download_link.short_description = 'CV'

    # ---------- Detail-view helper (readonly field) ----------

    def cv_view_download_link_detail(self, obj):
        """View + Download links shown in the Add/Edit form."""
        if obj.cv_file:
            return format_html(
                '<a href="{url}" target="_blank" '
                'style="color:#007bff; font-size:14px; font-weight:600; margin-right:16px;">'
                '👁 View CV</a>'
                '<a href="{url}" download '
                'style="color:#28a745; font-size:14px; font-weight:600;">'
                '⬇ Download CV</a>'
                '<br><small style="color:#6c757d; margin-top:4px; display:block;">'
                'Stored at: <code>{path}</code></small>',
                url=obj.cv_file.url,
                path=obj.cv_file.name,
            )
        return format_html(
            '<span style="color:#6c757d; font-style:italic;">No CV uploaded yet.</span>'
        )
    cv_view_download_link_detail.short_description = 'View / Download'


admin.site.register(Candidate, CandidateAdmin)