import os
import sys
import django

# Add current directory to path
sys.path.append('.')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from authentication.models import User
from leave_management.views import LeaveTypeListCreateView
from utils.permissions import IsHRManager
from rest_framework.test import APIRequestFactory, force_authenticate

def verify_permissions():
    print("--- Permission Verification ---")
    
    # Get the superuser
    superuser = User.objects.filter(is_superuser=True).first()
    if not superuser:
        print("❌ No superuser found!")
        return
        
    print(f"Testing with user: {superuser.email}")
    print(f"Superuser: {superuser.is_superuser}")
    print(f"Has Profile: {hasattr(superuser, 'profile')}")
    
    # Test IsHRManager.has_permission
    factory = APIRequestFactory()
    request = factory.post('/api/leave/types/')
    force_authenticate(request, user=superuser)
    
    class DummyView:
        pass
    
    permission = IsHRManager()
    has_perm = permission.has_permission(request, DummyView())
    
    if has_perm:
        print("✅ IsHRManager.has_permission: PASSED for superuser")
    else:
        print("❌ IsHRManager.has_permission: FAILED for superuser")

    # Test the view itself
    view = LeaveTypeListCreateView.as_view()
    response = view(request)
    
    # We expect 400 Bad Request (missing data) or 201 (empty list create) if permission passed,
    # but 403 Forbidden if it failed.
    if response.status_code != 403:
        print(f"✅ View access: PASSED (Status: {response.status_code})")
    else:
        print("❌ View access: FAILED (Status: 403 Forbidden)")
        
    print("-------------------------------")

if __name__ == "__main__":
    verify_permissions()
