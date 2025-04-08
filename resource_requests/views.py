from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import ResourceRequestForm, DeliveryRequestFormSet
from .models import ResourceRequest, BuyRateGuidance
from django.contrib import messages
from datetime import date

@login_required
def resource_request_create(request):
    if request.method == 'POST':
        form = ResourceRequestForm(request.POST)
        formset = DeliveryRequestFormSet(request.POST, instance=ResourceRequest())
        if form.is_valid() and formset.is_valid():
            resource_request = form.save(commit=False)
            resource_request.request_owner = request.user
            resource_request.save()
            formset.instance = resource_request
            formset.save()
            messages.success(request, 'Resource Request submitted successfully!')
            return redirect('admin:resource_request_resourcerequest_changelist')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ResourceRequestForm(
            initial={'resource_request_raised_date': date.today()}
        )
        formset = DeliveryRequestFormSet(instance=ResourceRequest())
    
    buy_rate_guidance = BuyRateGuidance.objects.all()
    return render(request, 'admin/resource_request/resource_request_form.html', {
        'form': form,
        'formset': formset,
        'buy_rate_guidance': buy_rate_guidance,
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