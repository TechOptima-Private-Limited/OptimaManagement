
# Create your models here.
### onboarding/models.py
from django.db import models

class Employee(models.Model):
    EMPLOYEE_TYPE_CHOICES = [
        ('intern', 'Intern'),
        ('employee', 'Employee'),
    ]
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
    status = models.CharField(max_length=20, default='pending')  # pending, accepted, rejected
    joining_date = models.DateField(null=True, blank=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    # salary_lpa = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True, help_text="Salary in Lakhs Per Annum")
    class Meta:
        verbose_name = 'Employee (Onboarding)'
        verbose_name_plural = 'Employees (Onboarding)'

    def __str__(self):
        return self.name
from django.utils import timezone
class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('Aadhar and PAN Card', 'Aadhar and PAN Card'),
        ('Last 6 months payslips', 'Last 6 months payslips'),
        ('Educational Certificates (Degree)', 'Educational Certificates (Degree)'),
        ('Previous Offer Letter', 'Previous Offer Letter'),
        ('Relieving & Experience Letters', 'Relieving & Experience Letters'),
        ('Appraisal/Hike Letters', 'Appraisal/Hike Letters'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    # file = models.FileField(upload_to='employee_documents/')
    file_data = models.BinaryField(null=True, blank=True, editable=True)
    file_name = models.CharField(max_length=255, blank=True)  # Original filename
    uploaded_at = models.DateTimeField(default=timezone.now)  # Changed from auto_now_add=True    
    class Meta:
        unique_together = ['employee', 'doc_type']
    
    def __str__(self):
        return f"{self.get_doc_type_display()} - {self.employee.name}"
    
    @property
    def file_size_mb(self):
        """Return file size in MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0


class OfferLetter(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE)
    letter_file = models.FileField(upload_to='offer_letters/')
    sent_date = models.DateField(auto_now_add=True)
    accepted = models.BooleanField(null=True)

    def __str__(self):
        return f"Offer for {self.employee.name}"
    
# onboarding/models.py

class Asset(models.Model):
    ASSET_TYPE_CHOICES = [
        ('laptop', 'Laptop'),
        ('phone', 'Phone'),
        ('id_card', 'ID Card'),
        ('access_card', 'Access Card'),
        ('other', 'Other'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assets')
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    issued_date = models.DateField(blank=True, null=True)  # <-- Changed here

    def __str__(self):
        return f"{self.asset_type} for {self.employee.name}"

class Offboarding(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
    last_working_date = models.DateField()
    notice_period_days = models.IntegerField()
    # Removed: resignation_email_screenshot
    all_items_submitted = models.BooleanField(default=False)  # ✅ New field
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Employee Offboarding'
        verbose_name_plural = 'Employee Offboarding'

    def __str__(self):
        return f"Offboarding for {self.employee.name}"
