import logging
import json
from django.contrib.auth.models import User
from resource_requests.models import ResourceRequest, DeliveryRequest, PMORequest
from resource_management.models import AccessRequest, Resource
from assets.models import Asset, AssetReturn
from crm.models import Lead, Deal, Request as CrmRequest
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate

logger = logging.getLogger(__name__)

def get_dashboard_data():
    logger.debug("get_dashboard_data called - Accessing database")
    
    # 1. Resource Requests Aggregation
    resource_request_stats = ResourceRequest.objects.aggregate(
        total=Count('id')
    )
    delivery_stats = DeliveryRequest.objects.aggregate(
        pending=Count('id', filter=Q(status='PENDING')),
        approved=Count('id', filter=Q(status='APPROVED')),
        rejected=Count('id', filter=Q(status='REJECTED')),
    )
    pmo_stats = PMORequest.objects.aggregate(
        approved=Count('id', filter=Q(is_approved=True))
    )
    
    # Distribution queries
    delivery_status_dist = (
        DeliveryRequest.objects.values('status')
        .annotate(count=Count('id'))
        .order_by()
    )
    location_dist = (
        DeliveryRequest.objects.values('location')
        .annotate(count=Count('id'))
        .order_by()
    )
    pmo_by_business_unit = (
        PMORequest.objects.values('business_unit')
        .annotate(count=Count('id'))
        .order_by()
    )
    pmo_by_business_type = (
        PMORequest.objects.values('business_type')
        .annotate(count=Count('id'))
        .order_by()
    )

    # 2. ITSM (Resource Management) Aggregation
    itsm_stats = AccessRequest.objects.aggregate(
        total=Count('id'),
        # Combine status pending check
        high_priority=Count('id', filter=Q(priority='HIGH'))
    )
    active_resources = Resource.objects.filter(is_active=True).count()
    
    access_status_dist = (
        AccessRequest.objects.values('status')
        .annotate(count=Count('id'))
        .order_by()
    )
    access_priority_dist = (
        AccessRequest.objects.values('priority')
        .annotate(count=Count('id'))
        .order_by()
    )
    access_requests_by_date = (
        AccessRequest.objects.filter(requested_at__gte=timezone.now() - timezone.timedelta(days=30))
        .annotate(date=TruncDate('requested_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    # 3. Assets Aggregation
    asset_stats = Asset.objects.aggregate(
        total=Count('id'),
        assigned=Count('id', filter=Q(status='ASSIGNED')),
        available=Count('id', filter=Q(status='AVAILABLE')),
        damaged=Count('id', filter=Q(status='DAMAGED'))
    )
    
    asset_status_dist = (
        Asset.objects.values('status')
        .annotate(count=Count('id'))
        .order_by()
    )
    return_condition_dist = (
        AssetReturn.objects.values('condition')
        .annotate(count=Count('id'))
        .order_by()
    )
    return_by_date = (
        AssetReturn.objects.filter(returned_at__gte=timezone.now() - timezone.timedelta(days=30))
        .annotate(date=TruncDate('returned_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    # 4. CRM Aggregation
    crm_stats = {
        'total_leads': Lead.objects.count(),
        'total_deals': Deal.objects.count(),
        'total_requests': CrmRequest.objects.count(),
        'deal_amount_total': Deal.objects.aggregate(total=Sum('amount'))['total'] or 0,
        'lead_sources': {item['lead_source__name']: item['count'] for item in Lead.objects.values('lead_source__name').annotate(count=Count('id')) if item['lead_source__name']},
        'deal_stages': {item['stage__name']: item['count'] for item in Deal.objects.values('stage__name').annotate(count=Count('id')) if item['stage__name']},
        'request_status': CrmRequest.objects.aggregate(
            pending_count=Count('id', filter=Q(pending=True)),
            duplicate_count=Count('id', filter=Q(duplicate=True)),
            processed_count=Count('id', filter=Q(pending=False, duplicate=False))
        )
    }

    return {
        'resource_request': {
            'total_requests': resource_request_stats['total'],
            'delivery_requests': {
                'pending': delivery_stats['pending'],
                'approved': delivery_stats['approved'],
                'rejected': delivery_stats['rejected']
            },
            'pmo_requests_approved': pmo_stats['approved'],
            'by_location': {item['location']: item['count'] for item in location_dist if item['location']},
            'by_location_json': json.dumps({item['location']: item['count'] for item in location_dist if item['location']}),
            'delivery_status_dist': {item['status']: item['count'] for item in delivery_status_dist if item['status']},
            'delivery_status_dist_json': json.dumps({item['status']: item['count'] for item in delivery_status_dist if item['status']}),
            'pmo_by_business_unit': {item['business_unit']: item['count'] for item in pmo_by_business_unit if item['business_unit']},
            'pmo_by_business_unit_json': json.dumps({item['business_unit']: item['count'] for item in pmo_by_business_unit if item['business_unit']}),
            'pmo_by_business_type': {item['business_type']: item['count'] for item in pmo_by_business_type if item['business_type']},
            'pmo_by_business_type_json': json.dumps({item['business_type']: item['count'] for item in pmo_by_business_type if item['business_type']})
        },
        'resource_management': {
            'total_access_requests': itsm_stats['total'],
            'access_requests_by_status': {item['status']: item['count'] for item in access_status_dist if item['status']},
            'access_requests_by_status_json': json.dumps({item['status']: item['count'] for item in access_status_dist if item['status']}),
            'access_requests_by_priority': {item['priority']: item['count'] for item in access_priority_dist if item['priority']},
            'access_requests_by_priority_json': json.dumps({item['priority']: item['count'] for item in access_priority_dist if item['priority']}),
            'active_resources': active_resources,
            'access_requests_by_date': {item['date'].strftime('%Y-%m-%d') if hasattr(item['date'], 'strftime') else str(item['date']): item['count'] for item in access_requests_by_date if item['date']},
            'access_requests_by_date_json': json.dumps({item['date'].strftime('%Y-%m-%d') if hasattr(item['date'], 'strftime') else str(item['date']): item['count'] for item in access_requests_by_date if item['date']})
        },
        'asset_management': {
            'total_assets': asset_stats['total'],
            'assets_by_status': {item['status']: item['count'] for item in asset_status_dist if item['status']},
            'assets_by_status_json': json.dumps({item['status']: item['count'] for item in asset_status_dist if item['status']}),
            'assigned_assets': asset_stats['assigned'],
            'available_assets': asset_stats['available'],
            'damaged_assets': asset_stats['damaged'],
            'returned_assets_by_condition': {item['condition']: item['count'] for item in return_condition_dist if item['condition']},
            'returned_assets_by_condition_json': json.dumps({item['condition']: item['count'] for item in return_condition_dist if item['condition']}),
            'return_by_date': {item['date'].strftime('%Y-%m-%d') if hasattr(item['date'], 'strftime') else str(item['date']): item['count'] for item in return_by_date if item['date']},
            'return_by_date_json': json.dumps({item['date'].strftime('%Y-%m-%d') if hasattr(item['date'], 'strftime') else str(item['date']): item['count'] for item in return_by_date if item['date']})
        },
        'crm': {
            **crm_stats,
            'lead_sources_json': json.dumps(crm_stats['lead_sources']),
            'deal_stages_json': json.dumps(crm_stats['deal_stages']),
        }
    }

def dashboard_data(request):
    logger.debug("dashboard_data context processor called")
    if not request.user.is_authenticated or not request.user.is_superuser:
        return {'subtitle': _('Recent actions')}
    return {
        'dashboard_data': get_dashboard_data(),
        'subtitle': _('Dashboard Overview')
    }