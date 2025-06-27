# # from django.db import models

# # # Commented out IT Supporter model
# # class ITSupporter(models.Model):
# #     name = models.CharField(max_length=100)
# #     email = models.EmailField(unique=True)
# #     is_active = models.BooleanField(default=True)
# #     created_at = models.DateTimeField(auto_now_add=True)
    
# #     class Meta:
# #         verbose_name = 'IT Supporter'
# #         verbose_name_plural = 'IT Supporters'
    
# #     def __str__(self):
# #         return f"{self.name} ({self.email})"

# # class Employee(models.Model):
# #     EMPLOYEE_TYPE_CHOICES = [
# #         ('fresher', 'Fresher'),
# #         ('employee', 'Employee'),
# #     ]
    
# #     name = models.CharField(max_length=100)
# #     email = models.EmailField(unique=True)
# #     employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
# #     # Removed status field as requested
# #     joining_date = models.DateField(null=True, blank=True)
# #     position = models.CharField(max_length=100, blank=True, null=True)
    
# #     # Flag to track if IT notification was sent
# #     it_notification_sent = models.BooleanField(default=False, verbose_name="IT Notification Sent")
    
# #     # Document collection checkboxes and file uploads
# #     aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card")
# #     aadhar_pan_file = models.FileField(upload_to='documents/aadhar_pan/', blank=True, null=True, verbose_name="Aadhar & PAN File")
    
# #     payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips")
# #     payslips_file = models.FileField(upload_to='documents/payslips/', blank=True, null=True, verbose_name="Payslips File")
    
# #     educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree)")
# #     educational_certificates_file = models.FileField(upload_to='documents/educational_certificates/', blank=True, null=True, verbose_name="Educational Certificates File")
    
# #     previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter")
# #     previous_offer_letter_file = models.FileField(upload_to='documents/previous_offer_letter/', blank=True, null=True, verbose_name="Previous Offer Letter File")
    
# #     relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters")
# #     relieving_experience_letters_file = models.FileField(upload_to='documents/relieving_experience/', blank=True, null=True, verbose_name="Relieving & Experience Letters File")
    
# #     appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters ")
# #     appraisal_hike_letters_file = models.FileField(upload_to='documents/appraisal_hike/', blank=True, null=True, verbose_name="Appraisal/Hike Letters File")
    
# #     class Meta:
# #         verbose_name = 'Employee (Onboarding)'
# #         verbose_name_plural = 'Employees (Onboarding)'
    
# #     def __str__(self):
# #         return self.name
    
# #     @property
# #     def all_documents_collected(self):
# #         """Check if all required documents are collected"""
# #         return all([
# #             self.aadhar_pan_collected,
# #             self.payslips_collected,
# #             self.educational_certificates_collected,
# #             self.previous_offer_letter_collected,
# #             self.relieving_experience_letters_collected,
# #             self.appraisal_hike_letters_collected,
# #         ])
    
# #     @property
# #     def onboarding_complete(self):
# #         """Check if onboarding is complete (just based on documents now)"""
# #         return self.all_documents_collected

# # class Offboarding(models.Model):
# #     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
# #     last_working_date = models.DateField()
    
# #     # Asset collection checkboxes
# #     laptop_returned = models.BooleanField(default=False, verbose_name="Laptop")
# #     charger_returned = models.BooleanField(default=False, verbose_name="Charger")
    
# #     # Damaged assets file upload
# #     damaged_assets_file = models.FileField(upload_to='offboarding/damaged_assets/', blank=True, null=True, verbose_name="Damaged Assets File")
    
# #     remarks = models.TextField(blank=True, null=True)
    
# #     class Meta:
# #         verbose_name = 'Employee Offboarding'
# #         verbose_name_plural = 'Employee Offboarding'
    
# #     def __str__(self):
# #         return f"Offboarding for {self.employee.name}"


# # from django.db import models

# # class ITSupporter(models.Model):
# #     name = models.CharField(max_length=100)  # Keep as single name field for IT Supporter
# #     email = models.EmailField(unique=True)
# #     is_active = models.BooleanField(default=True)
# #     created_at = models.DateTimeField(auto_now_add=True)
    
# #     class Meta:
# #         verbose_name = 'IT Supporter'
# #         verbose_name_plural = 'IT Supporters'
    
# #     def __str__(self):
# #         return f"{self.name} ({self.email})"



# # class Employee(models.Model):
# #     EMPLOYEE_TYPE_CHOICES = [
# #         ('fresher', 'Fresher'),
# #         ('employee', 'Employee'),
# #     ]
    
