from django import forms
from django.forms import inlineformset_factory
from .models import ResourceRequest, DeliveryRequest, JobDescription

class ResourceRequestForm(forms.ModelForm):
    class Meta:
        model = ResourceRequest
        fields = [
            'account_name', 'engagement_manager_delivery_director',
            'business_unit', 'region', 'function', 'bdm_client_partner',
        ]
        widgets = {
            'account_name': forms.TextInput(attrs={'class': 'select2'}),
            'engagement_manager_delivery_director': forms.TextInput(attrs={'class': 'select2'}),
            'business_unit': forms.Select(attrs={'class': 'select2'}),
            'region': forms.TextInput(attrs={'class': 'select2'}),
            'function': forms.TextInput(attrs={'class': 'select2'}),
            'bdm_client_partner': forms.TextInput(attrs={'class': 'select2'}),
        }

DeliveryRequestFormSet = inlineformset_factory(
    ResourceRequest,
    DeliveryRequest,
    fields=[
        'id', 'competency_group', 'primary_skill', 'trainable', 'is_replacement_indent',
        'emp_id_replaced', 'designation', 'billing_title_in_sow', 'allocation_type',
        'offer_type', 'operating_model', 'frequency', 'allocation_start_date',
        'allocation_end_date', 'resource_required_date', 'location', 'country',
        'opportunity_probability', 'client_interview', 'business_type',
        'bill_rate_sow_usd_hr', 'buy_rate_guidance_from_usd_hr',
        'buy_rate_guidance_to_usd_hr', 'delivery_buy_rate_tag_usd_hr',
        'address', 'verification', 'buddy_mentor_name', 'l1_panel_name',
        'l2_panel_name', 'job_description',
    ],
    extra=1,
    can_delete=True,
    widgets={
        'competency_group': forms.Select(attrs={'class': 'select2'}),
        'primary_skill': forms.TextInput(attrs={'class': 'select2'}),
        'designation': forms.Select(attrs={'class': 'select2'}),
        'allocation_type': forms.Select(attrs={'class': 'select2'}),
        'offer_type': forms.Select(attrs={'class': 'select2'}),
        'operating_model': forms.Select(attrs={'class': 'select2'}),
        'frequency': forms.Select(attrs={'class': 'select2'}),
        'location': forms.Select(attrs={'class': 'select2'}),
        'opportunity_probability': forms.Select(attrs={'class': 'select2'}),
        'business_type': forms.Select(attrs={'class': 'select2'}),
        'job_description': forms.Select(attrs={'class': 'select2'}),
    }
)

class JobDescriptionForm(forms.ModelForm):
    class Meta:
        model = JobDescription
        fields = '__all__'
        widgets = {
            'primary_skill': forms.TextInput(attrs={'class': 'select2'}),
            'secondary_skill': forms.TextInput(attrs={'class': 'select2'}),
        }

    def clean_uploaded_file(self):
        uploaded_file = self.cleaned_data.get('uploaded_file')
        if uploaded_file:
            # Placeholder: Add logic to parse file (e.g., Excel with pandas)
            # Example: Extract primary_skill, technical_skills, etc.
            pass
        return uploaded_file