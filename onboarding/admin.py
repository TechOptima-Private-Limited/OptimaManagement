
# # # # from django.contrib import admin
# # # # from django.utils.html import format_html
# # # # from django.urls import reverse
# # # # from django.shortcuts import render
# # # # from django.http import HttpResponse
# # # # from .models import Employee, Offboarding, ITSupporter, OnboardingLink
# # # # import time
# # # # import base64

# # # # class ITSupporterAdmin(admin.ModelAdmin):
# # # #     list_display = ['name', 'email', 'is_active', 'created_at']
# # # #     list_filter = ['is_active', 'created_at']
# # # #     search_fields = ['name', 'email']
# # # #     list_display_links = ['name']
    
# # # #     fieldsets = (
# # # #         ('IT Supporter Information', {
# # # #             'fields': ('name', 'email', 'is_active')
# # # #         }),
# # # #     )

# # # # class EmployeeAdmin(admin.ModelAdmin):
# # # #     list_display = [
# # # #         'full_name_display', 'email', 'phone_number', 'department', 'position', 'employee_type', 
# # # #         'submission_status', 'documents_status', 'files_status', 'it_status'
# # # #     ]
# # # #     list_filter = [
# # # #         'employee_type', 'department', 'position', 'is_self_submitted', 
# # # #         'it_notification_sent', 'submitted_at'
# # # #     ]
# # # #     search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department', 'position']
# # # #     list_display_links = ['full_name_display']
# # # #     date_hierarchy = 'submitted_at'
    
# # # #     fieldsets = (
# # # #         ('Basic Information', {
# # # #             'fields': (
# # # #                 'first_name', 'last_name', 'email', 'phone_number', 'employee_type', 'department', 'position', 
# # # #                 'address', 'joining_date'
# # # #             )
# # # #         }),
# # # #         ('Submission Information', {
# # # #             'fields': ('is_self_submitted', 'submitted_at'),
# # # #             'classes': ('collapse',),
# # # #             'description': 'Information about employee submission status.'
# # # #         }),
# # # #         ('Document Collection', {
# # # #             'fields': (
# # # #                 ('aadhar_pan_collected', 'aadhar_pan_file'),
# # # #                 ('payslips_collected', 'payslips_file'),
# # # #                 ('educational_certificates_collected', 'educational_certificates_file'),
# # # #                 ('previous_offer_letter_collected', 'previous_offer_letter_file'),
# # # #                 ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
# # # #                 ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
# # # #             ),
# # # #             'classes': ('collapse',),
# # # #             'description': 'Check the box when document is collected and upload the file.'
# # # #         }),
# # # #         ('IT Notification', {
# # # #             'fields': ('it_notification_sent',),
# # # #             'classes': ('collapse',),
# # # #             'description': 'Track if IT team has been notified for asset assignment.'
# # # #         }),
# # # #     )
    
# # # #     readonly_fields = ['is_self_submitted', 'submitted_at', 'it_notification_sent']
    
# # # #     def full_name_display(self, obj):
# # # #         return obj.full_name
# # # #     full_name_display.short_description = 'Name'
    
# # # #     def submission_status(self, obj):
# # # #         if obj.is_self_submitted:
# # # #             return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
# # # #         else:
# # # #             return format_html('<span style="color: orange;">⏳ Pending</span>')
# # # #     submission_status.short_description = 'Onboarding Status'
    
# # # #     def documents_status(self, obj):
# # # #         if obj.all_documents_collected:
# # # #             return format_html('<span style="color: green;">✓ Complete</span>')
# # # #         else:
# # # #             return format_html('<span style="color: red;">✗ Incomplete</span>')
# # # #     documents_status.short_description = 'Documents Collected'
    
# # # #     def files_status(self, obj):
# # # #         files_uploaded = 0
# # # #         total_files = 6
        
# # # #         if obj.aadhar_pan_file:
# # # #             files_uploaded += 1
# # # #         if obj.payslips_file:
# # # #             files_uploaded += 1
# # # #         if obj.educational_certificates_file:
# # # #             files_uploaded += 1
# # # #         if obj.previous_offer_letter_file:
# # # #             files_uploaded += 1
# # # #         if obj.relieving_experience_letters_file:
# # # #             files_uploaded += 1
# # # #         if obj.appraisal_hike_letters_file:
# # # #             files_uploaded += 1
            
# # # #         if files_uploaded == total_files:
# # # #             return format_html('<span style="color: green;">✓ All Files ({}/{})</span>', files_uploaded, total_files)
# # # #         elif files_uploaded > 0:
# # # #             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', files_uploaded, total_files)
# # # #         else:
# # # #             return format_html('<span style="color: red;">✗ No Files (0/{})</span>', total_files)
# # # #     files_status.short_description = 'Files Uploaded'
    
# # # #     def it_status(self, obj):
# # # #         if obj.it_notification_sent:
# # # #             return format_html('<span style="color: green;">✓ Notified</span>')
# # # #         else:
# # # #             return format_html('<span style="color: orange;">⚠ Ready to Notify</span>')
# # # #     it_status.short_description = 'IT Status'
    
# # # #     def get_queryset(self, request):
# # # #         qs = super().get_queryset(request)
# # # #         return qs.order_by('-submitted_at', '-id')

# # # # class OffboardingAdmin(admin.ModelAdmin):
# # # #     list_display = ['employee', 'last_working_date', 'assets_status']
# # # #     search_fields = ['employee__first_name', 'employee__last_name', 'employee__email']
    
# # # #     fieldsets = (
# # # #         ('Basic Information', {
# # # #             'fields': ('employee', 'last_working_date')
# # # #         }),
# # # #         ('Assets Collection', {
# # # #             'fields': (
# # # #                 ('laptop_returned', 'charger_returned'),
# # # #             ),
# # # #             'description': 'Check the boxes for returned assets.'
# # # #         }),
# # # #         ('Damaged Assets & Remarks', {
# # # #             'fields': ('damaged_assets_file', 'remarks'),
# # # #             'description': 'Upload file for any damaged assets and add remarks.'
# # # #         }),
# # # #     )
    
# # # #     def assets_status(self, obj):
# # # #         returned_count = 0
# # # #         total_assets = 2
        
# # # #         if obj.laptop_returned:
# # # #             returned_count += 1
# # # #         if obj.charger_returned:
# # # #             returned_count += 1
            
# # # #         if returned_count == total_assets:
# # # #             return format_html('<span style="color: green;">✓ All Returned ({}/{})</span>', returned_count, total_assets)
# # # #         elif returned_count > 0:
# # # #             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', returned_count, total_assets)
# # # #         else:
# # # #             return format_html('<span style="color: red;">✗ None Returned (0/{})</span>', total_assets)
# # # #     assets_status.short_description = 'Assets Returned'

# # # # class OnboardingLinkAdmin(admin.ModelAdmin):
    
# # # #     def changelist_view(self, request, extra_context=None):
# # # #         """Show the link generator instead of a normal list"""
        
# # # #         html_content = '''
# # # #         <!DOCTYPE html>
# # # #         <html>
# # # #         <head>
# # # #             <title>Generate Onboarding Link</title>
# # # #             <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
# # # #             <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
# # # #         </head>
# # # #         <body class="app-onboarding model-onboardinglink change-list">
# # # #             <div id="container">
# # # #                 <div id="header">
# # # #                     <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
# # # #                     <div id="user-tools">
# # # #                         <a href="/admin/">Home</a> / 
# # # #                         <a href="/admin/onboarding/">Onboarding</a> / 
# # # #                         Generate Link
# # # #                     </div>
# # # #                 </div>
                
# # # #                 <div class="breadcrumbs">
# # # #                     <a href="/admin/">Home</a> &rsaquo; 
# # # #                     <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
# # # #                     Onboarding Links
# # # #                 </div>
                
# # # #                 <div id="content" class="colM">
# # # #                     <h1>Generate Onboarding Link</h1>
                    
# # # #                     <div class="module aligned">
# # # #                         <div style="text-align: center; padding: 60px 40px; background: #f8f9fa; border-radius: 12px; margin: 30px 0; border: 1px solid #e9ecef;">
# # # #                             <h2 style="color: #343a40; margin-bottom: 25px; font-size: 28px;">🔗 Onboarding Link Generator</h2>
# # # #                             <p style="color: #6c757d; margin-bottom: 35px; font-size: 18px; line-height: 1.5;">
# # # #                                 Generate a timestamped onboarding link that employees can use to submit their information.<br>
# # # #                                 The link will be valid for 7 days from the time of generation.
# # # #                             </p>
                            
# # # #                             <button onclick="generateNewLink()" id="generate-btn"
# # # #                                 style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 18px 36px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3); transition: all 0.3s ease;">
# # # #                                 Generate New Link
# # # #                             </button>
                            
# # # #                             <div id="generated-link-container" style="display: none; margin-top: 40px; padding: 30px; background: white; border-radius: 10px; border: 2px solid #28a745; box-shadow: 0 6px 20px rgba(40,167,69,0.15);">
# # # #                                 <h3 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">
# # # #                                     ✅ Link Generated Successfully!
# # # #                                 </h3>
                                
