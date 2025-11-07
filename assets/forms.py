# # assets/forms.py
# from django import forms
# from dal import autocomplete
# from django.contrib.auth.models import User
# from .models import Asset, AssetAssignment, AssetReturn
# from django.db import models
# import re

# def is_valid_email(email):
#     return bool(email and re.match(r'^[a-zA.Z0-9_.+-]+@[a-zA.Z0-9-]+\.[a-zA.Z0-9-.]+$', email))

# class EmailModelChoiceField(forms.ModelChoiceField):
#     def to_python(self, value):
#         print(f"Validating manager_email value: {value}")
#         if not value:
#             return None
#         try:
#             return self.queryset.get(email=value)
#         except (ValueError, TypeError, self.queryset.model.DoesNotExist):
#             raise forms.ValidationError(
#                 self.error_messages['invalid_choice'],
#                 code='invalid_choice',
#                 params={'value': value},
#             )

#     def prepare_value(self, value):
#         if isinstance(value, User):
#             return value.email
#         return value

# # assets/forms.py
# from django import forms
# from dal import autocomplete
# from django.contrib.auth.models import User
# from .models import Asset, AssetAssignment, AssetReturn
# from django.db import models
# import re

# def is_valid_email(email):
#     return bool(email and re.match(r'^[a-zA.Z0-9_.+-]+@[a-zA.Z0-9-]+\.[a-zA.Z0-9-.]+$', email))

# class EmailModelChoiceField(forms.ModelChoiceField):
#     def to_python(self, value):
#         print(f"Validating manager_email value: {value}")
#         if not value:
#             return None
#         try:
#             return self.queryset.get(email=value)
#         except (ValueError, TypeError, self.queryset.model.DoesNotExist):
#             raise forms.ValidationError(
#                 self.error_messages['invalid_choice'],
#                 code='invalid_choice',
#                 params={'value': value},
#             )

#     def prepare_value(self, value):
#         if isinstance(value, User):
#             return value.email
#         return value

# class AssetForm(forms.ModelForm):
#     currently_assigned_to = forms.CharField(
#         label="Currently Assigned To",
#         required=False,
#         widget=forms.TextInput(attrs={
#             'readonly': 'readonly', 
#             'style': 'background-color: #f5f5f5; cursor: not-allowed;',
#             'title': 'This field is read-only. Use Asset Assignments to assign/reassign assets.'
#         })
#     )

#     class Meta:
#         model = Asset
#         fields = '__all__'
#         widgets = {
#             'custom_attributes': forms.Textarea(attrs={'rows': 5, 'cols': 40}),
#         }

#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
        
#         # If this is an existing asset, show current assignment
#         if self.instance and self.instance.pk:
#             current_assignment = self.instance.assignments.filter(
#                 returns__isnull=True
#             ).first()
            
#             if current_assignment:
#                 employee = current_assignment.employee
#                 if employee.first_name and employee.last_name:
#                     full_name = f"{employee.first_name} {employee.last_name}"
#                     assignment_text = f"{full_name} ({employee.username})"
#                 elif employee.first_name:
#                     assignment_text = f"{employee.first_name} ({employee.username})"
#                 else:
#                     assignment_text = employee.username
                
#                 # Add assignment date for more context
#                 assigned_date = current_assignment.assigned_at.strftime("%Y-%m-%d")
#                 self.fields['currently_assigned_to'].initial = f"{assignment_text} - Assigned on {assigned_date}"
#             else:
#                 self.fields['currently_assigned_to'].initial = "Not assigned"
#         else:
#             # For new assets, hide this field since there's no assignment yet
#             self.fields['currently_assigned_to'].widget = forms.HiddenInput()

#     def save(self, commit=True):
#         # Remove the read-only field from the data before saving
#         if 'currently_assigned_to' in self.cleaned_data:
#             del self.cleaned_data['currently_assigned_to']
#         return super().save(commit)

# class AssetAssignmentForm(forms.ModelForm):
#     manager_email = EmailModelChoiceField(
#         queryset=User.objects.all(),
#         widget=autocomplete.ModelSelect2(
#             url='assets:manager-email-autocomplete',
#             attrs={
#                 'data-placeholder': 'Search for a manager by email...',
#                 'data-minimum-input-length': 2,
#             },
#         ),
#         required=False,
#         to_field_name='email',
#     )

