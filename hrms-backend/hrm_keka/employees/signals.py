from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from authentication.models import UserProfile
from .models import Employee, EmployeeBirthday

User = get_user_model()


@receiver(post_save, sender=User)
def create_employee_for_new_user(sender, instance, created, **kwargs):
    """Automatically create an Employee record when a new User is created."""
    if not created:
        return

    if hasattr(instance, "employee"):
        return

    # Prefer the user-provided UserID (username) as employee_id.
    # Fall back to TO-XXXXX only when username is unavailable.
    employee_id = (instance.username or "").strip() or f"TO-{instance.id:05d}"

    Employee.objects.create(
        user=instance,
        employee_id=employee_id,
        department=None,
        position="",
        hire_date=None,
        manager=None,
        status="INACTIVE",
    )


@receiver(post_save, sender=UserProfile)
def sync_birthday_from_profile(sender, instance, **kwargs):
    """Sync UserProfile.date_of_birth with EmployeeBirthday model."""
    if instance.date_of_birth:
        try:
            employee = Employee.objects.get(user=instance.user)
            EmployeeBirthday.objects.update_or_create(
                employee=employee,
                defaults={'birth_date': instance.date_of_birth}
            )
            print(f"✅ Synced birthday for {instance.user.get_full_name()}: {instance.date_of_birth}")
        except Employee.DoesNotExist:
            print(f"⚠️ Could not sync birthday: No Employee record for user {instance.user.email}")
        except Exception as e:
            print(f"❌ Error syncing birthday for {instance.user.email}: {str(e)}")
