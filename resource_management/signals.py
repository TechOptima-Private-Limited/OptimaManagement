from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings
from resource_management.utils import send_email_notification
from django.utils.html import strip_tags
from .models import AccessRequest
from assets.models import AssetRepair

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

@receiver(post_save, sender=AccessRequest)
def sync_asset_repair_from_access_request(sender, instance, created, **kwargs):
    try:
        if instance.request_type != 'ASSET_REPAIR':
            return

        if not instance.asset_id:
            return

        status_map = {
            'APPROVED': 'IN_REPAIR',
            'REJECTED': 'CANCELLED',
            'REVOKED': 'CANCELLED',
            'APPROVER_REJECTED': 'CANCELLED',
        }
        repair_status = status_map.get(instance.status, 'REPORTED')

        issue_description = ''
        try:
            issue_description = strip_tags(instance.justification or '')
        except Exception:
            issue_description = ''

        repair = AssetRepair.objects.filter(ticket_reference=instance.ticket_number).first()
        if repair:
            repair.asset_id = instance.asset_id
            repair.status = repair_status
            if issue_description and not repair.issue_description:
                repair.issue_description = issue_description
            repair.save()
        else:
            AssetRepair.objects.create(
                asset_id=instance.asset_id,
                status=repair_status,
                ticket_reference=instance.ticket_number,
                issue_description=issue_description,
                notes=instance.notes or '',
            )

    except Exception as e:
        print(f"Error syncing AssetRepair from AccessRequest: {str(e)}")