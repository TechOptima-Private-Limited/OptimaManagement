# dashboard/context_processors.py
import logging
from django.contrib.auth.models import User
from resource_requests.models import ResourceRequest, DeliveryRequest, PMORequest
from resource_management.models import AccessRequest, Resource
from assets.models import Asset, AssetReturn
from crm.models import Lead, Deal, Company, Contact
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db.models import Count, Q

logger = logging.getLogger(__name__)

def get_dashboard_data():
    logger.debug("get_dashboard_data called - Accessing database")
    # Resource Requests Data
    total_requests = ResourceRequest.objects.count()
    delivery_status_dist = (
        DeliveryRequest.objects.values('status')
        .annotate(count=Count('id'))
        .order_by()
    )
    pending_deliveries = DeliveryRequest.objects.filter(status='PENDING').count()
    approved_deliveries = DeliveryRequest.objects.filter(status='APPROVED').count()
    rejected_deliveries = DeliveryRequest.objects.filter(status='REJECTED').count()
    approved_pmo = PMORequest.objects.filter(is_approved=True).count()
    pmo_by_business_unit = (
        PMORequest.objects.values('business_unit')
        .annotate(count=Count('id'))
        .order_by()
    )
    location_dist = (
        DeliveryRequest.objects.values('location')
        .annotate(count=Count('id'))
        .order_by()
    )
    pmo_by_business_type = (
        PMORequest.objects.values('business_type')
        .annotate(count=Count('id'))
        .order_by()
    )

    # ITSM (Resource Management) Data
    total_access_requests = AccessRequest.objects.count()
    solved_tickets = AccessRequest.objects.filter(status='APPROVED').count()
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
    active_resources = Resource.objects.filter(is_active=True).count()
    access_requests_by_date = (
        AccessRequest.objects.filter(requested_at__gte=timezone.now() - timezone.timedelta(days=30))
        .extra({'date': "date(requested_at)"})
        .values('date')
        .annotate(
            total=Count('id'),
            solved=Count('id', filter=Q(status='APPROVED'))
        )
        .order_by('date')
    )

    # Assets Data
    total_assets = Asset.objects.count()
    asset_status_dist = (
        Asset.objects.values('status')
        .annotate(count=Count('id'))
        .order_by()
    )
    assigned_assets = Asset.objects.filter(status='ASSIGNED').count()
    available_assets = Asset.objects.filter(status='AVAILABLE').count()
    damaged_assets = Asset.objects.filter(status='DAMAGED').count()
    return_condition_dist = (
        AssetReturn.objects.values('condition')
        .annotate(count=Count('id'))
        .order_by()
    )
    return_by_date = (
        AssetReturn.objects.filter(returned_at__gte=timezone.now() - timezone.timedelta(days=30))
        .extra({'date': "date(returned_at)"})
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    # CRM Data
    total_leads = Lead.objects.count()
    total_deals = Deal.objects.count()
    total_companies = Company.objects.count()
    total_contacts = Contact.objects.count()
    
    deal_stage_dist = (
        Deal.objects.values('stage__name')
        .annotate(count=Count('id'))
        .order_by()
    )
    
    lead_trend = (
        Lead.objects.filter(creation_date__gte=timezone.now() - timezone.timedelta(days=30))
        .extra({'date': "date(creation_date)"})
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    return {
        'resource_request': {
            'total_requests': total_requests,
            'delivery_requests': {
                'pending': pending_deliveries,
                'approved': approved_deliveries,
                'rejected': rejected_deliveries
            },
            'pmo_requests_approved': approved_pmo,
            'by_location': {item['location']: item['count'] for item in location_dist},
            'delivery_status_dist': {item['status']: item['count'] for item in delivery_status_dist},
            'pmo_by_business_unit': {item['business_unit']: item['count'] for item in pmo_by_business_unit},
            'pmo_by_business_type': {item['business_type']: item['count'] for item in pmo_by_business_type}
        },
        'resource_management': {
            'total_tickets': total_access_requests,
            'solved_tickets': solved_tickets,
            'access_requests_by_status': {item['status']: item['count'] for item in access_status_dist},
            'access_requests_by_priority': {item['priority']: item['count'] for item in access_priority_dist},
            'active_resources': active_resources,
            'access_requests_by_date': [
                {
                    'date': item['date'].strftime('%Y-%m-%d'),
                    'total': item['total'],
                    'solved': item['solved']
                } for item in access_requests_by_date
            ]
        },
        'asset_management': {
            'total_assets': total_assets,
            'assets_by_status': {item['status']: item['count'] for item in asset_status_dist},
            'assigned_assets': assigned_assets,
            'available_assets': available_assets,
            'damaged_assets': damaged_assets,
            'returned_assets_by_condition': {item['condition']: item['count'] for item in return_condition_dist},
            'return_by_date': {item['date'].strftime('%Y-%m-%d'): item['count'] for item in return_by_date}
        },
        'crm_management': {
            'total_leads': total_leads,
            'total_deals': total_deals,
            'total_companies': total_companies,
            'total_contacts': total_contacts,
            'deal_stage_dist': {item['stage__name'] or str(_('No Stage')): item['count'] for item in deal_stage_dist},
            'lead_trend': [
                {
                    'date': item['date'].strftime('%Y-%m-%d'),
                    'count': item['count']
                } for item in lead_trend
            ]
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