# from django.db import models
# from django.contrib.auth import get_user_model
# from django.core.validators import MinValueValidator, MaxValueValidator
# from employees.models import Employee

# User = get_user_model()

# class LeaveType(models.Model):
#     name = models.CharField(max_length=100, unique=True)
#     code = models.CharField(max_length=10, unique=True)  # e.g., 'AL', 'SL', 'ML'
#     days_allowed_per_year = models.IntegerField(validators=[MinValueValidator(0)])
#     description = models.TextField(blank=True)
#     is_carry_forward = models.BooleanField(default=False)
#     max_carry_forward_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['name']
    
#     def __str__(self):
#         return f"{self.name} ({self.code})"

# class LeavePolicy(models.Model):
#     GENDER_CHOICES = [
#         ('ALL', 'All'),
#         ('MALE', 'Male'),
#         ('FEMALE', 'Female'),
#     ]
    
#     EMPLOYMENT_TYPE_CHOICES = [
#         ('ALL', 'All'),
#         ('PERMANENT', 'Permanent'),
#         ('CONTRACT', 'Contract'),
#         ('TEMPORARY', 'Temporary'),
#     ]
    
#     name = models.CharField(max_length=200)
#     leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='policies')
#     applicable_to_all = models.BooleanField(default=True)
#     applicable_gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='ALL')
#     applicable_employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='ALL')
#     minimum_service_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
#     maximum_consecutive_days = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
#     requires_approval = models.BooleanField(default=True)
#     advance_notice_days = models.IntegerField(default=1, validators=[MinValueValidator(0)])
#     can_apply_half_day = models.BooleanField(default=False)
#     documentation_required = models.BooleanField(default=False)
#     documentation_required_after_days = models.IntegerField(default=3, validators=[MinValueValidator(1)])
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['name']
#         unique_together = ['name', 'leave_type']
    
#     def __str__(self):
#         return f"{self.name} - {self.leave_type.name}"

# class LeaveRequest(models.Model):
#     STATUS_CHOICES = [
#         ('PENDING', 'Pending'),
#         ('APPROVED', 'Approved'),
#         ('REJECTED', 'Rejected'),
#         ('CANCELLED', 'Cancelled'),
#         ('WITHDRAWN', 'Withdrawn'),
#     ]
    
#     LEAVE_DURATION_CHOICES = [
#         ('FULL_DAY', 'Full Day'),
#         ('HALF_DAY_MORNING', 'Half Day - Morning'),
#         ('HALF_DAY_AFTERNOON', 'Half Day - Afternoon'),
#     ]
    
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
#     leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
#     leave_policy = models.ForeignKey(LeavePolicy, on_delete=models.SET_NULL, null=True, blank=True)
#     start_date = models.DateField()
#     end_date = models.DateField()
#     leave_duration = models.CharField(max_length=20, choices=LEAVE_DURATION_CHOICES, default='FULL_DAY')
#     days_requested = models.DecimalField(max_digits=4, decimal_places=1)  # Support half days
#     reason = models.TextField()
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
#     applied_on = models.DateTimeField(auto_now_add=True)
    
#     # Approval workflow
#     approved_by = models.ForeignKey(
#         User, 
#         on_delete=models.SET_NULL, 
#         null=True, 
#         blank=True, 
#         related_name='approved_leaves'
#     )
#     approved_on = models.DateTimeField(null=True, blank=True)
#     rejection_reason = models.TextField(blank=True)
    
#     # Documentation
#     supporting_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    
#     # Comments
#     employee_comments = models.TextField(blank=True)
#     manager_comments = models.TextField(blank=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['-applied_on']
    
#     def save(self, *args, **kwargs):
#         # Auto-calculate days if not provided
#         if not self.days_requested:
#             self.calculate_days_requested()
#         super().save(*args, **kwargs)
    
#     def calculate_days_requested(self):
#         """Calculate the number of days requested based on duration"""
#         if self.start_date and self.end_date:
#             total_days = (self.end_date - self.start_date).days + 1
            
