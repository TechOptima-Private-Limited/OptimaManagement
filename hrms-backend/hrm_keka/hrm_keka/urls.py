# """
# URL configuration for hrm_keka project.

# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/5.2/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views.home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.urls import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """
# from django.contrib import admin
# from django.urls import path, include
# from django.conf import settings
# from django.conf.urls.static import static
# from onboarding import views as onboarding_views
# from onboarding.urls import api_urlpatterns
# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('api/auth/', include('authentication.urls')),
#     path('api/employees/', include('employees.urls')),
#     path('api/attendance/', include('attendance.urls')),
#     path('api/leave/', include('leave_management.urls')),
#     path('api/assets/', include('assets.urls')),
#     # # API endpoints for React components (HR interface)
#     # path('api/onboarding/', include(api_urlpatterns)),
    
#     # # Employee-facing onboarding form URLs (external access)
#     # path('en/onboarding/employee-onboarding/<str:encoded_data>/', 
#     #      onboarding_views.employee_onboarding_form, 
#     #      name='employee_onboarding_form_with_link'),
#     # path('onboarding/success/', 
#     #      onboarding_views.employee_onboarding_success, 
#     #      name='onboarding_success'),
    
#     # Direct access URLs for onboarding app
#     path('onboarding/', include('onboarding.urls')),
#     path('api/notifications/', include('notifications.urls')),
#     path('api/resource-management/', include('resource_management.urls')),]
    

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



"""
URL configuration for hrm_keka project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from onboarding import views as onboarding_views
from onboarding.urls import api_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),

    # CKEditor5 upload + browse URLs (required for image upload)
    path('ckeditor5/', include('django_ckeditor_5.urls')),

    path('api/auth/', include('authentication.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/leave/', include('leave_management.urls')),
    path('api/assets/', include('assets.urls')),
    path('api/onboarding/', include((api_urlpatterns, 'onboarding'), namespace='onboarding_api')),

    # Direct access URLs for onboarding app
    path('onboarding/', include('onboarding.urls')),

    path('api/notifications/', include('notifications.urls')),
    path('api/resource-management/', include('resource_management.urls')),
    path('api/webpush/', include('webpush.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
