# assets/urls.py
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from . import views, autocomplete

app_name = 'assets'

# API router
router = DefaultRouter()
router.register(r'asset-types', views.AssetTypeViewSet)
router.register(r'assets', views.AssetViewSet)
router.register(r'asset-assignments', views.AssetAssignmentViewSet, basename='assetassignment')
router.register(r'asset-history', views.AssetHistoryViewSet, basename='assethistory')
router.register(r'offboarding-returns', views.OffboardingAssetReturnViewSet, basename='offboardingreturn')
router.register(r'asset-returns', views.AssetReturnViewSet, basename='assetreturn')
router.register(r'employee-statuses', views.EmployeeStatusViewSet, basename='employeestatus')
router.register(r'asset-repairs', views.AssetRepairViewSet, basename='assetrepair')


urlpatterns = [
    # API endpoints
    path('api/', include((router.urls, 'assets-api'), namespace='api')),
    
    # Regular views
    path('summary/', views.asset_summary, name='summary'),
    path('export/excel/', views.export_assets_excel, name='export_assets_excel'),
    path('return-assets/', views.return_assets_form, name='return_assets_form'),
    path('asset-autocomplete/', autocomplete.AssetAutocomplete.as_view(), name='asset-autocomplete'),
    path('available-assets-autocomplete/', autocomplete.AvailableAssetsAutocomplete.as_view(), name='available-assets-autocomplete'),
    path('employee-autocomplete/', autocomplete.EmployeeAutocomplete.as_view(), name='employee-autocomplete'),
    path('manager-email-autocomplete/', autocomplete.ManagerEmailAutocomplete.as_view(), name='manager-email-autocomplete'),
    path('asset-type-autocomplete/', autocomplete.AssetTypeAutocomplete.as_view(), name='asset-type-autocomplete'),
    
    # Backward compatibility URLs
    path('assetassignment/', RedirectView.as_view(pattern_name='assets:api:assetassignment-list', permanent=True)),
    path('assetassignment/add/', RedirectView.as_view(pattern_name='assets:api:assetassignment-list', permanent=True)),
    
    # Include router URLs at the root (for API access)
    path('', include(router.urls)),
]