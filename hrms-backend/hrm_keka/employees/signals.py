from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Employee

User = get_user_model()


@receiver(post_save, sender=User)
def create_employee_for_new_user(sender, instance, created, **kwargs):
    """Automatically create an Employee record when a new User is created.

    This keeps the Employees page in sync with Users & Authentication:
    every new user gets a default Employee row so HR can later fill in
    department, position, manager, etc.
    """
    if not created:
        return

    # If an employee already exists for this user, do nothing
    if hasattr(instance, "employee"):
        return

    # Generate a simple employee_id if not provided elsewhere
    employee_id = f"EMP-{instance.id:04d}"

    Employee.objects.create(
        user=instance,
        employee_id=employee_id,
        department=None,
        position="",
        hire_date=None,
        manager=None,
        # Start as INACTIVE so HR can review and activate after setting details
        status="INACTIVE",
    )
