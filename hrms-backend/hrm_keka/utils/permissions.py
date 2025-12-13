from rest_framework import permissions

# class IsHRManager(permissions.BasePermission):
#     """Custom permission for HR Manager role"""
    
#     def has_permission(self, request, view):
#         return request.user and request.user.is_authenticated and \
#                hasattr(request.user, 'profile') and \
#                request.user.profile.role == 'HR_MANAGER'

# class IsEmployee(permissions.BasePermission):
#     """Custom permission for Employee role"""
    
#     def has_permission(self, request, view):
#         return request.user and request.user.is_authenticated and \
#                hasattr(request.user, 'profile')

# class IsOwnerOrHRManager(permissions.BasePermission):
#     """Allow access to owner or HR Manager"""
    
#     def has_object_permission(self, request, view, obj):
#         if hasattr(request.user, 'profile') and request.user.profile.role == 'HR_MANAGER':
#             return True
#         return obj.employee == request.user



class IsHRManager(permissions.BasePermission):
    """Custom permission for HR Manager role"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               hasattr(request.user, 'profile') and \
               request.user.profile.role == 'HR_MANAGER'

class IsManager(permissions.BasePermission):
    """Custom permission for Manager role"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               hasattr(request.user, 'profile') and \
               request.user.profile.role == 'MANAGER'

class IsEmployee(permissions.BasePermission):
    """Custom permission for Employee role"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               hasattr(request.user, 'profile')

class IsAdmin(permissions.BasePermission):
    """Custom permission for Admin role"""
    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and (
                getattr(getattr(user, 'profile', None), 'role', None) == 'ADMIN'
                or user.is_superuser
                or user.groups.filter(name='Admin').exists()
            )
        )
class IsHRorAdmin(permissions.BasePermission):
    """Allow access to HR managers or admins"""
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(getattr(user, 'profile', None), 'role', None)
        if role in ['HR_MANAGER', 'ADMIN']:
            return True
        if user.is_superuser:
            return True
        # Group-based allowance for flexibility
        if user.groups.filter(name__in=['Admin', 'HR Manager']).exists():
            return True
        return False


class AssetModelPermissions(permissions.DjangoModelPermissions):
    def has_permission(self, request, view):
        user = request.user
        role = getattr(getattr(user, 'profile', None), 'role', None)
        if user and user.is_authenticated and role == 'IT_SUPPORTER':
            return True
        return super().has_permission(request, view)