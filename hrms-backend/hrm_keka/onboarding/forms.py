


from django import forms
from django.core.exceptions import ValidationError
from .models import Employee
class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'employee_type', 'department', 'position', 'current_address', 'permanent_address', 'joining_date']

class EmployeeSelfOnboardingForm(forms.ModelForm):
    """Form for employees to submit their own onboarding information"""
    
    class Meta:
        model = Employee
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 
            'current_address', 'permanent_address',
            'aadhar_pan_file', 'payslips_file', 'educational_certificates_file', 
            'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file'
        ]
        
        widgets = {
            'first_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your first name'
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your last name'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your email address'
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your phone number (e.g., +91 9876543210)'
            }),
            'current_address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Enter your current address including city, state, PIN code'
            }),
            'permanent_address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Enter your permanent address including city, state, PIN code'
            }),
            'aadhar_pan_file': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.jpg,.jpeg,.png'
            }),
            'payslips_file': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.jpg,.jpeg,.png'
            }),
            'educational_certificates_file': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.jpg,.jpeg,.png'
            }),
            'previous_offer_letter_file': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.jpg,.jpeg,.png'
            }),
            'relieving_experience_letters_file': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.jpg,.jpeg,.png'
            }),
            'appraisal_hike_letters_file': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.jpg,.jpeg,.png'
            }),
        }
        
        labels = {
            'first_name': 'First Name *',
            'last_name': 'Last Name *',
            'email': 'Email Address *',
            'phone_number': 'Phone Number *',
            'current_address': 'Current Address *',
            'permanent_address': 'Permanent Address *',
            'aadhar_pan_file': 'Aadhar & PAN Card (PDF/Image) *',
            'payslips_file': 'Last 6 Months Payslips (PDF/Image) *',
            'educational_certificates_file': 'Educational Certificates/Degree (PDF/Image) *',
            'previous_offer_letter_file': 'Previous Offer Letter (PDF/Image) *',
            'relieving_experience_letters_file': 'Relieving & Experience Letters (PDF/Image) *',
            'appraisal_hike_letters_file': 'Appraisal/Hike Letters (PDF/Image) *',
        }
        
        help_texts = {
            'first_name': 'Enter your first name as per official documents',
            'last_name': 'Enter your last name as per official documents',
            'email': 'Use your personal email address',
            'phone_number': 'Include country code (e.g., +91 9876543210)',
            'current_address': 'Include complete current address with city, state, and PIN code',
            'permanent_address': 'Include complete permanent address with city, state, and PIN code',
            'aadhar_pan_file': 'Upload scanned copy of Aadhar and PAN card in single file',
            'payslips_file': 'Upload last 6 months salary slips (can be combined in single PDF)',
            'educational_certificates_file': 'Upload degree certificates and mark sheets',
            'previous_offer_letter_file': 'Upload your previous company offer letter',
            'relieving_experience_letters_file': 'Upload relieving letter and experience letter from previous company',
            'appraisal_hike_letters_file': 'Upload any appraisal or salary hike letters from previous company',
        }
    
    def __init__(self, *args, **kwargs):
        # Extract the instance if it's being edited
        self.updating_instance = kwargs.get('instance')
        super().__init__(*args, **kwargs)
        
        # Make certain fields required for self-submission
        required_fields = [
            'first_name', 'last_name', 'email', 'phone_number', 
            'current_address', 'permanent_address',
            'aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
            'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file'
        ]
        
        for field_name in required_fields:
            if field_name in self.fields:
                self.fields[field_name].required = True
    
    def clean_email(self):
        """Custom validation for email field to handle soft-deleted employees"""
        email = self.cleaned_data.get('email')
        if not email:
            return email
        
        # Check for existing employees with this email
        existing_employees = Employee.all_objects.filter(email=email)
        
        # If updating an existing instance, exclude it from the check
        if self.updating_instance:
            existing_employees = existing_employees.exclude(pk=self.updating_instance.pk)
        
        existing_employee = existing_employees.first()
        
        if existing_employee:
            if existing_employee.is_deleted:
                raise ValidationError(
                    'An employee record with this email was previously created but has been deactivated by HR. '
                    'Please contact HR for assistance.'
                )
            elif existing_employee.is_self_submitted:
                raise ValidationError(
                    'An employee with this email has already completed onboarding. '
                    'Please contact HR if you need assistance.'
                )
            else:
                raise ValidationError(
                    'An employee record with this email already exists. '
                    'Please contact HR for assistance.'
                )
        
        return email
    
    def clean_phone_number(self):
        """Custom validation for phone number field to handle soft-deleted employees"""
        phone_number = self.cleaned_data.get('phone_number')
        if not phone_number:
            return phone_number
        
        # Check for existing employees with this phone number
        existing_employees = Employee.all_objects.filter(phone_number=phone_number)
        
        # If updating an existing instance, exclude it from the check
        if self.updating_instance:
            existing_employees = existing_employees.exclude(pk=self.updating_instance.pk)
        
        existing_employee = existing_employees.first()
        
        if existing_employee:
            if existing_employee.is_deleted:
                raise ValidationError(
                    'An employee record with this phone number was previously created but has been deactivated by HR. '
                    'Please contact HR for assistance.'
                )
            elif existing_employee.is_self_submitted:
                raise ValidationError(
                    'An employee with this phone number has already completed onboarding. '
                    'Please contact HR if you need assistance.'
                )
            else:
                raise ValidationError(
                    'An employee record with this phone number already exists. '
                    'Please contact HR for assistance.'
                )
        
        return phone_number
    
    def save(self, commit=True):
        employee = super().save(commit=False)
        
        # Mark as self-submitted and auto-check document collection
        employee.is_self_submitted = True
        
        # Auto-check document collection boxes since files are uploaded
        if employee.aadhar_pan_file:
            employee.aadhar_pan_collected = True
        if employee.payslips_file:
            employee.payslips_collected = True
        if employee.educational_certificates_file:
            employee.educational_certificates_collected = True
        if employee.previous_offer_letter_file:
            employee.previous_offer_letter_collected = True
        if employee.relieving_experience_letters_file:
            employee.relieving_experience_letters_collected = True
        if employee.appraisal_hike_letters_file:
            employee.appraisal_hike_letters_collected = True
        
        if commit:
            from django.utils import timezone
            employee.submitted_at = timezone.now()
            employee.save()
        
        return employee