# # # #                                 <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
# # # #                                     <div style="color: #0c5460; font-weight: 600; margin-bottom: 5px;">📅 Link Information:</div>
# # # #                                     <div style="color: #0c5460;">
# # # #                                         <strong>Created:</strong> <span id="created-time"></span><br>
# # # #                                         <strong>Expires:</strong> <span id="expiry-time"></span>
# # # #                                     </div>
# # # #                                 </div>
                                
# # # #                                 <div style="text-align: left; margin: 20px 0;">
# # # #                                     <label style="font-weight: 600; color: #495057; display: block; margin-bottom: 8px;">
# # # #                                         Generated Onboarding Link:
# # # #                                     </label>
# # # #                                     <textarea id="generated-link-input" 
# # # #                                         style="width: 100%; height: 100px; padding: 15px; font-family: 'Courier New', monospace; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px; resize: none; background: #f8f9fa;" 
# # # #                                         readonly></textarea>
# # # #                                 </div>
                                
# # # #                                 <div style="margin: 25px 0;">
# # # #                                     <button onclick="copyGeneratedLink()" id="copy-btn"
# # # #                                         style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; margin-right: 15px;">
# # # #                                         📋 Copy Link
# # # #                                     </button>
# # # #                                     <span id="copy-status" style="color: #28a745; font-weight: 600; font-size: 16px;"></span>
# # # #                                 </div>
                                
# # # #                                 <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin-top: 25px; text-align: left;">
# # # #                                     <div style="color: #856404; font-weight: 600; margin-bottom: 8px;">
# # # #                                         ⚠️ Important Instructions:
# # # #                                     </div>
# # # #                                     <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
# # # #                                         <li>This link expires in <strong>7 days</strong></li>
# # # #                                         <li>Send this link to employees via email</li>
# # # #                                         <li>Each employee can use this same link</li>
# # # #                                         <li>Once an employee submits, they cannot submit again</li>
# # # #                                     </ul>
# # # #                                 </div>
# # # #                             </div>
# # # #                         </div>
# # # #                     </div>
# # # #                 </div>
# # # #             </div>
            
# # # #             <script>
# # # #                 function generateNewLink() {
# # # #                     const timestamp = Math.floor(Date.now() / 1000);
# # # #                     const data = "GENERIC_" + timestamp;
# # # #                     const encoded = btoa(data);
# # # #                     const link = window.location.origin + "/en/onboarding/employee-onboarding/" + encoded + "/";
                    
# # # #                     // Show creation and expiry dates
# # # #                     const createdDate = new Date(timestamp * 1000);
# # # #                     const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                    
# # # #                     document.getElementById("created-time").textContent = createdDate.toLocaleString();
# # # #                     document.getElementById("expiry-time").textContent = expiryDate.toLocaleString();
# # # #                     document.getElementById("generated-link-input").value = link;
# # # #                     document.getElementById("generated-link-container").style.display = "block";
                    
# # # #                     const btn = document.getElementById("generate-btn");
# # # #                     btn.innerHTML = "✅ Link Generated!";
# # # #                     btn.style.background = "linear-gradient(135deg, #28a745, #1e7e34)";
                    
# # # #                     setTimeout(function() {
# # # #                         btn.innerHTML = "Generate New Link";
# # # #                         btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
# # # #                     }, 3000);
                    
# # # #                     // Scroll to the generated link
# # # #                     document.getElementById("generated-link-container").scrollIntoView({ 
# # # #                         behavior: 'smooth' 
# # # #                     });
# # # #                 }
                
# # # #                 function copyGeneratedLink() {
# # # #                     const input = document.getElementById("generated-link-input");
# # # #                     input.select();
# # # #                     input.setSelectionRange(0, 99999); // For mobile devices
                    
# # # #                     try {
# # # #                         document.execCommand("copy");
# # # #                         document.getElementById("copy-status").innerHTML = "✅ Copied to Clipboard!";
                        
# # # #                         const copyBtn = document.getElementById("copy-btn");
# # # #                         copyBtn.style.background = "#20c997";
                        
# # # #                         setTimeout(function() {
# # # #                             document.getElementById("copy-status").innerHTML = "";
# # # #                             copyBtn.style.background = "#28a745";
# # # #                         }, 3000);
# # # #                     } catch (err) {
# # # #                         document.getElementById("copy-status").innerHTML = "❌ Copy failed - please select and copy manually";
# # # #                         document.getElementById("copy-status").style.color = "#dc3545";
# # # #                     }
# # # #                 }
                
# # # #                 // Add hover effects
# # # #                 document.addEventListener('DOMContentLoaded', function() {
# # # #                     const generateBtn = document.getElementById('generate-btn');
# # # #                     generateBtn.addEventListener('mouseenter', function() {
# # # #                         this.style.transform = 'translateY(-2px)';
# # # #                         this.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
# # # #                     });
# # # #                     generateBtn.addEventListener('mouseleave', function() {
# # # #                         this.style.transform = 'translateY(0)';
# # # #                         this.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
# # # #                     });
# # # #                 });
# # # #             </script>
# # # #         </body>
# # # #         </html>
# # # #         '''
        
# # # #         return HttpResponse(html_content)
    
# # # #     def has_add_permission(self, request):
# # # #         return False
    
# # # #     def has_change_permission(self, request, obj=None):
# # # #         return False
    
# # # #     def has_delete_permission(self, request, obj=None):
# # # #         return False

# # # # # Register models
# # # # admin.site.register(ITSupporter, ITSupporterAdmin)
# # # # admin.site.register(Employee, EmployeeAdmin)
# # # # admin.site.register(Offboarding, OffboardingAdmin)
# # # # admin.site.register(OnboardingLink, OnboardingLinkAdmin)

# # # # # Customize admin site header
# # # # admin.site.site_header = "Techoptima HR Management"
# # # # admin.site.site_title = "HR Admin"
# # # # admin.site.index_title = "Welcome to HR Management Portal"



# # # from django.contrib import admin
# # # from django.utils.html import format_html
# # # from django.urls import reverse
# # # from django.shortcuts import render
# # # from django.http import HttpResponse
# # # from .models import Employee, Offboarding, ITSupporter, OnboardingLink
# # # import time
# # # import base64

# # # class ITSupporterAdmin(admin.ModelAdmin):
# # #     list_display = ['name', 'email', 'is_active', 'created_at']
# # #     list_filter = ['is_active', 'created_at']
# # #     search_fields = ['name', 'email']
# # #     list_display_links = ['name']
    
# # #     fieldsets = (
# # #         ('IT Supporter Information', {
# # #             'fields': ('name', 'email', 'is_active')
# # #         }),
# # #     )

# # # class EmployeeAdmin(admin.ModelAdmin):
# # #     list_display = [
# # #         'full_name_display', 'email', 'phone_number', 'department', 'position', 'employee_type', 
# # #         'submission_status', 'documents_status', 'files_status', 'it_status', 'edit_link', 'delete_link'
# # #     ]
# # #     list_filter = [
# # #         'employee_type', 'department', 'position', 'is_self_submitted', 
# # #         'it_notification_sent', 'submitted_at'
# # #     ]
# # #     search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department', 'position']
# # #     list_display_links = ['full_name_display']
# # #     date_hierarchy = 'submitted_at'
    
# # #     fieldsets = (
# # #         ('Basic Information', {
# # #             'fields': (
# # #                 'first_name', 'last_name', 'email', 'phone_number', 'employee_type', 'department', 'position', 
# # #                 'address', 'joining_date'
# # #             )
# # #         }),
# # #         ('Submission Information', {
# # #             'fields': ('is_self_submitted', 'submitted_at'),
# # #             'classes': ('collapse',),
# # #             'description': 'Information about employee submission status.'
# # #         }),
# # #         ('Document Collection', {
# # #             'fields': (
# # #                 ('aadhar_pan_collected', 'aadhar_pan_file'),
# # #                 ('payslips_collected', 'payslips_file'),
# # #                 ('educational_certificates_collected', 'educational_certificates_file'),
# # #                 ('previous_offer_letter_collected', 'previous_offer_letter_file'),
# # #                 ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
# # #                 ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
# # #             ),
# # #             'classes': ('collapse',),
# # #             'description': 'Check the box when document is collected and upload the file.'
# # #         }),
# # #         ('IT Notification', {
# # #             'fields': ('it_notification_sent',),
# # #             'classes': ('collapse',),
# # #             'description': 'Track if IT team has been notified for asset assignment.'
# # #         }),
# # #     )
    
# # #     readonly_fields = ['is_self_submitted', 'submitted_at', 'it_notification_sent']
    
# # #     def full_name_display(self, obj):
# # #         return obj.full_name
# # #     full_name_display.short_description = 'Name'
    
