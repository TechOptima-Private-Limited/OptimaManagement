from django import forms
from django.forms import inlineformset_factory
from .models import ResourceRequest, DeliveryRequest, JobDescription, BusinessUnit
from django_select2.forms import Select2Widget
from .models import ReferenceData
from django.utils import timezone

class DeliveryRequestForm(forms.ModelForm):
    job_description = forms.ModelChoiceField(
        queryset=JobDescription.objects.all(),
        widget=Select2Widget,
        required=False,
        label="Link Job Description"
    )
    competency_group = forms.ModelChoiceField(
        queryset=ReferenceData.objects.filter(category='competency_group'),
        widget=Select2Widget,
        to_field_name='value'
    )
    designation = forms.ModelChoiceField(
        queryset=ReferenceData.objects.filter(category='designation'),
        widget=Select2Widget,
        to_field_name='value'
    )

    class Meta:
        model = DeliveryRequest
        fields = ['competency_group', 'primary_skill', 'trainable', 'is_replacement_indent', 'emp_id_replaced',
                  'designation', 'billing_title_in_sow', 'allocation_type', 'offer_type', 'operating_model',
                  'frequency', 'allocation_start_date', 'allocation_end_date', 'resource_required_date',
                  'location', 'country', 'opportunity_probability', 'client_interview', 'business_type',
                  'bill_rate_sow_usd_hr', 'delivery_buy_rate_tag_usd_hr', 'address', 'buddy_mentor_name',
                  'l1_panel_name', 'l2_panel_name', 'job_description']
        widgets = {
            'primary_skill': Select2Widget,
            'allocation_start_date': forms.DateInput(attrs={'type': 'date'}),
            'allocation_end_date': forms.DateInput(attrs={'type': 'date'}),
            'resource_required_date': forms.DateInput(attrs={'type': 'date'}),
            'location': Select2Widget,
            'opportunity_probability': Select2Widget,
            'business_type': Select2Widget,
        }

class JobDescriptionForm(forms.ModelForm):
    class Meta:
        model = JobDescription
        fields = ['primary_skill', 'secondary_skill', 'technical_skills', 'domain_skills', 'soft_skills',
                  'leadership_skills', 'education_qualification', 'experience_years', 'certifications', 'file']
        widgets = {
            'technical_skills': forms.Textarea(attrs={'rows': 3}),
            'domain_skills': forms.Textarea(attrs={'rows': 3}),
            'soft_skills': forms.Textarea(attrs={'rows': 3}),
            'leadership_skills': forms.Textarea(attrs={'rows': 3}),
        }

class ResourceRequestForm(forms.ModelForm):
    class Meta:
        model = ResourceRequest
        fields = ['account_name', 'engagement_manager_delivery_director', 'business_unit', 'region', 'function', 'bdm_client_partner']
        widgets = {
            'account_name': Select2Widget,
            'engagement_manager_delivery_director': Select2Widget,
            'business_unit': Select2Widget,
            'region': Select2Widget,
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['request_owner'].initial = user
            self.fields['request_owner'].widget = forms.HiddenInput()
            self.fields['resource_request_raised_date'].initial = timezone.now().date()
            self.fields['resource_request_raised_date'].widget = forms.HiddenInput()

class DeliveryRequestForm(forms.ModelForm):
    job_description = forms.ModelChoiceField(
        queryset=JobDescription.objects.all(),
        widget=Select2Widget,
        required=False,
        label="Link Job Description"
    )

    class Meta:
        model = DeliveryRequest
        fields = ['competency_group', 'primary_skill', 'trainable', 'is_replacement_indent', 'emp_id_replaced',
                  'designation', 'billing_title_in_sow', 'allocation_type', 'offer_type', 'operating_model',
                  'frequency', 'allocation_start_date', 'allocation_end_date', 'resource_required_date',
                  'location', 'country', 'opportunity_probability', 'client_interview', 'business_type',
                  'bill_rate_sow_usd_hr', 'delivery_buy_rate_tag_usd_hr', 'address', 'buddy_mentor_name',
                  'l1_panel_name', 'l2_panel_name', 'job_description']
        widgets = {
            'competency_group': Select2Widget,
            'primary_skill': Select2Widget,
            'designation': Select2Widget,
            'allocation_start_date': forms.DateInput(attrs={'type': 'date'}),
            'allocation_end_date': forms.DateInput(attrs={'type': 'date'}),
            'resource_required_date': forms.DateInput(attrs={'type': 'date'}),
            'location': Select2Widget,
            'opportunity_probability': Select2Widget,
            'business_type': Select2Widget,
        }

DeliveryRequestFormSet = inlineformset_factory(
    ResourceRequest, DeliveryRequest, form=DeliveryRequestForm, extra=1, can_delete=True
)