# #     DEPARTMENT_CHOICES = [
# #         ('hr', 'Human Resources'),
# #         ('it', 'Information Technology'),
# #         ('finance', 'Finance'),
# #         ('marketing', 'Marketing'),
# #         ('sales', 'Sales'),
# #         ('operations', 'Operations'),
# #         ('development', 'Development'),
# #         ('design', 'Design'),
# #         ('qa', 'Quality Assurance'),
# #         ('support', 'Customer Support'),
# #     ]
    
# #     POSITION_CHOICES = [
# #         # HR Positions
# #         ('hr_manager', 'HR Manager'),
# #         ('hr_executive', 'HR Executive'),
# #         ('hr_intern', 'HR Intern'),
        
# #         # IT Positions
# #         ('it_manager', 'IT Manager'),
# #         ('system_admin', 'System Administrator'),
# #         ('network_engineer', 'Network Engineer'),
# #         ('it_support', 'IT Support'),
        
# #         # Development Positions
# #         ('senior_developer', 'Senior Developer'),
# #         ('junior_developer', 'Junior Developer'),
# #         ('full_stack_developer', 'Full Stack Developer'),
# #         ('frontend_developer', 'Frontend Developer'),
# #         ('backend_developer', 'Backend Developer'),
# #         ('devops_engineer', 'DevOps Engineer'),
# #         ('tech_lead', 'Tech Lead'),
        
# #         # Design Positions
# #         ('ui_designer', 'UI Designer'),
# #         ('ux_designer', 'UX Designer'),
# #         ('graphic_designer', 'Graphic Designer'),
        
# #         # QA Positions
# #         ('qa_engineer', 'QA Engineer'),
# #         ('test_lead', 'Test Lead'),
        
# #         # Finance Positions
# #         ('finance_manager', 'Finance Manager'),
# #         ('accountant', 'Accountant'),
# #         ('finance_executive', 'Finance Executive'),
        
# #         # Marketing & Sales
# #         ('marketing_manager', 'Marketing Manager'),
# #         ('sales_manager', 'Sales Manager'),
# #         ('sales_executive', 'Sales Executive'),
# #         ('digital_marketer', 'Digital Marketer'),
        
# #         # Support
# #         ('customer_support', 'Customer Support'),
# #         ('team_lead', 'Team Lead'),
        
# #         # Management
# #         ('project_manager', 'Project Manager'),
# #         ('operations_manager', 'Operations Manager'),
        
# #         # Internships
# #         ('intern', 'Intern'),
# #         ('trainee', 'Trainee'),
# #     ]
    
# #     # Updated to use separate first_name and last_name fields
# #     first_name = models.CharField(max_length=50)
# #     last_name = models.CharField(max_length=50)
# #     email = models.EmailField(unique=True)
# #     employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
# #     department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, null=True, blank=True)
# #     position = models.CharField(max_length=30, choices=POSITION_CHOICES, null=True, blank=True)
# #     address = models.TextField(null=True, blank=True, help_text="Complete address including city, state, PIN code")
# #     joining_date = models.DateField(null=True, blank=True)
    
# #     # Track submission method
# #     is_self_submitted = models.BooleanField(default=False, verbose_name="Self Submitted by Employee")
# #     submitted_at = models.DateTimeField(null=True, blank=True, verbose_name="Submission Date")
    
# #     # Flag to track if IT notification was sent
# #     it_notification_sent = models.BooleanField(default=False, verbose_name="IT Notification Sent")
    
# #     # Document collection checkboxes and file uploads
# #     aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card")
# #     aadhar_pan_file = models.FileField(upload_to='documents/aadhar_pan/', blank=True, null=True, verbose_name="Aadhar & PAN File")
    
# #     payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips")
# #     payslips_file = models.FileField(upload_to='documents/payslips/', blank=True, null=True, verbose_name="Payslips File")
    
# #     educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree)")
# #     educational_certificates_file = models.FileField(upload_to='documents/educational_certificates/', blank=True, null=True, verbose_name="Educational Certificates File")
    
# #     previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter")
# #     previous_offer_letter_file = models.FileField(upload_to='documents/previous_offer_letter/', blank=True, null=True, verbose_name="Previous Offer Letter File")
    
# #     relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters")
# #     relieving_experience_letters_file = models.FileField(upload_to='documents/relieving_experience/', blank=True, null=True, verbose_name="Relieving & Experience Letters File")
    
