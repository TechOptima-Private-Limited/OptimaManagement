# dashboard/permissions.py
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from resource_requests.models import ResourceRequest, DeliveryRequest, PMORequest
from resource_management.models import Resource, AccessRequest
from assets.models import Asset

def setup_dashboard_permissions():
    # Create a group for dashboard access
    dashboard_group, created = Group.objects.get_or_create(name='AdminDashboard')
    if created:
        # Add permissions (e.g., view access to relevant models)
        content_types = [
            ContentType.objects.get_for_model(ResourceRequest),
            ContentType.objects.get_for_model(DeliveryRequest),
            ContentType.objects.get_for_model(PMORequest),
            ContentType.objects.get_for_model(Resource),
            ContentType.objects.get_for_model(AccessRequest),
            ContentType.objects.get_for_model(Asset),
        ]
        permissions = Permission.objects.filter(content_type__in=content_types)
        dashboard_group.permissions.set(permissions)
    return dashboard_group