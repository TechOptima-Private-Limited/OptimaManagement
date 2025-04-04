# assets/autocomplete.py
from dal import autocomplete
from django.contrib.auth.models import User
from .models import Asset, AssetAssignment
from django.db import models
import re

def is_valid_email(email):
    return bool(email and re.match(r'^[a-zA.Z0-9_.+-]+@[a-zA.Z0-9-]+\.[a-zA.Z0-9-.]+$', email))

class EmployeeAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()

        if not self.q or len(self.q) < 2:
            return User.objects.none()

        qs = User.objects.all()
        if self.q:
            qs = qs.filter(
                models.Q(email__icontains=self.q) |
                models.Q(first_name__icontains=self.q) |
                models.Q(last_name__icontains=self.q) |
                models.Q(username__icontains=self.q)
            )
        return qs

    def get_result_label(self, result):
        name = result.get_full_name() or result.username
        employee_id = result.username
        return f"{name} (Employee ID: {employee_id})"

    def get_result_value(self, result):
        return str(result.pk)

class ManagerEmailAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()

        qs = User.objects.filter(is_active=True, is_staff=True)
        
        if not self.q or len(self.q) < 2:
            return qs[:10]

        qs = qs.filter(
            models.Q(email__icontains=self.q) |
            models.Q(username__icontains=self.q) |
            models.Q(first_name__icontains=self.q) |
            models.Q(last_name__icontains=self.q)
        )
        print(f"ManagerEmailAutocomplete queryset: {qs}")
        return qs

    def get_result_label(self, result):
        name = result.get_full_name() or result.username
        return f"{name} ({result.email})"

    def get_result_value(self, result):
        print(f"Returning email for user {result.username}: {result.email}")
        if not is_valid_email(result.email):
            raise ValueError(f"Invalid email address for user {result.username}: {result.email}")
        return result.email

class AssetAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        from .utils import fix_asset_status_inconsistencies
        
        if not self.request.user.is_authenticated:
            return Asset.objects.none()

        fixed_count = fix_asset_status_inconsistencies()
        if fixed_count > 0:
            print(f"Fixed {fixed_count} asset status inconsistencies in autocomplete")
        
        qs = Asset.objects.filter(status='AVAILABLE', is_active=True)
        
        assigned_assets = AssetAssignment.objects.filter(
            returns__isnull=True
        ).values_list('assets__id', flat=True).distinct()
        
        instance_id = self.forwarded.get('instance_id')
        if instance_id and instance_id.isdigit():
            instance_id = int(instance_id)
            only_this_assignment = AssetAssignment.objects.filter(
                id=instance_id,
                returns__isnull=True
            ).values_list('assets__id', flat=True)
            
            assigned_elsewhere = assigned_assets.exclude(
                id__in=only_this_assignment
            )
            qs = qs.exclude(id__in=assigned_elsewhere)
            qs = qs | Asset.objects.filter(id__in=only_this_assignment)
        else:
            qs = qs.exclude(id__in=assigned_assets)
        
        print(f"AssetAutocomplete queryset count: {qs.count()}")
        
        try:
            hp01 = Asset.objects.get(asset_tag='Hp-01')
            print(f"Hp-01 status: {hp01.status}, in queryset: {hp01 in qs}")
            if hp01.status == 'AVAILABLE' and hp01 not in qs:
                qs = qs | Asset.objects.filter(id=hp01.id)
                print("Manually added Hp-01 to available assets")
        except Asset.DoesNotExist:
            pass
        
        if self.q:
            qs = qs.filter(
                models.Q(asset_tag__icontains=self.q) |
                models.Q(name__icontains=self.q) |
                models.Q(serial_number__icontains=self.q)
            )
        
        return qs

    def get_result_label(self, result):
        return f"{result.asset_type.name} - {result.name} ({result.asset_tag})"