import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from authentication.models import UserProfile
from employees.models import Employee, EmployeeBirthday

def sync_birthdays():
    print("🚀 Starting birthday synchronization...")
    profiles = UserProfile.objects.exclude(date_of_birth__isnull=True)
    count = 0
    errors = 0
    
    for profile in profiles:
        try:
            employee = Employee.objects.get(user=profile.user)
            obj, created = EmployeeBirthday.objects.update_or_create(
                employee=employee,
                defaults={'birth_date': profile.date_of_birth}
            )
            status = "Created" if created else "Updated"
            print(f"✅ {status} birthday for {profile.user.get_full_name()}: {profile.date_of_birth}")
            count += 1
        except Employee.DoesNotExist:
            print(f"⚠️ Skipping: No Employee record for user {profile.user.email}")
            errors += 1
        except Exception as e:
            print(f"❌ Error syncing {profile.user.email}: {str(e)}")
            errors += 1
            
    print("-" * 30)
    print(f"🎉 Synchronization complete!")
    print(f"Total synced: {count}")
    print(f"Total skipped/errors: {errors}")

if __name__ == "__main__":
    sync_birthdays()
