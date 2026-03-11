from django.contrib import admin
from .models import BiometricDevice, AttendanceRecord, BiometricAttendanceLog

@admin.register(BiometricDevice)
class BiometricDeviceAdmin(admin.ModelAdmin):
    list_display = ('device_name', 'ip_address', 'is_active', 'auto_sync_enabled', 'last_sync', 'sync_interval_minutes')
    list_filter = ('is_active', 'auto_sync_enabled')
    search_fields = ('device_name', 'ip_address')

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('employee', 'biometric_user_name', 'date', 'check_in_time', 'check_out_time', 'status', 'attendance_type')
    list_filter = ('status', 'attendance_type', 'date')
    search_fields = ('employee__employee_id', 'biometric_user_id', 'biometric_user_name')

@admin.register(BiometricAttendanceLog)
class BiometricAttendanceLogAdmin(admin.ModelAdmin):
    list_display = ('biometric_user_id', 'biometric_user_name', 'timestamp', 'device_id', 'employee')
    list_filter = ('date', 'device_id')
    search_fields = ('biometric_user_id', 'biometric_user_name', 'employee__employee_id')