# # #     def submission_status(self, obj):
# # #         if obj.is_self_submitted:
# # #             return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
# # #         else:
# # #             return format_html('<span style="color: orange;">⏳ Pending</span>')
# # #     submission_status.short_description = 'Onboarding Status'
    
# # #     def documents_status(self, obj):
# # #         if obj.all_documents_collected:
# # #             return format_html('<span style="color: green;">✓ Complete</span>')
# # #         else:
# # #             return format_html('<span style="color: red;">✗ Incomplete</span>')
# # #     documents_status.short_description = 'Documents Collected'
    
# # #     def files_status(self, obj):
# # #         files_uploaded = 0
# # #         total_files = 6
        
# # #         if obj.aadhar_pan_file:
# # #             files_uploaded += 1
# # #         if obj.payslips_file:
# # #             files_uploaded += 1
# # #         if obj.educational_certificates_file:
# # #             files_uploaded += 1
# # #         if obj.previous_offer_letter_file:
# # #             files_uploaded += 1
# # #         if obj.relieving_experience_letters_file:
# # #             files_uploaded += 1
# # #         if obj.appraisal_hike_letters_file:
# # #             files_uploaded += 1
            
# # #         if files_uploaded == total_files:
# # #             return format_html('<span style="color: green;">✓ All Files ({}/{})</span>', files_uploaded, total_files)
# # #         elif files_uploaded > 0:
# # #             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', files_uploaded, total_files)
# # #         else:
# # #             return format_html('<span style="color: red;">✗ No Files (0/{})</span>', total_files)
# # #     files_status.short_description = 'Files Uploaded'
    
# # #     def it_status(self, obj):
# # #         if obj.it_notification_sent:
# # #             return format_html('<span style="color: green;">✓ Notified</span>')
# # #         else:
# # #             return format_html('<span style="color: orange;">⚠ Ready to Notify</span>')
# # #     it_status.short_description = 'IT Status'
    
# # #     def edit_link(self, obj):
# # #         url = reverse('admin:onboarding_employee_change', args=[obj.pk])
# # #         return format_html('<a class="button" href="{}">Edit</a>', url)
# # #     edit_link.short_description = 'Edit'
# # #     edit_link.allow_tags = True
    
# # #     def delete_link(self, obj):
# # #         url = reverse('admin:onboarding_employee_delete', args=[obj.pk])
# # #         return format_html('<a class="button" href="{}" style="color:red;">Delete</a>', url)
# # #     delete_link.short_description = 'Delete'
# # #     delete_link.allow_tags = True
    
# # #     def get_queryset(self, request):
# # #         qs = super().get_queryset(request)
# # #         return qs.order_by('-submitted_at', '-id')

# # # class OffboardingAdmin(admin.ModelAdmin):
# # #     list_display = ['employee', 'last_working_date', 'assets_status']
# # #     search_fields = ['employee__first_name', 'employee__last_name', 'employee__email']
    
# # #     fieldsets = (
# # #         ('Basic Information', {
# # #             'fields': ('employee', 'last_working_date')
# # #         }),
# # #         ('Assets Collection', {
# # #             'fields': (
# # #                 ('laptop_returned', 'charger_returned'),
# # #             ),
# # #             'description': 'Check the boxes for returned assets.'
# # #         }),
# # #         ('Damaged Assets & Remarks', {
# # #             'fields': ('damaged_assets_file', 'remarks'),
# # #             'description': 'Upload file for any damaged assets and add remarks.'
# # #         }),
# # #     )
    
# # #     def assets_status(self, obj):
# # #         returned_count = 0
# # #         total_assets = 2
        
# # #         if obj.laptop_returned:
# # #             returned_count += 1
# # #         if obj.charger_returned:
# # #             returned_count += 1
            
# # #         if returned_count == total_assets:
# # #             return format_html('<span style="color: green;">✓ All Returned ({}/{})</span>', returned_count, total_assets)
# # #         elif returned_count > 0:
# # #             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', returned_count, total_assets)
# # #         else:
# # #             return format_html('<span style="color: red;">✗ None Returned (0/{})</span>', total_assets)
# # #     assets_status.short_description = 'Assets Returned'

# # # class OnboardingLinkAdmin(admin.ModelAdmin):
    
# # #     def changelist_view(self, request, extra_context=None):
# # #         """Show the link generator instead of a normal list"""
        
# # #         html_content = '''
# # #         <!DOCTYPE html>
# # #         <html>
# # #         <head>
# # #             <title>Generate Onboarding Link</title>
# # #             <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
# # #             <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
# # #         </head>
# # #         <body class="app-onboarding model-onboardinglink change-list">
# # #             <div id="container">
# # #                 <div id="header">
# # #                     <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
# # #                     <div id="user-tools">
# # #                         <a href="/admin/">Home</a> / 
# # #                         <a href="/admin/onboarding/">Onboarding</a> / 
# # #                         Generate Link
# # #                     </div>
# # #                 </div>
                
# # #                 <div class="breadcrumbs">
# # #                     <a href="/admin/">Home</a> &rsaquo; 
# # #                     <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
# # #                     Onboarding Links
# # #                 </div>
                
# # #                 <div id="content" class="colM">
# # #                     <h1>Generate Onboarding Link</h1>
                    
# # #                     <div class="module aligned">
# # #                         <div style="text-align: center; padding: 60px 40px; background: #f8f9fa; border-radius: 12px; margin: 30px 0; border: 1px solid #e9ecef;">
# # #                             <h2 style="color: #343a40; margin-bottom: 25px; font-size: 28px;">🔗 Onboarding Link Generator</h2>
# # #                             <p style="color: #6c757d; margin-bottom: 35px; font-size: 18px; line-height: 1.5;">
# # #                                 Generate a timestamped onboarding link that employees can use to submit their information.<br>
# # #                                 The link will be valid for 7 days from the time of generation.
# # #                             </p>
                            
# # #                             <button onclick="generateNewLink()" id="generate-btn"
# # #                                 style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 18px 36px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3); transition: all 0.3s ease;">
# # #                                 Generate New Link
# # #                             </button>
                            
# # #                             <div id="generated-link-container" style="display: none; margin-top: 40px; padding: 30px; background: white; border-radius: 10px; border: 2px solid #28a745; box-shadow: 0 6px 20px rgba(40,167,69,0.15);">
# # #                                 <h3 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">
# # #                                     ✅ Link Generated Successfully!
# # #                                 </h3>
                                
# # #                                 <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
# # #                                     <div style="color: #0c5460; font-weight: 600; margin-bottom: 5px;">📅 Link Information:</div>
# # #                                     <div style="color: #0c5460;">
# # #                                         <strong>Created:</strong> <span id="created-time"></span><br>
# # #                                         <strong>Expires:</strong> <span id="expiry-time"></span>
# # #                                     </div>
# # #                                 </div>
                                
# # #                                 <div style="text-align: left; margin: 20px 0;">
# # #                                     <label style="font-weight: 600; color: #495057; display: block; margin-bottom: 8px;">
# # #                                         Generated Onboarding Link:
# # #                                     </label>
# # #                                     <textarea id="generated-link-input" 
# # #                                         style="width: 100%; height: 100px; padding: 15px; font-family: 'Courier New', monospace; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px; resize: none; background: #f8f9fa;" 
# # #                                         readonly></textarea>
# # #                                 </div>
                                
# # #                                 <div style="margin: 25px 0;">
# # #                                     <button onclick="copyGeneratedLink()" id="copy-btn"
# # #                                         style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; margin-right: 15px;">
# # #                                         📋 Copy Link
# # #                                     </button>
# # #                                     <span id="copy-status" style="color: #28a745; font-weight: 600; font-size: 16px;"></span>
# # #                                 </div>
                                
# # #                                 <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin-top: 25px; text-align: left;">
# # #                                     <div style="color: #856404; font-weight: 600; margin-bottom: 8px;">
# # #                                         ⚠️ Important Instructions:
# # #                                     </div>
# # #                                     <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
# # #                                         <li>This link expires in <strong>7 days</strong></li>
# # #                                         <li>Send this link to employees via email</li>
# # #                                         <li>Each employee can use this same link</li>
# # #                                         <li>Once an employee submits, they cannot submit again</li>
# # #                                     </ul>
# # #                                 </div>
# # #                             </div>
# # #                         </div>
# # #                     </div>
# # #                 </div>
# # #             </div>
            
# # #             <script>
# # #                 function generateNewLink() {
# # #                     const timestamp = Math.floor(Date.now() / 1000);
# # #                     const data = "GENERIC_" + timestamp;
# # #                     const encoded = btoa(data);
# # #                     const link = window.location.origin + "/en/onboarding/employee-onboarding/" + encoded + "/";
                    
# # #                     // Show creation and expiry dates
# # #                     const createdDate = new Date(timestamp * 1000);
# # #                     const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                    
# # #                     document.getElementById("created-time").textContent = createdDate.toLocaleString();
# # #                     document.getElementById("expiry-time").textContent = expiryDate.toLocaleString();
# # #                     document.getElementById("generated-link-input").value = link;
# # #                     document.getElementById("generated-link-container").style.display = "block";
                    
