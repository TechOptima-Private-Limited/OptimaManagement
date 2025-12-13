# onboarding/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OnboardingEmployeeViewSet, DocumentViewSet, 
    AssetViewSet, OffboardingViewSet
)

router = DefaultRouter()
router.register(r'employees', OnboardingEmployeeViewSet, basename='onboarding-employees')
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'assets', AssetViewSet, basename='assets')
router.register(r'offboarding', OffboardingViewSet, basename='offboarding')

# Use router.urls directly, not include(router.urls)
urlpatterns = router.urls