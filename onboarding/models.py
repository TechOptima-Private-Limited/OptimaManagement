from django.db import models

# Commented out IT Supporter model
class ITSupporter(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'IT Supporter'
        verbose_name_plural = 'IT Supporters'
    
    def __str__(self):
        return f"{self.name} ({self.email})"

class Employee(models.Model):
    EMPLOYEE_TYPE_CHOICES = [
        ('fresher', 'Fresher'),
        ('employee', 'Employee'),
    ]
    
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
    # Removed status field as requested
    joining_date = models.DateField(null=True, blank=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    
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
    
    class Meta:
        verbose_name = 'Employee (Onboarding)'
        verbose_name_plural = 'Employees (Onboarding)'
    
    def __str__(self):
        return self.name
    
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
    def onboarding_complete(self):
        """Check if onboarding is complete (just based on documents now)"""
        return self.all_documents_collected

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
        return f"Offboarding for {self.employee.name}"