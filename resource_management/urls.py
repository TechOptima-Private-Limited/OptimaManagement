from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from . import views

router = DefaultRouter()
router.register(r'resource-types', ResourceTypeViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'access-requests', AccessRequestViewSet, basename='access-request')

urlpatterns = [
    path('', include(router.urls)),
    path('approve-request/<int:request_id>/<str:token>/<str:action>/', 
         views.handle_approval, name='handle_approval'),
    path('approve-request/<int:request_id>/<str:token>/', 
         views.approval_confirmation, name='approval_confirmation'),
    path('resource-owner-dashboard/', 
         views.resource_owner_dashboard, name='resource_owner_dashboard'),
    path('api/resource-owner-approve/<int:request_id>/<str:token>/<str:action>/', 
         views.handle_resource_owner_approval, name='handle_resource_owner_approval'),
]