# # #                     const btn = document.getElementById("generate-btn");
# # #                     btn.innerHTML = "✅ Link Generated!";
# # #                     btn.style.background = "linear-gradient(135deg, #28a745, #1e7e34)";
                    
# # #                     setTimeout(function() {
# # #                         btn.innerHTML = "Generate New Link";
# # #                         btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
# # #                     }, 3000);
                    
# # #                     // Scroll to the generated link
# # #                     document.getElementById("generated-link-container").scrollIntoView({ 
# # #                         behavior: 'smooth' 
# # #                     });
# # #                 }
                
# # #                 function copyGeneratedLink() {
# # #                     const input = document.getElementById("generated-link-input");
# # #                     input.select();
# # #                     input.setSelectionRange(0, 99999); // For mobile devices
                    
# # #                     try {
# # #                         document.execCommand("copy");
# # #                         document.getElementById("copy-status").innerHTML = "✅ Copied to Clipboard!";
                        
# # #                         const copyBtn = document.getElementById("copy-btn");
# # #                         copyBtn.style.background = "#20c997";
                        
# # #                         setTimeout(function() {
# # #                             document.getElementById("copy-status").innerHTML = "";
# # #                             copyBtn.style.background = "#28a745";
# # #                         }, 3000);
# # #                     } catch (err) {
# # #                         document.getElementById("copy-status").innerHTML = "❌ Copy failed - please select and copy manually";
# # #                         document.getElementById("copy-status").style.color = "#dc3545";
# # #                     }
# # #                 }
                
# # #                 // Add hover effects
# # #                 document.addEventListener('DOMContentLoaded', function() {
# # #                     const generateBtn = document.getElementById('generate-btn');
# # #                     generateBtn.addEventListener('mouseenter', function() {
# # #                         this.style.transform = 'translateY(-2px)';
# # #                         this.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
# # #                     });
# # #                     generateBtn.addEventListener('mouseleave', function() {
# # #                         this.style.transform = 'translateY(0)';
# # #                         this.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
# # #                     });
# # #                 });
# # #             </script>
# # #         </body>
# # #         </html>
# # #         '''
        
# # #         return HttpResponse(html_content)
    
# # #     def has_add_permission(self, request):
# # #         return False
    
# # #     def has_change_permission(self, request, obj=None):
# # #         return False
    
# # #     def has_delete_permission(self, request, obj=None):
# # #         return False

# # # # Register models
# # # admin.site.register(ITSupporter, ITSupporterAdmin)
# # # admin.site.register(Employee, EmployeeAdmin)
# # # admin.site.register(Offboarding, OffboardingAdmin)
# # # admin.site.register(OnboardingLink, OnboardingLinkAdmin)

# # # # Customize admin site header
# # # admin.site.site_header = "Techoptima HR Management"
# # # admin.site.site_title = "HR Admin"
# # # admin.site.index_title = "Welcome to HR Management Portal"



# # from django.contrib import admin
# # from django.utils.html import format_html
# # from django.urls import reverse, path
# # from django.shortcuts import render, redirect
# # from django.http import HttpResponse, HttpResponseRedirect
# # from django.contrib import messages
# # from django.utils import timezone
# # from .models import Employee, Offboarding, ITSupporter, OnboardingLink
# # import time
# # import base64

# # class ITSupporterAdmin(admin.ModelAdmin):
# #     list_display = ['name', 'email', 'is_active', 'created_at']
# #     list_filter = ['is_active', 'created_at']
# #     search_fields = ['name', 'email']
# #     list_display_links = ['name']
    
# #     fieldsets = (
# #         ('IT Supporter Information', {
# #             'fields': ('name', 'email', 'is_active')
# #         }),
# #     )

# # class EmployeeAdmin(admin.ModelAdmin):
# #     list_display = [
# #         'full_name_display', 'email', 'phone_number', 'department', 'position', 'employee_type', 
# #         'submission_status', 'documents_status', 'files_status', 'it_status', 'soft_delete_status', 'actions_column'
# #     ]
# #     list_filter = [
# #         'employee_type', 'department', 'position', 'is_self_submitted', 
# #         'it_notification_sent', 'submitted_at', 'is_deleted'
# #     ]
# #     search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department', 'position']
# #     list_display_links = ['full_name_display']
# #     date_hierarchy = 'submitted_at'
    
# #     fieldsets = (
# #         ('Basic Information', {
# #             'fields': (
# #                 'first_name', 'last_name', 'email', 'phone_number', 'employee_type', 'department', 'position', 
# #                 'address', 'joining_date'
# #             )
# #         }),
# #         ('Submission Information', {
# #             'fields': ('is_self_submitted', 'submitted_at'),
# #             'classes': ('collapse',),
# #             'description': 'Information about employee submission status.'
# #         }),
# #         ('Document Collection', {
# #             'fields': (
# #                 ('aadhar_pan_collected', 'aadhar_pan_file'),
# #                 ('payslips_collected', 'payslips_file'),
# #                 ('educational_certificates_collected', 'educational_certificates_file'),
# #                 ('previous_offer_letter_collected', 'previous_offer_letter_file'),
# #                 ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
# #                 ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
# #             ),
# #             'classes': ('collapse',),
# #             'description': 'Check the box when document is collected and upload the file.'
# #         }),
# #         ('IT Notification', {
# #             'fields': ('it_notification_sent',),
# #             'classes': ('collapse',),
# #             'description': 'Track if IT team has been notified for asset assignment.'
# #         }),
# #         ('Soft Delete Information', {
# #             'fields': ('is_deleted', 'deleted_at'),
# #             'classes': ('collapse',),
# #             'description': 'Soft delete status and information.'
# #         }),
# #     )
    
# #     readonly_fields = ['is_self_submitted', 'submitted_at', 'it_notification_sent', 'deleted_at']
    
# #     def get_queryset(self, request):
# #         """Override to show all employees including soft-deleted ones in admin"""
# #         return Employee.all_objects.all().order_by('-submitted_at', '-id')
    
# #     def full_name_display(self, obj):
# #         name = obj.full_name
# #         if obj.is_deleted:
# #             return format_html('<span style="color: #dc3545; text-decoration: line-through;">{} [DELETED]</span>', name)
# #         return name
# #     full_name_display.short_description = 'Name'
    
# #     def submission_status(self, obj):
# #         if obj.is_deleted:
# #             return format_html('<span style="color: #dc3545;">🗑️ Deleted</span>')
# #         elif obj.is_self_submitted:
# #             return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
# #         else:
# #             return format_html('<span style="color: orange;">⏳ Pending</span>')
# #     submission_status.short_description = 'Onboarding Status'
    
# #     def documents_status(self, obj):
# #         if obj.is_deleted:
# #             return format_html('<span style="color: #6c757d;">N/A</span>')
# #         elif obj.all_documents_collected:
# #             return format_html('<span style="color: green;">✓ Complete</span>')
# #         else:
# #             return format_html('<span style="color: red;">✗ Incomplete</span>')
# #     documents_status.short_description = 'Documents Collected'
    
# #     def files_status(self, obj):
# #         if obj.is_deleted:
# #             return format_html('<span style="color: #6c757d;">N/A</span>')
            
# #         files_uploaded = 0
# #         total_files = 6
        
# #         if obj.aadhar_pan_file:
# #             files_uploaded += 1
# #         if obj.payslips_file:
# #             files_uploaded += 1
# #         if obj.educational_certificates_file:
# #             files_uploaded += 1
# #         if obj.previous_offer_letter_file:
# #             files_uploaded += 1
# #         if obj.relieving_experience_letters_file:
# #             files_uploaded += 1
# #         if obj.appraisal_hike_letters_file:
# #             files_uploaded += 1
            
# #         if files_uploaded == total_files:
# #             return format_html('<span style="color: green;">✓ All Files ({}/{})</span>', files_uploaded, total_files)
# #         elif files_uploaded > 0:
# #             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', files_uploaded, total_files)
# #         else:
# #             return format_html('<span style="color: red;">✗ No Files (0/{})</span>', total_files)
# #     files_status.short_description = 'Files Uploaded'
    
# #     def it_status(self, obj):
# #         if obj.is_deleted:
# #             return format_html('<span style="color: #6c757d;">N/A</span>')
# #         elif obj.it_notification_sent:
# #             return format_html('<span style="color: green;">✓ Notified</span>')
# #         else:
# #             return format_html('<span style="color: orange;">⚠ Ready to Notify</span>')
# #     it_status.short_description = 'IT Status'
    
# #     def soft_delete_status(self, obj):
# #         if obj.is_deleted:
# #             deleted_date = obj.deleted_at.strftime('%Y-%m-%d %H:%M') if obj.deleted_at else 'Unknown'
# #             return format_html('<span style="color: #dc3545;">🗑️ Deleted on {}</span>', deleted_date)
# #         else:
# #             return format_html('<span style="color: green;">✓ Active</span>')
# #     soft_delete_status.short_description = 'Status'
    
