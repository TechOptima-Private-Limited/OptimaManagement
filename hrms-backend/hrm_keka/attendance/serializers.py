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
        
        # Can't apply for more than 30 days in advance
        if (value - timezone.now().date()).days > 30:
            raise serializers.ValidationError("Cannot apply more than 30 days in advance")
        
        return value
    

from rest_framework import serializers
from .models import AttendanceRecord, BiometricDevice, BiometricAttendanceLog, WorkFromHomeRequest
from employees.serializers import EmployeeSerializer

class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True, allow_null=True)
    
    # ✅ NEW: Add display name for biometric-only records
    display_name = serializers.SerializerMethodField()
    display_id = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_id', 'date', 'check_in_time', 'check_out_time',
            'status', 'attendance_type', 'biometric_device_id', 'notes',
            'check_in_lat', 'check_in_lng', 'check_out_lat', 'check_out_lng',
            'created_at', 'updated_at', 'is_pending_approval', 'edit_reason',
            'original_check_in_time', 'original_check_out_time', 
            'original_status', 'original_notes',
            'approved_by', 'approval_date',
            # ✅ NEW FIELDS
            'biometric_user_id', 'biometric_user_name',
            'display_name', 'display_id'
        ]
    
    def get_display_name(self, obj):
        """Get display name - employee name or biometric name"""
        if obj.employee:
            return obj.employee.user.get_full_name()
        else:
            return obj.biometric_user_name or obj.biometric_user_id or "Unknown"
    
    def get_display_id(self, obj):
        """Get display ID - employee ID or biometric ID"""
        if obj.employee:
            return obj.employee.employee_id
        else:
            return obj.biometric_user_id or "N/A"


class BiometricAttendanceLogSerializer(serializers.ModelSerializer):
    """Serializer for raw biometric logs"""
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = BiometricAttendanceLog
        fields = [
            'id', 'biometric_user_id', 'biometric_user_name', 
            'device_id', 'timestamp', 'date', 'time',
            'employee', 'employee_name', 'attendance_record', 'synced_at'
        ]
    
    def get_employee_name(self, obj):
        if obj.employee:
            return obj.employee.user.get_full_name()
        return obj.biometric_user_name or "Unknown"


class BiometricDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricDevice
        fields = ['id', 'device_id', 'device_name', 'location', 'ip_address', 
                  'is_active', 'last_sync', 'created_at']


class AttendanceCreateSerializer(serializers.Serializer):
    date = serializers.DateField()
    check_in_time = serializers.TimeField(required=False, allow_null=True)
    check_out_time = serializers.TimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    check_in_lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_in_lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_out_lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_out_lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    edit_reason = serializers.CharField(required=False, allow_blank=True)


class WorkFromHomeRequestSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    approved_by = EmployeeSerializer(read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = WorkFromHomeRequest
        fields = [
            'id', 'employee', 'employee_name', 'request_date', 'reason', 
            'status', 'applied_at', 'approved_by', 'approved_at', 'rejection_reason'
        ]


class WorkFromHomeApplySerializer(serializers.Serializer):
    request_date = serializers.DateField()
    reason = serializers.CharField()
