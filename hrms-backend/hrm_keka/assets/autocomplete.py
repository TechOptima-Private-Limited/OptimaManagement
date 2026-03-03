# assets/autocomplete.py
from dal import autocomplete
from django.contrib.auth import get_user_model
from .models import Asset, AssetAssignment, AssetType
from django.db import models
from django.db.models import Q
import re

User = get_user_model()

def is_valid_email(email):
    return bool(email and re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email))

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

class AssetTypeAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return AssetType.objects.none()

        qs = AssetType.objects.filter(is_active=True).order_by('name')
        
        if self.q:
            qs = qs.filter(
                models.Q(name__icontains=self.q) |
                models.Q(description__icontains=self.q) |
                models.Q(tag_prefix__icontains=self.q)
            )
            
        return qs
        
    def get_result_label(self, item):
        return f"{item.name} ({item.tag_prefix})"

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

class AvailableAssetsAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Asset.objects.none()

        qs = Asset.objects.filter(is_active=True)

        # Debug: Print all request data
        print("=" * 80)
        print(f"DEBUG - AvailableAssetsAutocomplete called")
        print(f"GET parameters: {dict(self.request.GET)}")
        print(f"Forwarded data: {getattr(self, 'forwarded', {})}")
        
        # Initialize asset_type_ids
        asset_type_ids = []
        
        # 1. Check forwarded data first (this is how Django admin sends data)
        if hasattr(self, 'forwarded') and self.forwarded:
            print(f"Found forwarded data: {self.forwarded}")
            
            # Handle different formats of forwarded data
            if 'asset_types' in self.forwarded:
                forwarded_types = self.forwarded['asset_types']
                print(f"Found forwarded asset_types: {forwarded_types} (type: {type(forwarded_types)})")
                
                if isinstance(forwarded_types, (list, tuple)):
                    asset_type_ids = [str(t) for t in forwarded_types if t is not None and str(t).strip() != '']
                elif forwarded_types is not None:
                    asset_type_ids = [str(forwarded_types)]
        
        # 2. Check for array-style parameters (asset_types[]=1&asset_types[]=2)
        if not asset_type_ids and 'asset_types[]' in self.request.GET:
            asset_type_ids = self.request.GET.getlist('asset_types[]')
            print(f"Found array-style asset_types[]: {asset_type_ids}")
        
        # 3. Check for comma-separated values (asset_types=1,2,3)
        if not asset_type_ids and 'asset_types' in self.request.GET:
            types = self.request.GET.get('asset_types')
            print(f"Found asset_types parameter: {types} (type: {type(types)})")
            
            if isinstance(types, str) and types.strip():
                if ',' in types:
                    asset_type_ids = [t.strip() for t in types.split(',') if t.strip()]
                else:
                    asset_type_ids = [types.strip()]
        
        # Convert to integers and validate
        valid_asset_type_ids = []
        if asset_type_ids:
            for id_str in asset_type_ids:
                try:
                    if id_str and str(id_str).strip():
                        valid_asset_type_ids.append(int(id_str))
                except (ValueError, TypeError) as e:
                    print(f"Warning: Invalid asset type ID '{id_str}': {e}")
            
            # Remove duplicates
            valid_asset_type_ids = list(set(valid_asset_type_ids))
        
        print(f"Final asset type IDs to filter by: {valid_asset_type_ids}")
        
        # Only show assets if asset types are selected
        if valid_asset_type_ids:
            qs = qs.filter(asset_type_id__in=valid_asset_type_ids)
            print(f"Filtered query: {qs.query}")
            
            # Debug: Print the categories of the selected asset types
            asset_types = AssetType.objects.filter(id__in=valid_asset_type_ids)
            categories = list(asset_types.values_list('category', flat=True).distinct())
            print(f"Asset type categories: {categories}")
            if 'SOFTWARE' in categories and 'HARDWARE' in categories:
                qs = qs.filter(
                    (Q(asset_type__category='SOFTWARE') & ~Q(status__in=['DAMAGED', 'LOST'])) |
                    (Q(asset_type__category='HARDWARE') & Q(status='AVAILABLE'))
                )
            elif 'SOFTWARE' in categories:
                qs = qs.exclude(status__in=['DAMAGED', 'LOST'])
            else:
                qs = qs.filter(status='AVAILABLE')
        else:
            print("No asset types selected, returning no assets")
            return Asset.objects.none()  # Return empty queryset when no asset types are selected

        # Apply search filter if query is provided
        if self.q:
            qs = qs.filter(
                Q(name__icontains=self.q) |
                Q(asset_tag__icontains=self.q) |
                Q(serial_number__icontains=self.q) |
                Q(asset_type__name__icontains=self.q) |
                Q(custom_attributes__icontains=self.q)
            )

        # Add debug info to the results
        debug_results = list(qs.select_related('asset_type').order_by('asset_type__name', 'name'))
        print(f"Found {len(debug_results)} assets")
        for asset in debug_results[:5]:  # Print first 5 for brevity
            print(f"  - {asset.name} (ID: {asset.id}, Type: {getattr(asset.asset_type, 'name', 'Unknown')}, Category: {getattr(asset.asset_type, 'category', 'Unknown')})")
        if len(debug_results) > 5:
            print(f"  ... and {len(debug_results) - 5} more")
            
        print("=" * 80)
        
        return debug_results

    def get_result_label(self, result):
        asset_type = getattr(result.asset_type, 'name', 'Unknown Type')
        status_display = dict(Asset.STATUS_CHOICES).get(getattr(result, 'status', 'UNKNOWN'), getattr(result, 'status', 'UNKNOWN'))
        
        parts = [
            f"{result.name} [{status_display}]",
            f"Type: {asset_type}"
        ]
        
        if result.asset_tag:
            parts.append(f"Tag: {result.asset_tag}")
            
        if result.serial_number:
            parts.append(f"S/N: {result.serial_number}")
        
        # Join all parts with a separator
        return " | ".join(parts)

class AssetAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Asset.objects.none()

        qs = Asset.objects.all()

        # Get the asset type from the forward dictionary or query parameters
        asset_type = self.forwarded.get('asset_types', None) if self.forwarded else None
        if not asset_type and 'asset_type' in self.request.GET:
            asset_type = self.request.GET.get('asset_type')

        if asset_type:
            qs = qs.filter(asset_type_id=asset_type)

        # Only show available assets by default unless status is specified
        status = self.forwarded.get('status', 'AVAILABLE') if self.forwarded else 'AVAILABLE'
        if status:
            qs = qs.filter(status=status)

        if self.q:
            qs = qs.filter(
                Q(name__icontains=self.q) |
                Q(asset_tag__icontains=self.q) |
                Q(serial_number__icontains=self.q) |
                Q(asset_type__name__icontains=self.q) |
                Q(custom_attributes__icontains=self.q)
            )

        return qs.distinct()

    def get_result_label(self, result):
        asset_type = getattr(result.asset_type, 'name', 'Unknown Type')
        status = getattr(result, 'status', 'UNKNOWN')
        status_display = dict(Asset.STATUS_CHOICES).get(status, status)
        
        # Add status badge with color based on status
        status_colors = {
            'AVAILABLE': 'success',
            'ASSIGNED': 'primary',
            'DAMAGED': 'danger',
            'LOST': 'secondary',
            'RETIRED': 'warning',
        }
        status_color = status_colors.get(status, 'secondary')
        
        # Add asset tag and serial number if available
        asset_info = [f"{result.name} ({asset_type})"]
        if result.asset_tag:
            asset_info.append(f"Tag: {result.asset_tag}")
        if result.serial_number:
            asset_info.append(f"S/N: {result.serial_number}")
            
        # Add status badge
        status_badge = f'<span class="badge bg-{status_color}">{status_display}</span>'
        asset_info.append(status_badge)
        
        # Add any custom attributes if they exist
        if result.custom_attributes:
            for key, value in result.custom_attributes.items():
                if value:  # Only include non-empty values
                    asset_info.append(f"{key}: {value}")
        
        return ' | '.join(asset_info)

class AssetAutocompleteOld(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        try:
            from .utils import fix_asset_status_inconsistencies
            
            if not self.request.user.is_authenticated:
                return Asset.objects.none()

            try:
                fixed_count = fix_asset_status_inconsistencies()
                if fixed_count > 0:
                    print(f"Fixed {fixed_count} asset status inconsistencies in autocomplete")
            except Exception as e:
                print(f"Warning: Could not fix asset status inconsistencies: {e}")

            qs = Asset.objects.filter(status='AVAILABLE', is_active=True)
            
            # Filter by asset type category if specified
            category = self.forwarded.get('category')
            if category in ['HARDWARE', 'SOFTWARE']:
                qs = qs.filter(asset_type__category=category)
            
            try:
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
            except Exception as e:
                print(f"Warning: Could not filter assigned assets: {e}")
            
            print(f"AssetAutocomplete queryset count: {qs.count()}")
            
            try:
                hp01 = Asset.objects.get(asset_tag='Hp-01')
                print(f"Hp-01 status: {hp01.status}, in queryset: {hp01 in qs}")
                if hp01.status == 'AVAILABLE' and hp01 not in qs:
                    qs = qs | Asset.objects.filter(id=hp01.id)
                    print("Manually added Hp-01 to available assets")
            except Asset.DoesNotExist:
                pass
            except Exception as e:
                print(f"Warning: Could not check for Hp-01: {e}")
            
            if self.q:
                qs = qs.filter(
                    models.Q(asset_tag__icontains=self.q) |
                    models.Q(name__icontains=self.q) |
                    models.Q(serial_number__icontains=self.q)
                )
            
            return qs
        except Exception as e:
            print(f"Error in AssetAutocomplete.get_queryset(): {e}")
            import traceback
            traceback.print_exc()
            # Return empty queryset to prevent server error
            return Asset.objects.none()

    def get_result_label(self, result):
        try:
            asset_type_name = result.asset_type.name if result.asset_type else "Unknown"
            return f"{asset_type_name} - {result.name} ({result.asset_tag})"
        except Exception as e:
            # Fallback if there's any issue accessing asset_type
            return f"{result.name} ({result.asset_tag})"