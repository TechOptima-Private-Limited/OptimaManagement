# from django.shortcuts import render

# # Create your views here.
# from rest_framework import generics, status
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from django.utils import timezone
# from .models import Employee, Department, OnboardingTask
# from .serializers import EmployeeSerializer, DepartmentSerializer, OnboardingTaskSerializer
# from utils.permissions import IsHRManager, IsEmployee
# from django.db.models import Q
# from django.contrib.auth import get_user_model
# User = get_user_model()
# class EmployeeListCreateView(generics.ListCreateAPIView):
#     queryset = Employee.objects.all()
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsEmployee]

#     def create(self, request, *args, **kwargs):
#         print("🚀 Incoming Employee Payload:", request.data)  # Log incoming data

#         serializer = self.get_serializer(data=request.data)
#         if not serializer.is_valid():
#             print("❌ Validation Errors:", serializer.errors)  # Log errors
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         self.perform_create(serializer)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)

# class UserListView(generics.ListAPIView):
#     """
#     Get all users who don't have employee records yet
#     """
#     permission_classes = [IsHRManager]
    
#     def get(self, request, *args, **kwargs):
#         # Get users who don't have employee records
#         users_without_employee = User.objects.filter(
#             ~Q(employee__isnull=False)  # Users without employee records
#         ).values('id', 'first_name', 'last_name', 'email', 'username')
        
#         return Response({
#             'results': list(users_without_employee)
#         })
# class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Employee.objects.all()
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsEmployee]

# class DepartmentListCreateView(generics.ListCreateAPIView):
#     queryset = Department.objects.all()
#     serializer_class = DepartmentSerializer
#     permission_classes = [IsHRManager]

# class OnboardingTaskListCreateView(generics.ListCreateAPIView):
#     serializer_class = OnboardingTaskSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER':
#             return OnboardingTask.objects.all()
#         return OnboardingTask.objects.filter(employee__user=self.request.user)
    
#     def perform_create(self, serializer):
#         serializer.save(assigned_by=self.request.user)

# @api_view(['PATCH'])
# def complete_onboarding_task(request, task_id):
#     try:
#         task = OnboardingTask.objects.get(id=task_id, employee__user=request.user)
#         task.status = 'COMPLETED'
#         task.completed_at = timezone.now()
#         task.save()
#         return Response({'message': 'Task completed successfully'})
#     except OnboardingTask.DoesNotExist:
#         return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)




# # employees/views.py

# from django.shortcuts import render
# from rest_framework import generics, status
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from django.utils import timezone
# from .models import Employee, Department, OnboardingTask
# from .serializers import EmployeeSerializer, DepartmentSerializer, OnboardingTaskSerializer
# from utils.permissions import IsHRManager, IsEmployee
# from django.db.models import Q
# from django.contrib.auth import get_user_model
# # from onboarding.models import Employee as OnboardingEmployee

# User = get_user_model()

# class EmployeeListCreateView(generics.ListCreateAPIView):
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         # Optimize queries by including related objects
#         return Employee.objects.select_related(
#             'user', 'department', 'manager', 'manager__user'
#         ).all()
    
#     def create(self, request, *args, **kwargs):
#         print("🚀 Incoming Employee Payload:", request.data)  # Log incoming data
#         serializer = self.get_serializer(data=request.data)
#         if not serializer.is_valid():
#             print("❌ Validation Errors:", serializer.errors)  # Log errors
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
#         self.perform_create(serializer)
        
#         # Get the created employee with related data for response
#         employee = Employee.objects.select_related(
#             'user', 'department', 'manager', 'manager__user'
#         ).get(id=serializer.instance.id)
        
#         response_serializer = self.get_serializer(employee)
#         return Response(response_serializer.data, status=status.HTTP_201_CREATED)

# class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         return Employee.objects.select_related(
#             'user', 'department', 'manager', 'manager__user'
#         ).all()

# class UserListView(generics.ListAPIView):
#     """
#     Get all users who don't have employee records yet
#     """
#     permission_classes = [IsHRManager]
    
#     def get(self, request, *args, **kwargs):
#         # Get users who don't have employee records
#         users_without_employee = User.objects.filter(
#             ~Q(employee__isnull=False)  # Users without employee records
#         ).values('id', 'first_name', 'last_name', 'email', 'username')
        
#         return Response({
#             'results': list(users_without_employee)
#         })

# class DepartmentListCreateView(generics.ListCreateAPIView):
#     queryset = Department.objects.all()
#     serializer_class = DepartmentSerializer
#     permission_classes = [IsHRManager]

# class OnboardingTaskListCreateView(generics.ListCreateAPIView):
#     serializer_class = OnboardingTaskSerializer
#     permission_classes = [IsEmployee]
    
#     def get_queryset(self):
#         queryset = OnboardingTask.objects.select_related(
#             'employee', 'employee__user', 'employee__department', 'assigned_by'
#         )
        
