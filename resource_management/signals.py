from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings
from resource_management.utils import send_email_notification

@receiver(post_save, sender=User)
def send_employee_creation_notification(sender, instance, created, **kwargs):
    if created:  # Only send the email if the user is newly created
        # Check if the user has a valid email address
        if not instance.email or not isinstance(instance.email, str) or '@' not in instance.email:
            print(f"Cannot send employee creation notification: Invalid or missing email for user {instance.username}")
            return

        # Prepare the context for the email template
        context = {
            'user': instance,
            'user_name': instance.get_full_name() or instance.username,
            'site_url': settings.SITE_URL,
        }

        # Send the email to the employee
        send_email_notification(
            obj=None,
            subject=f"Welcome to Optima Hub Management – Your Employee Account Details",
            template_name='employee_creation_notification.html',
            context=context,
            recipients=[instance.email],
            is_reply=False
        )
        print(f"Sent employee creation notification to {instance.email}")