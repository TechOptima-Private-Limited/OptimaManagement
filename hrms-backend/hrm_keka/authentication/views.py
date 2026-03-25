from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group, Permission
from django.db.models import Q
from django.conf import settings
from .serializers import (
    UserRegistrationSerializer, UserSerializer, EmployeeRegistrationSerializer, 
    UserDetailSerializer, UserUpdateSerializer, AdminUserSerializer,
    LoginSerializer
)
from captcha.models import CaptchaStore
from captcha.helpers import captcha_image_url

from .models import User, UserTokenState
from utils.permissions import IsHRorAdmin, IsAdmin
from employees.models import Employee
from utils.roles import (
    get_permission_level, 
    has_executive_access, 
    has_management_access,
    has_lead_access,
    can_manage_users, 
    can_manage_hr, 
    can_manage_assets,
    can_manage_finance,
    PERMISSION_LEVELS,
    ROLE_CATEGORIES,
    get_role_category
)
import re


def _bind_access_token_to_user(user, access_token_value):
    access_token = AccessToken(access_token_value)
    token_jti = access_token.get('jti')
    if not token_jti:
        return
    UserTokenState.objects.update_or_create(
        user=user,
        defaults={'current_jti': token_jti}
    )


def validate_password_complexity(password):
    """Return an error string if password does not meet complexity requirements, else None."""
    errors = []
    if len(password) < 8:
        errors.append('at least 8 characters')
    if not re.search(r'[A-Z]', password):
        errors.append('one uppercase letter (A-Z)')
    if not re.search(r'[a-z]', password):
        errors.append('one lowercase letter (a-z)')
    if not re.search(r'[0-9]', password):
        errors.append('one number (0-9)')
    if not re.search(r'[^A-Za-z0-9]', password):
        errors.append('one special character (!@#$%^&* etc.)')
    if errors:
        return f"Password must include: {', '.join(errors)}."
    return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register(request):
    """Admin/HR creates a new user account.

    Additionally, ensure an Employee row exists and is set to ACTIVE.
    This makes the Employees page show the user as active immediately.
    """
    # Check if user has permission or role-based access
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    if not request.user.has_perm('auth.add_user') and not can_manage_users(user_role):
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Force password change on first login for admin-created users
        user.must_change_password = True
        user.save()
        # Ensure an Employee exists and is ACTIVE for admin-created users.
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
        _bind_access_token_to_user(user, str(refresh.access_token))
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
        _bind_access_token_to_user(user, str(refresh.access_token))
        return Response({
            'message': 'Registration completed successfully!',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_captcha(request):
    """Generate a new captcha and return key and image URL"""
    key = CaptchaStore.generate_key()
    image_url = captcha_image_url(key)
    # Ensure image_url is an absolute URL if possible, or just the path
    # django-simple-captcha helpers usually return the path
    return Response({
        'key': key,
        'image_url': image_url
    })


from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            # Inject refresh token from cookie into request data for SimpleJWT
            data = request.data.copy()
            data['refresh'] = refresh_token
            request._full_data = data # For DRF 3.12+
            
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                access_token = response.data.get('access')
                if access_token:
                    try:
                        token = AccessToken(access_token)
                        user_id = token.get('user_id')
                        if user_id:
                            UserTokenState.objects.update_or_create(
                                user_id=user_id,
                                defaults={'current_jti': token.get('jti', '')}
                            )
                    except Exception:
                        return Response({'detail': 'Invalid token.'}, status=status.HTTP_401_UNAUTHORIZED)
                
                # Set new access token cookie
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    httponly=True,
                    secure=not settings.DEBUG,  # Secure in production, allow HTTP in dev
                    samesite='Lax',
                    path='/',
                )
                
                # If rotation is enabled, super().post() already updated response.data['refresh']
                # We should update that cookie too if it exists
                new_refresh = response.data.get('refresh')
                if new_refresh:
                    response.set_cookie(
                        key='refresh_token',
                        value=new_refresh,
                        httponly=True,
                        secure=not settings.DEBUG,  # Secure in production, allow HTTP in dev
                        samesite='Lax',
                        path='/',
                    )
            return response
        except (InvalidToken, TokenError) as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Clear authentication cookies and blacklist the refresh token if available"""
    response = Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    
    refresh_token = request.COOKIES.get('refresh_token')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass # Token might already be invalid or blacklisted

    UserTokenState.objects.filter(user=request.user).update(current_jti='')
            
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].strip().lower()
    password = serializer.validated_data['password']

    user = authenticate(username=email, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    _bind_access_token_to_user(user, access_token)

    response = Response({
        'user': UserSerializer(user).data,
        'access': access_token,
    })

    cookie_secure = not settings.DEBUG

    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=cookie_secure,
        samesite='Lax',
        path='/',
    )

    response.set_cookie(
        key='refresh_token',
        value=str(refresh),
        httponly=True,
        secure=cookie_secure,
        samesite='Lax',
        path='/',
    )

    return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Enhanced user profile view with proper update handling"""
    permission_classes = [IsAuthenticated]
    
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
            'date_of_birth': request.data.get('date_of_birth') or None,  # convert empty string to None
            'emergency_contact': request.data.get('emergency_contact', ''),
            'gender': request.data.get('gender', ''),
            'blood_group': request.data.get('blood_group', ''),
            'aadhaar_number': request.data.get('aadhaar_number', ''),
            'pan_number': request.data.get('pan_number', ''),
        }
        
        # Remove None values from user_data; remove None from profile_data (keep empty strings - they're valid clears)
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
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    # Check permissions: Django permission OR role-based access
    has_permission = request.user.has_perm('auth.view_user')
    has_role_access = can_manage_users(user_role) or can_manage_hr(user_role) or has_management_access(user_role)
    
    if not has_permission and not has_role_access:
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.select_related('profile').all().order_by('email')
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    """Retrieve or update a single user for admin/HR"""
    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None

    if request.method == 'GET':
        has_permission = request.user.has_perm('auth.view_user')
        has_role_access = can_manage_users(user_role) or can_manage_hr(user_role) or has_management_access(user_role)
        
        if not has_permission and not has_role_access:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)

    if request.method == 'DELETE':
        has_permission = request.user.has_perm('auth.delete_user')
        has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
        
        if not has_permission and not has_role_access:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Safety checks
        if request.user.id == user.id:
            return Response({'detail': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser and not request.user.is_superuser:
            return Response({'detail': 'Only a superuser can delete another superuser.'}, status=status.HTTP_403_FORBIDDEN)
        
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH
    has_permission = request.user.has_perm('auth.change_user')
    has_role_access = can_manage_users(user_role) or can_manage_hr(user_role) or has_management_access(user_role)
    
    if not has_permission and not has_role_access:
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
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    has_permission = request.user.has_perm('auth.change_user')
    has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
    
    if not has_permission and not has_role_access:
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    user = get_object_or_404(User, id=user_id)
    password = request.data.get('password')
    password_confirm = request.data.get('password_confirm')

    if not password or not password_confirm:
        return Response({'detail': 'Password and confirmation are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if password != password_confirm:
        return Response({'detail': "Passwords don't match."}, status=status.HTTP_400_BAD_REQUEST)
    complexity_error = validate_password_complexity(password)
    if complexity_error:
        return Response({'detail': complexity_error}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save()
    UserTokenState.objects.filter(user=user).update(current_jti='')
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
    complexity_error = validate_password_complexity(new_password)
    if complexity_error:
        return Response({'detail': complexity_error}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.must_change_password = False  # Reset the flag after change
    user.save()
    UserTokenState.objects.filter(user=user).update(current_jti='')
    return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_permissions(request):
    """Return the current user's effective Django permissions.

    Output format:
      {
        "permissions": ["app_label.codename", ...],
        "role": "ROLE_CODE",
        "permission_level": 3,
        "role_category": "MANAGEMENT"
      }
    """
    perms = sorted(list(request.user.get_all_permissions()))
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    return Response({
        'permissions': perms,
        'role': user_role,
        'permission_level': get_permission_level(user_role) if user_role else 0,
        'role_category': get_role_category(user_role) if user_role else 'OTHERS',
    })


def _compute_user_role_access(user, role_override=None):
    """Compute user access based on role permission level"""
    role = role_override or getattr(getattr(user, 'profile', None), 'role', None)
    
    if not role:
        return {
            'role': None,
            'permission_level': 0,
            'role_category': 'OTHERS',
            'baseline_permission_ids': [],
            'extra_permission_ids': [],
            'granted_permissions': [],
            'not_granted_permissions': [],
        }
    
    permission_level = get_permission_level(role)
    role_category = get_role_category(role)
    
    # Define permission mappings based on permission level
    if permission_level >= PERMISSION_LEVELS['EXECUTIVE']:
        # C-Level: Full access
        baseline_qs = Permission.objects.all()
    elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']:
        # VP/Director: Broad access except sensitive user management
        baseline_qs = Permission.objects.exclude(
            Q(content_type__app_label='auth', codename__in=['add_user', 'delete_user']) |
            Q(content_type__app_label='auth', codename__startswith='delete_')
        )
    elif permission_level >= PERMISSION_LEVELS['MANAGER']:
        # Managers: Department-specific access based on role category
        apps = ['employees', 'leave_management', 'attendance', 'notifications']
        prefixes = ['view_', 'add_', 'change_']
        
        # Add role-specific permissions
        if can_manage_hr(role):
            apps.extend(['onboarding', 'offboarding'])
        if can_manage_assets(role):
            apps.extend(['assets', 'resource_management'])
        if can_manage_finance(role):
            apps.extend(['finance', 'payroll'])
        
        # Add category-specific apps
        if role_category == 'DEVOPS':
            apps.extend(['resource_management', 'assets'])
        elif role_category == 'SECURITY':
            apps.extend(['auth', 'resource_management'])
            prefixes = ['view_']
        elif role_category == 'DATA_AI':
            apps.extend(['analytics', 'reports'])
        elif role_category == 'SALES_MARKETING':
            apps.extend(['crm', 'marketing'])
        elif role_category == 'OPERATIONS':
            apps.extend(['procurement', 'inventory'])
            
        q = Q()
        for pref in prefixes:
            q |= Q(codename__startswith=pref)
        baseline_qs = Permission.objects.filter(content_type__app_label__in=apps).filter(q)
        
    elif permission_level >= PERMISSION_LEVELS['LEAD']:
        # Team Leads/Senior: View and limited change
        apps = ['employees', 'leave_management', 'attendance', 'assets', 'notifications']
        
        # Add category-specific apps for leads
        if role_category in ['ENGINEERING', 'DEVOPS', 'QA', 'DATA_AI']:
            apps.extend(['resource_management'])
        elif role_category == 'DESIGN':
            apps.extend(['projects'])
        elif role_category == 'PRODUCT':
            apps.extend(['projects', 'requirements'])
            
        prefixes = ['view_', 'change_']
        q = Q()
        for pref in prefixes:
            q |= Q(codename__startswith=pref)
        baseline_qs = Permission.objects.filter(content_type__app_label__in=apps).filter(q)
        
    elif permission_level >= PERMISSION_LEVELS['STAFF']:
        # Regular staff: View and limited self-service
        apps = ['employees', 'attendance', 'leave_management', 'assets', 'notifications']
        
        # Most staff can view
        baseline_qs = Permission.objects.filter(
            content_type__app_label__in=apps,
            codename__startswith='view_'
        )
        
        # Add self-service change permissions
        self_service_perms = Permission.objects.filter(
            Q(codename='change_attendancerecord') |
            Q(codename='add_leaverequest') |
            Q(codename='change_leaverequest')
        )
        baseline_qs = baseline_qs | self_service_perms
    else:
        # Entry level (Interns, Trainees): Very limited view access
        apps = ['employees', 'attendance', 'notifications']
        baseline_qs = Permission.objects.filter(
            content_type__app_label__in=apps,
            codename__startswith='view_'
        )
    
    baseline_ids = set(baseline_qs.values_list('id', flat=True))
    extra_ids = set(user.user_permissions.values_list('id', flat=True))
    effective_ids = baseline_ids | extra_ids

    perms = Permission.objects.select_related('content_type').all().order_by(
        'content_type__app_label', 'codename'
    )

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
        'permission_level': permission_level,
        'role_category': role_category,
        'baseline_permission_ids': list(baseline_ids),
        'extra_permission_ids': list(extra_ids),
        'granted_permissions': granted,
        'not_granted_permissions': not_granted,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_role_access(request, user_id):
    """Return role-based baseline permissions and user extras.

    Response includes:
      - role
      - permission_level
      - role_category
      - baseline_permission_ids
      - extra_permission_ids
      - granted_permissions (list of objects)
      - not_granted_permissions (list of objects)
    """
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    has_permission = request.user.has_perm('auth.view_user')
    has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
    
    if not has_permission and not has_role_access:
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    role_override = request.query_params.get('role')
    data = _compute_user_role_access(user, role_override=role_override)
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def set_user_extra_permissions(request, user_id):
    """Set the user's extra (direct) permissions. Baseline via role is unchanged.

    Body: { "permission_ids": [1,2,3] }
    """
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    has_permission = request.user.has_perm('auth.change_user')
    has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
    
    if not has_permission and not has_role_access:
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, id=user_id)
    ids = request.data.get('permission_ids', [])
    if not isinstance(ids, list):
        return Response(
            {'permission_ids': ['Must be a list of integers.']}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Cast to integers and validate
    try:
        ids_int = [int(x) for x in ids]
    except (TypeError, ValueError):
        return Response(
            {'permission_ids': ['All values must be integers.']}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    perms = Permission.objects.filter(id__in=ids_int)
    found_ids = set(perms.values_list('id', flat=True))
    missing = sorted(set(ids_int) - found_ids)
    if missing:
        return Response(
            {'permission_ids': [f'Invalid IDs: {missing}']}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user.user_permissions.set(perms)
        user.save()
    except Exception as e:
        return Response(
            {'detail': f'Failed to set permissions: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Return updated access snapshot
    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    data = _compute_user_role_access(user)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_group_list(request):
    """List all groups with basic info (name, id, permissions count)"""
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    has_permission = request.user.has_perm('auth.view_group')
    has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
    
    if not has_permission and not has_role_access:
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
    
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None

    if request.method == 'GET':
        has_permission = request.user.has_perm('auth.view_permission')
        has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
        
        if not has_permission and not has_role_access:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'id': perm.id,
            'name': perm.name,
            'codename': perm.codename,
            'content_type': f"{perm.content_type.app_label}.{perm.content_type.model}",
        })

    has_permission = request.user.has_perm('auth.change_permission')
    has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
    
    if not has_permission and not has_role_access:
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
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    has_permission = request.user.has_perm('auth.view_permission')
    has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
    
    if not has_permission and not has_role_access:
        return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
    search = request.query_params.get('search')
    qs = Permission.objects.select_related('content_type').all().order_by(
        'content_type__app_label', 'codename'
    )
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(codename__icontains=search))
    
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
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    if request.method == 'GET':
        has_permission = request.user.has_perm('auth.view_group')
        has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
        
        if not has_permission and not has_role_access:
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
        has_permission = request.user.has_perm('auth.add_group')
        has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
        
        if not has_permission and not has_role_access:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        if not name:
            return Response({'name': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        group = Group.objects.create(name=name)
        
    elif request.method == 'PATCH':
        has_permission = request.user.has_perm('auth.change_group')
        has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
        
        if not has_permission and not has_role_access:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        group = get_object_or_404(Group, id=group_id)
        if name:
            group.name = name
            group.save()
            
    elif request.method == 'DELETE':
        has_permission = request.user.has_perm('auth.delete_group')
        has_role_access = can_manage_users(user_role) or has_executive_access(user_role)
        
        if not has_permission and not has_role_access:
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