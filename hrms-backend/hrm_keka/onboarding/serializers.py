# onboarding/serializers.py
from rest_framework import serializers
from .models import Employee, Offboarding
from django.conf import settings
import os
import re

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

class EmployeeSelfSubmitSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=32)
    current_address = serializers.CharField(max_length=2000)
    permanent_address = serializers.CharField(max_length=2000)

    aadhar_pan_file = serializers.FileField(required=False, allow_null=True)
    payslips_file = serializers.FileField(required=False, allow_null=True)
    educational_certificates_file = serializers.FileField(required=False, allow_null=True)
    previous_offer_letter_file = serializers.FileField(required=False, allow_null=True)
    relieving_experience_letters_file = serializers.FileField(required=False, allow_null=True)
    appraisal_hike_letters_file = serializers.FileField(required=False, allow_null=True)

    def validate_phone_number(self, value):
        value = value.strip()
        if not re.fullmatch(r"\+?[0-9]{7,15}", value):
            raise serializers.ValidationError('Invalid phone number.')
        return value

    def _validate_upload(self, file_obj):
        if not file_obj:
            return file_obj

        allowed_exts = getattr(settings, 'ALLOWED_UPLOAD_EXTENSIONS', None)
        if not allowed_exts:
            allowed_exts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']

        ext = os.path.splitext(getattr(file_obj, 'name', '') or '')[1].lower()
        if ext not in [e.lower() for e in allowed_exts]:
            raise serializers.ValidationError('Unsupported file type.')

        max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', None)
        if max_size is not None:
            try:
                if file_obj.size > int(max_size):
                    raise serializers.ValidationError('File too large.')
            except Exception:
                raise serializers.ValidationError('Invalid file upload.')

        return file_obj

    def validate(self, attrs):
        file_fields = [
            'aadhar_pan_file',
            'payslips_file',
            'educational_certificates_file',
            'previous_offer_letter_file',
            'relieving_experience_letters_file',
            'appraisal_hike_letters_file',
        ]

        for f in file_fields:
            if f in attrs:
                attrs[f] = self._validate_upload(attrs.get(f))

        return attrs