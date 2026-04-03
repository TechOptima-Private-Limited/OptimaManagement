# from rest_framework import permissions


# class IsHRManager(permissions.BasePermission):
#     """Custom permission for HR Manager role"""
#     def has_permission(self, request, view):
#         return request.user and request.user.is_authenticated and \
#                hasattr(request.user, 'profile') and \
#                request.user.profile.role == 'HR_MANAGER'

# class IsManager(permissions.BasePermission):
#     """Custom permission for Manager role"""
#     def has_permission(self, request, view):
#         return (
#             request.user and 
#             request.user.is_authenticated and 
#             hasattr(request.user, 'profile') and 
#             request.user.profile.role == 'MANAGER'
#         )

# class IsEmployee(permissions.BasePermission):
#     """Custom permission for Employee role"""
#     def has_permission(self, request, view):
#         return request.user and request.user.is_authenticated and \
#                hasattr(request.user, 'profile')

# class IsAdmin(permissions.BasePermission):
#     """Custom permission for Admin role"""
#     def has_permission(self, request, view):
#         user = request.user
#         return (
#             user
#             and user.is_authenticated
#             and (
#                 getattr(getattr(user, 'profile', None), 'role', None) == 'ADMIN'
#                 or user.is_superuser
#                 or user.groups.filter(name='Admin').exists()
#             )
#         )
# class IsHRorAdmin(permissions.BasePermission):
#     """Allow access to HR managers or admins"""
#     def has_permission(self, request, view):
#         user = request.user
#         if not (user and user.is_authenticated):
#             return False
#         role = getattr(getattr(user, 'profile', None), 'role', None)
#         if role in ['HR_MANAGER', 'ADMIN']:
#             return True
#         if user.is_superuser:
#             return True
#         # Group-based allowance for flexibility
#         if user.groups.filter(name__in=['Admin', 'HR Manager']).exists():
#             return True
#         return False


# class AssetModelPermissions(permissions.DjangoModelPermissions):
#     def has_permission(self, request, view):
#         user = request.user
#         role = getattr(getattr(user, 'profile', None), 'role', None)
#         if user and user.is_authenticated and role == 'IT_SUPPORTER':
#             return True
#         return super().has_permission(request, view)




# utils/permissions.py
from rest_framework import permissions
from utils.roles import (
    get_permission_level,
    has_executive_access,
    has_management_access,
    has_lead_access,
    can_manage_hr,
    can_manage_users,
    can_manage_assets,
    PERMISSION_LEVELS,
    ROLE_CATEGORIES
)


class IsHRManager(permissions.BasePermission):
    """Custom permission for HR Manager and HR Executive roles"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Superuser always has access
        if request.user.is_superuser:
            return True
            
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        # Check if user is in HR staff category or can manage HR
        return (
            user_role in ROLE_CATEGORIES['HR_STAFF'] or
            can_manage_hr(user_role)
        )


class IsManager(permissions.BasePermission):
    """Custom permission for Manager and Management roles"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Superuser always has access
        if request.user.is_superuser:
            return True
            
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        # Check if user has management access
        return has_management_access(user_role)


class IsEmployee(permissions.BasePermission):
    """Custom permission for authenticated users with profile or superusers"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or hasattr(request.user, 'profile')


class IsAdmin(permissions.BasePermission):
    """Custom permission for Admin role and superusers"""
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        
        # Superuser always has access
        if user.is_superuser:
            return True
        
        # Check for Admin group
        if user.groups.filter(name='Admin').exists():
            return True
        
        # Check role
        user_profile = getattr(user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        # Admin role or Office Admin
        return user_role in ['ADMIN', 'OFFICE_ADMIN']


class IsHRorAdmin(permissions.BasePermission):
    """Allow access to HR staff, admins, or executives"""
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        
        # Superuser always has access
        if user.is_superuser:
            return True
        
        # Check for Admin or HR Manager groups
        if user.groups.filter(name__in=['Admin', 'HR Manager']).exists():
            return True
        
        # Check role
        user_profile = getattr(user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        # Check if user is HR staff, Admin, or Executive
        return (
            user_role in ROLE_CATEGORIES['HR_STAFF'] or
            user_role in ROLE_CATEGORIES['ADMIN_STAFF'] or
            user_role in ROLE_CATEGORIES['C_LEVEL'] or
            can_manage_hr(user_role)
        )


class IsHRorAdminOrManager(permissions.BasePermission):
    """
    Allow access if the user is HR/Admin/Executive OR has management access.

    This avoids relying on bitwise composition of permission instances, which
    can behave differently across DRF versions/configurations.
    """

    def has_permission(self, request, view):
        return IsHRorAdmin().has_permission(request, view) or IsManager().has_permission(request, view)


class AssetModelPermissions(permissions.DjangoModelPermissions):
    """Custom permissions for asset management"""
    def has_permission(self, request, view):
        user = request.user
        
        if not (user and user.is_authenticated):
            return False
        
        user_profile = getattr(user, 'profile', None)
        if not user_profile:
            return super().has_permission(request, view)
        
        user_role = getattr(user_profile, 'role', None)
        
        # IT Support, System Admin, and roles that can manage assets have access
        if can_manage_assets(user_role):
            return True
        
        # DevOps and Cloud engineers also get access
        if user_role in ROLE_CATEGORIES['DEVOPS']:
            return True
        
        # Network engineers get access
        if user_role == 'NETWORK_ENGINEER':
            return True
        
        # Fall back to Django model permissions
        return super().has_permission(request, view)


class IsITSupport(permissions.BasePermission):
    """Custom permission for IT Support and related roles"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superuser always has access
        if request.user.is_superuser:
            return True
        
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        # Check if user is in IT support category or related roles
        return (
            user_role in ROLE_CATEGORIES['IT_SUPPORT'] or
            user_role in ROLE_CATEGORIES['DEVOPS'] or
            user_role in ROLE_CATEGORIES['ADMIN_STAFF'] or
            user_role == 'NETWORK_ENGINEER' or
            user_role == 'SYSTEM_ADMIN' or
            can_manage_assets(user_role)
        )


class HasLeadAccess(permissions.BasePermission):
    """Permission for Team Leads and Senior Staff"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superuser always has access
        if request.user.is_superuser:
            return True
        
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        return has_lead_access(user_role)


class HasManagementAccess(permissions.BasePermission):
    """Permission for Managers and above"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superuser always has access
        if request.user.is_superuser:
            return True
        
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        return has_management_access(user_role)


class HasExecutiveAccess(permissions.BasePermission):
    """Permission for VP level and above (C-Level, VP, Directors)"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superuser always has access
        if request.user.is_superuser:
            return True
        
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        return has_executive_access(user_role)


class CanManageUsers(permissions.BasePermission):
    """Permission for roles that can manage users"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superuser always has access
        if request.user.is_superuser:
            return True
        
        user_profile = getattr(request.user, 'profile', None)
        if not user_profile:
            return False
        
        user_role = getattr(user_profile, 'role', None)
        
        return can_manage_users(user_role)