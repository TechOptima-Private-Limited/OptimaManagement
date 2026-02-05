from django.shortcuts import render

# Create your views here.
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group, Permission
from django.db.models import Q
from .serializers import UserRegistrationSerializer, UserSerializer, EmployeeRegistrationSerializer, UserDetailSerializer, UserUpdateSerializer, AdminUserSerializer
from .models import User
from utils.permissions import IsHRorAdmin, IsAdmin
from employees.models import Employee

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register(request):
    """Admin/HR creates a new user account.

    Additionally, ensure an Employee row exists and is set to ACTIVE.
    This makes the Employees page show the user as active immediately.
    """
    # Require Django permission to add users
    if not request.user.has_perm('auth.add_user'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Ensure an Employee exists and is ACTIVE for admin-created users.
        # The User post_save signal may have created an INACTIVE employee already;
        # update_or_create guarantees the status flips to ACTIVE here.
        Employee.objects.update_or_create(
            user=user,
            defaults={
                'employee_id': f"EMP-{user.id:04d}",
                'department': None,
                'position': '',
                'hire_date': None,
                'manager': None,
                'status': 'ACTIVE',
            }
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@permission_classes([AllowAny])
def employee_register(request):
    """Employee registration with just email and password"""
    serializer = EmployeeRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration completed successfully!',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if email and password:
        user = authenticate(username=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
    
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
    

class UserProfileView(generics.RetrieveUpdateAPIView):
    """Enhanced user profile view with proper update handling"""
    permission_classes = [AllowAny]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserDetailSerializer
        return UserUpdateSerializer
    
    def get(self, request, *args, **kwargs):
        """Get user profile with decrypted data"""
        user = self.get_object()
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request, *args, **kwargs):
        """Update user profile"""
        user = self.get_object()
        
        # Separate user data and profile data
        user_data = {
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
        }
        
        profile_data = {
            'phone_number': request.data.get('phone_number', ''),
            'address': request.data.get('address', ''),
            'date_of_birth': request.data.get('date_of_birth'),
            'emergency_contact': request.data.get('emergency_contact', ''),
        }
        
        # Remove None values
        user_data = {k: v for k, v in user_data.items() if v is not None}
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        
        # Prepare data for serializer
        update_data = user_data.copy()
        if profile_data:
            update_data['profile'] = profile_data
        
        serializer = UserUpdateSerializer(user, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return updated user data
            return Response(UserDetailSerializer(user).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):
    """List all users for admin/HR management"""
    # Allow access if user has auth.view_user permission OR is HR/Admin (for offboarding etc.)
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    is_hr_or_admin = user_role in ['ADMIN', 'HR_MANAGER']
    
    if not request.user.has_perm('auth.view_user') and not is_hr_or_admin:
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.select_related('profile').all().order_by('email')
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    """Retrieve or update a single user for admin/HR"""
    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)

    if request.method == 'GET':
        if not request.user.has_perm('auth.view_user'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)

    if request.method == 'DELETE':
        if not request.user.has_perm('auth.delete_user'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        # Safety checks
        if request.user.id == user.id:
            return Response({'detail': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser and not request.user.is_superuser:
            return Response({'detail': 'Only a superuser can delete another superuser.'}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH
    if not request.user.has_perm('auth.change_user'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    serializer = AdminUserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(AdminUserSerializer(user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_set_user_password(request, user_id):
    """Allow admin to set/reset a user's password"""
    if not request.user.has_perm('auth.change_user'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    user = get_object_or_404(User, id=user_id)
    password = request.data.get('password')
    password_confirm = request.data.get('password_confirm')

    if not password or not password_confirm:
        return Response({'detail': 'Password and confirmation are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if password != password_confirm:
        return Response({'detail': "Passwords don't match."}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({'detail': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save()
    return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Allow the current authenticated user to change their own password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    new_password_confirm = request.data.get('new_password_confirm')

    if not old_password or not new_password or not new_password_confirm:
        return Response({'detail': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(old_password):
        return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
    if new_password != new_password_confirm:
        return Response({'detail': "Passwords don't match."}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({'detail': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_permissions(request):
    """Return the current user's effective Django permissions.

    Output format:
      {
        "permissions": ["app_label.codename", ...]
      }
    """
    perms = sorted(list(request.user.get_all_permissions()))
    return Response({
        'permissions': perms,
    })


def _compute_user_role_access(user, role_override=None):
    ROLE_GROUP_MAP = {
        'ADMIN': 'Admin',
        'HR_MANAGER': 'HR Manager',
        'MANAGER': 'Manager',
        'IT_SUPPORTER': 'IT Supporter',
        'EMPLOYEE': 'Employee',
    }
    role = role_override or getattr(getattr(user, 'profile', None), 'role', None)
    group_names = [ROLE_GROUP_MAP.get(role)] if role and ROLE_GROUP_MAP.get(role) else []

    baseline_qs = Permission.objects.none()
    for name in group_names:
        g = Group.objects.filter(name=name).first()
        if g:
            baseline_qs = baseline_qs | g.permissions.all()

    baseline_ids = set(baseline_qs.values_list('id', flat=True))

    if not baseline_ids and role:
        ROLE_BASELINE_APPS = {
            'ADMIN': {'all': True},
            'HR_MANAGER': {'apps': ['employees', 'leave_management', 'attendance'], 'prefixes': ['view_', 'add_', 'change_']},
            'MANAGER': {'apps': ['employees', 'leave_management', 'attendance'], 'prefixes': ['view_', 'change_']},
            'IT_SUPPORTER': {'apps': ['resource_management', 'assets', 'notifications'], 'prefixes': ['view_', 'add_', 'change_']},
            'EMPLOYEE': {'apps': ['employees', 'attendance', 'leave_management', 'assets', 'notifications'], 'prefixes': ['view_']},
        }
        cfg = ROLE_BASELINE_APPS.get(role)
        if cfg:
            if cfg.get('all'):
                baseline_ids = set(Permission.objects.values_list('id', flat=True))
            else:
                apps = cfg.get('apps', [])
                prefixes = cfg.get('prefixes', ['view_'])
                q = Q()
                for pref in prefixes:
                    q |= Q(codename__startswith=pref)
                qs = Permission.objects.filter(content_type__app_label__in=apps).filter(q)
                baseline_ids = set(qs.values_list('id', flat=True))

    extra_ids = set(user.user_permissions.values_list('id', flat=True))
    effective_ids = baseline_ids | extra_ids

    perms = Permission.objects.select_related('content_type').all().order_by('content_type__app_label', 'codename')

    def perm_obj(p):
        return {
            'id': p.id,
            'name': p.name,
            'codename': p.codename,
            'content_type': f"{p.content_type.app_label}.{p.content_type.model}",
        }

    granted = [perm_obj(p) for p in perms if p.id in effective_ids]
    not_granted = [perm_obj(p) for p in perms if p.id not in effective_ids]

    return {
        'role': role,
        'baseline_permission_ids': list(baseline_ids),
        'extra_permission_ids': list(extra_ids),
        'granted_permissions': granted,
        'not_granted_permissions': not_granted,
    }


# NEW: Role-based access view for a user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_role_access(request, user_id):
    """Return role-based baseline permissions and user extras.

    Response includes:
      - role
      - baseline_permission_ids
      - extra_permission_ids
      - granted_permissions (list of objects)
      - not_granted_permissions (list of objects)
    """
    # Require permission to view users (same as other admin endpoints)
    if not request.user.has_perm('auth.view_user'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    role_override = request.query_params.get('role')
    data = _compute_user_role_access(user, role_override=role_override)
    return Response(data)


# NEW: Update user extra permissions (beyond role baseline)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def set_user_extra_permissions(request, user_id):
    """Set the user's extra (direct) permissions. Baseline via role is unchanged.

    Body: { "permission_ids": [1,2,3] }
    """
    if not request.user.has_perm('auth.change_user'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, id=user_id)
    ids = request.data.get('permission_ids', [])
    if not isinstance(ids, list):
        return Response({'permission_ids': ['Must be a list of integers.']}, status=status.HTTP_400_BAD_REQUEST)

    # Cast to integers and validate
    try:
        ids_int = [int(x) for x in ids]
    except (TypeError, ValueError):
        return Response({'permission_ids': ['All values must be integers.']}, status=status.HTTP_400_BAD_REQUEST)

    perms = Permission.objects.filter(id__in=ids_int)
    found_ids = set(perms.values_list('id', flat=True))
    missing = sorted(set(ids_int) - found_ids)
    if missing:
        return Response({'permission_ids': [f'Invalid IDs: {missing}']}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user.user_permissions.set(perms)
        user.save()
    except Exception as e:
        return Response({'detail': f'Failed to set permissions: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Return updated access snapshot using helper
    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    data = _compute_user_role_access(user)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_group_list(request):
    """List all groups with basic info (name, id, permissions count)"""
    if not request.user.has_perm('auth.view_group'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    search = request.query_params.get('search')
    qs = Group.objects.all().order_by('name')
    if search:
        qs = qs.filter(name__icontains=search)
    data = [
        {
            'id': g.id,
            'name': g.name,
            'permissions_count': g.permissions.count(),
        }
        for g in qs
    ]
    return Response(data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_permission_detail(request, permission_id):
    """Retrieve or update a single permission (name only)"""
    perm = get_object_or_404(Permission, id=permission_id)

    if request.method == 'GET':
        if not request.user.has_perm('auth.view_permission'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({
            'id': perm.id,
            'name': perm.name,
            'codename': perm.codename,
            'content_type': f"{perm.content_type.app_label}.{perm.content_type.model}",
        })

    if not request.user.has_perm('auth.change_permission'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    name = request.data.get('name')
    if name:
        perm.name = name
        perm.save()
    return Response({
        'id': perm.id,
        'name': perm.name,
        'codename': perm.codename,
        'content_type': f"{perm.content_type.app_label}.{perm.content_type.model}",
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_permission_list(request):
    """List all permissions with id, name and codename"""
    if not request.user.has_perm('auth.view_permission'):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    search = request.query_params.get('search')
    qs = Permission.objects.select_related('content_type').all().order_by('content_type__app_label', 'codename')
    if search:
        qs = qs.filter(name__icontains=search)
    data = [
        {
            'id': p.id,
            'name': p.name,
            'codename': p.codename,
            'content_type': f"{p.content_type.app_label}.{p.content_type.model}",
        }
        for p in qs
    ]
    return Response(data)


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_group_detail(request, group_id=None):
    """Create or update a group and its permissions"""
    if request.method == 'GET':
        if not request.user.has_perm('auth.view_group'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        group = get_object_or_404(Group, id=group_id)
        return Response({
            'id': group.id,
            'name': group.name,
            'permissions': list(group.permissions.values_list('id', flat=True)),
        })

    name = request.data.get('name')
    permission_ids = request.data.get('permissions', [])
    if not isinstance(permission_ids, list):
        permission_ids = []

    if request.method == 'POST':
        if not request.user.has_perm('auth.add_group'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if not name:
            return Response({'name': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        group = Group.objects.create(name=name)
    elif request.method == 'PATCH':
        if not request.user.has_perm('auth.change_group'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        group = get_object_or_404(Group, id=group_id)
        if name:
            group.name = name
            group.save()
    elif request.method == 'DELETE':
        if not request.user.has_perm('auth.delete_group'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        group = get_object_or_404(Group, id=group_id)
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Update permissions
    perms = Permission.objects.filter(id__in=permission_ids)
    group.permissions.set(perms)

    return Response({
        'id': group.id,
        'name': group.name,
        'permissions': list(group.permissions.values_list('id', flat=True)),
    })