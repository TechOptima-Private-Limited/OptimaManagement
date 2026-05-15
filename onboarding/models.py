from django.db import models
from django.core.exceptions import ValidationError
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
    email = models.EmailField(unique=True, help_text="Personal email address")
    company_email = models.EmailField(unique=True, null=True, blank=True, help_text="Company email address (will be used for system login)")
    phone_number = models.CharField(max_length=15, help_text="Include country code (e.g., +91 9876543210)")
    employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES ,blank=True,  # Allow blank during employee submission
        null=True,   # Allow null during employee submission
        help_text="Will be set by HR during review")
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, null=True, blank=True)
    employee_id = models.CharField(max_length=150, blank=True, null=True, help_text="Unique employee username/ID for login")

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
    # MANDATORY DOCUMENTS
    aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card *")
    aadhar_pan_file = models.FileField(upload_to='documents/aadhar_pan/', blank=True, null=True, verbose_name="Aadhar & PAN File *")
    
    educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree) *")
    educational_certificates_file = models.FileField(upload_to='documents/educational_certificates/', blank=True, null=True, verbose_name="Educational Certificates File *")
    
    bank_statements_collected = models.BooleanField(default=False, verbose_name="Last 6 months Bank Statements *")
    bank_statements_file = models.FileField(upload_to='documents/bank_statements/', blank=True, null=True, verbose_name="Bank Statements File *")
    
    previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter *")
    previous_offer_letter_file = models.FileField(upload_to='documents/previous_offer_letter/', blank=True, null=True, verbose_name="Previous Offer Letter File *")
    
    # OPTIONAL DOCUMENTS
    payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips (Optional)")
    payslips_file = models.FileField(upload_to='documents/payslips/', blank=True, null=True, verbose_name="Payslips File (Optional)")
    
    relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters (Optional)")
    relieving_experience_letters_file = models.FileField(upload_to='documents/relieving_experience/', blank=True, null=True, verbose_name="Relieving & Experience Letters File (Optional)")
    
    appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters (Optional)")
    appraisal_hike_letters_file = models.FileField(upload_to='documents/appraisal_hike/', blank=True, null=True, verbose_name="Appraisal/Hike Letters File (Optional)")
    
    # Custom managers
    objects = EmployeeManager()  # Default manager (excludes soft-deleted)
    all_objects = models.Manager()  # Includes all employees (even soft-deleted)
    
    class Meta:
        verbose_name = 'Employee Onboarding'
        verbose_name_plural = '1. Employees Onboarding'
    
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
    def clean(self):
        """Custom model validation"""
        super().clean()
        
        # Validate employee_id uniqueness (only if it's provided)
        if self.employee_id:
            # Remove whitespace and convert to lowercase for consistency
            self.employee_id = self.employee_id.strip()
            
            # Check for duplicates in Employee model
            existing_employee = Employee.all_objects.filter(
                employee_id__iexact=self.employee_id,
                is_deleted=False  # Only check among active employees
            ).exclude(pk=self.pk)  # Exclude current instance
            
            if existing_employee.exists():
                raise ValidationError({
                    'employee_id': f'Employee ID "{self.employee_id}" is already in use by another active employee.'
                })
            
            # Check for duplicates in User model (username field)
            from django.contrib.auth.models import User
            existing_user = User.objects.filter(
                username__iexact=self.employee_id
            )
            
            # If editing an existing employee, exclude their associated user account
            if self.pk:
                # Try to find the current employee's user account by email
                current_user = None
                if self.company_email:
                    current_user = User.objects.filter(email=self.company_email).first()
                if not current_user and self.email:
                    current_user = User.objects.filter(email=self.email).first()
                
                if current_user:
                    existing_user = existing_user.exclude(pk=current_user.pk)
            
            if existing_user.exists():
                existing_user_obj = existing_user.first()
                raise ValidationError({
                    'employee_id': f'Employee ID "{self.employee_id}" is already in use as a username by user: {existing_user_obj.email or existing_user_obj.username}'
                })
    @property
    def mandatory_documents_collected(self):
        """Check if all mandatory documents are collected"""
        return all([
            self.aadhar_pan_collected,
            self.educational_certificates_collected,
            self.bank_statements_collected,
            self.previous_offer_letter_collected,
        ])
    
    @property
    def mandatory_documents_uploaded(self):
        """Check if all mandatory document files are uploaded"""
        return all([
            self.aadhar_pan_file,
            self.educational_certificates_file,
            self.bank_statements_file,
            self.previous_offer_letter_file,
        ])
    
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
            self.bank_statements_collected,
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
            self.bank_statements_file,
        ])
    
    @property
    def onboarding_complete(self):
        """Check if onboarding is complete (mandatory documents collected and uploaded)"""
        return self.mandatory_documents_collected and self.mandatory_documents_uploaded
    
from django.contrib.auth.models import User
from django.db import models


from assets.models import Asset

