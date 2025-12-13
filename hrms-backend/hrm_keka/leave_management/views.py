from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
from utils.permissions import IsEmployee, IsHRManager
from rest_framework import serializers
from .services import LeaveNotificationService, LeaveBalanceService

class LeaveTypeListCreateView(generics.ListCreateAPIView):
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsEmployee]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHRManager()]
        return [IsAuthenticated()]

class LeaveTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsHRManager]

class LeavePolicyListCreateView(generics.ListCreateAPIView):
    queryset = LeavePolicy.objects.filter(is_active=True)
    serializer_class = LeavePolicySerializer
    permission_classes = [IsHRManager]

class LeavePolicyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeavePolicy.objects.all()
    serializer_class = LeavePolicySerializer
    permission_classes = [IsHRManager]

class LeaveRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsEmployee]
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
        print(f"🔍 Current user: {user}")
        queryset = LeaveRequest.objects.all()

        # If user has global view permission, allow full queryset; else apply role-based scoping
        if not user.has_perm('leave_management.view_leaverequest'):
            # Check user role and filter accordingly
            if hasattr(user, 'profile'):
                user_role = user.profile.role
                print(f"🔍 User role: {user_role}")

                if user_role == 'HR_MANAGER':
                    # HR Manager can see all leave requests
                    pass  # queryset remains all records

                elif user_role == 'MANAGER':
                    # Manager can only see their team's leave requests + their own
                    try:
                        manager_employee = Employee.objects.get(user=user)
                        # Get all employees who report to this manager + the manager themselves
                        team_employee_ids = Employee.objects.filter(
                            manager=manager_employee,
                            status='ACTIVE'
                        ).values_list('id', flat=True)
                        print(f"🔍 Team employee IDs: {team_employee_ids}")
                        # Include manager's own leave requests too
                        allowed_employee_ids = list(team_employee_ids) + [manager_employee.id]
                        queryset = queryset.filter(employee_id__in=allowed_employee_ids)
                        print(f"🔍 Filtered queryset: {queryset}")
                    except Employee.DoesNotExist:
                        queryset = LeaveRequest.objects.none()

                else:  # EMPLOYEE
                    # Regular employees can only see their own leave requests
                    try:
                        employee = Employee.objects.get(user=user)
                        queryset = queryset.filter(employee=employee)
                    except Employee.DoesNotExist:
                        queryset = LeaveRequest.objects.none()
            else:
                # If no profile, only show own leave requests
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
        """Override to include pending approvals summary for HR and Managers"""
        response = super().list(request, *args, **kwargs)
        
        user = request.user
        print(f"🔍 Current user: {user}")
        
        if hasattr(user, 'profile'):
            user_role = user.profile.role
            print(f"🔍 User role: {user_role}")
            
            if user.has_perm('leave_management.view_leaverequest') or user_role == 'HR_MANAGER':
                # HR Manager sees all pending approvals
                pending_count = LeaveRequest.objects.filter(status='PENDING').count()
                
            elif user_role == 'MANAGER':
                # Manager only sees pending approvals from their team
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    # Include manager's own pending requests too
                    allowed_employee_ids = list(team_employee_ids) + [manager_employee.id]
                    pending_count = LeaveRequest.objects.filter(
                        status='PENDING',
                        employee_id__in=allowed_employee_ids
                    ).count()
                    
                except Employee.DoesNotExist:
                    pending_count = 0
            else:
                # Regular employees don't need pending count for others
                try:
                    employee = Employee.objects.get(user=user)
                    pending_count = LeaveRequest.objects.filter(
                        employee=employee,
                        status='PENDING'
                    ).count()
                except Employee.DoesNotExist:
                    pending_count = 0
            
            # Add pending approvals data for all users
            response.data = {
                'results': response.data.get('results', response.data),
                'pending_approvals_count': pending_count,
                'has_pending_approvals': pending_count > 0,
                'user_role': user_role
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
            
            # Check leave balance - but skip for HR managers
            is_hr_manager = hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER'
            
            if not is_hr_manager:
                has_balance, available_days = LeaveBalanceService.check_leave_balance(
                    employee, leave_type, days_requested
                )
                
                if not has_balance:
                    raise serializers.ValidationError(
                        f"Insufficient leave balance. Available: {available_days} days, Requested: {days_requested} days"
                    )
            
            # Save the leave request
            leave_request = serializer.save(employee=employee)
            
            # Send notifications
            try:
                LeaveNotificationService.notify_leave_request_submitted(leave_request)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send notification for leave request {leave_request.id}: {e}")
            
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employee profile not found")

class LeaveRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsEmployee]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Check permissions based on role
        if hasattr(user, 'profile'):
            user_role = user.profile.role
            
            if user_role == 'HR_MANAGER':
                # HR Manager can access any leave request
                return obj
                
            elif user_role == 'MANAGER':
                # Manager can access their team's requests + their own
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    allowed_employee_ids = list(team_employee_ids) + [manager_employee.id]
                    
                    if obj.employee.id not in allowed_employee_ids:
                        self.permission_denied(self.request, "Cannot access this leave request")
                    
                except Employee.DoesNotExist:
                    self.permission_denied(self.request, "Manager profile not found")
            else:
                # Regular employee can only access their own requests
                if obj.employee.user != user:
                    self.permission_denied(self.request, "Cannot access other employee's leave requests")
        else:
            # No profile - only own requests
            if obj.employee.user != user:
                self.permission_denied(self.request, "Cannot access other employee's leave requests")
        
        return obj
    
    def destroy(self, request, *args, **kwargs):
        """Delete leave request with balance restoration"""
        leave_request = self.get_object()
        user = request.user
        
        # Check permissions for deletion
        if user.has_perm('leave_management.delete_leaverequest'):
            pass  # allow deletion by perm
        elif hasattr(user, 'profile'):
            user_role = user.profile.role
            is_hr = user_role == 'HR_MANAGER'
            is_manager = user_role == 'MANAGER'
            is_owner = leave_request.employee.user == user
            
            # Manager can delete their team's requests, HR can delete any, owner can delete own
            if not (is_hr or (is_manager and self._can_manager_access(user, leave_request)) or is_owner):
                return Response({'error': 'Not authorized to delete this request'}, 
                              status=status.HTTP_403_FORBIDDEN)
        else:
            # No profile - only owner can delete
            if leave_request.employee.user != user:
                return Response({'error': 'Not authorized to delete this request'}, 
                              status=status.HTTP_403_FORBIDDEN)
        
        # For employees, check if they can delete based on status
        is_owner = leave_request.employee.user == user
        if is_owner and not (hasattr(user, 'profile') and user.profile.role in ['HR_MANAGER', 'MANAGER']):
            if leave_request.status not in ['APPROVED', 'REJECTED', 'CANCELLED']:
                return Response({'error': 'You can only delete approved, rejected, or cancelled requests'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
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
                    balance.used_days = 0  # Don't go negative
                balance.save()  # remaining_days auto-calculates
                
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"✅ Balance restored on deletion: {leave_request.employee.user.get_full_name()} - {leave_request.leave_type.name} - Used: {balance.used_days}")
                
            except LeaveBalance.DoesNotExist:
                pass  # Continue with deletion even if no balance record
        
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
    """Approve leave request - Updated with manager permissions"""
    try:
        leave_request = LeaveRequest.objects.get(id=request_id)
        user = request.user
        
        # Check authorization based on role
        can_approve = user.has_perm('leave_management.change_leaverequest')
        
        if not can_approve and hasattr(user, 'profile'):
            user_role = user.profile.role
            
            if user_role == 'HR_MANAGER':
                # HR Manager can approve any request
                can_approve = True
                
            elif user_role == 'MANAGER':
                # Manager can approve their team's requests (but not their own)
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    # Manager can approve team requests but not their own
                    if leave_request.employee.id in team_employee_ids:
                        can_approve = True
                    
                except Employee.DoesNotExist:
                    can_approve = False
        
        # Also check if there's a direct manager relationship (legacy check)
        if not can_approve and leave_request.employee.manager and leave_request.employee.manager.user == user:
            can_approve = True
        
        if not can_approve:
            return Response({'error': 'Not authorized to approve this request'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if leave_request.status != 'PENDING':
            return Response({'error': 'Only pending requests can be approved'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Update leave request
        leave_request.status = 'APPROVED'
        leave_request.approved_by = user
        leave_request.approved_on = timezone.now()
        leave_request.manager_comments = request.data.get('comments', '')
        leave_request.save()  # This will trigger signals
        
        return Response({'message': 'Leave request approved successfully'})
        
    except LeaveRequest.DoesNotExist:
        return Response({'error': 'Leave request not found'}, 
                      status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsEmployee])
def reject_leave_request(request, request_id):
    """Reject leave request - Updated with manager permissions"""
    try:
        leave_request = LeaveRequest.objects.get(id=request_id)
        user = request.user
        
        # Check authorization based on role (same logic as approve)
        can_reject = user.has_perm('leave_management.change_leaverequest')
        
        if not can_reject and hasattr(user, 'profile'):
            user_role = user.profile.role
            
            if user_role == 'HR_MANAGER':
                # HR Manager can reject any request
                can_reject = True
                
            elif user_role == 'MANAGER':
                # Manager can reject their team's requests (but not their own)
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    # Manager can reject team requests but not their own
                    if leave_request.employee.id in team_employee_ids:
                        can_reject = True
                    
                except Employee.DoesNotExist:
                    can_reject = False
        
        # Also check if there's a direct manager relationship (legacy check)
        if not can_reject and leave_request.employee.manager and leave_request.employee.manager.user == user:
            can_reject = True
        
        if not can_reject:
            return Response({'error': 'Not authorized to reject this request'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if leave_request.status != 'PENDING':
            return Response({'error': 'Only pending requests can be rejected'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        leave_request.status = 'REJECTED'
        leave_request.rejection_reason = request.data.get('comments', '')
        leave_request.manager_comments = request.data.get('comments', '')
        leave_request.save()
        
        return Response({'message': 'Leave request rejected'})
        
    except LeaveRequest.DoesNotExist:
        return Response({'error': 'Leave request not found'}, 
                      status=status.HTTP_404_NOT_FOUND)

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
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except LeaveRequest.DoesNotExist:
        return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

class LeaveBalanceListView(generics.ListAPIView):
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsEmployee]
    
    def get_queryset(self):
        year = int(self.request.query_params.get('year', datetime.now().year))
        user = self.request.user
        
        # Check user role and filter accordingly
        if hasattr(user, 'profile'):
            user_role = user.profile.role
            
            if user_role == 'HR_MANAGER':
                # HR Manager can view all balances
                employee_id = self.request.query_params.get('employee_id')
                if employee_id:
                    try:
                        employee = Employee.objects.get(id=employee_id)
                        self._initialize_employee_balances(employee, year)
                        queryset = LeaveBalance.objects.filter(employee_id=employee_id, year=year)
                    except Employee.DoesNotExist:
                        queryset = LeaveBalance.objects.none()
                else:
                    queryset = LeaveBalance.objects.filter(year=year)
                    
            elif user_role == 'MANAGER':
                # Manager can view their team's balances + their own
                try:
                    manager_employee = Employee.objects.get(user=user)
                    team_employee_ids = Employee.objects.filter(
                        manager=manager_employee,
                        status='ACTIVE'
                    ).values_list('id', flat=True)
                    
                    allowed_employee_ids = list(team_employee_ids) + [manager_employee.id]
                    
                    # Initialize balances for all team members
                    for emp_id in allowed_employee_ids:
                        try:
                            employee = Employee.objects.get(id=emp_id)
                            self._initialize_employee_balances(employee, year)
                        except Employee.DoesNotExist:
                            continue
                    
                    queryset = LeaveBalance.objects.filter(employee_id__in=allowed_employee_ids, year=year)
                    
                except Employee.DoesNotExist:
                    queryset = LeaveBalance.objects.none()
            else:
                # Regular employee - only their own balances
                try:
                    employee = Employee.objects.get(user=user)
                    self._initialize_employee_balances(employee, year)
                    queryset = LeaveBalance.objects.filter(employee=employee, year=year)
                except Employee.DoesNotExist:
                    queryset = LeaveBalance.objects.none()
        else:
            # No profile - only own balances
            try:
                employee = Employee.objects.get(user=user)
                self._initialize_employee_balances(employee, year)
                queryset = LeaveBalance.objects.filter(employee=employee, year=year)
            except Employee.DoesNotExist:
                queryset = LeaveBalance.objects.none()
        
        return queryset.order_by('leave_type__name')
    
    def _initialize_employee_balances(self, employee, year):
        """Initialize missing leave balances for an employee"""
        leave_types = LeaveType.objects.filter(is_active=True)
        
        for leave_type in leave_types:
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

            # Create or update the balance record to reflect current policy and usage
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

# ... (rest of the views remain the same)

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
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsEmployee])
def leave_summary(request):
    """Get comprehensive leave summary for employee"""
    try:
        employee = Employee.objects.get(user=request.user)
        current_year = datetime.now().year
        
        # Initialize balances first
        leave_types = LeaveType.objects.filter(is_active=True)
        for leave_type in leave_types:
            LeaveBalanceService.get_or_create_balance(employee, leave_type, current_year)
        
        # Get leave balances
        leave_balances = LeaveBalance.objects.filter(employee=employee, year=current_year)
        
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
            'leave_balances': LeaveBalanceSerializer(leave_balances, many=True).data,
            'recent_requests': LeaveRequestSerializer(recent_requests, many=True).data,
            'pending_requests_count': pending_count,
            'approved_requests_count': approved_count,
            'total_days_taken': total_days_taken,
        }
        
        return Response(data)
    
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsHRManager])
def leave_analytics(request):
    """Get leave analytics for HR dashboard"""
    current_year = datetime.now().year
    
    # Leave type usage
    leave_type_usage = LeaveRequest.objects.filter(
        status='APPROVED',
        start_date__year=current_year
    ).values('leave_type__name').annotate(
        total_days=Sum('days_requested')
    ).order_by('-total_days')
    
    # Monthly leave trends
    monthly_trends = []
    for month in range(1, 13):
        month_requests = LeaveRequest.objects.filter(
            status='APPROVED',
            start_date__year=current_year,
            start_date__month=month
        ).aggregate(total=Sum('days_requested'))['total'] or 0
        
        monthly_trends.append({
            'month': month,
            'total_days': float(month_requests)
        })
    
    # Top leave takers
    top_leave_takers = Employee.objects.annotate(
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
        ]
    })

@api_view(['POST'])
@permission_classes([IsHRManager])
def initialize_yearly_balances(request):
    """Initialize leave balances for all employees for a new year"""
    year = request.data.get('year', datetime.now().year)
    
    employees = Employee.objects.filter(status='ACTIVE')
    leave_types = LeaveType.objects.filter(is_active=True)
    
    created_count = 0
    updated_count = 0
    
    for employee in employees:
        for leave_type in leave_types:
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
                # Update existing balances to reflect current policy and usage
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
        'year': year
    })

########################################################################################################


# from rest_framework import generics, status, filters
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.utils import timezone
# from django.db.models import Q, Sum
# from django.shortcuts import get_object_or_404
# from datetime import datetime, timedelta
# from .models import (
#     LeaveType, LeavePolicy, LeaveRequest, LeaveBalance, 
#     LeaveApprovalWorkflow, LeaveEncashment, Notification
# )
# from .serializers import (
#     LeaveTypeSerializer, LeavePolicySerializer, LeaveRequestSerializer,
#     LeaveRequestCreateSerializer, LeaveBalanceSerializer, LeaveApprovalSerializer,
#     LeaveApprovalWorkflowSerializer, LeaveEncashmentSerializer, LeaveSummarySerializer,
#     NotificationSerializer
# )
# from employees.models import Employee
# from utils.permissions import IsEmployee, IsHRManager
# from rest_framework import serializers
# from .services import LeaveNotificationService, LeaveBalanceService