# #     def actions_column(self, obj):
# #         if obj.is_deleted:
# #             # Show restore button for deleted employees
# #             return format_html(
# #                 '<a class="button" href="{}" style="background: #28a745; color: white;">Restore</a>',
# #                 reverse('admin:restore_employee', args=[obj.pk])
# #             )
# #         else:
# #             # Show edit and soft delete buttons for active employees
# #             edit_url = reverse('admin:onboarding_employee_change', args=[obj.pk])
# #             delete_url = reverse('admin:soft_delete_employee', args=[obj.pk])
# #             return format_html(
# #                 '<a class="button" href="{}">Edit</a> '
# #                 '<a class="button" href="{}" style="background: #dc3545; color: white;" onclick="return confirm(\'Are you sure you want to delete this employee? This will soft delete the record.\')">Delete</a>',
# #                 edit_url, delete_url
# #             )
# #     actions_column.short_description = 'Actions'
# #     actions_column.allow_tags = True
    
# #     def get_urls(self):
# #         urls = super().get_urls()
# #         custom_urls = [
# #             path('soft-delete/<int:employee_id>/', self.admin_site.admin_view(self.soft_delete_employee), name='soft_delete_employee'),
# #             path('restore/<int:employee_id>/', self.admin_site.admin_view(self.restore_employee), name='restore_employee'),
# #         ]
# #         return custom_urls + urls
    
# #     def soft_delete_employee(self, request, employee_id):
# #         """Custom view to soft delete an employee"""
# #         try:
# #             employee = Employee.all_objects.get(id=employee_id)
# #             if not employee.is_deleted:
# #                 employee.soft_delete()
# #                 messages.success(request, f'Employee "{employee.full_name}" has been soft deleted successfully.')
# #             else:
# #                 messages.warning(request, f'Employee "{employee.full_name}" is already deleted.')
# #         except Employee.DoesNotExist:
# #             messages.error(request, 'Employee not found.')
        
# #         return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
# #     def restore_employee(self, request, employee_id):
# #         """Custom view to restore a soft deleted employee"""
# #         try:
# #             employee = Employee.all_objects.get(id=employee_id)
# #             if employee.is_deleted:
# #                 employee.restore()
# #                 messages.success(request, f'Employee "{employee.full_name}" has been restored successfully.')
# #             else:
# #                 messages.warning(request, f'Employee "{employee.full_name}" is not deleted.')
# #         except Employee.DoesNotExist:
# #             messages.error(request, 'Employee not found.')
        
# #         return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
# #     def delete_model(self, request, obj):
# #         """Override delete_model to perform soft delete instead of hard delete"""
# #         if not obj.is_deleted:
# #             obj.soft_delete()
# #             messages.success(request, f'Employee "{obj.full_name}" has been soft deleted.')
# #         else:
# #             messages.warning(request, f'Employee "{obj.full_name}" is already deleted.')
    
# #     def delete_queryset(self, request, queryset):
# #         """Override bulk delete to perform soft delete"""
# #         count = 0
# #         for obj in queryset:
# #             if not obj.is_deleted:
# #                 obj.soft_delete()
# #                 count += 1
        
# #         if count > 0:
# #             messages.success(request, f'{count} employee(s) have been soft deleted.')
# #         else:
# #             messages.warning(request, 'No active employees were selected for deletion.')
    
# #     def has_delete_permission(self, request, obj=None):
# #         """Allow delete permission (we're doing soft delete anyway)"""
# #         return True

# # class OffboardingAdmin(admin.ModelAdmin):
# #     list_display = ['employee', 'last_working_date', 'assets_status']
# #     search_fields = ['employee__first_name', 'employee__last_name', 'employee__email']
    
# #     def get_queryset(self, request):
# #         """Show offboarding records only for active employees by default"""
# #         return super().get_queryset(request).select_related('employee')
    
# #     def formfield_for_foreignkey(self, db_field, request, **kwargs):
# #         """Only show active employees in the dropdown"""
# #         if db_field.name == "employee":
# #             kwargs["queryset"] = Employee.objects.all()  # Only active employees
# #         return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
# #     fieldsets = (
# #         ('Basic Information', {
# #             'fields': ('employee', 'last_working_date')
# #         }),
# #         ('Assets Collection', {
# #             'fields': (
# #                 ('laptop_returned', 'charger_returned'),
# #             ),
# #             'description': 'Check the boxes for returned assets.'
# #         }),
# #         ('Damaged Assets & Remarks', {
# #             'fields': ('damaged_assets_file', 'remarks'),
# #             'description': 'Upload file for any damaged assets and add remarks.'
# #         }),
# #     )
    
# #     def assets_status(self, obj):
# #         returned_count = 0
# #         total_assets = 2
        
# #         if obj.laptop_returned:
# #             returned_count += 1
# #         if obj.charger_returned:
# #             returned_count += 1
            
# #         if returned_count == total_assets:
# #             return format_html('<span style="color: green;">✓ All Returned ({}/{})</span>', returned_count, total_assets)
# #         elif returned_count > 0:
# #             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', returned_count, total_assets)
# #         else:
# #             return format_html('<span style="color: red;">✗ None Returned (0/{})</span>', total_assets)
# #     assets_status.short_description = 'Assets Returned'

# # class OnboardingLinkAdmin(admin.ModelAdmin):
    
# #     def changelist_view(self, request, extra_context=None):
# #         """Show the link generator instead of a normal list"""
        
# #         html_content = '''
# #         <!DOCTYPE html>
# #         <html>
# #         <head>
# #             <title>Generate Onboarding Link</title>
# #             <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
# #             <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
# #         </head>
# #         <body class="app-onboarding model-onboardinglink change-list">
# #             <div id="container">
# #                 <div id="header">
# #                     <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
# #                     <div id="user-tools">
# #                         <a href="/admin/">Home</a> / 
# #                         <a href="/admin/onboarding/">Onboarding</a> / 
# #                         Generate Link
# #                     </div>
# #                 </div>
                
# #                 <div class="breadcrumbs">
# #                     <a href="/admin/">Home</a> &rsaquo; 
# #                     <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
# #                     Onboarding Links
# #                 </div>
                
# #                 <div id="content" class="colM">
# #                     <h1>Generate Onboarding Link</h1>
                    
# #                     <div class="module aligned">
# #                         <div style="text-align: center; padding: 60px 40px; background: #f8f9fa; border-radius: 12px; margin: 30px 0; border: 1px solid #e9ecef;">
# #                             <h2 style="color: #343a40; margin-bottom: 25px; font-size: 28px;">🔗 Onboarding Link Generator</h2>
# #                             <p style="color: #6c757d; margin-bottom: 35px; font-size: 18px; line-height: 1.5;">
# #                                 Generate a timestamped onboarding link that employees can use to submit their information.<br>
# #                                 The link will be valid for 7 days from the time of generation.
# #                             </p>
                            
# #                             <button onclick="generateNewLink()" id="generate-btn"
# #                                 style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 18px 36px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,123,255,0.3); transition: all 0.3s ease;">
# #                                 Generate New Link
# #                             </button>
                            
# #                             <div id="generated-link-container" style="display: none; margin-top: 40px; padding: 30px; background: white; border-radius: 10px; border: 2px solid #28a745; box-shadow: 0 6px 20px rgba(40,167,69,0.15);">
# #                                 <h3 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">
# #                                     ✅ Link Generated Successfully!
# #                                 </h3>
                                
# #                                 <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
# #                                     <div style="color: #0c5460; font-weight: 600; margin-bottom: 5px;">📅 Link Information:</div>
# #                                     <div style="color: #0c5460;">
# #                                         <strong>Created:</strong> <span id="created-time"></span><br>
# #                                         <strong>Expires:</strong> <span id="expiry-time"></span>
# #                                     </div>
# #                                 </div>
                                
# #                                 <div style="text-align: left; margin: 20px 0;">
# #                                     <label style="font-weight: 600; color: #495057; display: block; margin-bottom: 8px;">
# #                                         Generated Onboarding Link:
# #                                     </label>
# #                                     <textarea id="generated-link-input" 
# #                                         style="width: 100%; height: 100px; padding: 15px; font-family: 'Courier New', monospace; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px; resize: none; background: #f8f9fa;" 
# #                                         readonly></textarea>
# #                                 </div>
                                
# #                                 <div style="margin: 25px 0;">
# #                                     <button onclick="copyGeneratedLink()" id="copy-btn"
# #                                         style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; margin-right: 15px;">
# #                                         📋 Copy Link
# #                                     </button>
# #                                     <span id="copy-status" style="color: #28a745; font-weight: 600; font-size: 16px;"></span>
# #                                 </div>
                                
