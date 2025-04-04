# assets/forms.py
from django import forms
from dal import autocomplete
from django.contrib.auth.models import User
from .models import Asset, AssetAssignment, AssetReturn
from django.db import models
import re

def is_valid_email(email):
    return bool(email and re.match(r'^[a-zA.Z0-9_.+-]+@[a-zA.Z0-9-]+\.[a-zA.Z0-9-.]+$', email))

class EmailModelChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        print(f"Validating manager_email value: {value}")
        if not value:
            return None
        try:
            return self.queryset.get(email=value)
        except (ValueError, TypeError, self.queryset.model.DoesNotExist):
            raise forms.ValidationError(
                self.error_messages['invalid_choice'],
                code='invalid_choice',
                params={'value': value},
            )

    def prepare_value(self, value):
        if isinstance(value, User):
            return value.email
        return value

class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = '__all__'
        widgets = {
            'custom_attributes': forms.Textarea(attrs={'rows': 5, 'cols': 40}),
        }

class AssetAssignmentForm(forms.ModelForm):
    manager_email = EmailModelChoiceField(
        queryset=User.objects.all(),
        widget=autocomplete.ModelSelect2(
            url='assets:manager-email-autocomplete',
            attrs={
                'data-placeholder': 'Search for a manager by email...',
                'data-minimum-input-length': 2,
            },
        ),
        required=False,
        to_field_name='email',
    )

    class Meta:
        model = AssetAssignment
        fields = ['employee', 'assets', 'manager_email', 'notes']
        widgets = {
            'employee': autocomplete.ModelSelect2(
                url='assets:employee-autocomplete',
                attrs={
                    'data-placeholder': 'Search for an employee by email...',
                    'data-minimum-input-length': 2,
                },
            ),
            'assets': autocomplete.ModelSelect2Multiple(
                url='assets:asset-autocomplete',
                attrs={
                    'data-placeholder': 'Search for assets to assign...',
                    'data-minimum-input-length': 2,
                },
                forward=['instance_id'],
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and self.instance.manager_email:
            try:
                manager = User.objects.get(email=self.instance.manager_email)
                self.fields['manager_email'].initial = manager.email
                print(f"Set manager_email initial to: {self.fields['manager_email'].initial}")
            except User.DoesNotExist:
                self.fields['manager_email'].initial = None
                print("Manager email not found in User table.")
        if self.instance and self.instance.pk:
            self.fields['assets'].initial = self.instance.assets.all()
            self.fields['assets'].widget.attrs['data-exclude-assignment'] = self.instance.id
            print(f"Set assets initial to: {self.fields['assets'].initial}")

    def clean(self):
        cleaned_data = super().clean()
        print(f"Cleaned data before conversion: {cleaned_data}")
        manager = cleaned_data.get('manager_email')
        if manager:
            cleaned_data['manager_email'] = manager.email
        else:
            cleaned_data['manager_email'] = None
        print(f"Cleaned data after conversion: {cleaned_data}")
        if 'employee' in self.errors:
            cleaned_data['employee'] = None
            self.data = self.data.copy()
            self.data['employee'] = ''
        if 'manager_email' in self.errors:
            cleaned_data['manager_email'] = None
            self.data = self.data.copy()
            self.data['manager_email'] = ''
        return cleaned_data

    def clean_manager_email(self):
        manager = self.cleaned_data.get('manager_email')
        print(f"Cleaning manager_email: {manager}")
        employee = self.cleaned_data.get('employee')
        if manager and employee and manager.email == employee.email:
            raise forms.ValidationError("The manager cannot be the same as the employee.")
        return manager

    def clean_assets(self):
        assets = self.cleaned_data.get('assets')
        if not assets:
            return assets
        for asset in assets:
            asset.refresh_from_db()
            print(f"Asset {asset.asset_tag} status: {asset.status}")
            exclude_id = self.instance.id if self.instance and self.instance.pk else None
            active_assignments = AssetAssignment.objects.filter(
                assets=asset,
                returns__isnull=True
            )
            if exclude_id:
                active_assignments = active_assignments.exclude(id=exclude_id)
            print(f"Active assignments for {asset.asset_tag} (excluding {exclude_id}): {active_assignments}")
            if active_assignments.exists():
                print(f"Active assignment details: {[(a.id, a.employee.username) for a in active_assignments]}")
                if asset.status == 'AVAILABLE':
                    print(f"Data inconsistency detected: Asset {asset.asset_tag} is AVAILABLE but has active assignments. Updating status to ASSIGNED.")
                    asset.status = 'ASSIGNED'
                    asset.save()
                raise forms.ValidationError(f"Asset {asset.asset_tag} is already assigned to another employee.")
            if asset.status != 'AVAILABLE':
                print(f"Data inconsistency detected: Asset {asset.asset_tag} status is {asset.status}, but no active assignments found. Updating status to AVAILABLE.")
                asset.status = 'AVAILABLE'
                asset.save()
        return assets

    def save(self, commit=True):
        instance = super().save(commit=False)
        manager_email = self.cleaned_data.get('manager_email')
        instance.manager_email = manager_email
        print(f"Saving manager_email to instance: {instance.manager_email}")
        if commit:
            instance.save()
            print(f"After instance.save(), manager_email: {instance.manager_email}")
            self.save_m2m()
            print(f"Saved instance with assets: {instance.assets.all()}")
            instance.refresh_from_db()
            print(f"After refresh, manager_email: {instance.manager_email}, assets: {instance.assets.all()}")
        return instance

class AssetReturnForm(forms.ModelForm):
    class Meta:
        model = AssetReturn
        fields = ['asset', 'condition', 'notes', 'return_image']