from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import CategoryViewSet, PageViewSet, search_users

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'pages', PageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/users/search/', search_users, name='search_users'),
]