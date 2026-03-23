from rest_framework import serializers
from .models import AttendanceRecord, BiometricDevice, BiometricAttendanceLog, WorkFromHomeRequest
from employees.serializers import EmployeeSerializer
from django.utils import timezone
from employees.models import Employee
from django.contrib.auth import get_user_model
from django.db.models import Q
from functools import reduce
import operator

User = get_user_model()

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


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True, allow_null=True)
    
    # ✅ NEW: Add display name for biometric-only records
    display_name = serializers.SerializerMethodField()
    display_id = serializers.SerializerMethodField()
    
    biometric_logs = BiometricAttendanceLogSerializer(many=True, read_only=True)
    
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
            'biometric_user_id', 'biometric_user_name',
            'display_name', 'display_id', 'biometric_logs'
        ]

    def _build_identifier_candidates(self, identifier):
        if not identifier:
            return []

        raw = str(identifier)
        normalized = raw.strip()
        if not normalized:
            return []

        upper = normalized.upper()
        candidates = []
        for v in [normalized, upper]:
            if v and v not in candidates:
                candidates.append(v)

        # If the device provides a numeric user id (e.g. "80"), try common employee_id formats.
        # Example in this project: TO-00080
        digits = ''.join([ch for ch in upper if ch.isdigit()])
        if digits and digits == upper:
            try:
                n = int(digits)
            except ValueError:
                n = None

            if n is not None:
                for width in [5, 4, 3]:
                    padded = str(n).zfill(width)
                    for prefix in ['TO', 'EMP']:
                        for fmt in [f"{prefix}-{padded}", f"{prefix}{padded}", f"{prefix}_{padded}"]:
                            if fmt not in candidates:
                                candidates.append(fmt)

        # Common variations:
        # - TO-00080 <-> TO00080
        # - underscores/spaces
        no_separators = upper.replace('-', '').replace('_', '').replace(' ', '')
        if no_separators and no_separators not in candidates:
            candidates.append(no_separators)

        if '-' in upper:
            with_underscore = upper.replace('-', '_')
            if with_underscore not in candidates:
                candidates.append(with_underscore)
        elif '_' in upper:
            with_dash = upper.replace('_', '-')
            if with_dash not in candidates:
                candidates.append(with_dash)

        return candidates

    def _resolve_employee_from_biometric_user_id(self, biometric_user_id):
        """
        Best-effort lookup of an Employee from a biometric identifier.

        Some biometric devices send an employee code in `biometric_user_id` (e.g. "80")
        while others place it in `biometric_user_name` (e.g. "TO-00080"). We therefore
        accept any identifier value here and try several normalized variants.
        """
        if not biometric_user_id:
            return None

        cache = getattr(self, '_biometric_employee_cache', None)
        if cache is None:
            cache = {}
            setattr(self, '_biometric_employee_cache', cache)

        raw = str(biometric_user_id)
        if raw in cache:
            return cache[raw]

        candidates = self._build_identifier_candidates(raw)
        if not candidates:
            cache[raw] = None
            return None

        # Single query using OR across candidates (case-insensitive)
        q = reduce(
            operator.or_,
            [Q(employee_id__iexact=c) | Q(user__username__iexact=c) for c in candidates],
            Q(),
        )
        emp = Employee.objects.select_related('user').filter(q).first()
        cache[raw] = emp
        return emp

    def _resolve_user_from_identifier(self, identifier):
        """
        Fallback for cases where a Django User exists but an Employee row doesn't
        (or isn't linked yet). We try to match by username and email.
        """
        candidates = self._build_identifier_candidates(identifier)
        if not candidates:
            return None

        q = reduce(
            operator.or_,
            [Q(username__iexact=c) | Q(email__iexact=c) for c in candidates],
            Q(),
        )
        return User.objects.filter(q).first()
    
    def get_display_name(self, obj):
        """Get display name - employee name or biometric name"""
        if obj.employee:
            full = obj.employee.user.get_full_name() if obj.employee.user else ''
            if full:
                return full
            # If the user doesn't have first/last name populated, fall back gracefully.
            return (
                getattr(obj.employee.user, 'username', None) or
                getattr(obj.employee, 'employee_id', None) or
                "Unknown"
            )

        # Biometric-only records: try resolving by both biometric_user_id and biometric_user_name.
        emp = (
            self._resolve_employee_from_biometric_user_id(obj.biometric_user_id) or
            self._resolve_employee_from_biometric_user_id(obj.biometric_user_name)
        )
        if emp and emp.user:
            full = emp.user.get_full_name()
            if full:
                return full
            return getattr(emp.user, 'username', None) or getattr(emp, 'employee_id', None) or "Unknown"

        # If there's no Employee row but there *is* a User, use that name.
        u = (
            self._resolve_user_from_identifier(obj.biometric_user_id) or
            self._resolve_user_from_identifier(obj.biometric_user_name)
        )
        if u:
            full = u.get_full_name()
            if full:
                return full
            return getattr(u, 'username', None) or getattr(u, 'email', None) or "Unknown"

        # Final fallback: whatever we got from the device.
        return obj.biometric_user_name or obj.biometric_user_id or "Unknown"
    
    def get_display_id(self, obj):
        """Get display ID - employee ID or biometric ID"""
        if obj.employee:
            return obj.employee.employee_id
        emp = (
            self._resolve_employee_from_biometric_user_id(obj.biometric_user_id) or
            self._resolve_employee_from_biometric_user_id(obj.biometric_user_name)
        )
        if emp:
            return emp.employee_id
        return obj.biometric_user_id or "N/A"


class BiometricDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricDevice
        fields = ['id', 'device_id', 'device_name', 'location', 'ip_address', 
                  'is_active', 'auto_sync_enabled', 'sync_interval_minutes',
                  'last_sync', 'created_at']


class AttendanceCreateSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    check_in_time = serializers.TimeField(required=False, allow_null=True)
    check_out_time = serializers.TimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    check_in_lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_in_lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_out_lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_out_lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    edit_reason = serializers.CharField(required=False, allow_blank=True)


class AttendanceUpdateSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    check_in_time = serializers.TimeField(required=False, allow_null=True)
    check_out_time = serializers.TimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    check_in_lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_in_lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_out_lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    check_out_lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    edit_reason = serializers.CharField(required=False, allow_blank=True)


class AttendanceLocationPingSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    timestamp = serializers.DateTimeField(required=False)


class WorkFromHomeRequestSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    approved_by = EmployeeSerializer(read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_department = serializers.CharField(source='employee.department.name', read_only=True)
    formatted_applied_at = serializers.SerializerMethodField()
    formatted_start_date = serializers.SerializerMethodField()
    formatted_end_date = serializers.SerializerMethodField()
    days_until_start = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkFromHomeRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'employee_department',
            'start_date', 'end_date', 'formatted_start_date', 'formatted_end_date', 'reason', 'status', 
            'applied_at', 'formatted_applied_at', 'approved_by', 
            'approved_at', 'rejection_reason', 'days_until_start'
        ]
    
    def get_formatted_applied_at(self, obj):
        return obj.applied_at.strftime('%B %d, %Y at %I:%M %p')
    
    def get_formatted_start_date(self, obj):
        return obj.start_date.strftime('%B %d, %Y')

    def get_formatted_end_date(self, obj):
        return obj.end_date.strftime('%B %d, %Y')

    def get_days_until_start(self, obj):
        today = timezone.now().date()
        delta = obj.start_date - today
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
            
        # Can't apply for more than 30 days in advance
        if (start_date - today).days > 30:
            raise serializers.ValidationError("Cannot apply more than 30 days in advance")
        
        return data