# class LeaveTypeListCreateView(generics.ListCreateAPIView):
#     queryset = LeaveType.objects.filter(is_active=True)
#     serializer_class = LeaveTypeSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_permissions(self):
#         if self.request.method == 'POST':
#             return [IsHRManager()]
#         return [IsAuthenticated()]

# class LeaveTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = LeaveType.objects.all()
#     serializer_class = LeaveTypeSerializer
#     permission_classes = [IsHRManager]

# class LeavePolicyListCreateView(generics.ListCreateAPIView):
#     queryset = LeavePolicy.objects.filter(is_active=True)
#     serializer_class = LeavePolicySerializer
#     permission_classes = [IsHRManager]

# class LeavePolicyDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = LeavePolicy.objects.all()
#     serializer_class = LeavePolicySerializer
#     permission_classes = [IsHRManager]

# class LeaveRequestListCreateView(generics.ListCreateAPIView):
#     permission_classes = [IsEmployee]
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['employee__user__first_name', 'employee__user__last_name', 'leave_type__name']
#     ordering_fields = ['applied_on', 'start_date', 'status']
#     ordering = ['-applied_on']
    
#     def get_serializer_class(self):
#         if self.request.method == 'POST':
#             return LeaveRequestCreateSerializer
#         return LeaveRequestSerializer
    
#     def get_queryset(self):
#         queryset = LeaveRequest.objects.all()
        
#         # If not HR Manager, only show own leave requests
#         if not (hasattr(self.request.user, 'profile') and 
#                 self.request.user.profile.role == 'HR_MANAGER'):
#             try:
#                 employee = Employee.objects.get(user=self.request.user)
#                 queryset = queryset.filter(employee=employee)
#             except Employee.DoesNotExist:
#                 queryset = LeaveRequest.objects.none()
        
#         # Filter by status
#         status_filter = self.request.query_params.get('status')
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
        
#         # Filter by date range
#         start_date = self.request.query_params.get('start_date')
#         end_date = self.request.query_params.get('end_date')
#         if start_date:
#             queryset = queryset.filter(start_date__gte=start_date)
#         if end_date:
#             queryset = queryset.filter(end_date__lte=end_date)
        
#         # Filter by leave type
#         leave_type = self.request.query_params.get('leave_type')
#         if leave_type:
#             queryset = queryset.filter(leave_type_id=leave_type)
        
#         return queryset
    
#     def perform_create(self, serializer):
#         try:
#             employee = Employee.objects.get(user=self.request.user)
            
#             # Check if employee has enough balance
#             leave_type = serializer.validated_data['leave_type']
            
#             # Calculate days first
#             leave_request_temp = LeaveRequest(**serializer.validated_data)
#             leave_request_temp.calculate_days_requested()
#             days_requested = leave_request_temp.days_requested
            
#             # Check leave balance - but skip for HR managers
#             is_hr_manager = hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER'
            
#             if not is_hr_manager:
#                 has_balance, available_days = LeaveBalanceService.check_leave_balance(
#                     employee, leave_type, days_requested
#                 )
                
#                 if not has_balance:
#                     raise serializers.ValidationError(
#                         f"Insufficient leave balance. Available: {available_days} days, Requested: {days_requested} days"
#                     )
            
#             # Save the leave request - DON'T DEDUCT BALANCE HERE
#             leave_request = serializer.save(employee=employee)
            
#             # Send notifications
#             try:
#                 LeaveNotificationService.notify_leave_request_submitted(leave_request)
#             except Exception as e:
#                 import logging
#                 logger = logging.getLogger(__name__)
#                 logger.error(f"Failed to send notification for leave request {leave_request.id}: {e}")
            
#         except Employee.DoesNotExist:
#             raise serializers.ValidationError("Employee profile not found")

# class LeaveRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = LeaveRequest.objects.all()
#     serializer_class = LeaveRequestSerializer
#     permission_classes = [IsEmployee]
    
#     def get_object(self):
#         obj = super().get_object()
#         # Allow access to own requests or if HR Manager
#         if not (hasattr(self.request.user, 'profile') and 
#                 self.request.user.profile.role == 'HR_MANAGER'):
#             if obj.employee.user != self.request.user:
#                 self.permission_denied(self.request, "Cannot access other employee's leave requests")
#         return obj
    