# #     appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters ")
# #     appraisal_hike_letters_file = models.FileField(upload_to='documents/appraisal_hike/', blank=True, null=True, verbose_name="Appraisal/Hike Letters File")
    
# #     class Meta:
# #         verbose_name = 'Employee Onboarding'
# #         verbose_name_plural = 'Employees Onboarding'
    
# #     def __str__(self):
# #         return f"{self.first_name} {self.last_name}"
    
# #     @property
# #     def full_name(self):
# #         return f"{self.first_name} {self.last_name}"
    
# #     @property
# #     def all_documents_collected(self):
# #         """Check if all required documents are collected"""
# #         return all([
# #             self.aadhar_pan_collected,
# #             self.payslips_collected,
# #             self.educational_certificates_collected,
# #             self.previous_offer_letter_collected,
# #             self.relieving_experience_letters_collected,
# #             self.appraisal_hike_letters_collected,
# #         ])
    
# #     @property
# #     def all_documents_uploaded(self):
# #         """Check if all document files are uploaded"""
# #         return all([
# #             self.aadhar_pan_file,
# #             self.payslips_file,
# #             self.educational_certificates_file,
# #             self.previous_offer_letter_file,
# #             self.relieving_experience_letters_file,
# #             self.appraisal_hike_letters_file,
# #         ])
    
# #     @property
# #     def onboarding_complete(self):
# #         """Check if onboarding is complete (documents collected and uploaded)"""
# #         return self.all_documents_collected and self.all_documents_uploaded

# # class Offboarding(models.Model):
# #     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
# #     last_working_date = models.DateField()
    
# #     # Asset collection checkboxes
# #     laptop_returned = models.BooleanField(default=False, verbose_name="Laptop")
# #     charger_returned = models.BooleanField(default=False, verbose_name="Charger")
    
# #     # Damaged assets file upload
# #     damaged_assets_file = models.FileField(upload_to='offboarding/damaged_assets/', blank=True, null=True, verbose_name="Damaged Assets File")
    
# #     remarks = models.TextField(blank=True, null=True)
    
# #     class Meta:
# #         verbose_name = 'Employee Offboarding'
# #         verbose_name_plural = 'Employee Offboarding'
    
# #     def __str__(self):
# #         return f"Offboarding for {self.employee.full_name}"




# # from django.db import models

# # class ITSupporter(models.Model):
# #     name = models.CharField(max_length=100)  # Keep as single name field for IT Supporter
# #     email = models.EmailField(unique=True)
# #     is_active = models.BooleanField(default=True)
# #     created_at = models.DateTimeField(auto_now_add=True)
    
# #     class Meta:
# #         verbose_name = 'IT Supporter'
# #         verbose_name_plural = 'IT Supporters'
    
# #     def __str__(self):
# #         return f"{self.name} ({self.email})"

# # class Employee(models.Model):
# #     EMPLOYEE_TYPE_CHOICES = [
# #         ('fresher', 'Fresher'),
# #         ('employee', 'Employee'),
# #     ]
    
# #     DEPARTMENT_CHOICES = [
# #         ('hr', 'Human Resources'),
# #         ('it', 'Information Technology'),
# #         ('finance', 'Finance'),
# #         ('marketing', 'Marketing'),
# #         ('sales', 'Sales'),
# #         ('operations', 'Operations'),
# #         ('development', 'Development'),
# #         ('design', 'Design'),
# #         ('qa', 'Quality Assurance'),
# #         ('support', 'Customer Support'),
# #     ]
    
# #     POSITION_CHOICES = [
# #         # HR Positions
# #         ('hr_manager', 'HR Manager'),
# #         ('hr_executive', 'HR Executive'),
# #         ('hr_intern', 'HR Intern'),
        
# #         # IT Positions
# #         ('it_manager', 'IT Manager'),
# #         ('system_admin', 'System Administrator'),
# #         ('network_engineer', 'Network Engineer'),
# #         ('it_support', 'IT Support'),
        
# #         # Development Positions
# #         ('senior_developer', 'Senior Developer'),
# #         ('junior_developer', 'Junior Developer'),
# #         ('full_stack_developer', 'Full Stack Developer'),
# #         ('frontend_developer', 'Frontend Developer'),
# #         ('backend_developer', 'Backend Developer'),
# #         ('devops_engineer', 'DevOps Engineer'),
# #         ('tech_lead', 'Tech Lead'),
        
