from rest_framework import serializers
from .models import AttendanceRecord, BiometricDevice
from employees.serializers import EmployeeSerializer
from .models import WorkFromHomeRequest
from django.utils import timezone

class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = '__all__'

class BiometricDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricDevice
        fields = '__all__'

class AttendanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = [
            'date', 'check_in_time', 'check_out_time', 'status', 
            'attendance_type', 'notes', 'edit_reason',
            'check_in_lat', 'check_in_lng', 'check_out_lat', 'check_out_lng'
        ]

class AttendanceLocationPingSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    timestamp = serializers.DateTimeField(required=False)

class WorkFromHomeRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    formatted_applied_at = serializers.SerializerMethodField()
    formatted_start_date = serializers.SerializerMethodField()
    formatted_end_date = serializers.SerializerMethodField()
    days_until_start = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkFromHomeRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'employee_department',
            'start_date', 'end_date', 'formatted_start_date', 'formatted_end_date', 'reason', 'status', 
            'applied_at', 'formatted_applied_at', 'approved_by', 'approved_by_name', 
            'approved_at', 'rejection_reason', 'days_until_start'
        ]
    
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()
    
    def get_employee_id(self, obj):
        return obj.employee.employee_id
    
    def get_employee_department(self, obj):
        return obj.employee.department.name if obj.employee.department else 'No Department'
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.user.get_full_name() if obj.approved_by else None
    
    def get_formatted_applied_at(self, obj):
        return obj.applied_at.strftime('%B %d, %Y at %I:%M %p')
    
    def get_formatted_start_date(self, obj):
        return obj.start_date.strftime('%B %d, %Y')

    def get_formatted_end_date(self, obj):
        return obj.end_date.strftime('%B %d, %Y')

    def get_days_until_start(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        start_date = obj.start_date
        if hasattr(start_date, 'date'):
            start_date = start_date.date()
        delta = start_date - today
        return delta.days

class WorkFromHomeApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkFromHomeRequest
        fields = ['start_date', 'end_date', 'reason']
        
    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        today = timezone.now().date()

        if start_date < today:
            raise serializers.ValidationError({"start_date": "Cannot apply for past dates"})
        
        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date"})
            
        if (start_date - today).days > 30:
            raise serializers.ValidationError({"start_date": "Cannot apply more than 30 days in advance"})
            
        if (end_date - start_date).days > 30:
            raise serializers.ValidationError({"end_date": "WFH request cannot exceed 30 days"})

        return data