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
    path('api/approve-request/<int:request_id>/<str:action>/', 
         views.handle_approval, name='handle_approval'),
]