# #         # Design Positions
# #         ('ui_designer', 'UI Designer'),
# #         ('ux_designer', 'UX Designer'),
# #         ('graphic_designer', 'Graphic Designer'),
        
# #         # QA Positions
# #         ('qa_engineer', 'QA Engineer'),
# #         ('test_lead', 'Test Lead'),
        
# #         # Finance Positions
# #         ('finance_manager', 'Finance Manager'),
# #         ('accountant', 'Accountant'),
# #         ('finance_executive', 'Finance Executive'),
        
# #         # Marketing & Sales
# #         ('marketing_manager', 'Marketing Manager'),
# #         ('sales_manager', 'Sales Manager'),
# #         ('sales_executive', 'Sales Executive'),
# #         ('digital_marketer', 'Digital Marketer'),
        
# #         # Support
# #         ('customer_support', 'Customer Support'),
# #         ('team_lead', 'Team Lead'),
        
# #         # Management
# #         ('project_manager', 'Project Manager'),
# #         ('operations_manager', 'Operations Manager'),
        
# #         # Internships
# #         ('intern', 'Intern'),
# #         ('trainee', 'Trainee'),
# #     ]
    
# #     # Updated to use separate first_name and last_name fields
# #     first_name = models.CharField(max_length=50)
# #     last_name = models.CharField(max_length=50)
# #     email = models.EmailField(unique=True)
# #     phone_number = models.CharField(max_length=15, help_text="Include country code (e.g., +91 9876543210)")
# #     employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
# #     department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, null=True, blank=True)
# #     position = models.CharField(max_length=30, choices=POSITION_CHOICES, null=True, blank=True)
# #     address = models.TextField(null=True, blank=True, help_text="Complete address including city, state, PIN code")
# #     joining_date = models.DateField(null=True, blank=True)
    
# #     # Track submission method
# #     is_self_submitted = models.BooleanField(default=False, verbose_name="Self Submitted by Employee")
# #     submitted_at = models.DateTimeField(null=True, blank=True, verbose_name="Submission Date")
    
# #     # Flag to track if IT notification was sent
# #     it_notification_sent = models.BooleanField(default=False, verbose_name="IT Notification Sent")
    
# #     # Document collection checkboxes and file uploads
# #     aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card")
# #     aadhar_pan_file = models.FileField(upload_to='documents/aadhar_pan/', blank=True, null=True, verbose_name="Aadhar & PAN File")
    
# #     payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips")
# #     payslips_file = models.FileField(upload_to='documents/payslips/', blank=True, null=True, verbose_name="Payslips File")
    
# #     educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree)")
# #     educational_certificates_file = models.FileField(upload_to='documents/educational_certificates/', blank=True, null=True, verbose_name="Educational Certificates File")
    
# #     previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter")
# #     previous_offer_letter_file = models.FileField(upload_to='documents/previous_offer_letter/', blank=True, null=True, verbose_name="Previous Offer Letter File")
    
# #     relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters")
# #     relieving_experience_letters_file = models.FileField(upload_to='documents/relieving_experience/', blank=True, null=True, verbose_name="Relieving & Experience Letters File")
    
# #     appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters ")
# #     appraisal_hike_letters_file = models.FileField(upload_to='documents/appraisal_hike/', blank=True, null=True, verbose_name="Appraisal/Hike Letters File")
    
# #     class Meta:
# #         verbose_name = 'Employee (Onboarding)'
# #         verbose_name_plural = 'Employees (Onboarding)'
    
# #     def __str__(self):
# #         return f"{self.first_name} {self.last_name}"
    
# #     @property
# #     def full_name(self):
# #         return f"{self.first_name} {self.last_name}"
    
# #     @property
# #     def all_documents_collected(self):
# #         """Check if all required documents are collected"""
# #         return all([
# #             self.aadhar_pan_collected,
# #             self.payslips_collected,
# #             self.educational_certificates_collected,
# #             self.previous_offer_letter_collected,
# #             self.relieving_experience_letters_collected,
# #             self.appraisal_hike_letters_collected,
# #         ])
    
# #     @property
# #     def all_documents_uploaded(self):
# #         """Check if all document files are uploaded"""
# #         return all([
# #             self.aadhar_pan_file,
# #             self.payslips_file,
# #             self.educational_certificates_file,
# #             self.previous_offer_letter_file,
# #             self.relieving_experience_letters_file,
# #             self.appraisal_hike_letters_file,
# #         ])
    
# #     @property
# #     def onboarding_complete(self):
# #         """Check if onboarding is complete (documents collected and uploaded)"""
# #         return self.all_documents_collected and self.all_documents_uploaded