#         if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER':
#             return queryset.all()
#         return queryset.filter(employee__user=self.request.user)
    
#     def perform_create(self, serializer):
#         serializer.save(assigned_by=self.request.user)

# @api_view(['PATCH'])
# def complete_onboarding_task(request, task_id):
#     try:
#         task = OnboardingTask.objects.get(id=task_id, employee__user=request.user)
#         task.status = 'COMPLETED'
#         task.completed_at = timezone.now()
#         task.save()
#         return Response({'message': 'Task completed successfully'})
#     except OnboardingTask.DoesNotExist:
#         return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)



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
from utils.permissions import IsHRManager, IsEmployee, IsManager





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
        
        # # Get team members (employees who report to current employee)
        # direct_reports = Employee.objects.select_related(
        #     'user', 'department'
        # ).filter(
        #     manager=current_employee, 
        #     status='ACTIVE'
        # )
        
        # Get peer colleagues or all employees for HR/Admin
        peer_colleagues = []
        user_role = getattr(getattr(user, 'profile', None), 'role', None)
        
        if user_role in ['HR_MANAGER', 'ADMIN']:
            # For HR/Admin, "peers" will be all active employees except self
            peer_colleagues = Employee.objects.select_related(
                'user', 'department'
            ).filter(
                status='ACTIVE'
            ).exclude(
                id=current_employee.id
            )
            print(f"👑 {user_role} - fetching all employees as peers")
        elif current_employee.manager:
            # Regular peer logic
            peer_colleagues = Employee.objects.select_related(
                'user', 'department'
            ).filter(
                manager=current_employee.manager,  # Same manager as current employee
                status='ACTIVE'
            ).exclude(
                id=current_employee.id  # Exclude current employee from peers list
            )
        
        # Serialize data
        employee_data = EmployeeSerializer(current_employee, context={'request': request}).data
        # team_data = EmployeeSerializer(direct_reports, many=True, context={'request': request}).data
        peers_data = EmployeeSerializer(peer_colleagues, many=True, context={'request': request}).data
        
        # Get manager data if exists
        manager_data = None
        if current_employee.manager:
            manager_data = EmployeeSerializer(current_employee.manager, context={'request': request}).data
        
        response_data = {
            'employee': employee_data,
            'peers': peers_data,         # Colleagues with same manager
            'manager': manager_data,
           
        }
        
        return Response(response_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Failed to fetch employee profile data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsManager])
def get_manager_profile_data(request):
    """
    Get manager profile data - same structure as employee but 'peers' contains direct reports
    """
    try:
        user = request.user
        
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
            'peers': peers_data,         # For managers, this contains direct reports
            'manager': manager_data,
        }
        
        return Response(response_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Failed to fetch manager profile data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsHRManager])