#     def destroy(self, request, *args, **kwargs):
#         """Delete leave request with balance restoration"""
#         leave_request = self.get_object()
        
#         # Check permissions for deletion
#         is_hr = hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER'
#         is_owner = leave_request.employee.user == request.user
        
#         if not (is_hr or is_owner):
#             return Response({'error': 'Not authorized to delete this request'}, 
#                           status=status.HTTP_403_FORBIDDEN)
        
#         # For employees, check if they can delete based on status
#         if not is_hr and is_owner:
#             if leave_request.status not in ['APPROVED', 'REJECTED', 'CANCELLED']:
#                 return Response({'error': 'You can only delete approved, rejected, or cancelled requests'}, 
#                               status=status.HTTP_400_BAD_REQUEST)
        
#         # If deleting an approved request, restore the balance
#         if leave_request.status == 'APPROVED':
#             try:
#                 balance = LeaveBalance.objects.get(
#                     employee=leave_request.employee,
#                     leave_type=leave_request.leave_type,
#                     year=leave_request.start_date.year
#                 )
                
#                 # Restore the balance
#                 balance.used_days -= leave_request.days_requested
#                 if balance.used_days < 0:
#                     balance.used_days = 0  # Don't go negative
#                 balance.save()  # remaining_days auto-calculates
                
#                 import logging
#                 logger = logging.getLogger(__name__)
#                 logger.info(f"✅ Balance restored on deletion: {leave_request.employee.user.get_full_name()} - {leave_request.leave_type.name} - Used: {balance.used_days}")
                
#             except LeaveBalance.DoesNotExist:
#                 pass  # Continue with deletion even if no balance record
        
#         # Delete the request
#         leave_request.delete()
        
#         return Response({
#             'message': 'Leave request deleted successfully',
#             'balance_restored': leave_request.status == 'APPROVED'
#         }, status=status.HTTP_200_OK)

# @api_view(['POST'])
# @permission_classes([IsEmployee])
# def approve_leave_request(request, request_id):
#     """Approve leave request - Balance deduction handled by signals"""
#     try:
#         leave_request = LeaveRequest.objects.get(id=request_id)
        
#         # Check authorization
#         can_approve = (
#             hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER'
#         ) or (
#             leave_request.employee.manager and 
#             leave_request.employee.manager.user == request.user
#         )
        
#         if not can_approve:
#             return Response({'error': 'Not authorized to approve this request'}, 
#                           status=status.HTTP_403_FORBIDDEN)
        
#         if leave_request.status != 'PENDING':
#             return Response({'error': 'Only pending requests can be approved'}, 
#                           status=status.HTTP_400_BAD_REQUEST)
        
#         # Update leave request - DON'T deduct balance here (signals will handle it)
#         leave_request.status = 'APPROVED'
#         leave_request.approved_by = request.user
#         leave_request.approved_on = timezone.now()
#         leave_request.manager_comments = request.data.get('comments', '')
#         leave_request.save()  # This will trigger signals
        
#         return Response({'message': 'Leave request approved successfully'})
        
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, 
#                       status=status.HTTP_404_NOT_FOUND)
# @api_view(['POST'])
# @permission_classes([IsEmployee])
# def reject_leave_request(request, request_id):
#     """Reject leave request"""
#     try:
#         leave_request = LeaveRequest.objects.get(id=request_id)
        
#         # Check authorization
#         can_reject = (
#             hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER'
#         ) or (
#             leave_request.employee.manager and 
#             leave_request.employee.manager.user == request.user
#         )
        
#         if not can_reject:
#             return Response({'error': 'Not authorized to reject this request'}, 
#                           status=status.HTTP_403_FORBIDDEN)
        
#         if leave_request.status != 'PENDING':
#             return Response({'error': 'Only pending requests can be rejected'}, 
#                           status=status.HTTP_400_BAD_REQUEST)
        
#         leave_request.status = 'REJECTED'
#         leave_request.rejection_reason = request.data.get('comments', '')
#         leave_request.manager_comments = request.data.get('comments', '')
#         leave_request.save()
        
#         return Response({'message': 'Leave request rejected'})
        
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, 
#                       status=status.HTTP_404_NOT_FOUND)

# @api_view(['POST'])
# @permission_classes([IsEmployee])
# def cancel_leave_request(request, request_id):
#     """Cancel own leave request"""
#     try:
#         employee = Employee.objects.get(user=request.user)
#         leave_request = LeaveRequest.objects.get(id=request_id, employee=employee)
        
#         if leave_request.status not in ['PENDING', 'APPROVED']:
#             return Response(
#                 {'error': 'Only pending or approved requests can be cancelled'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         leave_request.status = 'CANCELLED'
#         leave_request.save()
        
#         return Response({'message': 'Leave request cancelled successfully'})
        
#     except Employee.DoesNotExist:
#         return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

# class LeaveBalanceListView(generics.ListAPIView):
#     serializer_class = LeaveBalanceSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         year = int(self.request.query_params.get('year', datetime.now().year))
        
#         # HR Managers can view all, others only their own
#         if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER':
#             employee_id = self.request.query_params.get('employee_id')
#             if employee_id:
#                 try:
#                     employee = Employee.objects.get(id=employee_id)
#                     # Initialize balances for this employee
#                     self._initialize_employee_balances(employee, year)
#                     queryset = LeaveBalance.objects.filter(employee_id=employee_id, year=year)
#                 except Employee.DoesNotExist:
#                     queryset = LeaveBalance.objects.none()
#             else:
#                 queryset = LeaveBalance.objects.filter(year=year)
#         else:
#             try:
#                 employee = Employee.objects.get(user=self.request.user)
#                 # Initialize balances for this employee
#                 self._initialize_employee_balances(employee, year)
#                 queryset = LeaveBalance.objects.filter(employee=employee, year=year)
#             except Employee.DoesNotExist:
#                 queryset = LeaveBalance.objects.none()
        
#         return queryset.order_by('leave_type__name')
    
#     def _initialize_employee_balances(self, employee, year):
#         """Initialize missing leave balances for an employee"""
#         leave_types = LeaveType.objects.filter(is_active=True)
        
#         for leave_type in leave_types:
#             # Check if balance exists
#             balance_exists = LeaveBalance.objects.filter(
#                 employee=employee,
#                 leave_type=leave_type,
#                 year=year
#             ).exists()
            
#             if not balance_exists:
#                 # Calculate used days from existing approved requests
#                 approved_days = LeaveRequest.objects.filter(
#                     employee=employee,
#                     leave_type=leave_type,
#                     status='APPROVED',
#                     start_date__year=year
#                 ).aggregate(total=Sum('days_requested'))['total'] or 0
                
