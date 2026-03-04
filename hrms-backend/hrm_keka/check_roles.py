import os
import django
import sys

# Add the current directory to sys.path to resolve 'hrm_keka'
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from authentication.models import User

print("--- User Role Report ---")
for user in User.objects.all():
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else "No Profile"
    print(f"Email: {user.email}, Superuser: {user.is_superuser}, Role: {role}")
print("------------------------")