# #                                 <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin-top: 25px; text-align: left;">
# #                                     <div style="color: #856404; font-weight: 600; margin-bottom: 8px;">
# #                                         ⚠️ Important Instructions:
# #                                     </div>
# #                                     <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
# #                                         <li>This link expires in <strong>7 days</strong></li>
# #                                         <li>Send this link to employees via email</li>
# #                                         <li>Each employee can use this same link</li>
# #                                         <li>Once an employee submits, they cannot submit again</li>
# #                                     </ul>
# #                                 </div>
# #                             </div>
# #                         </div>
# #                     </div>
# #                 </div>
# #             </div>
            
# #             <script>
# #                 function generateNewLink() {
# #                     const timestamp = Math.floor(Date.now() / 1000);
# #                     const data = "GENERIC_" + timestamp;
# #                     const encoded = btoa(data);
# #                     const link = window.location.origin + "/en/onboarding/employee-onboarding/" + encoded + "/";
                    
# #                     // Show creation and expiry dates
# #                     const createdDate = new Date(timestamp * 1000);
# #                     const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                    
# #                     document.getElementById("created-time").textContent = createdDate.toLocaleString();
# #                     document.getElementById("expiry-time").textContent = expiryDate.toLocaleString();
# #                     document.getElementById("generated-link-input").value = link;
# #                     document.getElementById("generated-link-container").style.display = "block";
                    
# #                     const btn = document.getElementById("generate-btn");
# #                     btn.innerHTML = "✅ Link Generated!";
# #                     btn.style.background = "linear-gradient(135deg, #28a745, #1e7e34)";
                    
# #                     setTimeout(function() {
# #                         btn.innerHTML = "Generate New Link";
# #                         btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
# #                     }, 3000);
                    
# #                     // Scroll to the generated link
# #                     document.getElementById("generated-link-container").scrollIntoView({ 
# #                         behavior: 'smooth' 
# #                     });
# #                 }
                
# #                 function copyGeneratedLink() {
# #                     const input = document.getElementById("generated-link-input");
# #                     input.select();
# #                     input.setSelectionRange(0, 99999); // For mobile devices
                    
# #                     try {
# #                         document.execCommand("copy");
# #                         document.getElementById("copy-status").innerHTML = "✅ Copied to Clipboard!";
                        
# #                         const copyBtn = document.getElementById("copy-btn");
# #                         copyBtn.style.background = "#20c997";
                        
# #                         setTimeout(function() {
# #                             document.getElementById("copy-status").innerHTML = "";
# #                             copyBtn.style.background = "#28a745";
# #                         }, 3000);
# #                     } catch (err) {
# #                         document.getElementById("copy-status").innerHTML = "❌ Copy failed - please select and copy manually";
# #                         document.getElementById("copy-status").style.color = "#dc3545";
# #                     }
# #                 }
                
# #                 // Add hover effects
# #                 document.addEventListener('DOMContentLoaded', function() {
# #                     const generateBtn = document.getElementById('generate-btn');
# #                     generateBtn.addEventListener('mouseenter', function() {
# #                         this.style.transform = 'translateY(-2px)';
# #                         this.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
# #                     });
# #                     generateBtn.addEventListener('mouseleave', function() {
# #                         this.style.transform = 'translateY(0)';
# #                         this.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
# #                     });
# #                 });
# #             </script>
# #         </body>
# #         </html>
# #         '''
        
# #         return HttpResponse(html_content)
    
# #     def has_add_permission(self, request):
# #         return False
    
# #     def has_change_permission(self, request, obj=None):
# #         return False
    
# #     def has_delete_permission(self, request, obj=None):
# #         return False

# # # Register models
# # admin.site.register(ITSupporter, ITSupporterAdmin)
# # admin.site.register(Employee, EmployeeAdmin)
# # admin.site.register(Offboarding, OffboardingAdmin)
# # admin.site.register(OnboardingLink, OnboardingLinkAdmin)

# # # Customize admin site header
# # admin.site.site_header = "Techoptima HR Management"
# # admin.site.site_title = "HR Admin"
# # admin.site.index_title = "Welcome to HR Management Portal"




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
#         'full_name_display', 'email', 'phone_number', 'department', 'position', 'employee_type', 
#         'submission_status', 'documents_status', 'files_status', 'it_status', 'soft_delete_status', 'actions_column'
#     ]
#     list_filter = [
#         'employee_type', 'department', 'position', 'is_self_submitted', 
#         'it_notification_sent', 'submitted_at', 'is_deleted'
#     ]
#     search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department', 'position']
#     list_display_links = ['full_name_display']
#     date_hierarchy = 'submitted_at'
    
#     # Custom actions
#     actions = ['show_onboarding_employees', 'show_all_employees']
    
#     fieldsets = (
#         ('Basic Information', {
#             'fields': (
#                 'first_name', 'last_name', 'email', 'phone_number', 'employee_type', 'department', 'position', 
#                 'address', 'joining_date'
#             )
#         }),
#         ('Submission Information', {
#             'fields': ('is_self_submitted', 'submitted_at'),
#             'classes': ('collapse',),
#             'description': 'Information about employee submission status.'
#         }),
#         ('Document Collection', {
#             'fields': (
#                 ('aadhar_pan_collected', 'aadhar_pan_file'),
#                 ('payslips_collected', 'payslips_file'),
#                 ('educational_certificates_collected', 'educational_certificates_file'),
#                 ('previous_offer_letter_collected', 'previous_offer_letter_file'),
#                 ('relieving_experience_letters_collected', 'relieving_experience_letters_file'),
#                 ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file'),
#             ),
#             'classes': ('collapse',),
#             'description': 'Check the box when document is collected and upload the file.'
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
#         # return Employee.all_objects.all().order_by('-submitted_at', '-id')
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
    
#     # def show_all_employees(self, request, queryset):
#     #     """Custom action to show all employees (including deleted ones)"""
#     #     # Get counts for the message
#     #     total_count = Employee.all_objects.count()
#     #     active_count = Employee.objects.count()
#     #     deleted_count = total_count - active_count
        
#     #     # Create informative message
#     #     if deleted_count > 0:
#     #         message = (
#     #             f"Showing all {total_count} employees including {deleted_count} deleted employees. "
#     #             f"Deleted employees are shown with strikethrough text and [DELETED] label."
#     #         )
#     #     else:
#     #         message = f"Showing all {total_count} employees (no deleted employees found)."
        
#     #     self.message_user(request, message, level='info')
        
#     #     # Redirect to unfiltered view
#     #     from django.http import HttpResponseRedirect
#     #     from django.urls import reverse
        
#     #     url = reverse('admin:onboarding_employee_changelist')
#     #     return HttpResponseRedirect(url)
    
#     # show_all_employees.short_description = "Show all employees (including deleted)"
    
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
    
#     def submission_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #dc3545;">🗑️ Deleted</span>')
#         elif obj.is_self_submitted:
#             return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
#         else:
#             return format_html('<span style="color: orange;">⏳ Pending</span>')
#     submission_status.short_description = 'Onboarding Status'
    
#     def documents_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
#         elif obj.all_documents_collected:
#             return format_html('<span style="color: green;">✓ Complete</span>')
#         else:
#             return format_html('<span style="color: red;">✗ Incomplete</span>')
#     documents_status.short_description = 'Documents Collected'
    
#     def files_status(self, obj):
#         if obj.is_deleted:
#             return format_html('<span style="color: #6c757d;">N/A</span>')
            
#         files_uploaded = 0
#         total_files = 6
        
#         if obj.aadhar_pan_file:
#             files_uploaded += 1
#         if obj.payslips_file:
#             files_uploaded += 1
#         if obj.educational_certificates_file:
#             files_uploaded += 1
#         if obj.previous_offer_letter_file:
#             files_uploaded += 1
#         if obj.relieving_experience_letters_file:
#             files_uploaded += 1
#         if obj.appraisal_hike_letters_file:
#             files_uploaded += 1
            
#         if files_uploaded == total_files:
#             return format_html('<span style="color: green;">✓ All Files ({}/{})</span>', files_uploaded, total_files)
#         elif files_uploaded > 0:
#             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', files_uploaded, total_files)
#         else:
#             return format_html('<span style="color: red;">✗ No Files (0/{})</span>', total_files)
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
#             # Show edit and soft delete buttons for active employees
#             edit_url = reverse('admin:onboarding_employee_change', args=[obj.pk])
#             delete_url = reverse('admin:soft_delete_employee', args=[obj.pk])
#             return format_html(
#                 '<div style="display: flex; gap: 5px;">'
#                 '<a class="button" href="{}" style="margin-right: 5px;">Edit</a>'
#                 '<a class="button" href="{}" style="background: #dc3545; color: white;" onclick="return confirm(\'Are you sure you want to delete this employee? This will soft delete the record.\')">Delete</a>'
#                 '</div>',
#                 edit_url, delete_url
#             )
#     actions_column.short_description = 'Actions'
#     actions_column.allow_tags = True
    
#     def get_urls(self):
#         urls = super().get_urls()
#         custom_urls = [
#             path('soft-delete/<int:employee_id>/', self.admin_site.admin_view(self.soft_delete_employee), name='soft_delete_employee'),
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
    
