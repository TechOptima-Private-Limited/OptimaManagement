from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import AssetTypeViewSet, AssetViewSet, AssetAssignmentViewSet, AssetHistoryViewSet

router = DefaultRouter()
router.register(r'asset-types', AssetTypeViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'asset-assignments', AssetAssignmentViewSet)
router.register(r'asset-history', AssetHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]