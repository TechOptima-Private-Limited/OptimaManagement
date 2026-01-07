from dal import autocomplete
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Resource, ResourceType
from assets.models import Asset

class UserAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()

        qs = User.objects.all()

        if self.q:
            qs = qs.filter(
                Q(username__icontains=self.q) |
                Q(first_name__icontains=self.q) |
                Q(last_name__icontains=self.q) |
                Q(email__icontains=self.q)
            )

        return qs.order_by('username')

    def get_result_label(self, item):
        full_name = item.get_full_name() or item.username
        return f"{full_name} (Employee ID: {item.username})"

class ResourceTypeAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return ResourceType.objects.none()

        qs = ResourceType.objects.filter(is_active=True)  # Only show active resource types

        if self.q:
            qs = qs.filter(
                Q(name__icontains=self.q) |
                Q(description__icontains=self.q)
            )

        return qs.order_by('name')

    def get_result_label(self, item):
        return f"{item.name} ({item.description})"

class ResourceAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Resource.objects.none()

        qs = Resource.objects.filter(is_active=True)  # Only show active resources by default

        # Filter based on request_type and resource_type if provided via GET parameters
        request_type = self.request.GET.get('request_type')
        resource_type_id = self.request.GET.get('resource_type')
        
        if resource_type_id:
            try:
                qs = qs.filter(resource_type_id=int(resource_type_id))
            except (ValueError, TypeError):
                # Handle invalid resource_type_id
                pass

        if request_type:
            if request_type == 'NEW':
                qs = qs.filter(is_active=True)
            elif request_type == 'IT':
                # For IT requests, filter to IT-related resources or none
                it_resource_types = ResourceType.objects.filter(name__icontains='IT')
                qs = qs.filter(resource_type__in=it_resource_types)
            elif request_type == 'ASSET_REPAIR':
                qs = qs.none()

        if self.q:
            qs = qs.filter(
                Q(name__icontains=self.q) |
                Q(resource_type__name__icontains=self.q) |
                Q(description__icontains=self.q)
            )

        return qs.order_by('name')

    def get_result_label(self, item):
        return f"{item.name} ({item.resource_type.name}, {item.environment})"

class AssetAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Asset.objects.none()

        qs = Asset.objects.all()

        try:
            qs = qs.filter(is_active=True)
        except Exception:
            pass

        if self.q:
            qs = qs.filter(
                Q(asset_tag__icontains=self.q) |
                Q(name__icontains=self.q) |
                Q(serial_number__icontains=self.q) |
                Q(asset_type__name__icontains=self.q)
            )

        forwarded_user_id = None
        try:
            forwarded_user_id = self.forwarded.get('user')
        except Exception:
            forwarded_user_id = None

        allowed_statuses = ['ASSIGNED', 'DAMAGED', 'LOST']

        if forwarded_user_id:
            qs = qs.filter(status__in=allowed_statuses, assignments__employee_id=forwarded_user_id).distinct()
        elif not self.request.user.is_superuser:
            qs = qs.filter(status__in=allowed_statuses, assignments__employee=self.request.user).distinct()

        return qs.order_by('asset_tag')

    def get_result_label(self, item):
        return f"{item.asset_tag} - {item.name}"