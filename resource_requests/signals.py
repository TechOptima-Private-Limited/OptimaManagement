from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import DeliveryRequest, PMORequest
from django.utils import timezone
from .utils import send_pmo_approval_request, generate_approval_token
import logging
import datetime
# from datetime import timedelta

logger = logging.getLogger(__name__)

@receiver(post_save, sender=DeliveryRequest)
def handle_delivery_request_save(sender, instance, created, **kwargs):
    if created:
        logger.info(f"Processing new DeliveryRequest {instance.id}")
        # Generate approval token if not exists
        if not instance.approval_token:
            instance.approval_token = generate_approval_token(instance)
            instance.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)
            instance.save(update_fields=['approval_token', 'approval_token_expiry'])
            logger.debug(f"Generated approval token for DeliveryRequest {instance.id}")
        
        # Send PMO approval request email
        send_pmo_approval_request(instance)
        logger.info(f"Initiated PMO approval email for DeliveryRequest {instance.id}")

def approve_pmo_request(delivery_request_id):
    try:
        delivery_request = DeliveryRequest.objects.get(id=delivery_request_id)
        
        # Generate RI number
        ri_no = f"RI-{delivery_request.id}-{timezone.now().strftime('%Y%m')}"
        
        PMORequest.objects.create(
            delivery_request=delivery_request,
            ri_no=ri_no,
            business_unit=delivery_request.resource_request.business_unit,
            account_name=delivery_request.resource_request.account_name,
            competency_group=delivery_request.competency_group,
            billing_title_in_sow=delivery_request.billing_title_in_sow,
            primary_skill=delivery_request.primary_skill,
            designation=delivery_request.designation,
            location=delivery_request.location,
            operating_model=delivery_request.operating_model,
            frequency=delivery_request.frequency,
            resource_required_date=delivery_request.resource_required_date,
            business_type=delivery_request.business_type,
            opportunity_probability=delivery_request.opportunity_probability,
            is_approved=True,
        )
        
        return True
    except DeliveryRequest.DoesNotExist:
        return False