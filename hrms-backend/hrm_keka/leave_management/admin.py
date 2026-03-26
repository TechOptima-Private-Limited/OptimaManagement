from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (
    LeaveType, LeavePolicy, LeaveRequest, LeaveBalance, 
    LeaveApprovalWorkflow, LeaveEncashment
)

@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'code',
        'days_allowed_per_year',
        'expiry_date',
        'is_carry_forward',
        'is_active'
    ]
    list_filter = ['is_active', 'is_carry_forward']
    search_fields = ['name', 'code']
    ordering = ['name']

@admin.register(LeavePolicy)
class LeavePolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'leave_type', 'minimum_service_days', 'requires_approval', 'is_active']
    list_filter = ['leave_type', 'requires_approval', 'is_active', 'applicable_gender']
    search_fields = ['name', 'leave_type__name']
    ordering = ['name']

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days_requested', 'status', 'applied_on']
    list_filter = ['status', 'leave_type', 'applied_on', 'start_date']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    date_hierarchy = 'applied_on'
    ordering = ['-applied_on']
    readonly_fields = ['applied_on', 'approved_on']

@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'year', 'total_days', 'used_days', 'remaining_days']
    list_filter = ['year', 'leave_type']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering = ['-year', 'employee__user__last_name']

@admin.register(LeaveApprovalWorkflow)
class LeaveApprovalWorkflowAdmin(admin.ModelAdmin):
    list_display = ['leave_type', 'department', 'approver_level_1', 'requires_hr_approval', 'is_active']
    list_filter = ['requires_hr_approval', 'is_active']
    ordering = ['leave_type__name']

@admin.register(LeaveEncashment)
class LeaveEncashmentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'year', 'days_encashed', 'amount', 'processed_on']
    list_filter = ['year', 'leave_type', 'processed_on']
    search_fields = ['employee__user__first_name', 'employee__user__last_name']
    date_hierarchy = 'processed_on'
    ordering = ['-processed_on']