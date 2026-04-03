from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from . import views
from .autocomplete import UserAutocomplete, ResourceAutocomplete,ResourceTypeAutocomplete

router = DefaultRouter()
router.register(r'resource-types', ResourceTypeViewSet)
# router.register(r'access-levels', AccessLevelViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'access-requests', AccessRequestViewSet, basename='access-request')

urlpatterns = [
    path('', include(router.urls)),
    path('company-documents/', views.company_documents_list, name='company_documents_list'),
    path('company-documents/<int:document_id>/', views.company_documents_delete, name='company_documents_delete'),
    path('approve-request/<int:request_id>/<str:token>/<str:action>/', 
         views.handle_approval, name='handle_approval'),
    path('approve-request/<int:request_id>/<str:token>/', 
         views.approval_confirmation, name='approval_confirmation'),
    path('resource-owner-dashboard/', 
         views.resource_owner_dashboard, name='resource_owner_dashboard'),
    path('resource-owner-approve/<int:request_id>/<str:token>/<str:action>/', 
         views.handle_resource_owner_approval, name='handle_resource_owner_approval'),
     path('user-autocomplete/', UserAutocomplete.as_view(), name='user-autocomplete'),
     path('resource-autocomplete/', ResourceAutocomplete.as_view(), name='resource-autocomplete'),
     path('resourcetype-autocomplete/', ResourceTypeAutocomplete.as_view(), name='resourcetype-autocomplete'),
]