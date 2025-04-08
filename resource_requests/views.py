from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ResourceRequest, DeliveryRequest, PMORequest, JobDescription, Notification
from .forms import ResourceRequestForm, DeliveryRequestFormSet, JobDescriptionForm
from django.conf import settings
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ResourceRequest, DeliveryRequest, PMORequest, JobDescription, Notification, BuyRateGuidance
from .forms import ResourceRequestForm, DeliveryRequestFormSet, JobDescriptionForm
from django.conf import settings
import openpyxl
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

@login_required
def create_job_description(request):
    if request.method == 'POST':
        form = JobDescriptionForm(request.POST, request.FILES)
        if form.is_valid():
            job_description = form.save(commit=False)
            if request.FILES.get('file'):
                file = request.FILES['file']
                if file.name.endswith('.xlsx'):
                    workbook = openpyxl.load_workbook(file)
                    sheet = workbook.active
                    # Assume first row is headers, second row is data
                    headers = [cell.value for cell in sheet[1]]
                    data = [cell.value for cell in sheet[2]]
                    header_map = {
                        'Primary Skill': 'primary_skill',
                        'Secondary Skill': 'secondary_skill',
                        'Technical Skills': 'technical_skills',
                        'Domain Skills': 'domain_skills',
                        'Soft Skills': 'soft_skills',
                        'Leadership Skills': 'leadership_skills',
                        'Education Qualification': 'education_qualification',
                        'Experience in Years': 'experience_years',
                        'Certifications': 'certifications',
                    }
                    for header, value in zip(headers, data):
                        if header in header_map:
                            setattr(job_description, header_map[header], value or '')
            job_description.save()
            return redirect('create_resource_request')
    else:
        form = JobDescriptionForm()
    return render(request, 'resource_management/job_description_form.html', {'form': form})

@login_required
def create_resource_request(request):
    if request.method == 'POST':
        form = ResourceRequestForm(request.POST, user=request.user)
        formset = DeliveryRequestFormSet(request.POST, instance=ResourceRequest())
        if form.is_valid() and formset.is_valid():
            resource_request = form.save()
            formset.instance = resource_request
            instances = formset.save(commit=False)
            for instance in instances:
                # Validate Buy Rate
                try:
                    guidance = BuyRateGuidance.objects.get(location=instance.location, business_type=instance.business_type)
                    if not (guidance.from_rate <= instance.delivery_buy_rate_tag_usd_hr <= guidance.to_rate):
                        Notification.objects.create(
                            user=request.user,
                            message=f"Warning: Delivery Buy Rate {instance.delivery_buy_rate_tag_usd_hr} for {instance.id} is outside guidance range ({guidance.from_rate}-{guidance.to_rate})."
                        )
                except BuyRateGuidance.DoesNotExist:
                    pass
                instance.save()
            formset.save_m2m()
            return redirect('resource_request_detail', pk=resource_request.pk)
    else:
        form = ResourceRequestForm(user=request.user)
        formset = DeliveryRequestFormSet(instance=ResourceRequest())
    return render(request, 'resource_management/resource_request_form.html', {'form': form, 'formset': formset})

@login_required
def create_resource_request(request):
    if request.method == 'POST':
        form = ResourceRequestForm(request.POST, user=request.user)
        formset = DeliveryRequestFormSet(request.POST, instance=ResourceRequest())
        if form.is_valid() and formset.is_valid():
            resource_request = form.save()
            formset.instance = resource_request
            formset.save()
            return redirect('resource_request_detail', pk=resource_request.pk)
    else:
        form = ResourceRequestForm(user=request.user)
        formset = DeliveryRequestFormSet(instance=ResourceRequest())
    return render(request, 'resource_management/resource_request_form.html', {'form': form, 'formset': formset})

@login_required
def resource_request_detail(request, pk):
    resource_request = ResourceRequest.objects.get(pk=pk)
    return render(request, 'resource_management/resource_request_detail.html', {'resource_request': resource_request})

@login_required
def create_job_description(request):
    if request.method == 'POST':
        form = JobDescriptionForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('create_resource_request')
    else:
        form = JobDescriptionForm()
    return render(request, 'resource_management/job_description_form.html', {'form': form})

# Signal to generate PMORequest and send notifications
@receiver(post_save, sender=DeliveryRequest)
def generate_pmo_request(sender, instance, created, **kwargs):
    if created:
        pmo = PMORequest(
            delivery_request=instance,
            business_unit=instance.resource_request.business_unit,
            account_name=instance.resource_request.account_name,
            competency_group=instance.competency_group,
            billing_title_in_sow=instance.billing_title_in_sow,
            primary_skill=instance.primary_skill,
            designation=instance.designation,
            location=instance.location,
            operating_model=instance.operating_model,
            frequency=instance.frequency,
            resource_required_date=instance.resource_required_date,
            business_type=instance.business_type,
            opportunity_probability=instance.opportunity_probability
        )
        pmo.save()

        # Send HTML email
        subject = f"New Resource Request - {pmo.ri_no}"
        html_content = render_to_string('resource_management/email_notification.html', {
            'resource_request': instance.resource_request,
            'delivery': instance,
            'pmo': pmo
        })
        text_content = "New resource request submitted. Please check the system for details."
        pmo_emails = ['pmo@company.com']  # Replace with actual PMO team emails
        engagement_manager_email = f"{instance.resource_request.engagement_manager_delivery_director.lower()}@company.com"
        email = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, pmo_emails + [engagement_manager_email])
        email.attach_alternative(html_content, "text/html")
        email.send()

        # In-app notification
        Notification.objects.create(
            user=instance.resource_request.request_owner,
            message=f"Your resource request {pmo.ri_no} has been submitted and assigned to PMO."
        )