# # class Offboarding(models.Model):
# #     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
# #     last_working_date = models.DateField()
    
# #     # Asset collection checkboxes
# #     laptop_returned = models.BooleanField(default=False, verbose_name="Laptop")
# #     charger_returned = models.BooleanField(default=False, verbose_name="Charger")
    
# #     # Damaged assets file upload
# #     damaged_assets_file = models.FileField(upload_to='offboarding/damaged_assets/', blank=True, null=True, verbose_name="Damaged Assets File")
    
# #     remarks = models.TextField(blank=True, null=True)
    
# #     class Meta:
# #         verbose_name = 'Employee Offboarding'
# #         verbose_name_plural = 'Employee Offboarding'
    
# #     def __str__(self):
# #         return f"Offboarding for {self.employee.full_name}"
    
# # class OnboardingLink(models.Model):
# #     # No fields needed - just a placeholder for admin
    
# #     class Meta:
# #         managed = False  # Don't create database table
# #         verbose_name = 'Onboarding Link'
# #         verbose_name_plural = 'Onboarding Links'



# from django.db import models

# class ITSupporter(models.Model):
#     name = models.CharField(max_length=100)  # Keep as single name field for IT Supporter
#     email = models.EmailField(unique=True)
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         verbose_name = 'IT Supporter'
#         verbose_name_plural = 'IT Supporters'
    
#     def __str__(self):
#         return f"{self.name} ({self.email})"

# class EmployeeManager(models.Manager):
#     """Custom manager for Employee model to handle soft deletes"""
    
#     def get_queryset(self):
#         """Override to exclude soft-deleted employees by default"""
#         return super().get_queryset().filter(is_deleted=False)
    
#     def all_with_deleted(self):
#         """Get all employees including soft-deleted ones"""
#         return super().get_queryset()
    
#     def deleted_only(self):
#         """Get only soft-deleted employees"""
#         return super().get_queryset().filter(is_deleted=True)
    
#     def onboarded_only(self):
#         """Get only onboarded employees (completed self-submission)"""
#         return self.get_queryset().filter(is_self_submitted=True)

# class Employee(models.Model):
#     EMPLOYEE_TYPE_CHOICES = [
#         ('fresher', 'Fresher'),
#         ('employee', 'Employee'),
#     ]
    
#     DEPARTMENT_CHOICES = [
#         ('hr', 'Human Resources'),
#         ('it', 'Information Technology'),
#         ('finance', 'Finance'),
#         ('marketing', 'Marketing'),
#         ('sales', 'Sales'),
#         ('operations', 'Operations'),
#         ('development', 'Development'),
#         ('design', 'Design'),
#         ('qa', 'Quality Assurance'),
#         ('support', 'Customer Support'),
#     ]
    
#     POSITION_CHOICES = [
#         # HR Positions
#         ('hr_manager', 'HR Manager'),
#         ('hr_executive', 'HR Executive'),
#         ('hr_intern', 'HR Intern'),
        
#         # IT Positions
#         ('it_manager', 'IT Manager'),
#         ('system_admin', 'System Administrator'),
#         ('network_engineer', 'Network Engineer'),
#         ('it_support', 'IT Support'),
        
#         # Development Positions
#         ('senior_developer', 'Senior Developer'),
#         ('junior_developer', 'Junior Developer'),
#         ('full_stack_developer', 'Full Stack Developer'),
#         ('frontend_developer', 'Frontend Developer'),
#         ('backend_developer', 'Backend Developer'),
#         ('devops_engineer', 'DevOps Engineer'),
#         ('tech_lead', 'Tech Lead'),
        
#         # Design Positions
#         ('ui_designer', 'UI Designer'),
#         ('ux_designer', 'UX Designer'),
#         ('graphic_designer', 'Graphic Designer'),
        
#         # QA Positions
#         ('qa_engineer', 'QA Engineer'),
#         ('test_lead', 'Test Lead'),
        
#         # Finance Positions
#         ('finance_manager', 'Finance Manager'),
#         ('accountant', 'Accountant'),
#         ('finance_executive', 'Finance Executive'),
        
#         # Marketing & Sales
#         ('marketing_manager', 'Marketing Manager'),
#         ('sales_manager', 'Sales Manager'),
#         ('sales_executive', 'Sales Executive'),
#         ('digital_marketer', 'Digital Marketer'),
        
#         # Support
#         ('customer_support', 'Customer Support'),
#         ('team_lead', 'Team Lead'),
        
