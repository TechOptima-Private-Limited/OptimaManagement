

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Employee, Offboarding, ITSupporter

class ITSupporterAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'is_active', 'created_at', 'edit_link', 'delete_link']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email']
    list_display_links = ['name']
    
    fieldsets = (
        ('IT Supporter Information', {
            'fields': ('name', 'email', 'is_active')
        }),
    )
    
    def edit_link(self, obj):
        url = reverse('admin:onboarding_itsupporter_change', args=[obj.pk])
        return format_html('<a class="button" href="{}">Edit</a>', url)
    edit_link.short_description = 'Edit'
    edit_link.allow_tags = True
    
    def delete_link(self, obj):
        url = reverse('admin:onboarding_itsupporter_delete', args=[obj.pk])
        return format_html('<a class="button" href="{}" style="color:red;">Delete</a>', url)
    delete_link.short_description = 'Delete'
    delete_link.allow_tags = True

class EmployeeAdmin(admin.ModelAdmin):
    # Removed 'status' from list_display and list_filter
    list_display = ['name', 'email', 'employee_type', 'documents_status', 'files_status', 'it_status', 'edit_link', 'delete_link']
    list_filter = ['employee_type', 'it_notification_sent']
    search_fields = ['name', 'email']
    list_display_links = ['name']
    
    fieldsets = (
        ('Basic Information', {
            # Removed 'status' from fields
            'fields': ('name', 'email', 'employee_type', 'joining_date', 'position')
        }),
        ('Document Collection', {
            'fields': (
                ('aadhar_pan_collected', 'aadhar_pan_file'),
                ('payslips_collected', 'payslips_file'),
                ('educational_certificates_collected', 'educational_certificates_file'),
                ('previous_offer_letter_collected', 'previous_offer_letter_file'),
                ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
                ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
            ),
            'classes': ('collapse',),
            'description': 'Check the box when document is collected and upload the file.'
        }),
        ('IT Notification', {
            'fields': ('it_notification_sent',),
            'classes': ('collapse',),
            'description': 'Track if IT team has been notified for asset assignment.'
        }),
    )
    
    readonly_fields = ['it_notification_sent']  # Make IT notification field read-only
    
    def documents_status(self, obj):
        if obj.all_documents_collected:
            return format_html('<span style="color: green;">✓ Complete</span>')
        else:
            return format_html('<span style="color: red;">✗ Incomplete</span>')
    documents_status.short_description = 'Documents Collected'
    
    def files_status(self, obj):
        files_uploaded = 0
        total_files = 6
        
        if obj.aadhar_pan_file:
            files_uploaded += 1
        if obj.payslips_file:
            files_uploaded += 1
        if obj.educational_certificates_file:
            files_uploaded += 1
        if obj.previous_offer_letter_file:
            files_uploaded += 1
        if obj.relieving_experience_letters_file:
            files_uploaded += 1
        if obj.appraisal_hike_letters_file:
            files_uploaded += 1
            
        if files_uploaded == total_files:
            return format_html('<span style="color: green;">✓ All Files ({}/{})</span>', files_uploaded, total_files)
        elif files_uploaded > 0:
            return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', files_uploaded, total_files)
        else:
            return format_html('<span style="color: red;">✗ No Files (0/{})</span>', total_files)
    files_status.short_description = 'Files Uploaded'
    
    def it_status(self, obj):
        if obj.it_notification_sent:
            return format_html('<span style="color: green;">✓ Notified</span>')
        else:
            return format_html('<span style="color: orange;">⚠ Ready to Notify</span>')
    it_status.short_description = 'IT Status'
    
    def edit_link(self, obj):
        url = reverse('admin:onboarding_employee_change', args=[obj.pk])
        return format_html('<a class="button" href="{}">Edit</a>', url)
    edit_link.short_description = 'Edit'
    edit_link.allow_tags = True
    
    def delete_link(self, obj):
        url = reverse('admin:onboarding_employee_delete', args=[obj.pk])
        return format_html('<a class="button" href="{}" style="color:red;">Delete</a>', url)
    delete_link.short_description = 'Delete'
    delete_link.allow_tags = True

class OffboardingAdmin(admin.ModelAdmin):
    list_display = ['employee', 'last_working_date', 'assets_status']
    search_fields = ['employee__name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('employee', 'last_working_date')
        }),
        ('Assets Collection', {
            'fields': (
                ('laptop_returned', 'charger_returned'),
            ),
            'description': 'Check the boxes for returned assets.'
        }),
        ('Damaged Assets & Remarks', {
            'fields': ('damaged_assets_file', 'remarks'),
            'description': 'Upload file for any damaged assets and add remarks.'
        }),
    )
    
    def assets_status(self, obj):
        returned_count = 0
        total_assets = 2
        
        if obj.laptop_returned:
            returned_count += 1
        if obj.charger_returned:
            returned_count += 1
            
        if returned_count == total_assets:
            return format_html('<span style="color: green;">✓ All Returned ({}/{})</span>', returned_count, total_assets)
        elif returned_count > 0:
            return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', returned_count, total_assets)
        else:
            return format_html('<span style="color: red;">✗ None Returned (0/{})</span>', total_assets)
    assets_status.short_description = 'Assets Returned'

# Register the models
admin.site.register(ITSupporter, ITSupporterAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(Offboarding, OffboardingAdmin)
