#     def soft_delete_employee(self, request, employee_id):
#         """Custom view to soft delete an employee"""
#         try:
#             employee = Employee.all_objects.get(id=employee_id)
#             if not employee.is_deleted:
#                 employee.soft_delete()
#                 messages.success(request, f'Employee "{employee.full_name}" has been soft deleted successfully.')
#             else:
#                 messages.warning(request, f'Employee "{employee.full_name}" is already deleted.')
#         except Employee.DoesNotExist:
#             messages.error(request, 'Employee not found.')
        
#         return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
#     def restore_employee(self, request, employee_id):
#         """Custom view to restore a soft deleted employee"""
#         try:
#             employee = Employee.all_objects.get(id=employee_id)
#             if employee.is_deleted:
#                 employee.restore()
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

# class OffboardingAdmin(admin.ModelAdmin):
#     list_display = ['employee', 'last_working_date', 'assets_status']
#     search_fields = ['employee__first_name', 'employee__last_name', 'employee__email']
    
#     def get_queryset(self, request):
#         """Show offboarding records only for active employees by default"""
#         return super().get_queryset(request).select_related('employee')
    
#     def formfield_for_foreignkey(self, db_field, request, **kwargs):
#         """Only show active employees in the dropdown"""
#         if db_field.name == "employee":
#             kwargs["queryset"] = Employee.objects.all()  # Only active employees
#         return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('employee', 'last_working_date')
#         }),
#         ('Assets Collection', {
#             'fields': (
#                 ('laptop_returned', 'charger_returned'),
#             ),
#             'description': 'Check the boxes for returned assets.'
#         }),
#         ('Damaged Assets & Remarks', {
#             'fields': ('damaged_assets_file', 'remarks'),
#             'description': 'Upload file for any damaged assets and add remarks.'
#         }),
#     )
    
#     def assets_status(self, obj):
#         returned_count = 0
#         total_assets = 2
        
#         if obj.laptop_returned:
#             returned_count += 1
#         if obj.charger_returned:
#             returned_count += 1
            
#         if returned_count == total_assets:
#             return format_html('<span style="color: green;">✓ All Returned ({}/{})</span>', returned_count, total_assets)
#         elif returned_count > 0:
#             return format_html('<span style="color: orange;">⚠ Partial ({}/{})</span>', returned_count, total_assets)
#         else:
#             return format_html('<span style="color: red;">✗ None Returned (0/{})</span>', total_assets)
#     assets_status.short_description = 'Assets Returned'

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


# from django.http import HttpResponse
# from django.utils.html import escape
# from .models import Employee, DeletedEmployees

# class DeletedEmployeeAdmin(admin.ModelAdmin):
#     def get_urls(self):
#         from django.urls import path
#         custom_urls = [
#             path('deleted-employees/', self.admin_site.admin_view(self.changelist_view), name='deleted_employees'),
#         ]
#         return custom_urls + super().get_urls()

#     def changelist_view(self, request, extra_context=None):
#         # Handle restore POST request
#         if request.method == "POST" and "restore_id" in request.POST:
#             employee_id = request.POST["restore_id"]
#             try:
#                 emp = Employee.all_objects.get(id=employee_id)
#                 emp.is_deleted = False
#                 emp.save()
#                 self.message_user(request, f"Employee '{emp.full_name}' restored successfully.")
#             except Employee.DoesNotExist:
#                 self.message_user(request, "Employee not found.", level='error')

#         # Fetch soft-deleted employees
#         deleted_employees = Employee.all_objects.filter(is_deleted=True)

#         # Generate table rows
#         rows = ""
#         for emp in deleted_employees:
#             rows += f"""
#                 <tr>
#                     <td>{escape(emp.full_name)}</td>
#                     <td>{escape(emp.email)}</td>
#                     <td>{escape(emp.get_department_display())}</td>
#                     <td>{escape(emp.get_position_display())}</td>
#                     <td>{emp.deleted_at.strftime('%Y-%m-%d %H:%M') if emp.deleted_at else '—'}</td>
#                     <td>
#                         <form method="post" style="display:inline;">
#                             <input type="hidden" name="csrfmiddlewaretoken" value="{request.META.get("CSRF_COOKIE", "")}">
#                             <input type="hidden" name="restore_id" value="{emp.id}">
#                             <button type="submit" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
#                                 Restore
#                             </button>
#                         </form>
#                     </td>
#                 </tr>
#             """

#         # Render HTML
#         html_content = f"""
#         <!DOCTYPE html>
#         <html>
#         <head>
#             <title>Deleted Employees</title>
#             <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
#             <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
#             <style type="text/css">
#                 table.enhanced-table {{
#                     width: 100%;
#                     border-collapse: separate;
#                     border-spacing: 0;
#                     margin-top: 20px;
#                     font-family: 'Segoe UI', sans-serif;
#                     box-shadow: 0 4px 10px rgba(0,0,0,0.05);
#                     border-radius: 10px;
#                     overflow: hidden;
#                 }}
#                 table.enhanced-table thead {{
#                     background: linear-gradient(135deg, #007bff, #0056b3);
#                     color: white;
#                 }}
#                 table.enhanced-table th,
#                 table.enhanced-table td {{
#                     padding: 14px 18px;
#                     border-bottom: 1px solid #eaeaea;
#                     text-align: left;
#                     font-size: 15px;
#                 }}
#                 table.enhanced-table tbody tr:nth-child(even) {{
#                     background-color: #f9f9f9;
#                 }}
#                 table.enhanced-table tbody tr:hover {{
#                     background-color: #eef6ff;
#                 }}
#                 .restore-button {{
#                     padding: 6px 14px;
#                     background: linear-gradient(135deg, #28a745, #218838);
#                     color: white;
#                     border: none;
#                     border-radius: 6px;
#                     font-weight: bold;
#                     cursor: pointer;
#                     transition: background 0.3s ease;
#                 }}
#                 .restore-button:hover {{
#                     background: linear-gradient(135deg, #218838, #1e7e34);
#                 }}
#             </style>
#         </head>
#         <body class="app-onboarding model-deletedemployees change-list">
#             <div id="container">
#                 <div id="header">
#                     <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
#                     <div id="user-tools">
#                         <a href="/admin/">Home</a> / 
#                         <a href="/admin/onboarding/">Onboarding</a> / 
#                         Deleted Employees
#                     </div>
#                 </div>

#                 <div class="breadcrumbs">
#                     <a href="/admin/">Home</a> &rsaquo; 
#                     <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
#                     Deleted Employees
#                 </div>

#                 <div id="content" class="colM">
#                     <a href="/en/456/onboarding/employee/" 
#                     style="display: inline-block; margin-bottom: 20px; padding: 10px 20px; font-size: 16px; 
#                             background: linear-gradient(135deg, #007bff, #0056b3); color: white; 
#                             border: none; border-radius: 5px; text-decoration: none; font-weight: 600;">
#                         ← Back
#                     </a>

#                     <h1 style="margin-bottom: 25px;">Deleted Employees</h1>
#                     <table class="enhanced-table">
#                         <thead>
#                             <tr>
#                                 <th>Name</th>
#                                 <th>Email</th>
#                                 <th>Department</th>
#                                 <th>Position</th>
#                                 <th>Deleted On</th>
#                                 <th>Action</th>
#                             </tr>
#                         </thead>
#                         <tbody>
#                             {rows or '<tr><td colspan="6" style="padding:14px; text-align:center;">No deleted employees found.</td></tr>'}
#                         </tbody>
#                     </table>
#                 </div>
#             </div>
#         </body>
#         </html>
#         """


#         return HttpResponse(html_content)

#     def has_add_permission(self, request): return False
#     def has_change_permission(self, request, obj=None): return False
#     def has_delete_permission(self, request, obj=None): return False



# # Register models
# admin.site.register(ITSupporter, ITSupporterAdmin)
# admin.site.register(Employee, EmployeeAdmin)
# admin.site.register(Offboarding, OffboardingAdmin)
# admin.site.register(OnboardingLink, OnboardingLinkAdmin)
# admin.site.register(DeletedEmployees,DeletedEmployeeAdmin)

# # Customize admin site header
# admin.site.site_header = "Techoptima HR Management"
# admin.site.site_title = "HR Admin"
# admin.site.index_title = "Welcome to HR Management Portal"


