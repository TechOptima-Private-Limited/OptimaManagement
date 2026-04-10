
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from .models import (
    LeaveType, LeavePolicy, LeaveRequest, LeaveBalance, 
    LeaveApprovalWorkflow, LeaveEncashment, Notification
)
from .serializers import (
    LeaveTypeSerializer, LeavePolicySerializer, LeaveRequestSerializer,
    LeaveRequestCreateSerializer, LeaveBalanceSerializer, LeaveApprovalSerializer,
    LeaveApprovalWorkflowSerializer, LeaveEncashmentSerializer, LeaveSummarySerializer,
    NotificationSerializer
)
from employees.models import Employee
from utils.permissions import IsEmployee, IsHRManager, IsHRorAdmin
from utils.roles import (
    has_executive_access,
    has_management_access,
    has_lead_access,
    can_manage_hr,
    get_permission_level,
    PERMISSION_LEVELS,
    ROLE_CATEGORIES
)
from rest_framework import serializers
from .services import LeaveNotificationService, LeaveBalanceService
from .el_balance import get_el_balance_payload, merge_el_balance


class LeaveTypeListCreateView(generics.ListCreateAPIView):
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsEmployee]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            # Match broader HR/Admin/Executive access (C-level, etc.) for configuring leave types
            return [IsHRorAdmin()]
        return [IsAuthenticated()]


class LeaveTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsHRorAdmin]


class LeavePolicyListCreateView(generics.ListCreateAPIView):
    queryset = LeavePolicy.objects.filter(is_active=True)
    serializer_class = LeavePolicySerializer
    permission_classes = [IsHRManager]


class LeavePolicyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeavePolicy.objects.all()
    serializer_class = LeavePolicySerializer
    permission_classes = [IsHRManager]


# Helper function to get manager's team employees
def get_manager_team_employees(user):
    """Get list of employee IDs that a manager can access (team + self)"""
    try:
        manager_employee = Employee.objects.get(user=user)
        team_employee_ids = Employee.objects.filter(
            manager=manager_employee,
            status='ACTIVE'
        ).values_list('id', flat=True)
        # Include manager's own ID
        return list(team_employee_ids) + [manager_employee.id]
    except Employee.DoesNotExist:
        return []


class LeaveRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEmployee]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'leave_type__name']
    ordering_fields = ['applied_on', 'start_date', 'status']
    ordering = ['-applied_on']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = LeaveRequest.objects.all()

        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0

        # Check Django permission first
        if not user.has_perm('leave_management.view_leaverequest'):
            # Apply role-based scoping
            if permission_level >= PERMISSION_LEVELS['EXECUTIVE']:
                # C-Level executives can see all leave requests
                pass
                
            elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
                # VP/Directors and HR can see all leave requests
                pass
                
            elif permission_level >= PERMISSION_LEVELS['MANAGER'] or has_management_access(user_role):
                # Managers see their team + self
                allowed_employee_ids = get_manager_team_employees(user)
                queryset = queryset.filter(employee_id__in=allowed_employee_ids)
                
            elif has_lead_access(user_role):
                # Team leads see their team + self (if they have direct reports)
                try:
                    lead_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=lead_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    if team_employee_ids:
                        # Has team members
                        allowed_employee_ids = list(team_employee_ids) + [lead_employee.id]
                        queryset = queryset.filter(employee_id__in=allowed_employee_ids)
                    else:
                        # No team members, just own requests
                        queryset = queryset.filter(employee=lead_employee)
                    
                except Employee.DoesNotExist:
                    queryset = LeaveRequest.objects.none()
                    
            else:
                # Regular employees see only their own leave requests
                try:
                    employee = Employee.objects.get(user=user)
                    queryset = queryset.filter(employee=employee)
                except Employee.DoesNotExist:
                    queryset = LeaveRequest.objects.none()
        
        # Apply additional filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        
        # Filter by leave type
        leave_type = self.request.query_params.get('leave_type')
        if leave_type:
            queryset = queryset.filter(leave_type_id=leave_type)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override to include pending approvals summary"""
        response = super().list(request, *args, **kwargs)
        
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Calculate pending approvals based on role
        if user.has_perm('leave_management.view_leaverequest') or permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']:
            # High-level users see all pending approvals
            pending_count = LeaveRequest.objects.filter(status='PENDING').count()
            
        elif has_management_access(user_role) or has_lead_access(user_role):
            # Managers and Team Leads see pending from their team
            allowed_employee_ids = get_manager_team_employees(user)
            pending_count = LeaveRequest.objects.filter(
                status='PENDING',
                employee_id__in=allowed_employee_ids
            ).count()
            
        else:
            # Regular employees see only their own pending
            try:
                employee = Employee.objects.get(user=user)
                pending_count = LeaveRequest.objects.filter(
                    employee=employee,
                    status='PENDING'
                ).count()
            except Employee.DoesNotExist:
                pending_count = 0
        
        # Add pending approvals data
        raw_data = response.data
        # DRF paginated responses are typically dicts with a `results` key.
        # When pagination is disabled, `response.data` can be a plain list.
        if isinstance(raw_data, dict):
            results = raw_data.get('results', [])
        else:
            results = raw_data

        response.data = {
            'results': results,
            'pending_approvals_count': pending_count,
            'has_pending_approvals': pending_count > 0,
            'user_role': user_role,
            'permission_level': permission_level
        }
        
        return response
    
    def perform_create(self, serializer):
        try:
            employee = Employee.objects.get(user=self.request.user)
            
            # Check if employee has enough balance
            leave_type = serializer.validated_data['leave_type']
            
            # Calculate days first
            leave_request_temp = LeaveRequest(**serializer.validated_data)
            leave_request_temp.calculate_days_requested()
            days_requested = leave_request_temp.days_requested
            
            # Check leave balance - but skip for HR and senior leaders
            user_profile = getattr(self.request.user, 'profile', None)
            user_role = getattr(user_profile, 'role', None) if user_profile else None
            permission_level = get_permission_level(user_role) if user_role else 0
            
            can_bypass_balance_check = (
                can_manage_hr(user_role) or 
                permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']
            )
            
            if not can_bypass_balance_check:
                has_balance, available_days = LeaveBalanceService.check_leave_balance(
                    employee, leave_type, days_requested
                )
                
                if not has_balance:
                    raise serializers.ValidationError(
                        f"Insufficient leave balance. Available: {available_days} days, Requested: {days_requested} days"
                    )
            
            # Save the leave request
            leave_request = serializer.save(employee=employee)
            
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found")


class LeaveRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsEmployee]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check access permissions
        if permission_level >= PERMISSION_LEVELS['EXECUTIVE'] or can_manage_hr(user_role):
            # Executives and HR can access any leave request
            return obj
            
        elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']:
            # Senior leaders can access any leave request
            return obj
            
        elif has_management_access(user_role) or has_lead_access(user_role):
            # Managers and Team Leads can access their team's requests + their own
            allowed_employee_ids = get_manager_team_employees(user)
            
            if obj.employee.id not in allowed_employee_ids:
                self.permission_denied(self.request, "Cannot access this leave request")
        else:
            # Regular employee can only access their own requests
            if obj.employee.user != user:
                self.permission_denied(self.request, "Cannot access other employee's leave requests")
        
        return obj
    
    def destroy(self, request, *args, **kwargs):
        """Delete leave request with balance restoration"""
        leave_request = self.get_object()
        user = request.user
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check permissions for deletion
        can_delete = False
        
        if user.has_perm('leave_management.delete_leaverequest'):
            can_delete = True
        elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            # Senior leaders and HR can delete any request
            can_delete = True
        elif has_management_access(user_role):
            # Managers can delete their team's requests
            if self._can_manager_access(user, leave_request):
                can_delete = True
        elif leave_request.employee.user == user:
            # Owner can delete their own
            can_delete = True
        
        if not can_delete:
            return Response(
                {'error': 'Not authorized to delete this request'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # For employees (not managers/HR), check if they can delete based on status
        is_owner = leave_request.employee.user == user
        is_elevated = permission_level >= PERMISSION_LEVELS['MANAGER'] or can_manage_hr(user_role)
        
        if is_owner and not is_elevated:
            # Employees can delete requests that haven't been finalized as approved.
            # Approved requests should generally be immutable for employees (balance + audit trail).
            if leave_request.status not in ['PENDING', 'REJECTED', 'CANCELLED', 'WITHDRAWN']:
                return Response(
                    {'error': 'You can only delete pending, rejected, cancelled, or withdrawn requests'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # If deleting an approved request, restore the balance
        if leave_request.status == 'APPROVED':
            try:
                balance = LeaveBalance.objects.get(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=leave_request.start_date.year
                )
                
                # Restore the balance
                balance.used_days -= leave_request.days_requested
                if balance.used_days < 0:
                    balance.used_days = 0
                balance.save()
                
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Balance restored on deletion: {leave_request.employee.user.get_full_name()} - {leave_request.leave_type.name}")
                
            except LeaveBalance.DoesNotExist:
                pass
        
        # Delete the request
        leave_request.delete()
        
        return Response({
            'message': 'Leave request deleted successfully',
            'balance_restored': leave_request.status == 'APPROVED'
        }, status=status.HTTP_200_OK)
    
    def _can_manager_access(self, user, leave_request):
        """Check if manager can access this leave request"""
        try:
            manager_employee = Employee.objects.get(user=user)
            team_employee_ids = Employee.objects.filter(
                manager=manager_employee,
                status='ACTIVE'
            ).values_list('id', flat=True)
            
            allowed_employee_ids = list(team_employee_ids) + [manager_employee.id]
            return leave_request.employee.id in allowed_employee_ids
        except Employee.DoesNotExist:
            return False


@api_view(['POST'])
@permission_classes([IsEmployee])
def approve_leave_request(request, request_id):
    """Approve leave request - Updated with comprehensive role permissions"""
    try:
        leave_request = LeaveRequest.objects.get(id=request_id)
        user = request.user
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check authorization
        can_approve = user.has_perm('leave_management.change_leaverequest')
        
        if not can_approve:
            if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
                # Senior leaders and HR can approve any request
                can_approve = True
                
            elif has_management_access(user_role) or has_lead_access(user_role):
                # Managers and Team Leads can approve their team's requests (but not their own)
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    # Can approve team requests but not their own
                    if leave_request.employee.id in team_employee_ids:
                        can_approve = True
                    
                except Employee.DoesNotExist:
                    can_approve = False
        
        # Also check if there's a direct manager relationship (legacy check)
        if not can_approve and leave_request.employee.manager and leave_request.employee.manager.user == user:
            can_approve = True
        
        if not can_approve:
            return Response(
                {'error': 'Not authorized to approve this request'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if leave_request.status != 'PENDING':
            return Response(
                {'error': 'Only pending requests can be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update leave request
        leave_request.status = 'APPROVED'
        leave_request.approved_by = user
        leave_request.approved_on = timezone.now()
        leave_request.manager_comments = request.data.get('comments', '')
        leave_request.save()  # This will trigger signals
        
        return Response({'message': 'Leave request approved successfully'})
        
    except LeaveRequest.DoesNotExist:
        return Response(
            {'error': 'Leave request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsEmployee])
def reject_leave_request(request, request_id):
    """Reject leave request - Updated with comprehensive role permissions"""
    try:
        leave_request = LeaveRequest.objects.get(id=request_id)
        user = request.user
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check authorization (same logic as approve)
        can_reject = user.has_perm('leave_management.change_leaverequest')
        
        if not can_reject:
            if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
                # Senior leaders and HR can reject any request
                can_reject = True
                
            elif has_management_access(user_role) or has_lead_access(user_role):
                # Managers and Team Leads can reject their team's requests (but not their own)
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    # Can reject team requests but not their own
                    if leave_request.employee.id in team_employee_ids:
                        can_reject = True
                    
                except Employee.DoesNotExist:
                    can_reject = False
        
        # Also check if there's a direct manager relationship (legacy check)
        if not can_reject and leave_request.employee.manager and leave_request.employee.manager.user == user:
            can_reject = True
        
        if not can_reject:
            return Response(
                {'error': 'Not authorized to reject this request'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if leave_request.status != 'PENDING':
            return Response(
                {'error': 'Only pending requests can be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = 'REJECTED'
        leave_request.rejection_reason = request.data.get('comments', '')
        leave_request.manager_comments = request.data.get('comments', '')
        leave_request.save()
        
        return Response({'message': 'Leave request rejected'})
        
    except LeaveRequest.DoesNotExist:
        return Response(
            {'error': 'Leave request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsEmployee])
def cancel_leave_request(request, request_id):
    """Cancel own leave request"""
    try:
        employee = Employee.objects.get(user=request.user)
        leave_request = LeaveRequest.objects.get(id=request_id, employee=employee)
        
        if leave_request.status not in ['PENDING', 'APPROVED']:
            return Response(
                {'error': 'Only pending or approved requests can be cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = 'CANCELLED'
        leave_request.save()
        
        return Response({'message': 'Leave request cancelled successfully'})
        
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except LeaveRequest.DoesNotExist:
        return Response(
            {'error': 'Leave request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


class LeaveBalanceListView(generics.ListAPIView):
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsEmployee]

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        year = int(request.query_params.get('year', datetime.now().year))
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0

        single_employee = None
        try:
            if request.query_params.get('employee_id'):
                single_employee = Employee.objects.get(id=int(request.query_params['employee_id']))
            elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
                pass
            elif has_management_access(user_role) or has_lead_access(user_role):
                pass
            else:
                single_employee = Employee.objects.get(user=user)
        except (Employee.DoesNotExist, ValueError, TypeError):
            single_employee = None

        if single_employee is None:
            return response

        if isinstance(response.data, dict) and 'results' in response.data:
            response.data['results'] = merge_el_balance(
                list(response.data['results']), single_employee, year
            )
        elif isinstance(response.data, list):
            response.data = merge_el_balance(response.data, single_employee, year)
        return response
    
    def get_queryset(self):
        year = int(self.request.query_params.get('year', datetime.now().year))
        user = self.request.user
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Determine access level
        if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            # Senior leaders and HR can view all balances
            employee_id = self.request.query_params.get('employee_id')
            if employee_id:
                try:
                    employee = Employee.objects.get(id=employee_id)
                    self._initialize_employee_balances(employee, year)
                    queryset = LeaveBalance.objects.filter(employee_id=employee_id, year=year)
                except Employee.DoesNotExist:
                    queryset = LeaveBalance.objects.none()
            else:
                queryset = LeaveBalance.objects.filter(year=year).exclude(leave_type__code='EL')
                
        elif has_management_access(user_role) or has_lead_access(user_role):
            # Managers and Team Leads can view their team's balances + their own
            allowed_employee_ids = get_manager_team_employees(user)
            
            # Initialize balances for all team members
            for emp_id in allowed_employee_ids:
                try:
                    employee = Employee.objects.get(id=emp_id)
                    self._initialize_employee_balances(employee, year)
                except Employee.DoesNotExist:
                    continue
            
            queryset = LeaveBalance.objects.filter(employee_id__in=allowed_employee_ids, year=year)
            
        else:
            # Regular employee - only their own balances
            try:
                employee = Employee.objects.get(user=user)
                self._initialize_employee_balances(employee, year)
                queryset = LeaveBalance.objects.filter(employee=employee, year=year)
            except Employee.DoesNotExist:
                queryset = LeaveBalance.objects.none()

        # Earned Leave (EL) is tracked in LeaveLedger, not LeaveBalance — exclude stale rows
        return queryset.exclude(leave_type__code='EL').order_by('leave_type__name')
    
    def _initialize_employee_balances(self, employee, year):
        """Initialize missing leave balances for an employee"""
        leave_types = LeaveType.objects.filter(is_active=True)
        
        for leave_type in leave_types:
            # EL and Unpaid leaves use synthetic payloads from ledger/logic — skip LeaveBalance record
            if leave_type.code == 'EL' or getattr(leave_type, 'is_unpaid', False):
                continue
            # Calculate used days from existing approved requests
            approved_days = LeaveRequest.objects.filter(
                employee=employee,
                leave_type=leave_type,
                status='APPROVED',
                start_date__year=year
            ).aggregate(total=Sum('days_requested'))['total'] or 0

            used_days = float(approved_days)
            total_days = float(leave_type.days_allowed_per_year)
            remaining_days = max(total_days - used_days, 0)

            # Create or update the balance record
            balance, created = LeaveBalance.objects.get_or_create(
                employee=employee,
                leave_type=leave_type,
                year=year,
                defaults={
                    'total_days': total_days,
                    'used_days': used_days,
                    'remaining_days': remaining_days
                }
            )
            if not created:
                # Update existing balances if policy changed or usage differs
                if (
                    balance.total_days != total_days or
                    float(balance.used_days) != used_days or
                    float(balance.remaining_days) != remaining_days
                ):
                    balance.total_days = total_days
                    balance.used_days = used_days
                    balance.remaining_days = remaining_days
                    balance.save()


# Notification Views
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsEmployee]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@api_view(['PATCH'])
@permission_classes([IsEmployee])
def mark_notification_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsEmployee])
def leave_summary(request):
    """Get comprehensive leave summary for employee"""
    try:
        employee = Employee.objects.get(user=request.user)
        current_year = datetime.now().year
        
        # Initialize balances first (EL uses LeaveLedger, not LeaveBalance)
        leave_types = LeaveType.objects.filter(is_active=True)
        for leave_type in leave_types:
            if leave_type.code == 'EL' or getattr(leave_type, 'is_unpaid', False):
                continue
            LeaveBalanceService.get_or_create_balance(employee, leave_type, current_year)
        
        leave_balances = LeaveBalance.objects.filter(employee=employee, year=current_year).exclude(leave_type__code='EL')
        balance_data = merge_el_balance(
            LeaveBalanceSerializer(leave_balances, many=True).data,
            employee,
            current_year,
        )
        
        # Get recent leave requests (last 10)
        recent_requests = LeaveRequest.objects.filter(employee=employee)[:10]
        
        # Get counts
        pending_count = LeaveRequest.objects.filter(
            employee=employee, 
            status='PENDING'
        ).count()
        
        approved_count = LeaveRequest.objects.filter(
            employee=employee, 
            status='APPROVED',
            start_date__year=current_year
        ).count()
        
        # Calculate total days taken this year
        total_days_taken = LeaveRequest.objects.filter(
            employee=employee,
            status='APPROVED',
            start_date__year=current_year
        ).aggregate(total=Sum('days_requested'))['total'] or 0
        
        data = {
            'leave_balances': balance_data,
            'recent_requests': LeaveRequestSerializer(recent_requests, many=True).data,
            'pending_requests_count': pending_count,
            'approved_requests_count': approved_count,
            'total_days_taken': total_days_taken,
        }
        
        return Response(data)
    
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsEmployee])
def leave_analytics(request):
    """Get leave analytics.

    - HR, Senior Leaders, and Managers: org/team analytics
    - Other employees: self-only analytics (instead of 403)
    """
    user = request.user
    user_profile = getattr(user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    permission_level = get_permission_level(user_role) if user_role else 0
    
    # Check if user has access to analytics
    has_access = (
        permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or
        can_manage_hr(user_role) or
        has_management_access(user_role)
    )
    
    current_year = datetime.now().year
    
    # Filter data based on role
    if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
        # Full access to all data
        leave_requests_qs = LeaveRequest.objects.filter(
            status='APPROVED',
            start_date__year=current_year
        )
        employees_qs = Employee.objects.filter(status='ACTIVE')
    elif has_access:
        # Manager: only their team
        allowed_employee_ids = get_manager_team_employees(user)
        leave_requests_qs = LeaveRequest.objects.filter(
            status='APPROVED',
            start_date__year=current_year,
            employee_id__in=allowed_employee_ids
        )
        employees_qs = Employee.objects.filter(id__in=allowed_employee_ids, status='ACTIVE')
    else:
        # Regular employee: self-only analytics
        try:
            employee = Employee.objects.get(user=user)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

        leave_requests_qs = LeaveRequest.objects.filter(
            status='APPROVED',
            start_date__year=current_year,
            employee=employee,
        )
        employees_qs = Employee.objects.filter(id=employee.id, status='ACTIVE')
    
    # Leave type usage
    leave_type_usage = leave_requests_qs.values('leave_type__name').annotate(
        total_days=Sum('days_requested')
    ).order_by('-total_days')
    
    # Monthly leave trends
    monthly_trends = []
    for month in range(1, 13):
        month_requests = leave_requests_qs.filter(
            start_date__month=month
        ).aggregate(total=Sum('days_requested'))['total'] or 0
        
        monthly_trends.append({
            'month': month,
            'total_days': float(month_requests)
        })
    
    # Top leave takers
    top_leave_takers = employees_qs.annotate(
        total_leaves=Sum(
            'leave_requests__days_requested',
            filter=Q(
                leave_requests__status='APPROVED',
                leave_requests__start_date__year=current_year
            )
        )
    ).exclude(total_leaves__isnull=True).order_by('-total_leaves')[:10]
    
    return Response({
        'leave_type_usage': leave_type_usage,
        'monthly_trends': monthly_trends,
        'top_leave_takers': [
            {
                'employee_name': f"{emp.user.first_name} {emp.user.last_name}",
                'employee_id': emp.employee_id,
                'total_days': float(emp.total_leaves or 0)
            } for emp in top_leave_takers
        ],
        'scope': (
            'full'
            if (permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role))
            else ('team' if has_access else 'self')
        )
    })


@api_view(['POST'])
@permission_classes([IsEmployee])
def initialize_yearly_balances(request):
    """Initialize leave balances for all employees for a new year - HR only"""
    user = request.user
    user_profile = getattr(user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    # Only HR and executives can initialize balances
    if not (can_manage_hr(user_role) or has_executive_access(user_role)):
        return Response(
            {'error': 'Only HR and Executives can initialize yearly balances'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    year = request.data.get('year', datetime.now().year)
    
    employees = Employee.objects.filter(status='ACTIVE')
    leave_types = LeaveType.objects.filter(is_active=True)
    
    created_count = 0
    updated_count = 0
    
    for employee in employees:
        for leave_type in leave_types:
            if leave_type.code == 'EL':
                continue
            # Calculate used days from existing approved requests
            approved_days = LeaveRequest.objects.filter(
                employee=employee,
                leave_type=leave_type,
                status='APPROVED',
                start_date__year=year
            ).aggregate(total=Sum('days_requested'))['total'] or 0
            
            used_days = float(approved_days)
            total_days = float(leave_type.days_allowed_per_year)
            remaining_days = max(total_days - used_days, 0)
            
            balance, created = LeaveBalance.objects.get_or_create(
                employee=employee,
                leave_type=leave_type,
                year=year,
                defaults={
                    'total_days': total_days,
                    'used_days': used_days,
                    'remaining_days': remaining_days
                }
            )
            if created:
                created_count += 1
            else:
                # Update existing balances
                if (
                    balance.total_days != total_days or
                    float(balance.used_days) != used_days or
                    float(balance.remaining_days) != remaining_days
                ):
                    balance.total_days = total_days
                    balance.used_days = used_days
                    balance.remaining_days = remaining_days
                    balance.save()
                    updated_count += 1

    return Response({
        'message': f'Created {created_count} and updated {updated_count} leave balance records for year {year}',
        'year': year,
        'total_employees': employees.count(),
        'total_leave_types': leave_types.count()
    })





# Add this new endpoint 
@api_view(['GET'])
@permission_classes([IsEmployee])
def leave_ledger_history(request):
    """
    Return LeaveLedger rows for the logged-in employee for the given leave_type_id + year.
    Used by the frontend "Balance history" panel.
    """
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

    leave_type_id = request.query_params.get('leave_type_id')
    year = request.query_params.get('year') or datetime.now().year

    if not leave_type_id:
        return Response({'error': 'leave_type_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        leave_type_id = int(leave_type_id)
        year = int(year)
    except (TypeError, ValueError):
        return Response({'error': 'Invalid leave_type_id or year'}, status=status.HTTP_400_BAD_REQUEST)

    leave_type = get_object_or_404(LeaveType, id=leave_type_id)

    from .models import LeaveLedger
    ledger_entries = list(
        LeaveLedger.objects.filter(
            employee=employee,
            leave_type=leave_type,
            transaction_date__year=year,
        ).order_by('transaction_date', 'id')
    )

    # Compute a "running balance" based on transaction_type semantics.
    # - ACCRUAL increases balance
    # - DEDUCTION / EXPIRED / ENCASHMENT decrease balance
    def sign_for(tx_type: str) -> int:
        tx = (tx_type or '').upper()
        if tx == 'ACCRUAL':
            return 1
        if tx in {'DEDUCTION', 'EXPIRED', 'ENCASHMENT'}:
            return -1
        return 0

    running_balance = 0.0
    entries_out = []
    for l in ledger_entries:
        days = float(l.days or 0)
        change = days * sign_for(l.transaction_type)
        running_balance += change

        entries_out.append({
            'id': l.id,
            'transaction_date': l.transaction_date.isoformat(),
            'change': round(change, 2),
            'balance': round(running_balance, 2),
            'reason': l.description or l.transaction_type,
        })

    # Policy tab: return basic leave-type info; full policies are HR-only.
    policy_payload = {
        'leave_type_name': leave_type.name,
        'leave_type_code': leave_type.code,
        'annual_quota_days': float(getattr(leave_type, 'days_allowed_per_year', 0) or 0),
        'start_date': leave_type.start_date.isoformat() if getattr(leave_type, 'start_date', None) else None,
        'carry_forward_enabled': bool(getattr(leave_type, 'is_carry_forward', False)),
        'max_carry_forward_days': float(getattr(leave_type, 'max_carry_forward_days', 0) or 0),
    }

    return Response({
        'leave_type': {
            'id': leave_type.id,
            'name': leave_type.name,
            'code': leave_type.code,
        },
        'year': year,
        'entries': entries_out,
        'policy': policy_payload,
    })

@api_view(['POST'])
@permission_classes([IsEmployee])
def initialize_my_balances(request):
    """Initialize all leave balances for current employee"""
    try:
        employee = Employee.objects.get(user=request.user)
        year = request.data.get('year', datetime.now().year)
        
        leave_types = LeaveType.objects.filter(is_active=True)
        created_count = 0
        updated_count = 0
        
        for leave_type in leave_types:
            if leave_type.code == 'EL':
                continue
            # Calculate used days from existing approved requests for the year
            approved_days = LeaveRequest.objects.filter(
                employee=employee,
                leave_type=leave_type,
                status='APPROVED',
                start_date__year=year
            ).aggregate(total=Sum('days_requested'))['total'] or 0

            used_days = float(approved_days)
            total_days = float(leave_type.days_allowed_per_year)
            remaining_days = max(total_days - used_days, 0)

            balance, created = LeaveBalance.objects.get_or_create(
                employee=employee,
                leave_type=leave_type,
                year=year,
                defaults={
                    'total_days': total_days,
                    'used_days': used_days,
                    'remaining_days': remaining_days
                }
            )
            if created:
                created_count += 1
            else:
                # Update existing to reflect current policy and usage
                if (
                    balance.total_days != total_days or
                    float(balance.used_days) != used_days or
                    float(balance.remaining_days) != remaining_days
                ):
                    balance.total_days = total_days
                    balance.used_days = used_days
                    balance.remaining_days = remaining_days
                    balance.save()
                    updated_count += 1

        LeaveBalance.objects.filter(employee=employee, year=year, leave_type__code='EL').delete()
        
        # Return all balances (updated); EL comes from ledger
        balances = LeaveBalance.objects.filter(employee=employee, year=year).exclude(leave_type__code='EL').order_by('leave_type__name')
        serialized_balances = LeaveBalanceSerializer(balances, many=True).data
        serialized_balances = merge_el_balance(serialized_balances, employee, year)
        
        return Response({
            'message': f'Initialized {len(serialized_balances)} leave balance records (created: {created_count}, updated: {updated_count})',
            'balances': serialized_balances
        })
        
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

# Add this debug endpoint at the end of views.py (remove after testing)
@api_view(['POST'])
@permission_classes([IsHRManager])
def test_balance_update(request, request_id):
    """Debug endpoint to test balance update for a specific leave request"""
    try:
        leave_request = LeaveRequest.objects.get(id=request_id)
        
        if leave_request.status == 'APPROVED':
            # Test deduction
            balance_before = LeaveBalance.objects.get(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=leave_request.start_date.year
            )
            
            # logger.info(f"Before update - Used: {balance_before.used_days}, Remaining: {balance_before.remaining_days}")
            
            # Manually trigger balance update
            updated_balance = LeaveBalanceService.deduct_leave_balance(leave_request)
            
            return Response({
                'message': 'Balance updated successfully',
                'before': {
                    'used_days': float(balance_before.used_days),
                    'remaining_days': float(balance_before.remaining_days)
                },
                'after': {
                    'used_days': updated_balance.used_days,
                    'remaining_days': updated_balance.remaining_days
                },
                'leave_request': {
                    'id': leave_request.id,
                    'days_requested': leave_request.days_requested,
                    'employee': leave_request.employee.user.get_full_name(),
                    'leave_type': leave_request.leave_type.name
                }
            })
        else:
            return Response({'error': f'Leave request status is {leave_request.status}, not APPROVED'})
            
    except LeaveRequest.DoesNotExist:
        return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsHRManager])
def fix_all_balances(request):
    """Fix all leave balances by recalculating based on approved requests"""
    try:
        from django.db.models import Sum
        
        year = request.data.get('year', datetime.now().year)
        fixed_count = 0
        results = []
        
        # Get all employees
        employees = Employee.objects.filter(status='ACTIVE')
        
        for employee in employees:
            employee_result = {
                'employee': employee.user.get_full_name(),
                'employee_id': employee.id,
                'balances_fixed': []
            }
            
            # Get all leave types
            leave_types = LeaveType.objects.filter(is_active=True)
            
            for leave_type in leave_types:
                # Get or create balance record
                balance, created = LeaveBalance.objects.get_or_create(
                    employee=employee,
                    leave_type=leave_type,
                    year=year,
                    defaults={
                        'total_days': leave_type.days_allowed_per_year,
                        'used_days': 0,
                        'remaining_days': leave_type.days_allowed_per_year
                    }
                )
                
                # Calculate correct used days from approved requests
                approved_days = LeaveRequest.objects.filter(
                    employee=employee,
                    leave_type=leave_type,
                    status='APPROVED',
                    start_date__year=year
                ).aggregate(total=Sum('days_requested'))['total'] or 0
                
                correct_used_days = float(approved_days)
                correct_remaining_days = float(leave_type.days_allowed_per_year) - correct_used_days
                
                # Check if needs fixing
                if balance.used_days != correct_used_days or balance.remaining_days != correct_remaining_days:
                    old_used = balance.used_days
                    old_remaining = balance.remaining_days
                    
                    balance.used_days = correct_used_days
                    balance.remaining_days = correct_remaining_days
                    balance.save()
                    
                    employee_result['balances_fixed'].append({
                        'leave_type': leave_type.name,
                        'before': {'used': old_used, 'remaining': old_remaining},
                        'after': {'used': correct_used_days, 'remaining': correct_remaining_days}
                    })
                    fixed_count += 1
            
            if employee_result['balances_fixed']:
                results.append(employee_result)
        
        return Response({
            'message': f'Fixed {fixed_count} balance records',
            'year': year,
            'results': results
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def on_leave_today(request):
    """Get employees who are on approved leave today"""
    today = timezone.now().date()
    
    # Filter for approved leave requests that cover today
    leave_requests = LeaveRequest.objects.filter(
        status='APPROVED',
        start_date__lte=today,
        end_date__gte=today
    ).select_related('employee', 'employee__user', 'leave_type')
    
    results = []
    for lr in leave_requests:
        emp = lr.employee
        user = emp.user
        results.append({
            'employee_id': emp.id,
            'employee_name': f"{user.first_name} {user.last_name}",
            'leave_type': lr.leave_type.name,
            'start_date': lr.start_date,
            'end_date': lr.end_date,
            'initials': f"{user.first_name[0]}{user.last_name[0]}" if user.first_name and user.last_name else ""
        })
    
    return Response(results)

