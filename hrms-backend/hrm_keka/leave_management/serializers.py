# from rest_framework import serializers
# from django.utils import timezone
# from datetime import datetime, timedelta
# from .models import (
#     LeaveType, LeavePolicy, LeaveRequest, LeaveBalance, 
#     LeaveApprovalWorkflow, LeaveEncashment
# )
# from employees.serializers import EmployeeSerializer
# from authentication.serializers import UserSerializer

# class LeaveTypeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LeaveType
#         fields = '__all__'

# class LeavePolicySerializer(serializers.ModelSerializer):
#     leave_type = LeaveTypeSerializer(read_only=True)
#     leave_type_id = serializers.IntegerField(write_only=True)
    
#     class Meta:
#         model = LeavePolicy
#         fields = '__all__'

# class LeaveBalanceSerializer(serializers.ModelSerializer):
#     employee = EmployeeSerializer(read_only=True)
#     leave_type = LeaveTypeSerializer(read_only=True)
    
#     class Meta:
#         model = LeaveBalance
#         fields = '__all__'

# class LeaveRequestSerializer(serializers.ModelSerializer):
#     employee = EmployeeSerializer(read_only=True)
#     leave_type = LeaveTypeSerializer(read_only=True)
#     leave_policy = LeavePolicySerializer(read_only=True)
#     approved_by = UserSerializer(read_only=True)
    
#     class Meta:
#         model = LeaveRequest
#         fields = '__all__'

# class LeaveRequestCreateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LeaveRequest
#         fields = [
#             'leave_type', 'start_date', 'end_date', 'leave_duration',
#             'reason', 'employee_comments', 'supporting_document'
#         ]
    
#     def validate(self, attrs):
#         start_date = attrs['start_date']
#         end_date = attrs['end_date']
#         leave_duration = attrs.get('leave_duration', 'FULL_DAY')
        
#         # Basic date validation
#         if start_date > end_date:
#             raise serializers.ValidationError("Start date cannot be after end date")
        
#         if start_date < timezone.now().date():
#             raise serializers.ValidationError("Cannot apply for past dates")
        
#         # Validate half-day requests
#         if leave_duration in ['HALF_DAY_MORNING', 'HALF_DAY_AFTERNOON']:
#             if start_date != end_date:
#                 raise serializers.ValidationError("Half-day leaves can only be for single day")
        
#         # Check leave policy constraints
#         leave_type = attrs['leave_type']
#         try:
#             policy = LeavePolicy.objects.get(leave_type=leave_type, is_active=True)
            
#             # Check advance notice
#             days_to_start = (start_date - timezone.now().date()).days
#             if days_to_start < policy.advance_notice_days:
#                 raise serializers.ValidationError(
#                     f"Leave must be applied {policy.advance_notice_days} days in advance"
#                 )
            
#             # Check maximum consecutive days
#             if policy.maximum_consecutive_days:
#                 requested_days = (end_date - start_date).days + 1
#                 if requested_days > policy.maximum_consecutive_days:
#                     raise serializers.ValidationError(
#                         f"Maximum {policy.maximum_consecutive_days} consecutive days allowed"
#                     )
            
#             attrs['leave_policy'] = policy
            
#         except LeavePolicy.DoesNotExist:
#             pass  # No specific policy found
        
#         return attrs
    
#     def create(self, validated_data):
#         # Calculate days_requested
#         leave_request = LeaveRequest(**validated_data)
#         leave_request.calculate_days_requested()
#         leave_request.save()
#         return leave_request

# class LeaveApprovalSerializer(serializers.Serializer):
#     action = serializers.ChoiceField(choices=['approve', 'reject'])
#     manager_comments = serializers.CharField(required=False, allow_blank=True)
#     rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
#     def validate(self, attrs):
#         if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
#             raise serializers.ValidationError("Rejection reason is required when rejecting leave")
#         return attrs

# class LeaveApprovalWorkflowSerializer(serializers.ModelSerializer):
#     leave_type = LeaveTypeSerializer(read_only=True)
#     approver_level_1 = UserSerializer(read_only=True)
#     approver_level_2 = UserSerializer(read_only=True)
    
#     class Meta:
#         model = LeaveApprovalWorkflow
#         fields = '__all__'

# class LeaveEncashmentSerializer(serializers.ModelSerializer):
#     employee = EmployeeSerializer(read_only=True)
#     leave_type = LeaveTypeSerializer(read_only=True)
#     processed_by = UserSerializer(read_only=True)
    
#     class Meta:
#         model = LeaveEncashment
#         fields = '__all__'

