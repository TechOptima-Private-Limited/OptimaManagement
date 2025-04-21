from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from .models import ResourceRequest, DeliveryRequest, PMORequest, BuyRateGuidance
from .forms import ResourceRequestForm, DeliveryRequestFormSet
from .utils import send_email
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils.html import strip_tags
from django.template.loader import render_to_string
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.template import TemplateDoesNotExist
from django.db.models import Max
import logging
import json
from django.core.serializers.json import DjangoJSONEncoder

# Set up logging
logger = logging.getLogger(__name__)

@require_GET
def get_buy_rate_guidance(request):
    """API endpoint to calculate buy rate guidance values"""
    business_type = request.GET.get('business_type')
    location = request.GET.get('location')
    
    logger.debug(f"Buy rate guidance request - Business Type: {business_type}, Location: {location}")
    
    try:
        bill_rate = float(request.GET.get('bill_rate', 0))
    except (ValueError, TypeError):
        logger.warning(f"Invalid bill rate value: {request.GET.get('bill_rate')}")
        bill_rate = 0
    
    if not business_type or business_type == '-------':
        logger.warning("Missing or invalid business_type parameter")
        return JsonResponse({
            'from_rate': 0,
            'to_rate': 0,
            'error': 'Business type is required'
        })
    
    if not location or location == '-------':
        logger.warning("Missing or invalid location parameter")
        return JsonResponse({
            'from_rate': 0,
            'to_rate': 0,
            'error': 'Location is required'
        })
    
    if bill_rate <= 0:
        logger.warning(f"Invalid bill rate: {bill_rate}")
        return JsonResponse({
            'from_rate': 0,
            'to_rate': 0,
            'error': 'Bill rate must be greater than zero'
        })
    
    try:
        logger.debug(f"Looking up BuyRateGuidance for {business_type}/{location}")
        guidance = BuyRateGuidance.objects.get(
            business_type=business_type,
            location=location
        )
        
        logger.debug(f"Found guidance - Lower limit: {guidance.lower_limit}, Upper limit: {guidance.upper_limit}")
        
        from_rate = bill_rate - (guidance.lower_limit * bill_rate)
        to_rate = bill_rate - (guidance.upper_limit * bill_rate)
        
        logger.info(f"Calculated buy rate guidance - From: {from_rate}, To: {to_rate}")
        
        return JsonResponse({
            'from_rate': round(from_rate, 2),
            'to_rate': round(to_rate, 2),
            'success': True
        })
    except BuyRateGuidance.DoesNotExist:
        logger.warning(f"No BuyRateGuidance found for {business_type}/{location}")
        return JsonResponse({
            'from_rate': 0,
            'to_rate': 0,
            'error': f"No guidance found for {business_type}/{location}"
        })
    except Exception as e:
        logger.error(f"Error calculating buy rate guidance: {str(e)}")
        return JsonResponse({
            'from_rate': 0,
            'to_rate': 0,
            'error': str(e)
        })

@login_required
def resource_request_create(request):
    logger.debug("Executing resource_request_create")
    if request.method == 'POST':
        form = ResourceRequestForm(request.POST)
        formset = DeliveryRequestFormSet(request.POST, instance=ResourceRequest())
        if form.is_valid() and formset.is_valid():
            resource_request = form.save(commit=False)
            resource_request.request_owner = request.user
            resource_request.save()
            formset.instance = resource_request
            formset.save()
            messages.success(request, 'Resource Request submitted successfully! Awaiting PMO approval.')
            return redirect('admin:resource_requests_resourcerequest_changelist')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ResourceRequestForm()
        formset = DeliveryRequestFormSet(instance=ResourceRequest())
    
    guidance_records = BuyRateGuidance.objects.all()
    logger.debug(f"Number of BuyRateGuidance records fetched: {guidance_records.count()}")
    
    guidance_data = {}
    for record in guidance_records:
        key = f"{record.location.lower()}_{record.business_type.lower().replace(' ', '_')}"
        guidance_data[key] = {
            'lower_limit': float(record.lower_limit),
            'upper_limit': float(record.upper_limit)
        }
    logger.debug(f"Raw guidance data: {guidance_data}")
    
    guidance_json = json.dumps(guidance_data, cls=DjangoJSONEncoder)
    logger.debug(f"Guidance data JSON: {guidance_json}")
    
    return render(request, 'admin/resource_requests/resourcerequest/custom_change_form.html', {
        'form': form,
        'formset': formset,
        'debug_info': True,
        'guidance_data_json': guidance_json,
    })
    
