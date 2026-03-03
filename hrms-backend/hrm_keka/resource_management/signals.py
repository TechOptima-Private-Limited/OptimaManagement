from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.conf import settings
from resource_management.utils import send_email_notification
from django.utils.html import strip_tags

User = get_user_model()

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

from resource_management.models import AccessRequest
from assets.models import AssetRepair

@receiver(post_save, sender=AccessRequest)
def sync_asset_repair(sender, instance, created, **kwargs):
    """
    Automatically create an AssetRepair record when a new ASSET_REPAIR 
    AccessRequest is created.
    """
    if created and instance.request_type == 'ASSET_REPAIR' and instance.asset:
        print(f"Syncing Asset Repair for AccessRequest {instance.ticket_number}")
        try:
            # Create the repair record in Assets app
            repair = AssetRepair.objects.create(
                asset=instance.asset,
                reported_by=instance.user,
                issue_description=strip_tags(instance.justification) or "No description provided",
                status='PENDING'
            )
            # Update the asset's current repair and status
            instance.asset.is_under_repair = True
            instance.asset.current_repair = repair
            instance.asset.status = 'DAMAGED'
            instance.asset.save()
            
            print(f"Created AssetRepair {repair.id} for asset {instance.asset.asset_tag}")
        except Exception as e:
            print(f"Failed to sync Asset Repair: {str(e)}")