#                 used_days = float(approved_days)
#                 total_days = float(leave_type.days_allowed_per_year)
#                 remaining_days = total_days - used_days
                
#                 # Create the balance record
#                 LeaveBalance.objects.create(
#                     employee=employee,
#                     leave_type=leave_type,
#                     year=year,
#                     total_days=total_days,
#                     used_days=used_days,
#                     remaining_days=remaining_days
#                 )

# # Notification Views
# class NotificationListView(generics.ListAPIView):
#     serializer_class = NotificationSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         return Notification.objects.filter(recipient=self.request.user)

# @api_view(['PATCH'])
# @permission_classes([IsEmployee])
# def mark_notification_read(request, pk):
#     try:
#         notification = Notification.objects.get(pk=pk, recipient=request.user)
#         notification.is_read = True
#         notification.save()
#         return Response({'message': 'Notification marked as read'})
#     except Notification.DoesNotExist:
#         return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

# @api_view(['GET'])
# @permission_classes([IsEmployee])
# def leave_summary(request):
#     """Get comprehensive leave summary for employee"""
#     try:
#         employee = Employee.objects.get(user=request.user)
#         current_year = datetime.now().year
        
#         # Initialize balances first
#         leave_types = LeaveType.objects.filter(is_active=True)
#         for leave_type in leave_types:
#             LeaveBalanceService.get_or_create_balance(employee, leave_type, current_year)
        
#         # Get leave balances
#         leave_balances = LeaveBalance.objects.filter(employee=employee, year=current_year)
        
#         # Get recent leave requests (last 10)
#         recent_requests = LeaveRequest.objects.filter(employee=employee)[:10]
        
#         # Get counts
#         pending_count = LeaveRequest.objects.filter(
#             employee=employee, 
#             status='PENDING'
#         ).count()
        
#         approved_count = LeaveRequest.objects.filter(
#             employee=employee, 
#             status='APPROVED',
#             start_date__year=current_year
#         ).count()
        
#         # Calculate total days taken this year
#         total_days_taken = LeaveRequest.objects.filter(
#             employee=employee,
#             status='APPROVED',
#             start_date__year=current_year
#         ).aggregate(total=Sum('days_requested'))['total'] or 0
        
#         data = {
#             'leave_balances': LeaveBalanceSerializer(leave_balances, many=True).data,
#             'recent_requests': LeaveRequestSerializer(recent_requests, many=True).data,
#             'pending_requests_count': pending_count,
#             'approved_requests_count': approved_count,
#             'total_days_taken': total_days_taken,
#         }
        
#         return Response(data)
    
#     except Employee.DoesNotExist:
#         return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

# @api_view(['GET'])
# @permission_classes([IsHRManager])
# def leave_analytics(request):
#     """Get leave analytics for HR dashboard"""
#     current_year = datetime.now().year
    
#     # Leave type usage
#     leave_type_usage = LeaveRequest.objects.filter(
#         status='APPROVED',
#         start_date__year=current_year
#     ).values('leave_type__name').annotate(
#         total_days=Sum('days_requested')
#     ).order_by('-total_days')
    
#     # Monthly leave trends
#     monthly_trends = []
#     for month in range(1, 13):
#         month_requests = LeaveRequest.objects.filter(
#             status='APPROVED',
#             start_date__year=current_year,
#             start_date__month=month
#         ).aggregate(total=Sum('days_requested'))['total'] or 0
        
#         monthly_trends.append({
#             'month': month,
#             'total_days': float(month_requests)
#         })
    
#     # Top leave takers
#     top_leave_takers = Employee.objects.annotate(
#         total_leaves=Sum(
#             'leave_requests__days_requested',
#             filter=Q(
#                 leave_requests__status='APPROVED',
#                 leave_requests__start_date__year=current_year
#             )
#         )
#     ).exclude(total_leaves__isnull=True).order_by('-total_leaves')[:10]
    
#     return Response({
#         'leave_type_usage': leave_type_usage,
#         'monthly_trends': monthly_trends,
#         'top_leave_takers': [
#             {
#                 'employee_name': f"{emp.user.first_name} {emp.user.last_name}",
#                 'employee_id': emp.employee_id,
#                 'total_days': float(emp.total_leaves or 0)
#             } for emp in top_leave_takers
#         ]
#     })

# @api_view(['POST'])
# @permission_classes([IsHRManager])
# def initialize_yearly_balances(request):
#     """Initialize leave balances for all employees for a new year"""
#     year = request.data.get('year', datetime.now().year)
    
#     employees = Employee.objects.filter(status='ACTIVE')
#     leave_types = LeaveType.objects.filter(is_active=True)
    
#     created_count = 0
    
#     for employee in employees:
#         for leave_type in leave_types:
#             # Calculate used days from existing approved requests
#             approved_days = LeaveRequest.objects.filter(
#                 employee=employee,
#                 leave_type=leave_type,
#                 status='APPROVED',
#                 start_date__year=year
#             ).aggregate(total=Sum('days_requested'))['total'] or 0
            
#             used_days = float(approved_days)
#             total_days = float(leave_type.days_allowed_per_year)
#             remaining_days = total_days - used_days
            
#             balance, created = LeaveBalance.objects.get_or_create(
#                 employee=employee,
#                 leave_type=leave_type,
#                 year=year,
#                 defaults={
#                     'total_days': total_days,
#                     'used_days': used_days,
#                     'remaining_days': remaining_days
#                 }
#             )
#             if created:
#                 created_count += 1

# Add this new endpoint 
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
        
        # Return all balances (updated)
        balances = LeaveBalance.objects.filter(employee=employee, year=year).order_by('leave_type__name')
        serialized_balances = LeaveBalanceSerializer(balances, many=True).data
        
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

# from rest_framework import generics, status, filters
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.utils import timezone
# from django.db.models import Q, Sum
# from django.shortcuts import get_object_or_404
# from datetime import datetime, timedelta
# from .models import (
#     LeaveType, LeavePolicy, LeaveRequest, LeaveBalance, 
#     LeaveApprovalWorkflow, LeaveEncashment, Notification
# )
# from .serializers import (
#     LeaveTypeSerializer, LeavePolicySerializer, LeaveRequestSerializer,
#     LeaveRequestCreateSerializer, LeaveBalanceSerializer, LeaveApprovalSerializer,
#     LeaveApprovalWorkflowSerializer, LeaveEncashmentSerializer, LeaveSummarySerializer,
#     NotificationSerializer
# )
# from employees.models import Employee
# from utils.permissions import IsEmployee, IsHRManager
# from rest_framework import serializers
# from .services import LeaveNotificationService, LeaveBalanceService

# class LeaveTypeListCreateView(generics.ListCreateAPIView):
#     queryset = LeaveType.objects.filter(is_active=True)
#     serializer_class = LeaveTypeSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_permissions(self):
#         if self.request.method == 'POST':
#             return [IsHRManager()]
#         return [IsAuthenticated()]