#         # Management
#         ('project_manager', 'Project Manager'),
#         ('operations_manager', 'Operations Manager'),
        
#         # Internships
#         ('intern', 'Intern'),
#         ('trainee', 'Trainee'),
#     ]
    
#     # Updated to use separate first_name and last_name fields
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     email = models.EmailField(unique=True)
#     phone_number = models.CharField(max_length=15, help_text="Include country code (e.g., +91 9876543210)")
#     employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
#     department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, null=True, blank=True)
#     position = models.CharField(max_length=30, choices=POSITION_CHOICES, null=True, blank=True)
#     address = models.TextField(null=True, blank=True, help_text="Complete address including city, state, PIN code")
#     joining_date = models.DateField(null=True, blank=True)
    
#     # Soft delete functionality
#     is_deleted = models.BooleanField(default=False, verbose_name="Soft Deleted")
#     deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Deleted Date")
    
#     # Track submission method
#     is_self_submitted = models.BooleanField(default=False, verbose_name="Self Submitted by Employee")
#     submitted_at = models.DateTimeField(null=True, blank=True, verbose_name="Submission Date")
    
#     # Flag to track if IT notification was sent
#     it_notification_sent = models.BooleanField(default=False, verbose_name="IT Notification Sent")
    
#     # Document collection checkboxes and file uploads
#     aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card")
#     aadhar_pan_file = models.FileField(upload_to='documents/aadhar_pan/', blank=True, null=True, verbose_name="Aadhar & PAN File")
    
#     payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips")
#     payslips_file = models.FileField(upload_to='documents/payslips/', blank=True, null=True, verbose_name="Payslips File")
    
#     educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree)")
#     educational_certificates_file = models.FileField(upload_to='documents/educational_certificates/', blank=True, null=True, verbose_name="Educational Certificates File")
    
#     previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter")
#     previous_offer_letter_file = models.FileField(upload_to='documents/previous_offer_letter/', blank=True, null=True, verbose_name="Previous Offer Letter File")
    
#     relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters")
#     relieving_experience_letters_file = models.FileField(upload_to='documents/relieving_experience/', blank=True, null=True, verbose_name="Relieving & Experience Letters File")
    
#     appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters ")
#     appraisal_hike_letters_file = models.FileField(upload_to='documents/appraisal_hike/', blank=True, null=True, verbose_name="Appraisal/Hike Letters File")
    
#     # Custom managers
#     objects = EmployeeManager()  # Default manager (excludes soft-deleted)
#     all_objects = models.Manager()  # Includes all employees (even soft-deleted)
    
#     class Meta:
#         verbose_name = 'Employee (Onboarding)'
#         verbose_name_plural = 'Employees (Onboarding)'
    
#     def __str__(self):
#         deleted_indicator = " [DELETED]" if self.is_deleted else ""
#         return f"{self.first_name} {self.last_name}{deleted_indicator}"
    
#     @property
#     def full_name(self):
#         return f"{self.first_name} {self.last_name}"
    
#     def soft_delete(self):
#         """Soft delete this employee"""
#         from django.utils import timezone
#         self.is_deleted = True
#         self.deleted_at = timezone.now()
#         self.save()
    
#     def restore(self):
#         """Restore a soft-deleted employee"""
#         self.is_deleted = False
#         self.deleted_at = None
#         self.save()
    
#     @property
#     def all_documents_collected(self):
#         """Check if all required documents are collected"""
#         return all([
#             self.aadhar_pan_collected,
#             self.payslips_collected,
#             self.educational_certificates_collected,
#             self.previous_offer_letter_collected,
#             self.relieving_experience_letters_collected,
#             self.appraisal_hike_letters_collected,
#         ])
    
#     @property
#     def all_documents_uploaded(self):
#         """Check if all document files are uploaded"""
#         return all([
#             self.aadhar_pan_file,
#             self.payslips_file,
#             self.educational_certificates_file,
#             self.previous_offer_letter_file,
#             self.relieving_experience_letters_file,
#             self.appraisal_hike_letters_file,
#         ])
    
#     @property
#     def onboarding_complete(self):
#         """Check if onboarding is complete (documents collected and uploaded)"""
#         return self.all_documents_collected and self.all_documents_uploaded

# class Offboarding(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
#     last_working_date = models.DateField()
    
#     # Asset collection checkboxes
#     laptop_returned = models.BooleanField(default=False, verbose_name="Laptop")
#     charger_returned = models.BooleanField(default=False, verbose_name="Charger")
    
