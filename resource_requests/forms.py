from django import forms
from django.forms import inlineformset_factory
from .models import ResourceRequest, DeliveryRequest, BuyRateGuidance
# Import the custom widget
from .widgets import CustomDatePickerWidget
from django.db.models import Q
from django.core.exceptions import ValidationError

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


class DeliveryRequestForm(forms.ModelForm):
    class Meta:
        model = DeliveryRequest
        exclude = ['approval_token', 'approval_token_expiry']
        widgets = {
            'competency_group': forms.Select(attrs={'class': 'select2'}),
            'primary_skill': forms.TextInput(attrs={'class': 'select2'}),
            'secondary_skill': forms.TextInput(attrs={'class': 'select2'}),
            'education_qualification': forms.TextInput(attrs={'class': 'select2'}),
            'experience_in_years': forms.TextInput(attrs={'class': 'select2'}),
            'certifications': forms.Textarea(attrs={'class': 'select2'}),
            'job_description_text': forms.Textarea(attrs={'class': 'select2'}),
            'number_of_positions': forms.NumberInput(attrs={'class': 'select2'}),
            'designation': forms.Select(attrs={'class': 'select2'}),
            'allocation_type': forms.Select(attrs={'class': 'select2'}),
            'offer_type': forms.Select(attrs={'class': 'select2'}),
            'operating_model': forms.Select(attrs={'class': 'select2'}),
            'frequency': forms.Select(attrs={'class': 'select2'}),
            'location': forms.Select(attrs={'class': 'select2'}),
            'opportunity_probability': forms.Select(attrs={'class': 'select2'}),
            'business_type': forms.Select(attrs={'class': 'select2'}),
            'allocation_start_date': forms.DateInput(attrs={'class': 'select2 datepicker'}),
            'allocation_end_date': forms.DateInput(attrs={'class': 'select2 datepicker'}),
            'resource_required_date': forms.DateInput(attrs={'class': 'select2 datepicker'}),
            'delivery_buy_rate_tag_usd_hr': forms.NumberInput(attrs={'class': 'select2'}),
            # Make these fields read-only
            'buy_rate_guidance_from_usd_hr': forms.NumberInput(attrs={
                'class': 'select2',
                'readonly': 'readonly',
                'style': 'background-color: #f8f8f8; cursor: not-allowed;'
            }),
            'buy_rate_guidance_to_usd_hr': forms.NumberInput(attrs={
                'class': 'select2',
                'readonly': 'readonly',
                'style': 'background-color: #f8f8f8; cursor: not-allowed;'
            }),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add help text for delivery_buy_rate_tag_usd_hr field
        self.fields['delivery_buy_rate_tag_usd_hr'].help_text = 'This rate should not exceed the maximum guidance rate'
        
        # Ensure buy rate guidance fields are read-only
        self.fields['buy_rate_guidance_from_usd_hr'].widget.attrs['readonly'] = True
        self.fields['buy_rate_guidance_to_usd_hr'].widget.attrs['readonly'] = True

# Create the formset for DeliveryRequest
DeliveryRequestFormSet = inlineformset_factory(
    ResourceRequest,
    DeliveryRequest,
    form=DeliveryRequestForm,
    extra=0,
    max_num=1,
    can_delete=False,
)

# class JobDescriptionForm(forms.ModelForm):
#     class Meta:
#         model = JobDescription
#         fields = [
#             'primary_skill', 'secondary_skill', 'technical_skills', 'domain_skills',
#             'soft_skills', 'leadership_skills', 'education_qualification',
#             'experience_in_years', 'certifications', 'uploaded_file',
#         ]
#         widgets = {
#             'primary_skill': forms.TextInput(attrs={'class': 'select2'}),
#             'secondary_skill': forms.TextInput(attrs={'class': 'select2'}),
#             'technical_skills': forms.Textarea(attrs={'class': 'select2'}),
#             'domain_skills': forms.Textarea(attrs={'class': 'select2'}),
#             'soft_skills': forms.Textarea(attrs={'class': 'select2'}),
#             'leadership_skills': forms.Textarea(attrs={'class': 'select2'}),
#             'education_qualification': forms.TextInput(attrs={'class': 'select2'}),
#             'experience_in_years': forms.TextInput(attrs={'class': 'select2'}),
#             'certifications': forms.Textarea(attrs={'class': 'select2'}),
#             'uploaded_file': forms.FileInput(attrs={'class': 'select2'}),
#         }