# class LeaveTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = LeaveType.objects.all()
#     serializer_class = LeaveTypeSerializer
#     permission_classes = [IsHRManager]

# class LeavePolicyListCreateView(generics.ListCreateAPIView):
#     queryset = LeavePolicy.objects.filter(is_active=True)
#     serializer_class = LeavePolicySerializer
#     permission_classes = [IsHRManager]

# class LeavePolicyDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = LeavePolicy.objects.all()
#     serializer_class = LeavePolicySerializer
#     permission_classes = [IsHRManager]

# class LeaveRequestListCreateView(generics.ListCreateAPIView):
#     permission_classes = [IsEmployee]
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['employee__user__first_name', 'employee__user__last_name', 'leave_type__name']
#     ordering_fields = ['applied_on', 'start_date', 'status']
#     ordering = ['-applied_on']
    
#     def get_serializer_class(self):
#         if self.request.method == 'POST':
#             return LeaveRequestCreateSerializer
#         return LeaveRequestSerializer
    
#     def get_queryset(self):
#         queryset = LeaveRequest.objects.all()
        
#         # If not HR Manager, only show own leave requests
#         if not (hasattr(self.request.user, 'profile') and 
#                 self.request.user.profile.role == 'HR_MANAGER'):
#             try:
#                 employee = Employee.objects.get(user=self.request.user)
#                 queryset = queryset.filter(employee=employee)
#             except Employee.DoesNotExist:
#                 queryset = LeaveRequest.objects.none()
        
#         # Filter by status
#         status_filter = self.request.query_params.get('status')
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
        
#         # Filter by date range
#         start_date = self.request.query_params.get('start_date')
#         end_date = self.request.query_params.get('end_date')
#         if start_date:
#             queryset = queryset.filter(start_date__gte=start_date)
#         if end_date:
#             queryset = queryset.filter(end_date__lte=end_date)
        
#         # Filter by leave type
#         leave_type = self.request.query_params.get('leave_type')
#         if leave_type:
#             queryset = queryset.filter(leave_type_id=leave_type)
        
#         return queryset
    
#     def perform_create(self, serializer):
#         try:
#             employee = Employee.objects.get(user=self.request.user)
            
#             # Check if employee has enough balance
#             leave_type = serializer.validated_data['leave_type']
            
#             # Calculate days first
#             leave_request_temp = LeaveRequest(**serializer.validated_data)
#             leave_request_temp.calculate_days_requested()
#             days_requested = leave_request_temp.days_requested
            
#             # Check leave balance - but skip for HR managers
#             is_hr_manager = hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER'
            
#             if not is_hr_manager:
#                 has_balance, available_days = LeaveBalanceService.check_leave_balance(
#                     employee, leave_type, days_requested
#                 )
                
#                 if not has_balance:
#                     raise serializers.ValidationError(
#                         f"Insufficient leave balance. Available: {available_days} days, Requested: {days_requested} days"
#                     )
            
#             # Save the leave request - DON'T DEDUCT BALANCE HERE
#             leave_request = serializer.save(employee=employee)
            
#             # Send notifications
#             try:
#                 LeaveNotificationService.notify_leave_request_submitted(leave_request)
#             except Exception as e:
#                 import logging
#                 logger = logging.getLogger(__name__)
#                 logger.error(f"Failed to send notification for leave request {leave_request.id}: {e}")
            
#         except Employee.DoesNotExist:
#             raise serializers.ValidationError("Employee profile not found")

# class LeaveRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = LeaveRequest.objects.all()
#     serializer_class = LeaveRequestSerializer
#     permission_classes = [IsEmployee]
    
#     def get_object(self):
#         obj = super().get_object()
#         # Allow access to own requests or if HR Manager
#         if not (hasattr(self.request.user, 'profile') and 
#                 self.request.user.profile.role == 'HR_MANAGER'):
#             if obj.employee.user != self.request.user:
#                 self.permission_denied(self.request, "Cannot access other employee's leave requests")
#         return obj

# # Replace your approve_leave_request function with this simple version:

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def approve_leave_request(request, request_id):
#     """Approve leave request"""
#     try:
#         leave_request = LeaveRequest.objects.get(id=request_id)
        
#         # Check authorization
#         can_approve = (
#             hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER'
#         ) or (
#             leave_request.employee.manager and 
#             leave_request.employee.manager.user == request.user
#         )
        
#         if not can_approve:
#             return Response({'error': 'Not authorized to approve this request'}, 
#                           status=status.HTTP_403_FORBIDDEN)
        
#         if leave_request.status != 'PENDING':
#             return Response({'error': 'Only pending requests can be approved'}, 
#                           status=status.HTTP_400_BAD_REQUEST)
        
#         # Update leave request status
#         leave_request.status = 'APPROVED'
#         leave_request.approved_by = request.user
#         leave_request.approved_on = timezone.now()
#         leave_request.manager_comments = request.data.get('comments', '')
#         leave_request.save()
        
#         # *** SIMPLE BALANCE UPDATE - JUST UPDATE USED_DAYS ***
#         try:
#             balance = LeaveBalance.objects.get(
#                 employee=leave_request.employee,
#                 leave_type=leave_request.leave_type,
#                 year=leave_request.start_date.year
#             )
            
#             # Simply add the requested days to used_days
#             balance.used_days += leave_request.days_requested
#             balance.save()  # remaining_days will auto-calculate in the model's save() method
            
#             print(f"✅ Updated balance: used_days = {balance.used_days}, remaining_days = {balance.remaining_days}")
            
#         except LeaveBalance.DoesNotExist:
#             print(f"❌ No balance record found for {leave_request.employee.user.get_full_name()}")
        
#         return Response({'message': 'Leave request approved successfully'})
        
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, 
#                       status=status.HTTP_404_NOT_FOUND)

# # @api_view(['POST'])
# # @permission_classes([IsAuthenticated])
# # def approve_leave_request(request, request_id):
# #     """Approve leave request"""
# #     try:
# #         leave_request = LeaveRequest.objects.get(id=request_id)
        
# #         # Check authorization
# #         can_approve = (
# #             hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER'
# #         ) or (
# #             leave_request.employee.manager and 
# #             leave_request.employee.manager.user == request.user
# #         )
        
# #         if not can_approve:
# #             return Response({'error': 'Not authorized to approve this request'}, 
# #                           status=status.HTTP_403_FORBIDDEN)
        
# #         if leave_request.status != 'PENDING':
# #             return Response({'error': 'Only pending requests can be approved'}, 
# #                           status=status.HTTP_400_BAD_REQUEST)
        