#     # Damaged assets file upload
#     damaged_assets_file = models.FileField(upload_to='offboarding/damaged_assets/', blank=True, null=True, verbose_name="Damaged Assets File")
    
#     remarks = models.TextField(blank=True, null=True)
    
#     class Meta:
#         verbose_name = 'Employee Offboarding'
#         verbose_name_plural = 'Employee Offboarding'
    
#     def __str__(self):
#         return f"Offboarding for {self.employee.full_name}"
    
# class OnboardingLink(models.Model):
#     # No fields needed - just a placeholder for admin
    
#     class Meta:
#         managed = False  # Don't create database table
#         verbose_name = 'Onboarding Link'
#         verbose_name_plural = 'Onboarding Links'

# class DeletedEmployees(models.Model):
#     # No fields needed - just a placeholder for admin
    
#     class Meta:
#         managed = False  # Don't create database table
#         verbose_name = 'Deleted Employee'
#         verbose_name_plural = 'Deleted Employees'
#         verbose_name_plural = 'Onboarding Links'




from django.db import models

class ITSupporter(models.Model):
    name = models.CharField(max_length=100)  # Keep as single name field for IT Supporter
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'IT Supporter'
        verbose_name_plural = 'IT Supporters'
    
    def __str__(self):
        return f"{self.name} ({self.email})"

class EmployeeManager(models.Manager):
    """Custom manager for Employee model to handle soft deletes"""
    
    def get_queryset(self):
        """Override to exclude soft-deleted employees by default"""
        return super().get_queryset().filter(is_deleted=False)
    
    def all_with_deleted(self):
        """Get all employees including soft-deleted ones"""
        return super().get_queryset()
    
    def deleted_only(self):
        """Get only soft-deleted employees"""
        return super().get_queryset().filter(is_deleted=True)
    
    def onboarded_only(self):
        """Get only onboarded employees (completed self-submission)"""
        return self.get_queryset().filter(is_self_submitted=True)