#     class Meta:
#         model = AssetAssignment
#         fields = ['employee', 'assets', 'manager_email', 'notes']
#         widgets = {
#             'employee': autocomplete.ModelSelect2(
#                 url='assets:employee-autocomplete',
#                 attrs={
#                     'data-placeholder': 'Search for an employee by email...',
#                     'data-minimum-input-length': 2,
#                 },
#             ),
#             'assets': autocomplete.ModelSelect2Multiple(
#                 url='assets:asset-autocomplete',
#                 attrs={
#                     'data-placeholder': 'Search for assets to assign...',
#                     'data-minimum-input-length': 2,
#                 },
#                 forward=['instance_id'],
#             ),
#         }

#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         if self.instance and self.instance.pk and self.instance.manager_email:
#             try:
#                 manager = User.objects.get(email=self.instance.manager_email)
#                 self.fields['manager_email'].initial = manager.email
#                 print(f"Set manager_email initial to: {self.fields['manager_email'].initial}")
#             except User.DoesNotExist:
#                 self.fields['manager_email'].initial = None
#                 print("Manager email not found in User table.")
#         if self.instance and self.instance.pk:
#             self.fields['assets'].initial = self.instance.assets.all()
#             self.fields['assets'].widget.attrs['data-exclude-assignment'] = self.instance.id
#             print(f"Set assets initial to: {self.fields['assets'].initial}")

#     def clean(self):
#         cleaned_data = super().clean()
#         print(f"Cleaned data before conversion: {cleaned_data}")
#         manager = cleaned_data.get('manager_email')
#         if manager:
#             cleaned_data['manager_email'] = manager.email
#         else:
#             cleaned_data['manager_email'] = None
#         print(f"Cleaned data after conversion: {cleaned_data}")
#         if 'employee' in self.errors:
#             cleaned_data['employee'] = None
#             self.data = self.data.copy()
#             self.data['employee'] = ''
#         if 'manager_email' in self.errors:
#             cleaned_data['manager_email'] = None
#             self.data = self.data.copy()
#             self.data['manager_email'] = ''
#         return cleaned_data

#     def clean_manager_email(self):
#         manager = self.cleaned_data.get('manager_email')
#         print(f"Cleaning manager_email: {manager}")
#         employee = self.cleaned_data.get('employee')
#         if manager and employee and manager.email == employee.email:
#             raise forms.ValidationError("The manager cannot be the same as the employee.")
#         return manager

#     def clean_assets(self):
#         assets = self.cleaned_data.get('assets')
#         if not assets:
#             return assets
#         for asset in assets:
#             asset.refresh_from_db()
#             print(f"Asset {asset.asset_tag} status: {asset.status}")
#             exclude_id = self.instance.id if self.instance and self.instance.pk else None
#             active_assignments = AssetAssignment.objects.filter(
#                 assets=asset,
#                 returns__isnull=True
#             )
#             if exclude_id:
#                 active_assignments = active_assignments.exclude(id=exclude_id)
#             print(f"Active assignments for {asset.asset_tag} (excluding {exclude_id}): {active_assignments}")
#             if active_assignments.exists():
#                 print(f"Active assignment details: {[(a.id, a.employee.username) for a in active_assignments]}")
#                 if asset.status == 'AVAILABLE':
#                     print(f"Data inconsistency detected: Asset {asset.asset_tag} is AVAILABLE but has active assignments. Updating status to ASSIGNED.")
#                     asset.status = 'ASSIGNED'
#                     asset.save()
#                 raise forms.ValidationError(f"Asset {asset.asset_tag} is already assigned to another employee.")
#             if asset.status != 'AVAILABLE':
#                 print(f"Data inconsistency detected: Asset {asset.asset_tag} status is {asset.status}, but no active assignments found. Updating status to AVAILABLE.")
#                 asset.status = 'AVAILABLE'
#                 asset.save()
#         return assets

