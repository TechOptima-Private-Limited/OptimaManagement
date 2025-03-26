from django import forms
from .models import AccessRequest
from .utils import get_user_role

class AccessRequestForm(forms.ModelForm):
    class Meta:
        model = AccessRequest
        fields = ['user', 'resource', 'access_level', 'justification', 'duration', 'priority', 'status', 'requires_approval', 'approver_email', 'notes']

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_role = get_user_role(user)

        if user_role == 'employee':
            # Hide fields for employees
            self.fields.pop('priority')
            self.fields.pop('status')
            self.fields.pop('requires_approval')
            self.fields.pop('approver_email')
            self.fields.pop('notes')
            # Set the user field to the logged-in user and make it read-only
            self.fields['user'].initial = user
            self.fields['user'].disabled = True