@login_required
def resource_request_list(request):
    print("I have triggered!..")
    requests = ResourceRequest.objects.prefetch_related('deliveryrequest_set').annotate(
        latest_status=Max('deliveryrequest__status')
    )
    return render(request, 'admin/resource_request/resource_request_list.html', {'requests': requests})

# @login_required
# def job_description_create(request):
#     if request.method == 'POST':
#         form = JobDescriptionForm(request.POST, request.FILES)
#         if form.is_valid():
#             form.save()
#             messages.success(request, 'Job Description created successfully!')
#             return redirect('admin:resource_requests_jobdescription_changelist')
#     else:
#         form = JobDescriptionForm()
#     return render(request, 'admin/resource_request/job_description_form.html', {'form': form})

@login_required
def job_description_list(request):
    job_descriptions = JobDescription.objects.all()
    return render(request, 'admin/resource_request/job_description_list.html', {'job_descriptions': job_descriptions})

@api_view(['GET'])
def handle_pmo_approval(request, request_id, token, action):
    try:
        delivery_request = get_object_or_404(DeliveryRequest, id=request_id)
        
        if delivery_request.approval_token != token:
            logger.warning(f"Invalid approval token for DeliveryRequest {request_id}")
            return HttpResponse('Invalid or expired approval link.', status=403)

        if delivery_request.approval_token_expiry and delivery_request.approval_token_expiry < timezone.now():
            logger.warning(f"Expired approval token for DeliveryRequest {request_id}")
            return HttpResponse('Approval link has expired.', status=403)

        if delivery_request.status not in ['PENDING']:
            logger.warning(f"DeliveryRequest {request_id} already processed with status {delivery_request.status}")
            return HttpResponse('This request has already been processed.')

        old_status = delivery_request.status
        ri_no = None
        
        if action == 'approve':
            delivery_request.status = 'APPROVED'
            delivery_request.approved_at = timezone.now()
            
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
            status_text = 'approved'
        elif action == 'reject':
            delivery_request.status = 'REJECTED'
            status_text = 'rejected'
        else:
            logger.warning(f"Invalid action '{action}' for DeliveryRequest {request_id}")
            return HttpResponse('Invalid action')

        delivery_request.approval_token = None
        delivery_request.approval_token_expiry = None
        delivery_request.save()
        logger.info(f"Updated DeliveryRequest {request_id} to status {delivery_request.status}")

        context = {
            'request_id': delivery_request.id,
            'account_name': delivery_request.resource_request.account_name,
            'status': delivery_request.status,
            'status_text': status_text,
            'ri_no': ri_no,
        }
        
        try:
            html_message = render_to_string('resource_requests/emails/request_status_notification.html', context)
            plain_message = strip_tags(html_message)
            
            requester_email = delivery_request.resource_request.request_owner.email
            if not requester_email:
                logger.warning(f"No email found for requester of DeliveryRequest {request_id}")
            
            send_email(
                subject=f"Resource Request {delivery_request.id} {status_text.capitalize()}",
                body=plain_message,
                recipients=[requester_email] if requester_email else [],
                html_message=html_message
            )
            logger.info(f"Sent status notification to {requester_email} for DeliveryRequest {request_id}")
        except TemplateDoesNotExist as e:
            logger.error(f"Template not found: {str(e)}")
            # Continue execution to ensure status update is not rolled back
        except Exception as e:
            logger.error(f"Failed to send status notification for DeliveryRequest {request_id}: {str(e)}")
            # Continue execution

        return HttpResponse(f'Request has been {status_text}.')
    except Exception as e:
        logger.error(f"Error in handle_pmo_approval for DeliveryRequest {request_id}: {str(e)}")
        return HttpResponse(f'Error processing request: {str(e)}', status=500)