#     def save(self, commit=True):
#         instance = super().save(commit=False)
#         manager_email = self.cleaned_data.get('manager_email')
#         instance.manager_email = manager_email
#         print(f"Saving manager_email to instance: {instance.manager_email}")
#         if commit:
#             instance.save()
#             print(f"After instance.save(), manager_email: {instance.manager_email}")
#             self.save_m2m()
#             print(f"Saved instance with assets: {instance.assets.all()}")
#             instance.refresh_from_db()
#             print(f"After refresh, manager_email: {instance.manager_email}, assets: {instance.assets.all()}")
#         return instance

# class AssetReturnForm(forms.ModelForm):
#     class Meta:
#         model = AssetReturn
#         fields = ['asset', 'condition', 'notes', 'return_image']




# assets/forms.py
from django import forms
from dal import autocomplete, forward
from django.contrib.auth.models import User
from .models import Asset, AssetAssignment, AssetReturn, AssetImage, AssetAssignmentImage
from django.db import models
from django.db.models import Q
import re
from django.forms.widgets import ClearableFileInput

class MultiFileInput(ClearableFileInput):
    allow_multiple_selected = True

class AssetAssignmentImageForm(forms.ModelForm):
    # ⬇️ THIS is the line you were asking about
    image = forms.ImageField(required=False, widget=MultiFileInput(attrs={'accept': 'image/*'}))

    class Meta:
        model = AssetAssignmentImage
        fields = ['asset', 'image']