class Offboarding(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offboarding_records')
    last_working_date = models.DateField()
    
    # Simple remarks field
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Employee Offboarding'
        verbose_name_plural = '2. Employee Offboarding'
    
    def __str__(self):
        if self.user.first_name or self.user.last_name:
            full_name = f"{self.user.first_name} {self.user.last_name}".strip()
            return f"Offboarding for {full_name} (@{self.user.username})"
        return f"Offboarding for @{self.user.username}"
    
class OnboardingLink(models.Model):
    # No fields needed - just a placeholder for admin
    
    class Meta:
        managed = False  # Don't create database table
        verbose_name = 'Onboarding Link'
        verbose_name_plural = '3. Onboarding Links'


class TechStack(models.Model):
    """
    Predefined technical skills for filtering candidates.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name='Tech Stack Name')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Tech Stack'
        verbose_name_plural = 'Tech Stacks'
        ordering = ['name']

    def __str__(self):
        return self.name

class Candidate(models.Model):
    """
    Stores candidate/applicant information extracted from uploaded resume PDFs.

    The PDF file is saved on local disk under MEDIA_ROOT/cvs/ and only
    the relative path is stored in cv_file (Django FileField pattern).
    All other fields are either auto-extracted from the PDF or filled
    manually by HR staff via the admin panel.
    """

    # Auto-extracted from PDF
    full_name = models.CharField(max_length=200, blank=True, verbose_name='Full Name')
    first_name = models.CharField(max_length=100, blank=True, verbose_name='First Name')
    last_name = models.CharField(max_length=100, blank=True, verbose_name='Last Name')
    email = models.EmailField(blank=True, verbose_name='Email')
    mobile = models.CharField(max_length=20, blank=True, verbose_name='Mobile')
    exp_years = models.DecimalField(
        default=0.0, 
        max_digits=4, 
        decimal_places=1, 
        verbose_name='Experience (Years)'
    )
    tech_stack = models.TextField(
        blank=True,
        verbose_name='Tech Stack (Raw)',
        help_text='Comma-separated list of technical skills extracted from PDF',
    )
    tech_stacks = models.ManyToManyField(
        TechStack, 
        blank=True, 
        related_name='candidates',
        verbose_name='Predefined Tech Stacks'
    )
    location = models.CharField(max_length=200, blank=True, verbose_name='Current Location')
    preferred_location = models.CharField(
        max_length=200, blank=True, verbose_name='Preferred Location'
    )
    experience = models.TextField(blank=True, verbose_name='Professional Summary')

    # Resume file — stored under MEDIA_ROOT/cvs/, DB holds only the relative path
    cv_file = models.FileField(
        upload_to='cvs/',
        blank=True,
        null=True,
        verbose_name='Resume (CV)',
        help_text='PDF file stored locally; only the file path is saved in the database.',
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Uploaded At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Last Updated')

    class Meta:
        verbose_name = 'Candidate Resume'
        verbose_name_plural = '4. Resume Management'
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name or f'Candidate #{self.pk}'

    @property
    def cv_filename(self):
        """Returns the base filename of the uploaded CV."""
        if self.cv_file:
            import os
            return os.path.basename(self.cv_file.name)
        return None


# class DeletedEmployees(models.Model):
#     # No fields needed - just a placeholder for admin
    
#     class Meta:
#         managed = False  # Don't create database table
#         verbose_name = 'Deleted Employee'
#         verbose_name_plural = 'Deleted Employees'














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
#     employee_id = models.CharField(max_length=150, blank=True, null=True, help_text="Unique employee username/ID for login")

#     position = models.CharField(max_length=30, choices=POSITION_CHOICES, null=True, blank=True)
    
#     # Updated address fields - separate current and permanent
#     current_address = models.TextField(null=True, blank=True, help_text="Current address including city, state, PIN code")
#     permanent_address = models.TextField(null=True, blank=True, help_text="Permanent address including city, state, PIN code")
    
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
    
# from django.contrib.auth.models import User
# from django.db import models


# # class Offboarding(models.Model):
# #     # employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
# #     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offboarding_records')
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

# from assets.models import Asset

# class Offboarding(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offboarding_records')
#     last_working_date = models.DateField()
    
#     # Simple remarks field
#     remarks = models.TextField(blank=True, null=True)
    
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         verbose_name = 'Employee Offboarding'
#         verbose_name_plural = 'Employee Offboarding'
    
#     def __str__(self):
#         if self.user.first_name or self.user.last_name:
#             full_name = f"{self.user.first_name} {self.user.last_name}".strip()
#             return f"Offboarding for {full_name} (@{self.user.username})"
#         return f"Offboarding for @{self.user.username}"
    
# class OnboardingLink(models.Model):
#     # No fields needed - just a placeholder for admin
    
#     class Meta:
#         managed = False  # Don't create database table
#         verbose_name = 'Onboarding Link'
#         verbose_name_plural = 'Onboarding Links'

# # class DeletedEmployees(models.Model):
# #     # No fields needed - just a placeholder for admin
    
# #     class Meta:
# #         managed = False  # Don't create database table
# #         verbose_name = 'Deleted Employee'
# #         verbose_name_plural = 'Deleted Employees'