# class LeaveSummarySerializer(serializers.Serializer):
#     leave_balances = LeaveBalanceSerializer(many=True, read_only=True)
#     recent_requests = LeaveRequestSerializer(many=True, read_only=True)
#     pending_requests_count = serializers.IntegerField(read_only=True)
#     approved_requests_count = serializers.IntegerField(read_only=True)
#     total_days_taken = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)



from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    LeaveType, LeavePolicy, LeaveRequest, LeaveBalance, 
    LeaveApprovalWorkflow, LeaveEncashment, Notification
)
from employees.serializers import EmployeeSerializer
from authentication.serializers import UserSerializer

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

    def to_internal_value(self, data):
        # React forms often send "" for optional number inputs; DRF rejects that on IntegerField.
        if isinstance(data, dict):
            data = {**data}
            if data.get('max_carry_forward_days') in ('', None):
                data['max_carry_forward_days'] = 0
        elif hasattr(data, 'copy') and hasattr(data, 'get'):
            mutable = data.copy()
            if mutable.get('max_carry_forward_days') in ('', None):
                mutable['max_carry_forward_days'] = 0
            data = mutable
        return super().to_internal_value(data)

class LeavePolicySerializer(serializers.ModelSerializer):
    leave_type = LeaveTypeSerializer(read_only=True)
    leave_type_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = LeavePolicy
        fields = '__all__'

class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    leave_type = LeaveTypeSerializer(read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    leave_type = LeaveTypeSerializer(read_only=True)
    leave_policy = LeavePolicySerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['user_info']

    def get_user_info(self, obj):
        user = obj.employee.user
        return {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'profile_image': user.profile.image.url if hasattr(user, 'profile') and user.profile.image else None
        }

    
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = [
            'leave_type', 'start_date', 'end_date', 'leave_duration',
            'reason', 'employee_comments', 'supporting_document'
        ]
    
    def validate(self, attrs):
        start_date = attrs['start_date']
        end_date = attrs['end_date']
        leave_duration = attrs.get('leave_duration', 'FULL_DAY')
        
        # Basic date validation
        if start_date > end_date:
            raise serializers.ValidationError("Start date cannot be after end date")
        
        if start_date < timezone.now().date():
            raise serializers.ValidationError("Cannot apply for past dates")
        
        # Validate half-day requests
        if leave_duration in ['HALF_DAY_MORNING', 'HALF_DAY_AFTERNOON']:
            if start_date != end_date:
                raise serializers.ValidationError("Half-day leaves can only be for single day")
        
        # Check leave policy constraints
        leave_type = attrs['leave_type']
        try:
            policy = LeavePolicy.objects.get(leave_type=leave_type, is_active=True)
            
            # Check advance notice
            days_to_start = (start_date - timezone.now().date()).days
            if days_to_start < policy.advance_notice_days:
                raise serializers.ValidationError(
                    f"Leave must be applied {policy.advance_notice_days} days in advance"
                )
            
            # Check maximum consecutive days
            if policy.maximum_consecutive_days:
                requested_days = (end_date - start_date).days + 1
                if requested_days > policy.maximum_consecutive_days:
                    raise serializers.ValidationError(
                        f"Maximum {policy.maximum_consecutive_days} consecutive days allowed"
                    )
            
            attrs['leave_policy'] = policy
            
        except LeavePolicy.DoesNotExist:
            pass  # No specific policy found
        
        return attrs
    
    def create(self, validated_data):
        # Calculate days_requested
        leave_request = LeaveRequest(**validated_data)
        leave_request.calculate_days_requested()
        leave_request.save()
        return leave_request

class LeaveApprovalSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    manager_comments = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError("Rejection reason is required when rejecting leave")
        return attrs

class LeaveApprovalWorkflowSerializer(serializers.ModelSerializer):
    leave_type = LeaveTypeSerializer(read_only=True)
    approver_level_1 = UserSerializer(read_only=True)
    approver_level_2 = UserSerializer(read_only=True)
    
    class Meta:
        model = LeaveApprovalWorkflow
        fields = '__all__'

class LeaveEncashmentSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    leave_type = LeaveTypeSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = LeaveEncashment
        fields = '__all__'

class LeaveSummarySerializer(serializers.Serializer):
    leave_balances = LeaveBalanceSerializer(many=True, read_only=True)
    recent_requests = LeaveRequestSerializer(many=True, read_only=True)
    pending_requests_count = serializers.IntegerField(read_only=True)
    approved_requests_count = serializers.IntegerField(read_only=True)
    total_days_taken = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)

# Notification Serializer - ADD THIS
class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = '__all__'
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else None