def is_valid_email(email):
    return bool(email and re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email))

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
    currently_assigned_to = forms.CharField(
        label="Currently Assigned To",
        required=False,
        widget=forms.TextInput(attrs={
            'readonly': 'readonly', 
            'style': 'background-color: #f5f5f5; cursor: not-allowed;',
            'title': 'This field is read-only. Use Asset Assignments to assign/reassign assets.'
        })
    )

    class Meta:
        model = Asset
        fields = '__all__'
        widgets = {
            'custom_attributes': forms.Textarea(attrs={'rows': 5, 'cols': 40}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # If this is an existing asset, show current assignment
        if self.instance and self.instance.pk:
            current_assignment = self.instance.assignments.filter(
                returns__isnull=True
            ).first()
            
            if current_assignment:
                employee = current_assignment.employee
                if employee.first_name and employee.last_name:
                    full_name = f"{employee.first_name} {employee.last_name}"
                    assignment_text = f"{full_name} ({employee.username})"
                elif employee.first_name:
                    assignment_text = f"{employee.first_name} ({employee.username})"
                else:
                    assignment_text = employee.username
                
                # Add assignment date for more context
                assigned_date = current_assignment.assigned_at.strftime("%Y-%m-%d")
                self.fields['currently_assigned_to'].initial = f"{assignment_text} - Assigned on {assigned_date}"
            else:
                self.fields['currently_assigned_to'].initial = "Not assigned"
        else:
            # For new assets, hide this field since there's no assignment yet
            self.fields['currently_assigned_to'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        # Remove the read-only field from cleaned_data to avoid issues
        if 'currently_assigned_to' in cleaned_data:
            del cleaned_data['currently_assigned_to']
        return cleaned_data

# Add these forms to your existing forms.py file:

class HardwareAssetForm(forms.ModelForm):
    # read-only display field
    currently_assigned_to = forms.CharField(
        label="Currently Assigned To",
        required=False,
        widget=forms.TextInput(attrs={
            'readonly': 'readonly',
            'style': 'background-color: #f5f5f5; cursor: not-allowed;',
            'title': 'This field is read-only. Use Asset Assignments to assign/reassign assets.'
        })
    )

    # MULTI-UPLOAD fields (FileField + custom widget)
    image_before_files = forms.FileField(
        label="Upload Before Images",
        required=False,
        widget=MultiFileInput(attrs={'accept': 'image/*'})
    )
    image_after_files = forms.FileField(
        label="Upload After Images",
        required=False,
        widget=MultiFileInput(attrs={'accept': 'image/*'})
    )

    class Meta:
        model = Asset
        fields = '__all__'
        widgets = {
            'custom_attributes': forms.Textarea(attrs={'rows': 5, 'cols': 40}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        from .models import AssetType
        self.fields['asset_type'].queryset = AssetType.objects.filter(category='HARDWARE', is_active=True)

        if not self.instance.pk:
            qs = self.fields['asset_type'].queryset
            if qs.exists():
                self.fields['asset_type'].initial = qs.first()
        else:
            self.fields['asset_type'].widget.attrs['readonly'] = True
            self.fields['asset_type'].widget.attrs['style'] = 'pointer-events: none; background-color: #f5f5f5;'

        if self.instance and self.instance.pk:
            try:
                current_assignment = self.instance.assignments.filter(returns__isnull=True).first()
                if current_assignment:
                    u = current_assignment.employee
                    if u.first_name and u.last_name:
                        name = f"{u.first_name} {u.last_name} ({u.username})"
                    elif u.first_name:
                        name = f"{u.first_name} ({u.username})"
                    else:
                        name = u.username
                    self.fields['currently_assigned_to'].initial = f"{name} - Assigned on {current_assignment.assigned_at:%Y-%m-%d}"
                else:
                    self.fields['currently_assigned_to'].initial = "Not assigned"
            except Exception:
                self.fields['currently_assigned_to'].initial = "Not assigned"
        else:
            self.fields['currently_assigned_to'].widget = forms.HiddenInput()

    def clean(self):
        cleaned = super().clean()
        cleaned.pop('currently_assigned_to', None)  # display-only
        # We won’t validate image_*_files here; we’ll read request.FILES in admin.save_model
        return cleaned




class SoftwareAssetForm(forms.ModelForm):
    currently_assigned_to = forms.CharField(
        label="Currently Assigned To",
        required=False,
        widget=forms.TextInput(attrs={
            'readonly': 'readonly', 
            'style': 'background-color: #f5f5f5; cursor: not-allowed;',
            'title': 'This field is read-only. Use Asset Assignments to assign/reassign assets.'
        })
    )

    class Meta:
        model = Asset
        fields = '__all__'
        widgets = {
            'custom_attributes': forms.Textarea(attrs={'rows': 5, 'cols': 40}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Filter asset types to show only software
        from .models import AssetType
        self.fields['asset_type'].queryset = AssetType.objects.filter(category='SOFTWARE', is_active=True)
        
        # If creating new asset, set default to first software type
        if not self.instance.pk:
            software_types = AssetType.objects.filter(category='SOFTWARE', is_active=True)
            if software_types.exists():
                self.fields['asset_type'].initial = software_types.first()
        else:
            # Make asset_type read-only for existing assets
            self.fields['asset_type'].widget.attrs['readonly'] = True
            self.fields['asset_type'].widget.attrs['style'] = 'pointer-events: none; background-color: #f5f5f5;'
        
        # Handle current assignment display
        if self.instance and self.instance.pk:
            try:
                current_assignment = self.instance.assignments.filter(
                    returns__isnull=True
                ).first()
                
                if current_assignment:
                    employee = current_assignment.employee
                    if employee.first_name and employee.last_name:
                        full_name = f"{employee.first_name} {employee.last_name}"
                        assignment_text = f"{full_name} ({employee.username})"
                    elif employee.first_name:
                        assignment_text = f"{employee.first_name} ({employee.username})"
                    else:
                        assignment_text = employee.username
                    
                    assigned_date = current_assignment.assigned_at.strftime("%Y-%m-%d")
                    self.fields['currently_assigned_to'].initial = f"{assignment_text} - Assigned on {assigned_date}"
                else:
                    self.fields['currently_assigned_to'].initial = "Not assigned"
            except Exception as e:
                self.fields['currently_assigned_to'].initial = "Not assigned"
        else:
            self.fields['currently_assigned_to'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        if 'currently_assigned_to' in cleaned_data:
            del cleaned_data['currently_assigned_to']
        return cleaned_data


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

    available_assets = forms.ModelMultipleChoiceField(
        queryset=Asset.objects.filter(is_active=True),
        required=False,
        widget=autocomplete.ModelSelect2Multiple(
            url='assets:available-assets-autocomplete',
            attrs={
                'data-placeholder': 'Select available assets',
                'data-html': True,
                'data-minimum-input-length': 0,
            },
            forward=('asset_types',),  # Forward the selected asset types
        ),
    )

    class Meta:
        model = AssetAssignment
        fields = ['employee', 'asset_types', 'available_assets', 'manager_email', 'notes']
        widgets = {
            'employee': autocomplete.ModelSelect2(
                url='assets:employee-autocomplete',
                attrs={
                    'data-placeholder': 'Search for an employee by email...',
                    'data-minimum-input-length': 2,
                },
            ),
            'asset_types': autocomplete.ModelSelect2Multiple(
                url='assets:asset-type-autocomplete',
                attrs={
                    'data-placeholder': 'Search for asset types to assign...',
                    'data-minimum-input-length': 2,
                    'class': 'asset-type-select',
                },
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        from .models import AssetType  # avoid circular imports

        # Initialize manager email
        if self.instance and self.instance.pk and self.instance.manager_email:
            try:
                manager = User.objects.get(email=self.instance.manager_email)
                self.fields['manager_email'].initial = manager.email
                print(f"Set manager_email initial to: {self.fields['manager_email'].initial}")
            except User.DoesNotExist:
                self.fields['manager_email'].initial = None
                print("Manager email not found in User table.")

        # Asset types setup
        self.fields['asset_types'].queryset = AssetType.objects.filter(is_active=True)
        self.fields['asset_types'].label = "Asset Types"

        # Handle initial asset types and available assets
        if self.instance and self.instance.pk:
            asset_types = self.instance.asset_types.all()
            self.fields['asset_types'].initial = asset_types
            print(f"Set asset_types initial to: {asset_types}")

            self.fields['available_assets'].initial = self.instance.assets.all()

            if asset_types.exists():
                asset_type_ids = list(asset_types.values_list('id', flat=True))

                # ✅ Fixed: use forward.Const instead of a raw list of IDs
                self.fields['available_assets'].widget.forward = [
                    forward.Const(asset_type_ids, 'asset_types')
                ]

                categories = list(asset_types.values_list('category', flat=True).distinct())
                base_qs = Asset.objects.filter(asset_type_id__in=asset_type_ids, is_active=True)
                if 'SOFTWARE' in categories and 'HARDWARE' in categories:
                    self.fields['available_assets'].queryset = base_qs.filter(
                        (Q(asset_type__category='SOFTWARE') & ~Q(status__in=['DAMAGED', 'LOST'])) |
                        (Q(asset_type__category='HARDWARE') & Q(status='AVAILABLE'))
                    )
                elif 'SOFTWARE' in categories:
                    self.fields['available_assets'].queryset = base_qs.exclude(status__in=['DAMAGED', 'LOST'])
                else:
                    self.fields['available_assets'].queryset = base_qs.filter(status='AVAILABLE')
        else:
            # For new forms
            self.fields['available_assets'].widget.forward = ['asset_types']

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

    def clean_asset_types(self):
        asset_types = self.cleaned_data.get('asset_types')
        if not asset_types:
            return asset_types
        return asset_types

    def save(self, commit=True):
        instance = super().save(commit=False)

        # Handle manager email
        manager_email = self.cleaned_data.get('manager_email')
        if manager_email:
            instance.manager_email = manager_email.email if hasattr(manager_email, 'email') else str(manager_email)

        if commit:
            instance.save()
            self.save_m2m()

            # Clear and re-add assets
            instance.assets.clear()
            available_assets = self.cleaned_data.get('available_assets', [])
            if available_assets:
                instance.assets.add(*available_assets)

                # Update asset status
                for asset in available_assets:
                    asset.status = 'ASSIGNED'
                    asset.save()

            self.save_m2m()
            print(f"Saved instance with asset types: {self.cleaned_data.get('asset_types')}")
            instance.refresh_from_db()
            print(f"After refresh, manager_email: {instance.manager_email}, asset types: {self.cleaned_data.get('asset_types')}")

        return instance

class AssetReturnForm(forms.ModelForm):
    class Meta:
        model = AssetReturn
        fields = ['asset', 'condition', 'notes', 'return_image']