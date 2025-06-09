# from django.db import models

# # Create your models here.
# ### onboarding/models.py
# from django.db import models

# class Employee(models.Model):
#     EMPLOYEE_TYPE_CHOICES = [
#         ('intern', 'Intern'),
#         ('fresher', 'Fresher'),
#         ('experienced', 'Experienced'),
#     ]
#     name = models.CharField(max_length=100)
#     email = models.EmailField(unique=True)
#     employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
#     status = models.CharField(max_length=20, default='pending')  # pending, accepted, rejected
#     joining_date = models.DateField(null=True, blank=True)
#     position = models.CharField(max_length=100, blank=True, null=True)
#     salary_lpa = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True, help_text="Salary in Lakhs Per Annum")
#     class Meta:
#         verbose_name = 'Employee (Onboarding)'
#         verbose_name_plural = 'Employees (Onboarding)'

#     def __str__(self):
#         return self.name

# class Document(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
#     doc_type = models.CharField(max_length=50)
#     file = models.FileField(upload_to='documents/')

#     def __str__(self):
#         return f"{self.doc_type} - {self.employee.name}"

# class OfferLetter(models.Model):
#     employee = models.OneToOneField(Employee, on_delete=models.CASCADE)
#     letter_file = models.FileField(upload_to='offer_letters/')
#     sent_date = models.DateField(auto_now_add=True)
#     accepted = models.BooleanField(null=True)

#     def __str__(self):
#         return f"Offer for {self.employee.name}"
    
# # onboarding/models.py

# class Asset(models.Model):
#     ASSET_TYPE_CHOICES = [
#         ('laptop', 'Laptop'),
#         ('phone', 'Phone'),
#         ('id_card', 'ID Card'),
#         ('access_card', 'Access Card'),
#         ('other', 'Other'),
#     ]

#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assets')
#     asset_type = models.CharField(max_length=50, choices=ASSET_TYPE_CHOICES)
#     description = models.TextField(blank=True, null=True)
#     serial_number = models.CharField(max_length=100, blank=True, null=True)
#     issued_date = models.DateField(blank=True, null=True)  # <-- Changed here

#     def __str__(self):
#         return f"{self.asset_type} for {self.employee.name}"

# class Offboarding(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
#     last_working_date = models.DateField()
#     notice_period_days = models.IntegerField()
#     resignation_email_screenshot = models.FileField(upload_to='offboarding/screenshots/', null=True, blank=True)
#     remarks = models.TextField(blank=True, null=True)

#     class Meta:
#         verbose_name = 'Employee Offboarding'
#         verbose_name_plural = 'Employee Offboarding'

#     def __str__(self):
#         return f"Offboarding for {self.employee.name}"



# from django.db import models

# class Employee(models.Model):
#     EMPLOYEE_TYPE_CHOICES = [
#         ('fresher', 'Fresher'),
#         ('employee', 'Employee'),
#     ]
    
#     name = models.CharField(max_length=100)
#     email = models.EmailField(unique=True)
#     employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
#     status = models.CharField(max_length=20, default='pending')  # pending, accepted, rejected
#     joining_date = models.DateField(null=True, blank=True)
#     position = models.CharField(max_length=100, blank=True, null=True)
    
#     # Document collection checkboxes
#     aadhar_pan_collected = models.BooleanField(default=False, verbose_name="Aadhar and PAN Card")
#     payslips_collected = models.BooleanField(default=False, verbose_name="Last 6 months' payslips")
#     educational_certificates_collected = models.BooleanField(default=False, verbose_name="Educational Certificates (Degree)")
#     previous_offer_letter_collected = models.BooleanField(default=False, verbose_name="Previous Offer Letter")
#     relieving_experience_letters_collected = models.BooleanField(default=False, verbose_name="Relieving & Experience Letters")
#     appraisal_hike_letters_collected = models.BooleanField(default=False, verbose_name="Appraisal/Hike Letters")
    
#     class Meta:
#         verbose_name = 'Employee (Onboarding)'
#         verbose_name_plural = 'Employees (Onboarding)'
    
#     def __str__(self):
#         return self.name
    
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

# class Offboarding(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
#     last_working_date = models.DateField()
#     notice_period_days = models.IntegerField()
#     resignation_email_screenshot = models.FileField(upload_to='offboarding/screenshots/', null=True, blank=True)
#     remarks = models.TextField(blank=True, null=True)
    
#     class Meta:
#         verbose_name = 'Employee Offboarding'
#         verbose_name_plural = 'Employee Offboarding'
    
#     def __str__(self):
#         return f"Offboarding for {self.employee.name}"



from django.db import models

class Employee(models.Model):
    EMPLOYEE_TYPE_CHOICES = [
        ('fresher', 'Fresher'),
        ('employee', 'Employee'),
    ]
    
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    employee_type = models.CharField(max_length=15, choices=EMPLOYEE_TYPE_CHOICES)
    status = models.CharField(max_length=20, default='pending')  # pending, accepted, rejected
    joining_date = models.DateField(null=True, blank=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    
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