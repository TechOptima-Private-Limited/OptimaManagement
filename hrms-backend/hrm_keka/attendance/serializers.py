from rest_framework import serializers
from .models import AttendanceRecord, BiometricDevice
from employees.serializers import EmployeeSerializer

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


# attendance/serializers.py - Add these to your existing file

from rest_framework import serializers
from .models import WorkFromHomeRequest
from employees.serializers import EmployeeSerializer
from django.utils import timezone

class WorkFromHomeRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    formatted_applied_at = serializers.SerializerMethodField()
    formatted_request_date = serializers.SerializerMethodField()
    days_until_request = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkFromHomeRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'employee_department',
            'request_date', 'formatted_request_date', 'reason', 'status', 
            'applied_at', 'formatted_applied_at', 'approved_by', 'approved_by_name', 
            'approved_at', 'rejection_reason', 'days_until_request'
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
    
    # def get_formatted_request_date(self, obj):
    #     return obj.request_date.strftime('%B %d, %Y')
    
    # def get_days_until_request(self, obj):
    #     today = timezone.now().date()
    #     delta = obj.request_date - today
    #     return delta.days
    def get_formatted_request_date(self, obj):
        # Debug the date formatting
        # print(f"🔍 Formatting date for request {obj.id}:")
        # print(f"    📅 Raw request_date: {obj.request_date}")
        # print(f"    📅 Type: {type(obj.request_date)}")
        
        formatted = obj.request_date.strftime('%B %d, %Y')
        # print(f"    📅 Formatted: {formatted}")
        
        return formatted

    def get_days_until_request(self, obj):
        # Debug the days calculation
        from django.utils import timezone
        
        today = timezone.now().date()
        request_date = obj.request_date
        
        # print(f"🧮 Calculating days for request {obj.id}:")
        # print(f"    📅 Today: {today} (type: {type(today)})")
        # print(f"    📅 Request date: {request_date} (type: {type(request_date)})")
        
        # Ensure both are date objects
        if hasattr(request_date, 'date'):
            request_date = request_date.date()
        
        delta = request_date - today
        days = delta.days
        
        # print(f"    📊 Delta: {delta}")
        # print(f"    🔢 Days: {days}")
        
        return days

class WorkFromHomeApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkFromHomeRequest
        fields = ['request_date', 'reason']
        
    def validate_request_date(self, value):
        # Can't apply for past dates
        if value < timezone.now().date():
            raise serializers.ValidationError("Cannot apply for past dates")
        
        # Can't apply for more than 30 days in advance
        if (value - timezone.now().date()).days > 30:
            raise serializers.ValidationError("Cannot apply more than 30 days in advance")
        
        return value