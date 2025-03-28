from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import AccessRequest, Resource
from dal import autocomplete

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

    class Meta:
        model = AccessRequest
        fields = [
            'user', 'resource', 'access_level', 'priority', 'justification',
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
        # Extract user from kwargs if provided, otherwise set to None
        self.user = kwargs.pop('user', None)
        # Extract the object (AccessRequest instance) if available
        self.obj = kwargs.get('instance', None)
        super().__init__(*args, **kwargs)

        # If there's an existing approver_email, pre-select the corresponding User
        if self.instance and self.instance.approver_email:
            try:
                user = User.objects.get(email=self.instance.approver_email)
                self.fields['approver_email'].initial = user
            except User.DoesNotExist:
                pass

        # Debug log to verify user and role
        print(f"Form initialized with user: {self.user}")
        if self.user:
            print(f"User is superuser: {self.user.is_superuser}")
            print(f"User email: {self.user.email}")
            print(f"Resource owner emails: {list(self.get_resource_owner_emails())}")
            if self.obj:
                print(f"User is assignee: {self.obj.assigned_to == self.user}")

        # Check if the user is an employee (not a SuperUser, not a resource owner, and not the assignee)
        if self.user and not (self.user.is_superuser or self.user.email in self.get_resource_owner_emails() or (self.obj and self.obj.assigned_to == self.user)):
            print("Hiding fields for employee in AccessRequestForm")
            # Hide fields for employees
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
            self.fields.pop('assigned_to', None)  # Hide assigned_to for employees
        else:
            print("Showing all fields for SuperUser, Resource Team member, or Assignee in AccessRequestForm")

    def clean_approver_email(self):
        # Convert the selected User to their email address
        user = self.cleaned_data.get('approver_email')
        if user:
            return user.email
        return None

    def get_resource_owner_emails(self):
        # Get all resource owner emails
        return Resource.objects.values_list('resource_team_email', flat=True)