from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import AccessRequest, Resource, ResourceType
from dal import autocomplete
from django.utils.html import strip_tags
from django.utils.safestring import mark_safe
from django_ckeditor_5.widgets import CKEditor5Widget  # Corrected import


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, help_text="Required. Enter a valid email address.")

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password1', 'password2')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user

class AccessRequestForm(forms.ModelForm):
    # Custom field for approver_email to select a User but save the email
    approver_email = forms.ModelChoiceField(
        queryset=User.objects.all(),
        required=False,
        label="Approver Email",
        widget=autocomplete.ModelSelect2(
            url='user-autocomplete',
            attrs={
                'data-placeholder': 'Search for an approver by email, name, or username...',
                'data-minimum-input-length': 2,
            }
        )
    )
    # Add request_type field
    request_type = forms.ChoiceField(
        choices=[
            ('NEW', 'New Access'),
            ('IT', 'IT Support'),
        ],
        initial='NEW',
        label="Request Type",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    # Add resource_type field as searchable
    resource_type = forms.ModelChoiceField(
        queryset=ResourceType.objects.all(),
        label="Resource Type",
        required=True,
        widget=autocomplete.ModelSelect2(
            url='resourcetype-autocomplete',
            attrs={
                'data-placeholder': 'Search for a resource type...',
                'data-minimum-input-length': 2,
            }
        )
    )
    # Make resource field searchable and filterable
    resource = forms.ModelChoiceField(
        queryset=Resource.objects.all(),
        label="Resource",
        widget=autocomplete.ModelSelect2(
            url='resource-autocomplete',
            attrs={
                'data-placeholder': 'Search for a resource...',
                'data-minimum-input-length': 2,
            }
        )
    )

    # Set default duration to 365 days
    duration = forms.IntegerField(
        label="Duration (days)",
        initial=365,
        help_text="Access duration in days",
        widget=forms.NumberInput(attrs={'min': 1})
    )
    # Use CKEditor 5 for justification with image upload
    justification = forms.CharField(
        label="Justification",
        widget=CKEditor5Widget(config_name='default', attrs=({'style':'width:100%'})),  # Use CKEditor5Widget with correct config
        required=False
    )

    class Meta:
        model = AccessRequest
        fields = [
            'user', 'request_type', 'resource_type', 'resource', 'access_level', 'priority', 'justification',
            'duration', 'assigned_to', 'status', 'requires_approval', 'notes',
            'approver_email', 'approved_by', 'approved_at', 'expires_at',
            'approval_token', 'approval_token_expiry'
        ]
        widgets = {
            'assigned_to': autocomplete.ModelSelect2(
                url='user-autocomplete',
                attrs={
                    'data-placeholder': 'Search for a user...',
                    'data-minimum-input-length': 2,
                }
            ),
            'approved_by': autocomplete.ModelSelect2(
                url='user-autocomplete',
                attrs={
                    'data-placeholder': 'Search for a user...',
                    'data-minimum-input-length': 2,
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        self.obj = kwargs.get('instance', None)
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.approver_email:
            try:
                user = User.objects.get(email=self.instance.approver_email)
                self.fields['approver_email'].initial = user
            except User.DoesNotExist:
                pass

        print(f"Form initialized with user: {self.user}")
        if self.user:
            print(f"User is superuser: {self.user.is_superuser}")
            print(f"User email: {self.user.email}")
            print(f"Resource owner emails: {list(self.get_resource_owner_emails())}")
            if self.obj:
                print(f"User is assignee: {self.obj.assigned_to == self.user}")

        if self.user and not (self.user.is_superuser or self.user.email in self.get_resource_owner_emails() or (self.obj and self.obj.assigned_to == self.user)):
            print("Hiding fields for employee in AccessRequestForm")
            self.fields.pop('user', None)
            self.fields.pop('status', None)
            self.fields.pop('requires_approval', None)
            self.fields.pop('notes', None)
            self.fields.pop('approver_email', None)
            self.fields.pop('approved_by', None)
            self.fields.pop('approved_at', None)
            self.fields.pop('expires_at', None)
            self.fields.pop('approval_token', None)
            self.fields.pop('approval_token_expiry', None)
            self.fields.pop('assigned_to', None)
        else:
            print("Showing all fields for SuperUser, Resource Team member, or Assignee in AccessRequestForm")

        if self.data and self.data.get('request_type') == 'IT':
            self.fields.pop('resource_type', None)
            self.fields.pop('resource', None)
            self.fields.pop('access_level', None)
        elif self.instance and self.instance.request_type == 'IT':
            self.fields.pop('resource_type', None)
            self.fields.pop('resource', None)
            self.fields.pop('access_level', None)

        if self.fields.get('resource'):
            if 'request_type' in self.data and 'resource_type' in self.data:
                request_type = self.data.get('request_type')
                resource_type_id = self.data.get('resource_type')
                self.fields['resource'].queryset = self.get_filtered_resources(request_type, resource_type_id)
            elif self.instance and self.instance.request_type and self.instance.resource_id and self.instance.resource.resource_type_id:
                self.fields['resource'].queryset = self.get_filtered_resources(
                    self.instance.request_type,
                    self.instance.resource.resource_type_id
                )
        self.fields['justification'].label = mark_safe('<span style="font-weight: 700;">Justification</span>')
        

    def clean_justification(self):
        justification = self.cleaned_data.get('justification', '')
        return strip_tags(justification) if justification else ''

    def clean_approver_email(self):
        user = self.cleaned_data.get('approver_email')
        return user.email if user else None

    def get_resource_owner_emails(self):
        return Resource.objects.values_list('resource_team_email', flat=True)

    def get_filtered_resources(self, request_type, resource_type_id):
        base_qs = Resource.objects.filter(resource_type_id=resource_type_id) if resource_type_id else Resource.objects.all()
        if request_type == 'NEW':
            return base_qs.filter(is_active=True)
        elif request_type == 'IT':
            return base_qs.none()
        return base_qs.all()
    