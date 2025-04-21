from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import DeliveryRequest, PMORequest
from django.utils import timezone
from django.utils.html import strip_tags, format_html
from django.template.loader import render_to_string
from .utils import send_pmo_approval_request, generate_approval_token, get_approval_urls, send_email_with_threading
import datetime

@receiver(post_save, sender=DeliveryRequest)
def handle_delivery_request_save(sender, instance, created, **kwargs):
    if created:
        # Only call send_pmo_approval_request for newly created instances
        send_pmo_approval_request(instance)

@receiver(post_save, sender=DeliveryRequest)
def send_pmo_approval_email(sender, instance, created, **kwargs):
    if created:
        # Generate approval token if not exists
        if not instance.approval_token:
            instance.approval_token = generate_approval_token(instance)
            instance.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)
            instance.save(update_fields=['approval_token', 'approval_token_expiry'])
        
        # Get approval URLs
        approve_url, reject_url = get_approval_urls(instance.id, instance.approval_token)
        
        subject = f"Resource Request Approval Needed - ID {instance.id}"
        
        # Context for the email template
        context = {
            'ticket': instance.id,
            'requester': instance.resource_request.request_owner,
            'account_name': instance.resource_request.account_name,
            'competency_group': instance.competency_group,
            'primary_skill': instance.primary_skill,
            'secondary_skill': instance.secondary_skill,
            'education_qualification': instance.education_qualification,
            'experience_in_years': instance.experience_in_years,
            'certifications': instance.certifications,
            'job_description': instance.job_description_text,
            'number_of_positions': instance.number_of_positions,
            'designation': instance.designation,
            'allocation_start_date': instance.allocation_start_date,
            'allocation_end_date': instance.allocation_end_date,
            'resource_required_date': instance.resource_required_date,
            'location': instance.location,
            'business_type': instance.business_type,
            'opportunity_probability': instance.opportunity_probability,
            'approve_url': approve_url,
            'reject_url': reject_url,
            'approval_token_expiry': instance.approval_token_expiry,
        }
        
        # Render the template with the context
        html_message = render_to_string('resource_requests/emails/approval_required_approver.html', context)
        plain_message = strip_tags(html_message)
        
        # Send the email
        send_email_with_threading(
            subject=subject,
            body=plain_message,
            recipients=['gbvmanikanta13@gmail.com'],  # Replace with PMO email
            ticket_number=str(instance.id),
            html_message=html_message,
            is_reply=False
        )

# Function for approving PMO requests
def approve_pmo_request(delivery_request_id):
    try:
        delivery_request = DeliveryRequest.objects.get(id=delivery_request_id)
        
        # Generate RI number - You can customize this format
        ri_no = f"RI-{delivery_request.id}-{timezone.now().strftime('%Y%m')}"
        
        PMORequest.objects.create(
            delivery_request=delivery_request,
            ri_no=ri_no,  # Using a more descriptive format
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