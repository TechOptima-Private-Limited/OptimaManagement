# assets/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, autocomplete

app_name = 'assets'

router = DefaultRouter()
router.register(r'asset-types', views.AssetTypeViewSet)
router.register(r'assets', views.AssetViewSet)
router.register(r'asset-assignments', views.AssetAssignmentViewSet)
router.register(r'asset-history', views.AssetHistoryViewSet)

urlpatterns = [
    path('summary/', views.asset_summary, name='summary'),
    path('return-assets/', views.return_assets_form, name='return_assets_form'),
    path('asset-autocomplete/', views.AssetAutocomplete.as_view(), name='asset-autocomplete'),
    path('employee-autocomplete/', views.EmployeeAutocomplete.as_view(), name='employee-autocomplete'),
    path('manager-email-autocomplete/', views.ManagerEmailAutocomplete.as_view(), name='manager-email-autocomplete'),
]