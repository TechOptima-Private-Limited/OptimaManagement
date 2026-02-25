# from django.db import models

# # Create your models here.
# from django.db import models
# from django.contrib.auth import get_user_model
# from employees.models import Employee

# User = get_user_model()
# class WorkFromHomeRequest(models.Model):
#     STATUS_CHOICES = [
#         ('PENDING', 'Pending'),
#         ('APPROVED', 'Approved'), 
#         ('REJECTED', 'Rejected'),
#     ]
    
#     employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
#     request_date = models.DateField()
#     reason = models.TextField()
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
#     applied_at = models.DateTimeField(auto_now_add=True)
#     approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_wfh_requests')
#     approved_at = models.DateTimeField(null=True, blank=True)
#     rejection_reason = models.TextField(blank=True)
    
#     class Meta:
#         unique_together = ['employee', 'request_date']
#         ordering = ['-applied_at']
    
#     def __str__(self):
#         return f"{self.employee.user.get_full_name()} - {self.request_date} ({self.status})"


# class AttendanceRecord(models.Model):
#     ATTENDANCE_TYPE_CHOICES = [
#         ('MANUAL', 'Manual'),
#         ('BIOMETRIC', 'Biometric'),
#         ('QR_CODE', 'QR Code'),
#     ]
    
#     STATUS_CHOICES = [
#         ('PRESENT', 'Present'),
#         ('ABSENT', 'Absent'),
#         ('LATE', 'Late'),
#         ('HALF_DAY', 'Half Day'),
#     ]
    
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
#     date = models.DateField()
#     check_in_time = models.TimeField(null=True, blank=True)
#     check_out_time = models.TimeField(null=True, blank=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES)
#     attendance_type = models.CharField(max_length=20, choices=ATTENDANCE_TYPE_CHOICES, default='MANUAL')
#     biometric_device_id = models.CharField(max_length=50, blank=True)
#     notes = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     # Location fields
#     check_in_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
#     check_in_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
#     check_out_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
#     check_out_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
#     original_check_in_time = models.TimeField(null=True, blank=True, help_text="Temporary storage during edit")
#     original_check_out_time = models.TimeField(null=True, blank=True, help_text="Temporary storage during edit")
#     original_status = models.CharField(max_length=20, blank=True, help_text="Temporary storage during edit")
#     original_notes = models.TextField(blank=True, help_text="Temporary storage during edit")
#     # Add these fields for approval workflow (simple addition)
#     is_pending_approval = models.BooleanField(default=False)
#     edit_reason = models.TextField(blank=True)  # Reason for edit
#     approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendances')
#     approval_date = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         unique_together = ['employee', 'date']
    
#     def __str__(self):
#         return f"{self.employee.user.get_full_name()} - {self.date} - {self.status}"
#     def can_work_from_home_today(self):
#         """Check if employee has approved WFH for today"""
#         try:
#             wfh_request = WorkFromHomeRequest.objects.get(
#                 employee=self.employee,
#                 request_date=self.date,
#                 status='APPROVED'
#             )
#             return True
#         except WorkFromHomeRequest.DoesNotExist:
#             return False
#     def clear_original_values(self):
#         """Clear temporary original values after approval/rejection"""
#         self.original_check_in_time = None
#         self.original_check_out_time = None
#         self.original_status = ''
#         self.original_notes = ''
#         self.save(update_fields=[
#             'original_check_in_time', 
#             'original_check_out_time', 
#             'original_status', 
#             'original_notes'
#         ])

# class AttendanceLocationPing(models.Model):
#     """Hourly location ping while employee is checked in."""
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_location_pings')
#     attendance_record = models.ForeignKey(AttendanceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='location_pings')
#     latitude = models.DecimalField(max_digits=9, decimal_places=6)
#     longitude = models.DecimalField(max_digits=9, decimal_places=6)
#     source = models.CharField(max_length=20, default='BROWSER')
#     timestamp = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         ordering = ['-timestamp']
    
#     def __str__(self):
#         return f"{self.employee.user.get_full_name()} @ {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
# class BiometricDevice(models.Model):
#     device_id = models.CharField(max_length=50, unique=True)
#     device_name = models.CharField(max_length=100)
#     location = models.CharField(max_length=200)
#     ip_address = models.GenericIPAddressField()
#     is_active = models.BooleanField(default=True)
#     last_sync = models.DateTimeField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     def __str__(self):
#         return f"{self.device_name} - {self.location}"


