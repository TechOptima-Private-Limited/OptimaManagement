# dashboard/context_processors.py
from django.contrib.auth.models import User
from resource_requests.models import ResourceRequest, DeliveryRequest, PMORequest
from resource_management.models import AccessRequest, Resource
from assets.models import Asset, AssetReturn
from django.utils.translation import gettext_lazy as _
from django.db import models


def dashboard_data(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return {'subtitle': _('Recent actions')}
    
    # Resource Requests Data
    total_requests = ResourceRequest.objects.count()
    pending_deliveries = DeliveryRequest.objects.filter(status='PENDING').count()
    approved_pmo = PMORequest.objects.filter(is_approved=True).count()
    rejected_deliveries = DeliveryRequest.objects.filter(status='REJECTED').count()
    location_dist = (
        DeliveryRequest.objects.values('location')
        .annotate(count=models.Count('id'))
        .order_by()
    )

    # Resource Management Data
    total_access_requests = AccessRequest.objects.count()
    access_status_dist = (
        AccessRequest.objects.values('status')
        .annotate(count=models.Count('id'))
        .order_by()
    )
    access_priority_dist = (
        AccessRequest.objects.values('priority')
        .annotate(count=models.Count('id'))
        .order_by()
    )
    active_resources = Resource.objects.filter(is_active=True).count()

    # Assets Data
    total_assets = Asset.objects.count()
    asset_status_dist = (
        Asset.objects.values('status')
        .annotate(count=models.Count('id'))
        .order_by()
    )
    assigned_assets = Asset.objects.filter(status='ASSIGNED').count()
    return_condition_dist = (
        AssetReturn.objects.values('condition')
        .annotate(count=models.Count('id'))
        .order_by()
    )

    dashboard_data = {
        'resource_request': {
            'total_requests': total_requests,
            'delivery_requests': {
                'pending': pending_deliveries,
                'approved': 0,  # Placeholder, as PMO tracks approvals
                'rejected': rejected_deliveries
            },
            'pmo_requests_approved': approved_pmo,
            'by_location': {item['location']: item['count'] for item in location_dist}
        },
        'resource_management': {
            'total_access_requests': total_access_requests,
            'access_requests_by_status': {item['status']: item['count'] for item in access_status_dist},
            'access_requests_by_priority': {item['priority']: item['count'] for item in access_priority_dist},
            'active_resources': active_resources
        },
        'asset_management': {
            'total_assets': total_assets,
            'assets_by_status': {item['status']: item['count'] for item in asset_status_dist},
            'assigned_assets': assigned_assets,
            'returned_assets_by_condition': {item['condition']: item['count'] for item in return_condition_dist}
        }
    }
    return {'dashboard_data': dashboard_data, 'subtitle': _('Dashboard Overview')}