#             if self.leave_duration in ['HALF_DAY_MORNING', 'HALF_DAY_AFTERNOON']:
#                 if self.start_date == self.end_date:
#                     self.days_requested = 0.5
#                 else:
#                     # For multi-day half-day requests, calculate accordingly
#                     self.days_requested = total_days - 0.5
#             else:
#                 self.days_requested = total_days
    
#     def __str__(self):
#         return f"{self.employee.user.get_full_name()} - {self.leave_type.name} - {self.start_date}"

# class LeaveBalance(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
#     leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
#     year = models.IntegerField()
#     total_days = models.DecimalField(max_digits=5, decimal_places=1)
#     used_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
#     carried_forward_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
#     remaining_days = models.DecimalField(max_digits=5, decimal_places=1)
    
#     class Meta:
#         unique_together = ['employee', 'leave_type', 'year']
#         ordering = ['-year', 'leave_type__name']
    
#     def save(self, *args, **kwargs):
#         self.remaining_days = self.total_days + self.carried_forward_days - self.used_days
#         super().save(*args, **kwargs)
    
#     def __str__(self):
#         return f"{self.employee.user.get_full_name()} - {self.leave_type.name} - {self.year}"

# class LeaveApprovalWorkflow(models.Model):
#     """Define approval workflow for different leave types and departments"""
#     leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
#     department = models.ForeignKey('employees.Department', on_delete=models.CASCADE, null=True, blank=True)
#     approver_level_1 = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='level1_approvals',
#         help_text="Immediate supervisor/manager"
#     )
#     approver_level_2 = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='level2_approvals',
#         null=True, 
#         blank=True,
#         help_text="Department head (optional)"
#     )
#     requires_hr_approval = models.BooleanField(default=False)
#     days_threshold_for_hr = models.IntegerField(default=5, help_text="Days above which HR approval required")
#     is_active = models.BooleanField(default=True)
    
#     class Meta:
#         unique_together = ['leave_type', 'department']
    
#     def __str__(self):
#         dept_name = self.department.name if self.department else "All Departments"
#         return f"{self.leave_type.name} - {dept_name}"

# class LeaveEncashment(models.Model):
#     """Track leave encashment for employees"""
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_encashments')
#     leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
#     year = models.IntegerField()
#     days_encashed = models.DecimalField(max_digits=4, decimal_places=1)
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     processed_on = models.DateTimeField(auto_now_add=True)
#     processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
#     class Meta:
#         ordering = ['-processed_on']
    
#     def __str__(self):
#         return f"{self.employee.user.get_full_name()} - {self.days_encashed} days - {self.year}"



from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from employees.models import Employee

User = get_user_model()