class Employee(models.Model):
    EMPLOYEE_TYPE_CHOICES = [
        ('fresher', 'Fresher'),
        ('employee', 'Employee'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('hr', 'Human Resources'),
        ('it', 'Information Technology'),
        ('finance', 'Finance'),
        ('marketing', 'Marketing'),
        ('sales', 'Sales'),
        ('operations', 'Operations'),
        ('development', 'Development'),
        ('design', 'Design'),
        ('qa', 'Quality Assurance'),
        ('support', 'Customer Support'),
    ]
    
    POSITION_CHOICES = [
        # HR Positions
        ('hr_manager', 'HR Manager'),
        ('hr_executive', 'HR Executive'),
        ('hr_intern', 'HR Intern'),
        
        # IT Positions
        ('it_manager', 'IT Manager'),
        ('system_admin', 'System Administrator'),
        ('network_engineer', 'Network Engineer'),
        ('it_support', 'IT Support'),
        
        # Development Positions
        ('senior_developer', 'Senior Developer'),
        ('junior_developer', 'Junior Developer'),
        ('full_stack_developer', 'Full Stack Developer'),
        ('frontend_developer', 'Frontend Developer'),
        ('backend_developer', 'Backend Developer'),
        ('devops_engineer', 'DevOps Engineer'),
        ('tech_lead', 'Tech Lead'),
        
        # Design Positions
        ('ui_designer', 'UI Designer'),
        ('ux_designer', 'UX Designer'),
        ('graphic_designer', 'Graphic Designer'),
        
        # QA Positions
        ('qa_engineer', 'QA Engineer'),
        ('test_lead', 'Test Lead'),
        
        # Finance Positions
        ('finance_manager', 'Finance Manager'),
        ('accountant', 'Accountant'),
        ('finance_executive', 'Finance Executive'),
        
        # Marketing & Sales
        ('marketing_manager', 'Marketing Manager'),
        ('sales_manager', 'Sales Manager'),
        ('sales_executive', 'Sales Executive'),
        ('digital_marketer', 'Digital Marketer'),
        
        # Support
        ('customer_support', 'Customer Support'),
        ('team_lead', 'Team Lead'),
        
        # Management
        ('project_manager', 'Project Manager'),
        ('operations_manager', 'Operations Manager'),
        
        # Internships
        ('intern', 'Intern'),
        ('trainee', 'Trainee'),
    ]
    
    # Updated to use separate first_name and last_name fields
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, help_text="Include country code (e.g., +91 9876543210)")
    employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, null=True, blank=True)
    position = models.CharField(max_length=30, choices=POSITION_CHOICES, null=True, blank=True)
    
    # Updated address fields - separate current and permanent
    current_address = models.TextField(null=True, blank=True, help_text="Current address including city, state, PIN code")
    permanent_address = models.TextField(null=True, blank=True, help_text="Permanent address including city, state, PIN code")
    
    joining_date = models.DateField(null=True, blank=True)
    
    # Soft delete functionality
    is_deleted = models.BooleanField(default=False, verbose_name="Soft Deleted")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Deleted Date")
    
    # Track submission method
    is_self_submitted = models.BooleanField(default=False, verbose_name="Self Submitted by Employee")
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name="Submission Date")
    
    # Flag to track if IT notification was sent
    it_notification_sent = models.BooleanField(default=False, verbose_name="IT Notification Sent")
    
    # Document collection checkboxes and file uploads
    aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card")
    aadhar_pan_file = models.FileField(upload_to='documents/aadhar_pan/', blank=True, null=True, verbose_name="Aadhar & PAN File")
    
    payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips")
    payslips_file = models.FileField(upload_to='documents/payslips/', blank=True, null=True, verbose_name="Payslips File")
    
    educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree)")
    educational_certificates_file = models.FileField(upload_to='documents/educational_certificates/', blank=True, null=True, verbose_name="Educational Certificates File")
    
    previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter")
    previous_offer_letter_file = models.FileField(upload_to='documents/previous_offer_letter/', blank=True, null=True, verbose_name="Previous Offer Letter File")
    
    relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters")
    relieving_experience_letters_file = models.FileField(upload_to='documents/relieving_experience/', blank=True, null=True, verbose_name="Relieving & Experience Letters File")
    
    appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters ")
    appraisal_hike_letters_file = models.FileField(upload_to='documents/appraisal_hike/', blank=True, null=True, verbose_name="Appraisal/Hike Letters File")
    
    # Custom managers
    objects = EmployeeManager()  # Default manager (excludes soft-deleted)
    all_objects = models.Manager()  # Includes all employees (even soft-deleted)
    
    class Meta:
        verbose_name = 'Employee (Onboarding)'
        verbose_name_plural = 'Employees (Onboarding)'
    
    def __str__(self):
        deleted_indicator = " [DELETED]" if self.is_deleted else ""
        return f"{self.first_name} {self.last_name}{deleted_indicator}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def soft_delete(self):
        """Soft delete this employee"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """Restore a soft-deleted employee"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    @property
    def all_documents_collected(self):
        """Check if all required documents are collected"""
        return all([
            self.aadhar_pan_collected,
            self.payslips_collected,
            self.educational_certificates_collected,
            self.previous_offer_letter_collected,
            self.relieving_experience_letters_collected,
            self.appraisal_hike_letters_collected,
        ])
    
    @property
    def all_documents_uploaded(self):
        """Check if all document files are uploaded"""
        return all([
            self.aadhar_pan_file,
            self.payslips_file,
            self.educational_certificates_file,
            self.previous_offer_letter_file,
            self.relieving_experience_letters_file,
            self.appraisal_hike_letters_file,
        ])
    
    @property
    def onboarding_complete(self):
        """Check if onboarding is complete (documents collected and uploaded)"""
        return self.all_documents_collected and self.all_documents_uploaded

class Offboarding(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
    last_working_date = models.DateField()
    
    # Asset collection checkboxes
    laptop_returned = models.BooleanField(default=False, verbose_name="Laptop")
    charger_returned = models.BooleanField(default=False, verbose_name="Charger")
    
    # Damaged assets file upload
    damaged_assets_file = models.FileField(upload_to='offboarding/damaged_assets/', blank=True, null=True, verbose_name="Damaged Assets File")
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Employee Offboarding'
        verbose_name_plural = 'Employee Offboarding'
    
    def __str__(self):
        return f"Offboarding for {self.employee.full_name}"
    
class OnboardingLink(models.Model):
    # No fields needed - just a placeholder for admin
    
    class Meta:
        managed = False  # Don't create database table
        verbose_name = 'Onboarding Link'
        verbose_name_plural = 'Onboarding Links'

class DeletedEmployees(models.Model):
    # No fields needed - just a placeholder for admin
    
    class Meta:
        managed = False  # Don't create database table
        verbose_name = 'Deleted Employee'
        verbose_name_plural = 'Deleted Employees'