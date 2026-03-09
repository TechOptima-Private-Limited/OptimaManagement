from django.contrib.auth.models import AbstractUser
from django.db import models
from utils.encryption import encryption_util

class User(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    must_change_password = models.BooleanField(default=False)

class UserProfile(models.Model):
    ROLE_CHOICES = [
        # Interns & Trainees
        ('INTERN', 'Intern'),
        ('TRAINEE', 'Trainee'),
        # Engineering / Tech
        ('JUNIOR_DEVELOPER', 'Junior Developer'),
        ('SOFTWARE_ENGINEER', 'Software Engineer'),
        ('MID_LEVEL_DEVELOPER', 'Mid-Level Developer'),
        ('SENIOR_DEVELOPER', 'Senior Developer'),
        ('LEAD_ENGINEER', 'Lead Engineer'),
        ('PRINCIPAL_ENGINEER', 'Principal Engineer'),
        ('ARCHITECT', 'Software Architect'),
        ('FULL_STACK_DEVELOPER', 'Full Stack Developer'),
        ('FRONTEND_DEVELOPER', 'Frontend Developer'),
        ('BACKEND_DEVELOPER', 'Backend Developer'),
        ('MOBILE_APP_DEVELOPER', 'Mobile App Developer'),
        ('EMBEDDED_ENGINEER', 'Embedded Engineer'),
        # QA / Testing
        ('QA_ENGINEER', 'QA Engineer'),
        ('MANUAL_TESTER', 'Manual Tester'),
        ('AUTOMATION_TESTER', 'Automation Tester'),
        # DevOps / Cloud / Infra
        ('DEVOPS_ENGINEER', 'DevOps Engineer'),
        ('CLOUD_ENGINEER', 'Cloud Engineer'),
        ('SITE_RELIABILITY_ENGINEER', 'Site Reliability Engineer'),
        ('SYSTEM_ADMIN', 'System Administrator'),
        ('NETWORK_ENGINEER', 'Network Engineer'),
        # Data & AI
        ('DATA_ENGINEER', 'Data Engineer'),
        ('DATA_ANALYST', 'Data Analyst'),
        ('DATA_SCIENTIST', 'Data Scientist'),
        ('ML_ENGINEER', 'Machine Learning Engineer'),
        ('AI_ENGINEER', 'AI Engineer'),
        # Cybersecurity
        ('SECURITY_ANALYST', 'Security Analyst'),
        ('SECURITY_ENGINEER', 'Security Engineer'),
        # UI / UX / Design
        ('UI_DESIGNER', 'UI Designer'),
        ('UX_DESIGNER', 'UX Designer'),
        ('PRODUCT_DESIGNER', 'Product Designer'),
        # Product & Project
        ('PRODUCT_OWNER', 'Product Owner'),
        ('PRODUCT_MANAGER', 'Product Manager'),
        ('PROJECT_MANAGER', 'Project Manager'),
        ('SCRUM_MASTER', 'Scrum Master'),
        ('BUSINESS_ANALYST', 'Business Analyst'),
        # Support & IT
        ('IT_SUPPORT', 'IT Support'),
        ('TECHNICAL_SUPPORT', 'Technical Support'),
        ('CUSTOMER_SUPPORT', 'Customer Support'),
        # HR & Admin
        ('HR_EXECUTIVE', 'HR Executive'),
        ('HR_MANAGER', 'HR Manager'),
        ('ADMIN', 'Admin'),
        ('OFFICE_ADMIN', 'Office Administrator'),
        # Sales & Marketing
        ('SALES_EXECUTIVE', 'Sales Executive'),
        ('SALES_MANAGER', 'Sales Manager'),
        ('MARKETING_EXECUTIVE', 'Marketing Executive'),
        ('DIGITAL_MARKETING_SPECIALIST', 'Digital Marketing Specialist'),
        ('SEO_SPECIALIST', 'SEO Specialist'),
        # Finance & Legal
        ('ACCOUNTANT', 'Accountant'),
        ('FINANCE_MANAGER', 'Finance Manager'),
        ('AUDITOR', 'Auditor'),
        ('LEGAL_ADVISOR', 'Legal Advisor'),
        # Operations
        ('OPERATIONS_EXECUTIVE', 'Operations Executive'),
        ('OPERATIONS_MANAGER', 'Operations Manager'),
        ('PROCUREMENT_EXECUTIVE', 'Procurement Executive'),
        # Leadership
        ('TEAM_LEAD', 'Team Lead'),
        ('DELIVERY_MANAGER', 'Delivery Manager'),
        ('ENGINEERING_MANAGER', 'Engineering Manager'),
        ('DIRECTOR', 'Director'),
        ('VP_ENGINEERING', 'VP Engineering'),
        ('CTO', 'Chief Technology Officer'),
        ('CIO', 'Chief Information Officer'),
        ('COO', 'Chief Operating Officer'),
        ('CFO', 'Chief Financial Officer'),
        ('CEO', 'Chief Executive Officer'),
        # Others
        ('CONSULTANT', 'Consultant'),
        ('FREELANCER', 'Freelancer'),
        ('CONTRACTOR', 'Contractor'),
        ('OTHERS', 'Others'),
    ]
    
    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
        ('PREFER_NOT_TO_SAY', 'Prefer not to say'),
    ]

    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='INTERN')
    phone_number = models.CharField(max_length=256, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=256, blank=True)
    # New personal details
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True)
    aadhaar_number = models.CharField(max_length=512, blank=True)  # encrypted
    pan_number = models.CharField(max_length=512, blank=True)      # encrypted
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Encrypt sensitive data only if not already encrypted
        if self.phone_number and not self._is_encrypted(self.phone_number):
            self.phone_number = encryption_util.encrypt(self.phone_number)
        if self.address and not self._is_encrypted(self.address):
            self.address = encryption_util.encrypt(self.address)
        if self.emergency_contact and not self._is_encrypted(self.emergency_contact):
            self.emergency_contact = encryption_util.encrypt(self.emergency_contact)
        if self.aadhaar_number and not self._is_encrypted(self.aadhaar_number):
            self.aadhaar_number = encryption_util.encrypt(self.aadhaar_number)
        if self.pan_number and not self._is_encrypted(self.pan_number):
            self.pan_number = encryption_util.encrypt(self.pan_number)
        super().save(*args, **kwargs)

    def _is_encrypted(self, value):
        try:
            encryption_util.decrypt(value)
            return True
        except:
            return False

    def get_decrypted_phone(self):
        return encryption_util.decrypt(self.phone_number) if self.phone_number else ''

    def get_decrypted_address(self):
        return encryption_util.decrypt(self.address) if self.address else ''

    def get_decrypted_emergency_contact(self):
        return encryption_util.decrypt(self.emergency_contact) if self.emergency_contact else ''

    def get_decrypted_aadhaar(self):
        return encryption_util.decrypt(self.aadhaar_number) if self.aadhaar_number else ''

    def get_decrypted_pan(self):
        return encryption_util.decrypt(self.pan_number) if self.pan_number else ''