from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
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
        'full_name_display', 'email', 'phone_number', 'department', 'position', 'employee_type', 
        'submission_status', 'documents_status', 'files_status', 'it_status', 'soft_delete_status', 'actions_column'
    ]
    list_filter = [
        'employee_type', 'department', 'position', 'is_self_submitted', 
        'it_notification_sent', 'submitted_at', 'is_deleted'
    ]
    search_fields = ['first_name', 'last_name', 'email', 'phone_number', 'department', 'position']
    list_display_links = ['full_name_display']
    date_hierarchy = 'submitted_at'
    
    # Custom actions
    actions = ['show_onboarding_employees', 'show_all_employees']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'first_name', 'last_name', 'email', 'phone_number', 'employee_type', 'department', 'position', 
                'current_address', 'permanent_address', 'joining_date'
            )
        }),
        ('Submission Information', {
            'fields': ('is_self_submitted', 'submitted_at'),
            'classes': ('collapse',),
            'description': 'Information about employee submission status.'
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
        ('Soft Delete Information', {
            'fields': ('is_deleted', 'deleted_at'),
            'classes': ('collapse',),
            'description': 'Soft delete status and information.'
        }),
    )
    
    readonly_fields = ['is_self_submitted', 'submitted_at', 'it_notification_sent', 'deleted_at']
    
    def get_queryset(self, request):
        """Override to show all employees including soft-deleted ones in admin"""
        # return Employee.all_objects.all().order_by('-submitted_at', '-id')
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
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        
        url = reverse('admin:onboarding_employee_changelist')
        return HttpResponseRedirect(f"{url}?is_deleted__exact=0")
    
    show_onboarding_employees.short_description = "Show onboarding employees (active only)"
    
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
    
    def submission_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #dc3545;">🗑️ Deleted</span>')
        elif obj.is_self_submitted:
            return format_html('<span style="color: green; font-weight: bold;">✓ Completed</span>')
        else:
            return format_html('<span style="color: orange;">⏳ Pending</span>')
    submission_status.short_description = 'Onboarding Status'
    
    def documents_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
        elif obj.all_documents_collected:
            return format_html('<span style="color: green;">✓ Complete</span>')
        else:
            return format_html('<span style="color: red;">✗ Incomplete</span>')
    documents_status.short_description = 'Documents Collected'
    
    def files_status(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: #6c757d;">N/A</span>')
            
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
            # Show edit and soft delete buttons for active employees
            edit_url = reverse('admin:onboarding_employee_change', args=[obj.pk])
            delete_url = reverse('admin:soft_delete_employee', args=[obj.pk])
            return format_html(
                '<div style="display: flex; gap: 5px;">'
                '<a class="button" href="{}" style="margin-right: 5px;">Edit</a>'
                '<a class="button" href="{}" style="background: #dc3545; color: white;" onclick="return confirm(\'Are you sure you want to delete this employee? This will soft delete the record.\')">Delete</a>'
                '</div>',
                edit_url, delete_url
            )
    actions_column.short_description = 'Actions'
    actions_column.allow_tags = True
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('soft-delete/<int:employee_id>/', self.admin_site.admin_view(self.soft_delete_employee), name='soft_delete_employee'),
            path('restore/<int:employee_id>/', self.admin_site.admin_view(self.restore_employee), name='restore_employee'),
            path('onboarding-only/', self.admin_site.admin_view(self.onboarding_only_view), name='onboarding_employees_only'),
        ]
        return custom_urls + urls
    
    def onboarding_only_view(self, request):
        """Custom view to show only active onboarding employees"""
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        
        # Redirect to main changelist with filter applied
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
    
    def soft_delete_employee(self, request, employee_id):
        """Custom view to soft delete an employee"""
        try:
            employee = Employee.all_objects.get(id=employee_id)
            if not employee.is_deleted:
                employee.soft_delete()
                messages.success(request, f'Employee "{employee.full_name}" has been soft deleted successfully.')
            else:
                messages.warning(request, f'Employee "{employee.full_name}" is already deleted.')
        except Employee.DoesNotExist:
            messages.error(request, 'Employee not found.')
        
        return HttpResponseRedirect(reverse('admin:onboarding_employee_changelist'))
    
    def restore_employee(self, request, employee_id):
        """Custom view to restore a soft deleted employee"""
        try:
            employee = Employee.all_objects.get(id=employee_id)
            if employee.is_deleted:
                employee.restore()
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

class OffboardingAdmin(admin.ModelAdmin):
    list_display = ['employee', 'last_working_date', 'assets_status']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__email']
    
    def get_queryset(self, request):
        """Show offboarding records only for active employees by default"""
        return super().get_queryset(request).select_related('employee')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Only show active employees in the dropdown"""
        if db_field.name == "employee":
            kwargs["queryset"] = Employee.objects.all()  # Only active employees
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
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
                                        <li><strong>Note:</strong> Employees will only fill personal info and upload documents. HR will complete employment details after review.</li>
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


from django.http import HttpResponse
from django.utils.html import escape
from .models import Employee, DeletedEmployees

class DeletedEmployeeAdmin(admin.ModelAdmin):
    def get_urls(self):
        from django.urls import path
        custom_urls = [
            path('deleted-employees/', self.admin_site.admin_view(self.changelist_view), name='deleted_employees'),
        ]
        return custom_urls + super().get_urls()

    def changelist_view(self, request, extra_context=None):
        # Handle restore POST request
        if request.method == "POST" and "restore_id" in request.POST:
            employee_id = request.POST["restore_id"]
            try:
                emp = Employee.all_objects.get(id=employee_id)
                emp.is_deleted = False
                emp.save()
                self.message_user(request, f"Employee '{emp.full_name}' restored successfully.")
            except Employee.DoesNotExist:
                self.message_user(request, "Employee not found.", level='error')

        # Fetch soft-deleted employees
        deleted_employees = Employee.all_objects.filter(is_deleted=True)

        # Generate table rows
        rows = ""
        for emp in deleted_employees:
            rows += f"""
                <tr>
                    <td>{escape(emp.full_name)}</td>
                    <td>{escape(emp.email)}</td>
                    <td>{escape(emp.get_department_display() if emp.department else 'Not Set')}</td>
                    <td>{escape(emp.get_position_display() if emp.position else 'Not Set')}</td>
                    <td>{emp.deleted_at.strftime('%Y-%m-%d %H:%M') if emp.deleted_at else '—'}</td>
                    <td>
                        <form method="post" style="display:inline;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="{request.META.get("CSRF_COOKIE", "")}">
                            <input type="hidden" name="restore_id" value="{emp.id}">
                            <button type="submit" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                                Restore
                            </button>
                        </form>
                    </td>
                </tr>
            """

        # Render HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Deleted Employees</title>
            <link rel="stylesheet" type="text/css" href="/static/admin/css/base.css">
            <link rel="stylesheet" type="text/css" href="/static/admin/css/forms.css">
            <style type="text/css">
                table.enhanced-table {{
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 20px;
                    font-family: 'Segoe UI', sans-serif;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                    border-radius: 10px;
                    overflow: hidden;
                }}
                table.enhanced-table thead {{
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                }}
                table.enhanced-table th,
                table.enhanced-table td {{
                    padding: 14px 18px;
                    border-bottom: 1px solid #eaeaea;
                    text-align: left;
                    font-size: 15px;
                }}
                table.enhanced-table tbody tr:nth-child(even) {{
                    background-color: #f9f9f9;
                }}
                table.enhanced-table tbody tr:hover {{
                    background-color: #eef6ff;
                }}
                .restore-button {{
                    padding: 6px 14px;
                    background: linear-gradient(135deg, #28a745, #218838);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }}
                .restore-button:hover {{
                    background: linear-gradient(135deg, #218838, #1e7e34);
                }}
            </style>
        </head>
        <body class="app-onboarding model-deletedemployees change-list">
            <div id="container">
                <div id="header">
                    <div id="branding"><h1 id="site-name">Techoptima HR Management</h1></div>
                    <div id="user-tools">
                        <a href="/admin/">Home</a> / 
                        <a href="/admin/onboarding/">Onboarding</a> / 
                        Deleted Employees
                    </div>
                </div>

                <div class="breadcrumbs">
                    <a href="/admin/">Home</a> &rsaquo; 
                    <a href="/admin/onboarding/">Onboarding</a> &rsaquo; 
                    Deleted Employees
                </div>

                <div id="content" class="colM">
                    <a href="/en/456/onboarding/employee/" 
                    style="display: inline-block; margin-bottom: 20px; padding: 10px 20px; font-size: 16px; 
                            background: linear-gradient(135deg, #007bff, #0056b3); color: white; 
                            border: none; border-radius: 5px; text-decoration: none; font-weight: 600;">
                        ← Back
                    </a>

                    <h1 style="margin-bottom: 25px;">Deleted Employees</h1>
                    <table class="enhanced-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Position</th>
                                <th>Deleted On</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows or '<tr><td colspan="6" style="padding:14px; text-align:center;">No deleted employees found.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        """


        return HttpResponse(html_content)

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False



# Register models
admin.site.register(ITSupporter, ITSupporterAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(Offboarding, OffboardingAdmin)
admin.site.register(OnboardingLink, OnboardingLinkAdmin)
admin.site.register(DeletedEmployees,DeletedEmployeeAdmin)

# Customize admin site header
admin.site.site_header = "Techoptima HR Management"
admin.site.site_title = "HR Admin"
admin.site.index_title = "Welcome to HR Management Portal"