# #         # Update leave request
# #         leave_request.status = 'APPROVED'
# #         leave_request.approved_by = request.user
# #         leave_request.approved_on = timezone.now()
# #         leave_request.manager_comments = request.data.get('comments', '')
# #         leave_request.save()
        
# #         return Response({'message': 'Leave request approved successfully'})
        
# #     except LeaveRequest.DoesNotExist:
# #         return Response({'error': 'Leave request not found'}, 
# #                       status=status.HTTP_404_NOT_FOUND)

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def reject_leave_request(request, request_id):
#     """Reject leave request"""
#     try:
#         leave_request = LeaveRequest.objects.get(id=request_id)
        
#         # Check authorization
#         can_reject = (
#             hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER'
#         ) or (
#             leave_request.employee.manager and 
#             leave_request.employee.manager.user == request.user
#         )
        
#         if not can_reject:
#             return Response({'error': 'Not authorized to reject this request'}, 
#                           status=status.HTTP_403_FORBIDDEN)
        
#         if leave_request.status != 'PENDING':
#             return Response({'error': 'Only pending requests can be rejected'}, 
#                           status=status.HTTP_400_BAD_REQUEST)
        
#         leave_request.status = 'REJECTED'
#         leave_request.rejection_reason = request.data.get('comments', '')
#         leave_request.manager_comments = request.data.get('comments', '')
#         leave_request.save()
        
#         return Response({'message': 'Leave request rejected'})
        
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, 
#                       status=status.HTTP_404_NOT_FOUND)

# # @api_view(['POST'])
# # @permission_classes([IsEmployee])
# # def cancel_leave_request(request, request_id):
# #     """Cancel own leave request"""
# #     try:
# #         employee = Employee.objects.get(user=request.user)
# #         leave_request = LeaveRequest.objects.get(id=request_id, employee=employee)
        
# #         if leave_request.status not in ['PENDING', 'APPROVED']:
# #             return Response(
# #                 {'error': 'Only pending or approved requests can be cancelled'}, 
# #                 status=status.HTTP_400_BAD_REQUEST
# #             )
        
# #         leave_request.status = 'CANCELLED'
# #         leave_request.save()
        
# #         return Response({'message': 'Leave request cancelled successfully'})
        
# #     except Employee.DoesNotExist:
# #         return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
# #     except LeaveRequest.DoesNotExist:
# #         return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)


# @api_view(['POST'])
# @permission_classes([IsEmployee])
# def cancel_leave_request(request, request_id):
#     """Cancel own leave request"""
#     try:
#         employee = Employee.objects.get(user=request.user)
#         leave_request = LeaveRequest.objects.get(id=request_id, employee=employee)
        
#         if leave_request.status not in ['PENDING', 'APPROVED']:
#             return Response(
#                 {'error': 'Only pending or approved requests can be cancelled'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # If it was approved, restore the balance
#         if leave_request.status == 'APPROVED':
#             try:
#                 balance = LeaveBalance.objects.get(
#                     employee=leave_request.employee,
#                     leave_type=leave_request.leave_type,
#                     year=leave_request.start_date.year
#                 )
                
#                 # Simply subtract the days from used_days
#                 balance.used_days -= leave_request.days_requested
#                 balance.save()  # remaining_days will auto-calculate
                
#                 print(f"✅ Restored balance: used_days = {balance.used_days}, remaining_days = {balance.remaining_days}")
                
#             except LeaveBalance.DoesNotExist:
#                 print(f"❌ No balance record found for restoration")
        
#         # Update status
#         leave_request.status = 'CANCELLED'
#         leave_request.save()
        
#         return Response({'message': 'Leave request cancelled successfully'})
        
#     except Employee.DoesNotExist:
#         return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

# class LeaveBalanceListView(generics.ListAPIView):
#     serializer_class = LeaveBalanceSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         year = int(self.request.query_params.get('year', datetime.now().year))
        
#         # HR Managers can view all, others only their own
#         if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER':
#             employee_id = self.request.query_params.get('employee_id')
#             if employee_id:
#                 try:
#                     employee = Employee.objects.get(id=employee_id)
#                     # Initialize balances for this employee
#                     self._initialize_employee_balances(employee, year)
#                     queryset = LeaveBalance.objects.filter(employee_id=employee_id, year=year)
#                 except Employee.DoesNotExist:
#                     queryset = LeaveBalance.objects.none()
#             else:
#                 queryset = LeaveBalance.objects.filter(year=year)
#         else:
#             try:
#                 employee = Employee.objects.get(user=self.request.user)
#                 # Initialize balances for this employee
#                 self._initialize_employee_balances(employee, year)
#                 queryset = LeaveBalance.objects.filter(employee=employee, year=year)
#             except Employee.DoesNotExist:
#                 queryset = LeaveBalance.objects.none()
        
#         return queryset.order_by('leave_type__name')
    
#     def _initialize_employee_balances(self, employee, year):
#         """Initialize missing leave balances for an employee"""
#         leave_types = LeaveType.objects.filter(is_active=True)
        
#         for leave_type in leave_types:
#             # Check if balance exists
#             balance_exists = LeaveBalance.objects.filter(
#                 employee=employee,
#                 leave_type=leave_type,
#                 year=year
#             ).exists()
            
#             if not balance_exists:
#                 # Calculate used days from existing approved requests
#                 approved_days = LeaveRequest.objects.filter(
#                     employee=employee,
#                     leave_type=leave_type,
#                     status='APPROVED',
#                     start_date__year=year
#                 ).aggregate(total=Sum('days_requested'))['total'] or 0
                
#                 used_days = float(approved_days)
#                 total_days = float(leave_type.days_allowed_per_year)
#                 remaining_days = total_days - used_days
                
#                 # Create the balance record
#                 LeaveBalance.objects.create(
#                     employee=employee,
#                     leave_type=leave_type,
#                     year=year,
#                     total_days=total_days,
#                     used_days=used_days,
#                     remaining_days=remaining_days
#                 )

# # Notification Views
# class NotificationListView(generics.ListAPIView):
#     serializer_class = NotificationSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return Notification.objects.filter(recipient=self.request.user)

# @api_view(['PATCH'])
# @permission_classes([IsAuthenticated])
# def mark_notification_read(request, pk):
#     try:
#         notification = Notification.objects.get(pk=pk, recipient=request.user)
#         notification.is_read = True
#         notification.save()
#         return Response({'message': 'Notification marked as read'})
#     except Notification.DoesNotExist:
#         return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

# @api_view(['GET'])
# @permission_classes([IsEmployee])
# def leave_summary(request):
#     """Get comprehensive leave summary for employee"""
#     try:
#         employee = Employee.objects.get(user=request.user)
#         current_year = datetime.now().year
        
