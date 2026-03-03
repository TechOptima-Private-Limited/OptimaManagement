# onboarding/serializers.py
from rest_framework import serializers
from .models import Employee, Offboarding

class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone_number',
            'employee_type', 'department', 'position', 'current_address', 'permanent_address',
            'joining_date', 'is_deleted', 'deleted_at', 'is_self_submitted', 'submitted_at',
            'it_notification_sent', 'aadhar_pan_collected', 'aadhar_pan_file',
            'payslips_collected', 'payslips_file', 'educational_certificates_collected',
            'educational_certificates_file', 'previous_offer_letter_collected',
            'previous_offer_letter_file', 'relieving_experience_letters_collected',
            'relieving_experience_letters_file', 'appraisal_hike_letters_collected',
            'appraisal_hike_letters_file', 'status'
        ]
        extra_kwargs = {
            'deleted_at': {'read_only': True},
            'submitted_at': {'read_only': True},
            'it_notification_sent': {'read_only': True},
        }

class OffboardingSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    employee_email = serializers.ReadOnlyField(source='employee.email')
    
    class Meta:
        model = Offboarding
        fields = [
            'id', 'employee', 'employee_name', 'employee_email', 'last_working_date',
            'laptop_returned', 'charger_returned', 'damaged_assets_file', 'remarks'
        ]