from django.db import models
from django.contrib.auth import get_user_model
from employees.models import Employee

User = get_user_model()

class WorkFromHomeRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'), 
        ('REJECTED', 'Rejected'),
    ]
    
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    applied_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_wfh_requests')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-applied_at']
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.start_date} to {self.end_date} ({self.status})"


class AttendanceRecord(models.Model):
    ATTENDANCE_TYPE_CHOICES = [
        ('MANUAL', 'Manual'),
        ('BIOMETRIC', 'Biometric'),
        ('QR_CODE', 'QR Code'),
    ]
    
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records', null=True, blank=True)
    date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    attendance_type = models.CharField(max_length=20, choices=ATTENDANCE_TYPE_CHOICES, default='MANUAL')
    biometric_device_id = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ✅ NEW: Store biometric user info directly
    biometric_user_id = models.CharField(max_length=100, blank=True, help_text="User ID from biometric device")
    biometric_user_name = models.CharField(max_length=200, blank=True, help_text="User name from biometric device")
    
    # Location fields
    check_in_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    original_check_in_time = models.TimeField(null=True, blank=True, help_text="Temporary storage during edit")
    original_check_out_time = models.TimeField(null=True, blank=True, help_text="Temporary storage during edit")
    original_status = models.CharField(max_length=20, blank=True, help_text="Temporary storage during edit")
    original_notes = models.TextField(blank=True, help_text="Temporary storage during edit")
    
    # Add these fields for approval workflow (simple addition)
    is_pending_approval = models.BooleanField(default=False)
    edit_reason = models.TextField(blank=True)  # Reason for edit
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendances')
    approval_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        # ✅ CHANGED: Allow records without employee (biometric only)
        # unique_together = ['employee', 'date']  # Remove this
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['biometric_user_id', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        if self.employee:
            return f"{self.employee.user.get_full_name()} - {self.date} - {self.status}"
        else:
            return f"{self.biometric_user_name or self.biometric_user_id} - {self.date} - {self.status}"
    
    def get_display_name(self):
        """Get display name for attendance record"""
        if self.employee:
            return self.employee.user.get_full_name()
        else:
            return self.biometric_user_name or self.biometric_user_id or "Unknown"
    
    def can_work_from_home_today(self):
        """Check if employee has approved WFH for today"""
        if not self.employee:
            return False
        return WorkFromHomeRequest.objects.filter(
            employee=self.employee,
            start_date__lte=self.date,
            end_date__gte=self.date,
            status='APPROVED'
        ).exists()
    
    def clear_original_values(self):
        """Clear temporary original values after approval/rejection"""
        self.original_check_in_time = None
        self.original_check_out_time = None
        self.original_status = ''
        self.original_notes = ''
        self.save(update_fields=[
            'original_check_in_time', 
            'original_check_out_time', 
            'original_status', 
            'original_notes'
        ])


class BiometricAttendanceLog(models.Model):
    """
    ✅ NEW MODEL: Store raw biometric logs
    This stores ALL data from biometric device, even if employee doesn't exist
    """
    biometric_user_id = models.CharField(max_length=100, db_index=True, help_text="User ID from biometric device")
    biometric_user_name = models.CharField(max_length=200, blank=True, help_text="User name from device if available")
    device_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField()
    date = models.DateField(db_index=True)
    time = models.TimeField()
    
    # Try to link to employee if exists
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='biometric_logs')
    
    # Link to attendance record if created
    attendance_record = models.ForeignKey(AttendanceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='biometric_logs')
    
    synced_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['biometric_user_id', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['device_id', 'date']),
        ]
    
    def __str__(self):
        return f"{self.biometric_user_name or self.biometric_user_id} - {self.timestamp}"


class AttendanceLocationPing(models.Model):
    """Hourly location ping while employee is checked in."""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_location_pings')
    attendance_record = models.ForeignKey(AttendanceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='location_pings')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    source = models.CharField(max_length=20, default='BROWSER')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} @ {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"


class BiometricDevice(models.Model):
    device_id = models.CharField(max_length=50, unique=True)
    device_name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    ip_address = models.GenericIPAddressField()
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.device_name} - {self.location}"