#         # Initialize balances first
#         leave_types = LeaveType.objects.filter(is_active=True)
#         for leave_type in leave_types:
#             LeaveBalanceService.get_or_create_balance(employee, leave_type, current_year)
        
#         # Get leave balances
#         leave_balances = LeaveBalance.objects.filter(employee=employee, year=current_year)
        
#         # Get recent leave requests (last 10)
#         recent_requests = LeaveRequest.objects.filter(employee=employee)[:10]
        
#         # Get counts
#         pending_count = LeaveRequest.objects.filter(
#             employee=employee, 
#             status='PENDING'
#         ).count()
        
#         approved_count = LeaveRequest.objects.filter(
#             employee=employee, 
#             status='APPROVED',
#             start_date__year=current_year
#         ).count()
        
#         # Calculate total days taken this year
#         total_days_taken = LeaveRequest.objects.filter(
#             employee=employee,
#             status='APPROVED',
#             start_date__year=current_year
#         ).aggregate(total=Sum('days_requested'))['total'] or 0
        
#         data = {
#             'leave_balances': LeaveBalanceSerializer(leave_balances, many=True).data,
#             'recent_requests': LeaveRequestSerializer(recent_requests, many=True).data,
#             'pending_requests_count': pending_count,
#             'approved_requests_count': approved_count,
#             'total_days_taken': total_days_taken,
#         }
        
#         return Response(data)
    
#     except Employee.DoesNotExist:
#         return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

# @api_view(['GET'])
# @permission_classes([IsHRManager])
# def leave_analytics(request):
#     """Get leave analytics for HR dashboard"""
#     current_year = datetime.now().year
    
#     # Leave type usage
#     leave_type_usage = LeaveRequest.objects.filter(
#         status='APPROVED',
#         start_date__year=current_year
#     ).values('leave_type__name').annotate(
#         total_days=Sum('days_requested')
#     ).order_by('-total_days')
    
#     # Monthly leave trends
#     monthly_trends = []
#     for month in range(1, 13):
#         month_requests = LeaveRequest.objects.filter(
#             status='APPROVED',
#             start_date__year=current_year,
#             start_date__month=month
#         ).aggregate(total=Sum('days_requested'))['total'] or 0
        
#         monthly_trends.append({
#             'month': month,
#             'total_days': float(month_requests)
#         })
    
#     # Top leave takers
#     top_leave_takers = Employee.objects.annotate(
#         total_leaves=Sum(
#             'leave_requests__days_requested',
#             filter=Q(
#                 leave_requests__status='APPROVED',
#                 leave_requests__start_date__year=current_year
#             )
#         )
#     ).exclude(total_leaves__isnull=True).order_by('-total_leaves')[:10]
    
#     return Response({
#         'leave_type_usage': leave_type_usage,
#         'monthly_trends': monthly_trends,
#         'top_leave_takers': [
#             {
#                 'employee_name': f"{emp.user.first_name} {emp.user.last_name}",
#                 'employee_id': emp.employee_id,
#                 'total_days': float(emp.total_leaves or 0)
#             } for emp in top_leave_takers
#         ]
#     })

# @api_view(['POST'])
# @permission_classes([IsHRManager])
# def initialize_yearly_balances(request):
#     """Initialize leave balances for all employees for a new year"""
#     year = request.data.get('year', datetime.now().year)
    
#     employees = Employee.objects.filter(status='ACTIVE')
#     leave_types = LeaveType.objects.filter(is_active=True)
    
#     created_count = 0
    
#     for employee in employees:
#         for leave_type in leave_types:
#             # Calculate used days from existing approved requests
#             approved_days = LeaveRequest.objects.filter(
#                 employee=employee,
#                 leave_type=leave_type,
#                 status='APPROVED',
#                 start_date__year=year
#             ).aggregate(total=Sum('days_requested'))['total'] or 0
            
#             used_days = float(approved_days)
#             total_days = float(leave_type.days_allowed_per_year)
#             remaining_days = total_days - used_days
            
#             balance, created = LeaveBalance.objects.get_or_create(
#                 employee=employee,
#                 leave_type=leave_type,
#                 year=year,
#                 defaults={
#                     'total_days': total_days,
#                     'used_days': used_days,
#                     'remaining_days': remaining_days
#                 }
#             )
#             if created:
#                 created_count += 1

# # Add this new endpoint 
# @api_view(['POST'])
# @permission_classes([IsEmployee])
# def initialize_my_balances(request):
#     """Initialize all leave balances for current employee"""
#     try:
#         employee = Employee.objects.get(user=request.user)
#         year = request.data.get('year', datetime.now().year)
        
#         leave_types = LeaveType.objects.filter(is_active=True)
#         created_count = 0
        
#         for leave_type in leave_types:
#             # Use the service to get or create balance
#             balance = LeaveBalanceService.get_or_create_balance(employee, leave_type, year)
#             if balance:
#                 created_count += 1
        
#         # Return all balances
#         balances = LeaveBalance.objects.filter(employee=employee, year=year).order_by('leave_type__name')
#         serialized_balances = LeaveBalanceSerializer(balances, many=True).data
        
#         return Response({
#             'message': f'Initialized {len(serialized_balances)} leave balance records',
#             'balances': serialized_balances
#         })
        
#     except Employee.DoesNotExist:
#         return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

# # Add this debug endpoint at the end of views.py (remove after testing)
# @api_view(['POST'])
# @permission_classes([IsHRManager])
# def test_balance_update(request, request_id):
#     """Debug endpoint to test balance update for a specific leave request"""
#     try:
#         leave_request = LeaveRequest.objects.get(id=request_id)
        
#         if leave_request.status == 'APPROVED':
#             # Test deduction
#             balance_before = LeaveBalance.objects.get(
#                 employee=leave_request.employee,
#                 leave_type=leave_request.leave_type,
#                 year=leave_request.start_date.year
#             )
            
#             logger.info(f"Before update - Used: {balance_before.used_days}, Remaining: {balance_before.remaining_days}")
            
#             # Manually trigger balance update
#             updated_balance = LeaveBalanceService.deduct_leave_balance(leave_request)
            
#             return Response({
#                 'message': 'Balance updated successfully',
#                 'before': {
#                     'used_days': float(balance_before.used_days),
#                     'remaining_days': float(balance_before.remaining_days)
#                 },
#                 'after': {
#                     'used_days': updated_balance.used_days,
#                     'remaining_days': updated_balance.remaining_days
#                 },
#                 'leave_request': {
#                     'id': leave_request.id,
#                     'days_requested': leave_request.days_requested,
#                     'employee': leave_request.employee.user.get_full_name(),
#                     'leave_type': leave_request.leave_type.name
#                 }
#             })
#         else:
#             return Response({'error': f'Leave request status is {leave_request.status}, not APPROVED'})
            
#     except LeaveRequest.DoesNotExist:
#         return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)