class LeaveType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)  # e.g., 'AL', 'SL', 'ML'
    days_allowed_per_year = models.IntegerField(validators=[MinValueValidator(0)])
    description = models.TextField(blank=True)
    # Date when the leave balance for this leave type expires (informational/optional).
    # Stored as an absolute date; the UI expects a `YYYY-MM-DD` value.
    expiry_date = models.DateField(null=True, blank=True)
    is_carry_forward = models.BooleanField(default=False)
    max_carry_forward_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class LeavePolicy(models.Model):
    GENDER_CHOICES = [
        ('ALL', 'All'),
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
    ]
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('ALL', 'All'),
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('TEMPORARY', 'Temporary'),
    ]
    
    name = models.CharField(max_length=200)
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='policies')
    applicable_to_all = models.BooleanField(default=True)
    applicable_gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='ALL')
    applicable_employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='ALL')
    minimum_service_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    maximum_consecutive_days = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    requires_approval = models.BooleanField(default=True)
    advance_notice_days = models.IntegerField(default=1, validators=[MinValueValidator(0)])
    can_apply_half_day = models.BooleanField(default=False)
    documentation_required = models.BooleanField(default=False)
    documentation_required_after_days = models.IntegerField(default=3, validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['name', 'leave_type']
    
    def __str__(self):
        return f"{self.name} - {self.leave_type.name}"

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    
    LEAVE_DURATION_CHOICES = [
        ('FULL_DAY', 'Full Day'),
        ('HALF_DAY_MORNING', 'Half Day - Morning'),
        ('HALF_DAY_AFTERNOON', 'Half Day - Afternoon'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    leave_policy = models.ForeignKey(LeavePolicy, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    leave_duration = models.CharField(max_length=20, choices=LEAVE_DURATION_CHOICES, default='FULL_DAY')
    days_requested = models.DecimalField(max_digits=4, decimal_places=1)  # Support half days
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    applied_on = models.DateTimeField(auto_now_add=True)
    balance_deducted = models.BooleanField(default=False)
    # Approval workflow
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_leaves'
    )
    approved_on = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Documentation
    supporting_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    
    # Comments
    employee_comments = models.TextField(blank=True)
    manager_comments = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-applied_on']
    
    def save(self, *args, **kwargs):
        # Auto-calculate days if not provided
        if not self.days_requested:
            self.calculate_days_requested()
        super().save(*args, **kwargs)
    
    def calculate_days_requested(self):
        """Calculate the number of days requested based on duration"""
        if self.start_date and self.end_date:
            total_days = (self.end_date - self.start_date).days + 1
            
            if self.leave_duration in ['HALF_DAY_MORNING', 'HALF_DAY_AFTERNOON']:
                if self.start_date == self.end_date:
                    self.days_requested = 0.5
                else:
                    # For multi-day half-day requests, calculate accordingly
                    self.days_requested = total_days - 0.5
            else:
                self.days_requested = total_days
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.leave_type.name} - {self.start_date}"

class LeaveBalance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.IntegerField()
    total_days = models.DecimalField(max_digits=5, decimal_places=1)
    used_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    carried_forward_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    remaining_days = models.DecimalField(max_digits=5, decimal_places=1)
    
    class Meta:
        unique_together = ['employee', 'leave_type', 'year']
        ordering = ['-year', 'leave_type__name']
    
    def save(self, *args, **kwargs):
        """Override save to ensure consistent type handling in calculations"""
        
        # Convert all values to float to avoid mixing types
        total_days = float(self.total_days) if self.total_days is not None else 0.0
        carried_forward = float(self.carried_forward_days) if self.carried_forward_days is not None else 0.0
        used_days = float(self.used_days) if self.used_days is not None else 0.0
        
        # Calculate remaining days with consistent types
        self.remaining_days = total_days + carried_forward - used_days
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.leave_type.name} - {self.year}"

class LeaveApprovalWorkflow(models.Model):
    """Define approval workflow for different leave types and departments"""
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    department = models.ForeignKey('employees.Department', on_delete=models.CASCADE, null=True, blank=True)
    approver_level_1 = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='level1_approvals',
        help_text="Immediate supervisor/manager"
    )
    approver_level_2 = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='level2_approvals',
        null=True, 
        blank=True,
        help_text="Department head (optional)"
    )
    requires_hr_approval = models.BooleanField(default=False)
    days_threshold_for_hr = models.IntegerField(default=5, help_text="Days above which HR approval required")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['leave_type', 'department']
    
    def __str__(self):
        dept_name = self.department.name if self.department else "All Departments"
        return f"{self.leave_type.name} - {dept_name}"

class LeaveEncashment(models.Model):
    """Track leave encashment for employees"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_encashments')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.IntegerField()
    days_encashed = models.DecimalField(max_digits=4, decimal_places=1)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    processed_on = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-processed_on']
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.days_encashed} days - {self.year}"

# Notification Model - ADD THIS
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('LEAVE_REQUEST', 'Leave Request'),
        ('LEAVE_APPROVED', 'Leave Approved'),
        ('LEAVE_REJECTED', 'Leave Rejected'),
        ('LEAVE_CANCELLED', 'Leave Cancelled'),
        ('TEAM_LEAVE_ALERT', 'Team Leave Alert'),
        ('GENERAL', 'General'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_id = models.IntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"