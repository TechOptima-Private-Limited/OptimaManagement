from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from .models import ResourceRequest, DeliveryRequest, PMORequest, BuyRateGuidance
from .forms import ResourceRequestForm, DeliveryRequestFormSet, JobDescriptionForm
from .utils import send_email_with_threading
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils.html import strip_tags
from django.template.loader import render_to_string
from django.http import JsonResponse
from django.views.decorators.http import require_GET
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
    
    # Log request parameters for debugging
    logger.debug(f"Buy rate guidance request - Business Type: {business_type}, Location: {location}")
    
    try:
        bill_rate = float(request.GET.get('bill_rate', 0))
    except (ValueError, TypeError):
        logger.warning(f"Invalid bill rate value: {request.GET.get('bill_rate')}")
        bill_rate = 0
    
    # Validate required parameters
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
        # Get the margin guidance record
        logger.debug(f"Looking up BuyRateGuidance for {business_type}/{location}")
        guidance = BuyRateGuidance.objects.get(
            business_type=business_type,
            location=location
        )
        
        logger.debug(f"Found guidance - Lower limit: {guidance.lower_limit}, Upper limit: {guidance.upper_limit}")
        
        # Calculate the rates using the formula
        # Formula: Bill Rate - (margin_guidance * Bill Rate)
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
    print("I have executed!..")
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
            return redirect('admin:resource_request_resourcerequest_changelist')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ResourceRequestForm()
        formset = DeliveryRequestFormSet(instance=ResourceRequest())
    
    # Fetch all BuyRateGuidance records for client-side calculation
    guidance_records = BuyRateGuidance.objects.all()
    print(f"Number of BuyRateGuidance records fetched: {guidance_records.count()}")
    
    # Create a dictionary for easy lookup in JavaScript with lowercase keys
    guidance_data = {}
    for record in guidance_records:
        key = f"{record.location.lower()}_{record.business_type.lower().replace(' ', '_')}"
        guidance_data[key] = {
            'lower_limit': float(record.lower_limit),
            'upper_limit': float(record.upper_limit)
        }
    print(f"Raw guidance data: {guidance_data}")
    
    # Convert to JSON for template and log for debugging
    guidance_json = json.dumps(guidance_data, cls=DjangoJSONEncoder)
    print(f"Guidance data JSON: {guidance_json}")
    
    return render(request, 'admin/resource_requests/resourcerequest/custom_change_form.html', {
        'form': form,
        'formset': formset,
        'debug_info': True,
        'guidance_data_json': guidance_json,
    })
    
@login_required
def resource_request_list(request):
    requests = ResourceRequest.objects.all()
    return render(request, 'admin/resource_request/resource_request_list.html', {'requests': requests})

@login_required
def job_description_create(request):
    if request.method == 'POST':
        form = JobDescriptionForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Job Description created successfully!')
            return redirect('admin:resource_request_jobdescription_changelist')
    else:
        form = JobDescriptionForm()
    return render(request, 'admin/resource_request/job_description_form.html', {'form': form})

@login_required
def job_description_list(request):
    job_descriptions = JobDescription.objects.all()
    return render(request, 'admin/resource_request/job_description_list.html', {'job_descriptions': job_descriptions})

@api_view(['GET'])
def handle_pmo_approval(request, request_id, token, action):
    try:
        delivery_request = get_object_or_404(DeliveryRequest, id=request_id)
        
        if delivery_request.approval_token != token:
            return HttpResponse('Invalid or expired approval link.', status=403)

        if delivery_request.approval_token_expiry and delivery_request.approval_token_expiry < timezone.now():
            return HttpResponse('Approval link has expired.', status=403)

        if delivery_request.status not in ['PENDING']:
            return HttpResponse('This request has already been processed.')

        old_status = delivery_request.status
        ri_no = None
        
        if action == 'approve':
            delivery_request.status = 'APPROVED'
            delivery_request.approved_at = timezone.now()
            
            # Generate a more descriptive RI number
            ri_no = f"RI-{delivery_request.id}-{timezone.now().strftime('%Y%m')}"
            
            # Create PMORequest
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
            return HttpResponse('Invalid action')

        # Clear token
        delivery_request.approval_token = None
        delivery_request.approval_token_expiry = None
        delivery_request.save()

        # Prepare context for email template
        context = {
            'request_id': delivery_request.id,
            'account_name': delivery_request.resource_request.account_name,
            'status': delivery_request.status,
            'status_text': status_text,
            'ri_no': ri_no,
        }
        
        # Render email using the improved template
        html_message = render_to_string('resource_request/emails/request_status_notification.html', context)
        plain_message = strip_tags(html_message)
        
        # Send notification to requester
        send_threaded_email(
            subject=f"Resource Request {delivery_request.id} {status_text.capitalize()}",
            body=plain_message,
            recipients=[delivery_request.resource_request.request_owner.email],
            ticket_number=str(delivery_request.id),
            html_message=html_message,
            is_reply=False
        )

        return HttpResponse(f'Request has been {status_text}.')
    except Exception as e:
        print(f"Error in handle_pmo_approval: {str(e)}")
        return HttpResponse(f'Error processing request: {str(e)}', status=500)