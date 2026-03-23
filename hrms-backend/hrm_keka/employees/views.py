# employees/views.py
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import date, timedelta
from django.db.models import Q
from .models import Employee, Department, OnboardingTask, EmployeeBirthday, Festival
from .serializers import (
    EmployeeSerializer, DepartmentSerializer, OnboardingTaskSerializer,
    EmployeeBirthdaySerializer, FestivalSerializer
)
from authentication.models import User, UserProfile
from utils.permissions import IsHRManager, IsEmployee, IsManager, IsHRorAdmin
from utils.roles import (
    has_executive_access,
    has_management_access,
    has_lead_access,
    can_manage_hr,
    get_permission_level,
    PERMISSION_LEVELS,
    ROLE_CATEGORIES
)

import logging

logger = logging.getLogger(__name__)

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


@api_view(['GET'])
@permission_classes([IsEmployee])
def get_employee_profile_data(request):
    """
    Get comprehensive employee profile data including team, manager info, and peer colleagues
    """
    try:
        user = request.user
        
        # Get current user's employee data
        try:
            current_employee = Employee.objects.select_related(
                'user', 'department', 'manager', 'manager__user'
            ).get(user=user)
        except Employee.DoesNotExist:
            return Response({
                'error': 'Employee record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Get peer colleagues based on role
        peer_colleagues = []
        
        if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            # Executives and HR see all active employees except self
            peer_colleagues = Employee.objects.select_related(
                'user', 'department'
            ).filter(
                status='ACTIVE'
            ).exclude(
                id=current_employee.id
            )
            logger.debug("Employee profile peers: senior access")
            
        elif has_management_access(user_role) or has_lead_access(user_role):
            # Managers and Team Leads see their team
            peer_colleagues = Employee.objects.select_related(
                'user', 'department'
            ).filter(
                manager=current_employee,
                status='ACTIVE'
            )
            logger.debug("Employee profile peers: manager/team lead")
            
        elif current_employee.manager:
            # Regular employees see peers (same manager)
            peer_colleagues = Employee.objects.select_related(
                'user', 'department'
            ).filter(
                manager=current_employee.manager,
                status='ACTIVE'
            ).exclude(
                id=current_employee.id
            )
            logger.debug("Employee profile peers: same manager")
        
        # Serialize data
        employee_data = EmployeeSerializer(current_employee, context={'request': request}).data
        peers_data = EmployeeSerializer(peer_colleagues, many=True, context={'request': request}).data
        
        # Get manager data if exists
        manager_data = None
        if current_employee.manager:
            manager_data = EmployeeSerializer(current_employee.manager, context={'request': request}).data
        
        response_data = {
            'employee': employee_data,
            'peers': peers_data,
            'manager': manager_data,
            'user_role': user_role,
            'permission_level': permission_level
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error("Failed to fetch employee profile data user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsEmployee])
def get_manager_profile_data(request):
    """
    Get manager profile data - same structure as employee but 'peers' contains direct reports
    """
    try:
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check if user has management access
        if not (has_management_access(user_role) or has_lead_access(user_role) or permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']):
            return Response({
                'error': 'Only managers and team leads can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get current user's employee data
        try:
            current_manager = Employee.objects.select_related(
                'user', 'department', 'manager', 'manager__user'
            ).get(user=user)
        except Employee.DoesNotExist:
            return Response({
                'error': 'Manager record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # For managers, 'peers' will be their direct reports (team members)
        direct_reports = Employee.objects.select_related(
            'user', 'department'
        ).filter(
            manager=current_manager, 
            status='ACTIVE'
        )
        
        # Serialize data
        employee_data = EmployeeSerializer(current_manager, context={'request': request}).data
        peers_data = EmployeeSerializer(direct_reports, many=True, context={'request': request}).data
        
        # Get manager data if exists
        manager_data = None
        if current_manager.manager:
            manager_data = EmployeeSerializer(current_manager.manager, context={'request': request}).data
        
        response_data = {
            'employee': employee_data,
            'peers': peers_data,  # For managers, this contains direct reports
            'manager': manager_data,
            'team_count': direct_reports.count(),
            'user_role': user_role
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error("Failed to fetch manager profile data user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsEmployee])
def get_all_managers_with_teams(request):
    """
    Get all managers and their team counts
    Available to HR, Executives, and Senior Leaders
    """
    try:
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check if user has access to view all managers
        has_access = (
            permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or
            can_manage_hr(user_role) or
            user.has_perm('employees.view_employee')
        )
        
        if not has_access:
            return Response({
                'error': 'Only HR and Senior Leaders can view all managers'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all employees who have subordinates (are managers)
        managers = Employee.objects.filter(
            status='ACTIVE'
        ).select_related('user', 'department')
        
        managers_with_teams = []
        
        for manager in managers:
            # Count team members for each potential manager
            team_count = Employee.objects.filter(
                manager=manager,
                status='ACTIVE'
            ).count()
            
            if team_count > 0:  # Only include actual managers (who have team members)
                manager_data = EmployeeSerializer(manager, context={'request': request}).data
                manager_data['team_count'] = team_count
                managers_with_teams.append(manager_data)
        
        logger.debug("Found %s managers with teams", len(managers_with_teams))
        
        return Response({
            'managers': managers_with_teams,
            'count': len(managers_with_teams)
        })
        
    except Exception as e:
        logger.error("Error getting managers user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.select_related(
            'user', 'department', 'manager', 'manager__user'
        ).all()
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check Django permission first
        if user.has_perm('employees.view_employee'):
            base_qs = qs
        
        # Apply role-based filtering
        elif permission_level >= PERMISSION_LEVELS['EXECUTIVE']:
            # C-Level can see all employees
            base_qs = qs
            
        elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            # VP/Directors and HR can see all employees
            base_qs = qs
            
        elif has_management_access(user_role) or has_lead_access(user_role):
            # Managers and Team Leads see their team + self
            allowed_employee_ids = get_manager_team_employees(user)
            base_qs = qs.filter(id__in=allowed_employee_ids)
            
        else:
            # Regular employees see only themselves
            try:
                emp = Employee.objects.get(user=user)
                base_qs = qs.filter(id=emp.id)
            except Employee.DoesNotExist:
                base_qs = qs.none()

        params = getattr(self.request, 'query_params', self.request.GET)

        search = (params.get('search') or '').strip()
        if search:
            base_qs = base_qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(position__icontains=search) |
                Q(department__name__icontains=search)
            )

        department = (params.get('department') or '').strip()
        if department:
            if department.isdigit():
                base_qs = base_qs.filter(department_id=int(department))
            else:
                base_qs = base_qs.filter(department__name__icontains=department)

        status_param = (params.get('status') or '').strip()
        if status_param:
            base_qs = base_qs.filter(status__iexact=status_param)

        return base_qs.distinct()

    def create(self, request, *args, **kwargs):
        logger.debug("Incoming Employee payload user_id=%s", getattr(request.user, 'id', None))
        
        # Get user role and permission level
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        
        # Check permissions: Django permission OR HR role OR Executive
        has_permission = (
            user.has_perm('employees.add_employee') or
            can_manage_hr(user_role) or
            has_executive_access(user_role)
        )
        
        if not has_permission:
            return Response(
                {'detail': 'Permission denied. Only HR and Executives can add employees.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Transform frontend data structure to match serializer expectations
        transformed_data = {
            'user_data': request.data.get('user'),
            'profile_data': request.data.get('profile'),
            'employee_id': request.data.get('employee_id'),
            'department_id': request.data.get('department_id'),
            'position': request.data.get('position'),
            'hire_date': request.data.get('hire_date'),
            'manager_id': request.data.get('manager') if request.data.get('manager') else None,
        }
        
        serializer = self.get_serializer(data=transformed_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        employee = serializer.save()
        
        # Return employee data
        response_data = self.get_serializer(employee).data
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return Employee.objects.select_related(
            'user', 'department', 'manager', 'manager__user'
        ).all()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check view access
        if user.has_perm('employees.view_employee'):
            return obj
            
        if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            # Senior leaders and HR can view any employee
            return obj
            
        if has_management_access(user_role) or has_lead_access(user_role):
            # Managers and Team Leads can view their team + self
            allowed_employee_ids = get_manager_team_employees(user)
            if obj.id in allowed_employee_ids:
                return obj
                
        if getattr(obj, 'user_id', None) == getattr(user, 'id', None):
            # User can view their own profile
            return obj
            
        self.permission_denied(self.request, "Cannot access this employee record")

    def update(self, request, *args, **kwargs):
        user = request.user
        obj = self.get_object()
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Check update permissions
        allowed = (
            user.has_perm('employees.change_employee') or
            permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or
            can_manage_hr(user_role)
        )
        
        # Managers can update their team members
        if not allowed and (has_management_access(user_role) or has_lead_access(user_role)):
            try:
                manager_employee = Employee.objects.get(user=user)
                if obj.manager_id == manager_employee.id:
                    allowed = True
            except Employee.DoesNotExist:
                pass
        
        if not allowed:
            return Response(
                {'detail': 'Permission denied.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        
        # Only HR, Executives, and users with delete permission can delete
        allowed = (
            user.has_perm('employees.delete_employee') or
            can_manage_hr(user_role) or
            has_executive_access(user_role)
        )
        
        if not allowed:
            return Response(
                {'detail': 'Permission denied. Only HR and Executives can delete employees.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        return super().destroy(request, *args, **kwargs)


class UserListView(generics.ListAPIView):
    """
    Get all users who don't have employee records yet
    Available to HR and Executives only
    """
    permission_classes = [IsEmployee]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        
        # Check if user has access
        has_access = (
            can_manage_hr(user_role) or
            has_executive_access(user_role) or
            user.has_perm('auth.view_user')
        )
        
        if not has_access:
            return Response(
                {'error': 'Only HR and Executives can view this list'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get users who don't have employee records
        users_without_employee = User.objects.filter(
            ~Q(employee__isnull=False)
        ).values('id', 'first_name', 'last_name', 'email', 'username')
        
        return Response({
            'results': list(users_without_employee)
        })


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsEmployee()]
    
    def create(self, request, *args, **kwargs):
        # Check if user can create departments
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        
        has_permission = (
            user.has_perm('employees.add_department') or
            can_manage_hr(user_role) or
            has_executive_access(user_role)
        )
        
        if not has_permission:
            return Response(
                {'detail': 'Permission denied. Only HR and Executives can create departments.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        # If no departments exist yet, seed a sensible default set
        if Department.objects.count() == 0:
            defaults = [
                'Human Resources', 'Information Technology', 'Finance', 'Marketing', 'Sales',
                'Operations', 'Development', 'Design', 'Quality Assurance', 'Customer Support',
                'Engineering', 'Product Management', 'Data Science', 'Security', 'Legal'
            ]
            Department.objects.bulk_create([Department(name=name) for name in defaults])
        return super().list(request, *args, **kwargs)


class OnboardingTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = OnboardingTaskSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        user = self.request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        queryset = OnboardingTask.objects.select_related(
            'employee', 'employee__user', 'employee__department', 'assigned_by'
        )
        
        # HR and Senior Leaders can see all onboarding tasks
        if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            return queryset.all()
        
        # Managers can see their team's onboarding tasks
        if has_management_access(user_role):
            allowed_employee_ids = get_manager_team_employees(user)
            return queryset.filter(employee_id__in=allowed_employee_ids)
        
        # Regular employees see only their own tasks
        return queryset.filter(employee__user=user)

    def perform_create(self, serializer):
        # Check if user can create onboarding tasks
        user = self.request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        
        has_permission = (
            user.has_perm('employees.add_onboardingtask') or
            can_manage_hr(user_role) or
            has_management_access(user_role) or
            has_executive_access(user_role)
        )
        
        if not has_permission:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only HR, Managers, and Executives can create onboarding tasks.')
        
        serializer.save(assigned_by=self.request.user)


@api_view(['PATCH'])
@permission_classes([IsEmployee])
def complete_onboarding_task(request, task_id):
    try:
        task = OnboardingTask.objects.get(id=task_id, employee__user=request.user)
        task.status = 'COMPLETED'
        task.completed_at = timezone.now()
        task.save()
        return Response({'message': 'Task completed successfully'})
    except OnboardingTask.DoesNotExist:
        return Response(
            {'error': 'Task not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


class EmployeeBirthdayListView(generics.ListAPIView):
    """
    Get employee birthdays - today's birthdays and upcoming birthdays
    """
    serializer_class = EmployeeBirthdaySerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return EmployeeBirthday.objects.select_related(
            'employee', 'employee__user', 'employee__department'
        ).filter(employee__status='ACTIVE')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        today = date.today()
        
        # Get today's birthdays
        todays_birthdays = []
        upcoming_birthdays = []
        
        for birthday in queryset:
            if birthday.is_birthday_today and birthday.notify_team:
                todays_birthdays.append(self.get_serializer(birthday).data)
            elif birthday.days_until_birthday <= 7 and birthday.days_until_birthday > 0:
                upcoming_birthdays.append(self.get_serializer(birthday).data)
        
        # Sort upcoming birthdays by days until birthday
        upcoming_birthdays.sort(key=lambda x: x['days_until_birthday'])
        
        return Response({
            'todays_birthdays': todays_birthdays,
            'upcoming_birthdays': upcoming_birthdays[:5],  # Limit to next 5
            'total_today': len(todays_birthdays),
            'has_birthdays_today': len(todays_birthdays) > 0
        })


class FestivalListView(generics.ListAPIView):
    """
    Get festivals - today's festivals and upcoming festivals
    """
    serializer_class = FestivalSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return Festival.objects.filter(notify_employees=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        today = date.today()
        
        # Get today's festivals
        todays_festivals = []
        upcoming_festivals = []
        
        for festival in queryset:
            if festival.is_today:
                todays_festivals.append(self.get_serializer(festival).data)
            elif festival.days_until_festival <= 30 and festival.days_until_festival > 0:
                upcoming_festivals.append(self.get_serializer(festival).data)
        
        # Sort upcoming festivals by days until festival
        upcoming_festivals.sort(key=lambda x: x['days_until_festival'])
        
        return Response({
            'todays_festivals': todays_festivals,
            'upcoming_festivals': upcoming_festivals[:10],  # Limit to next 10
            'total_today': len(todays_festivals),
            'has_festivals_today': len(todays_festivals) > 0
        })


from rest_framework import viewsets

class FestivalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing festivals/holidays.
    Only HR, Managers, Admins, and C-Level can access this.
    """
    queryset = Festival.objects.all().order_by('date')
    serializer_class = FestivalSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsHRorAdmin() | IsManager()]

    def get_queryset(self):
        return self.queryset


@api_view(['GET'])
@permission_classes([IsEmployee])
def dashboard_birthday_festival_data(request):
    """
    Combined endpoint for dashboard birthday and festival data
    """
    try:
        # Get birthday data
        birthday_queryset = EmployeeBirthday.objects.select_related(
            'employee', 'employee__user', 'employee__department'
        ).filter(employee__status='ACTIVE')
        
        todays_birthdays = []
        upcoming_birthdays = []
        
        for birthday in birthday_queryset:
            if birthday.is_birthday_today and birthday.notify_team:
                todays_birthdays.append(EmployeeBirthdaySerializer(birthday).data)
            elif birthday.days_until_birthday <= 7 and birthday.days_until_birthday > 0:
                upcoming_birthdays.append(EmployeeBirthdaySerializer(birthday).data)
        
        # Sort upcoming birthdays
        upcoming_birthdays.sort(key=lambda x: x['days_until_birthday'])
        
        # Get festival data
        festival_queryset = Festival.objects.filter(notify_employees=True)
        
        todays_festivals = []
        upcoming_festivals = []
        
        for festival in festival_queryset:
            if festival.is_today:
                todays_festivals.append(FestivalSerializer(festival).data)
            elif festival.days_until_festival <= 30 and festival.days_until_festival > 0:
                upcoming_festivals.append(FestivalSerializer(festival).data)
        
        # Sort upcoming festivals
        upcoming_festivals.sort(key=lambda x: x['days_until_festival'])
        
        result = {
            'birthdays': {
                'todays_birthdays': todays_birthdays,
                'upcoming_birthdays': upcoming_birthdays[:5],
                'total_today': len(todays_birthdays),
                'has_birthdays_today': len(todays_birthdays) > 0
            },
            'festivals': {
                'todays_festivals': todays_festivals,
                'upcoming_festivals': upcoming_festivals[:10],
                'total_today': len(todays_festivals),
                'has_festivals_today': len(todays_festivals) > 0
            }
        }
        
        return Response(result)
        
    except Exception as e:
        logger.error("Error in dashboard_birthday_festival_data user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)