def get_all_managers_with_teams(request):
    """
    Get all managers and their team counts (HR only)
    """
    try:
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
        
        print(f"👥 Found {len(managers_with_teams)} managers with teams")
        
        return Response({
            'managers': managers_with_teams,
            'count': len(managers_with_teams)
        })
        
    except Exception as e:
        print(f"❌ Error getting managers: {str(e)}")
        return Response({
            'error': f'Failed to fetch managers: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.select_related(
            'user', 'department', 'manager', 'manager__user'
        ).all()
        # If user has global view permission, allow full queryset
        if user.has_perm('employees.view_employee'):
            return qs
        # Role-based fallback
        role = getattr(getattr(user, 'profile', None), 'role', None)
        if role == 'HR_MANAGER':
            return qs
        if role == 'MANAGER':
            try:
                manager_emp = Employee.objects.get(user=user)
                team_ids = Employee.objects.filter(manager=manager_emp, status='ACTIVE').values_list('id', flat=True)
                return qs.filter(id__in=list(team_ids) + [manager_emp.id])
            except Employee.DoesNotExist:
                return qs.none()
        # Regular employee: only self record
        try:
            emp = Employee.objects.get(user=user)
            return qs.filter(id=emp.id)
        except Employee.DoesNotExist:
            return qs.none()

    def create(self, request, *args, **kwargs):
        print("🚀 Incoming Employee Payload:", request.data)
        # Allow via Django add permission or HR role
        if not (
            request.user.has_perm('employees.add_employee') or
            (hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER')
        ):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
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
            print("❌ Validation Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        employee = serializer.save()
        
        # Return employee data
        response_data = self.get_serializer(employee).data
        
        return Response(response_data, status=status.HTTP_201_CREATED)

# Rest of your views remain the same...
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
        # View access: allow if has perm or HR, or manager over team, or owner
        if user.has_perm('employees.view_employee'):
            return obj
        role = getattr(getattr(user, 'profile', None), 'role', None)
        if role == 'HR_MANAGER':
            return obj
        if role == 'MANAGER':
            try:
                manager_emp = Employee.objects.get(user=user)
                team_ids = set(Employee.objects.filter(manager=manager_emp, status='ACTIVE').values_list('id', flat=True))
                if obj.id in team_ids or obj.id == manager_emp.id:
                    return obj
            except Employee.DoesNotExist:
                pass
        if getattr(obj, 'user_id', None) == getattr(user, 'id', None):
            return obj
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        user = request.user
        obj = self.get_object()
        allowed = (
            user.has_perm('employees.change_employee') or
            (hasattr(user, 'profile') and user.profile.role == 'HR_MANAGER') or
            (
                hasattr(user, 'profile') and user.profile.role == 'MANAGER' and
                Employee.objects.filter(user=user, id=obj.manager_id).exists()
            )
        )
        if not allowed:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not (user.has_perm('employees.delete_employee') or (hasattr(user, 'profile') and user.profile.role == 'HR_MANAGER')):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class UserListView(generics.ListAPIView):
    """
    Get all users who don't have employee records yet
    """
    permission_classes = [IsHRManager]

    def get(self, request, *args, **kwargs):
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
        return [IsHRManager()]
    def list(self, request, *args, **kwargs):
        # If no departments exist yet, seed a sensible default set
        if Department.objects.count() == 0:
            defaults = [
                'Human Resources','Information Technology','Finance','Marketing','Sales',
                'Operations','Development','Design','Quality Assurance','Customer Support'
            ]
            Department.objects.bulk_create([Department(name=name) for name in defaults])
        return super().list(request, *args, **kwargs)

class OnboardingTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = OnboardingTaskSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        queryset = OnboardingTask.objects.select_related(
            'employee', 'employee__user', 'employee__department', 'assigned_by'
        )
        if hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'HR_MANAGER':
            return queryset.all()
        return queryset.filter(employee__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

@api_view(['PATCH'])
def complete_onboarding_task(request, task_id):
    try:
        task = OnboardingTask.objects.get(id=task_id, employee__user=request.user)
        task.status = 'COMPLETED'
        task.completed_at = timezone.now()
        task.save()
        return Response({'message': 'Task completed successfully'})
    except OnboardingTask.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
    





# Your existing views remain the same...

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


@api_view(['GET'])
def dashboard_birthday_festival_data(request):
    """
    Combined endpoint for dashboard birthday and festival data
    """
    try:
        # print("🚀 Dashboard birthday/festival API called")
        # print(f"📝 User: {request.user}")
        # print(f"📝 User authenticated: {request.user.is_authenticated}")
        
        # Debug: Check if models exist and have data
        try:
            birthday_count = EmployeeBirthday.objects.count()
            festival_count = Festival.objects.count()
            employee_count = Employee.objects.count()
            
            # print(f"📊 Total birthdays in DB: {birthday_count}")
            # print(f"📊 Total festivals in DB: {festival_count}")
            # print(f"📊 Total employees in DB: {employee_count}")
        except Exception as model_error:
            print(f"❌ Model error: {model_error}")
            return Response(
                {'error': f'Database model error: {str(model_error)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Get birthday data
        birthday_queryset = EmployeeBirthday.objects.select_related(
            'employee', 'employee__user', 'employee__department'
        ).filter(employee__status='ACTIVE')
        
        # print(f"📊 Active employee birthdays: {birthday_queryset.count()}")
        
        todays_birthdays = []
        upcoming_birthdays = []
        
        for birthday in birthday_queryset:
            # print(f"🎂 Processing birthday: {birthday.employee.user.get_full_name()} - {birthday.birth_date}")
            # print(f"🎂 Is today: {birthday.is_birthday_today}, Days until: {birthday.days_until_birthday}")
            
            if birthday.is_birthday_today and birthday.notify_team:
                todays_birthdays.append(EmployeeBirthdaySerializer(birthday).data)
            elif birthday.days_until_birthday <= 7 and birthday.days_until_birthday > 0:
                upcoming_birthdays.append(EmployeeBirthdaySerializer(birthday).data)
        
        # Sort upcoming birthdays
        upcoming_birthdays.sort(key=lambda x: x['days_until_birthday'])
        
        # Get festival data
        festival_queryset = Festival.objects.filter(notify_employees=True)
        # print(f"📊 Festivals to notify: {festival_queryset.count()}")
        
        todays_festivals = []
        upcoming_festivals = []
        
        for festival in festival_queryset:
            # print(f"🎉 Processing festival: {festival.name} - {festival.date}")
            # print(f"🎉 Is today: {festival.is_today}, Days until: {festival.days_until_festival}")
            
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
        
        # print(f"✅ Returning data: {result}")
        return Response(result)
        
    except Exception as e:
        print(f"❌ Error in dashboard_birthday_festival_data: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response(
            {'error': f'Failed to fetch birthday and festival data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )