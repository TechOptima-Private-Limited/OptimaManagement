from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.urls import include
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.contrib import auth

from common.views.favicon import FaviconRedirect
from crm.views.contact_form import contact_form
from massmail.views.get_oauth2_tokens import get_refresh_token
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path
from content.views import search_users
from django.conf import settings
import dal
from django.conf.urls.i18n import i18n_patterns
from resource_management.views import handle_approval

admin.site.site_header = 'Optima Management Hub'
admin.site.site_title = 'Optima Management Hub'
admin.site.index_title = 'Welcome to Optima Management Hub'
from django.http import HttpResponseForbidden
from .views import custom_404_view

handler404 = 'webcrm.views.custom_404_view'

#print("STATIC_ROOT:", settings.STATIC_ROOT)
#print("STATICFILES_DIRS:", settings.STATIC_URL)

urlpatterns = [
    path('api/', include('client.urls')),
    path('favicon.ico', FaviconRedirect.as_view()),
    path('voip/', include('voip.urls')),
    path(
        'OAuth-2/authorize/',
        staff_member_required(get_refresh_token), 
        name='get_refresh_token'
    ),
    # Direct approve-request URLs (outside i18n patterns)
    path('456/approve-request/<int:request_id>/<str:token>/<str:action>/', 
         handle_approval, name='admin_handle_approval'),
]

# Serve media files regardless of DEBUG — must be OUTSIDE i18n_patterns
# so the URL is /media/... not /en/media/...
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if 'rosetta' in settings.INSTALLED_APPS:
    urlpatterns += [
        path('rosetta/', include('rosetta.urls'))
    ]

urlpatterns += i18n_patterns(
    path(settings.SECRET_CRM_PREFIX, include('crm.urls')),
    path(settings.SECRET_CRM_PREFIX, include('common.urls')),
    path(settings.SECRET_CRM_PREFIX, include('tasks.urls')),
    path(settings.SECRET_ADMIN_PREFIX, admin.site.urls),
    path('resource-management/', include('resource_management.urls')),
    path('onboarding/', include('onboarding.urls')),  # 👈 ADD THIS LINE
    
    # Direct approve-request URLs for email links
    path('approve-request/<int:request_id>/<str:token>/<str:action>/', 
         handle_approval, name='direct_handle_approval'),
    
    path('contact-form/<uuid:uuid>/', contact_form, name='contact_form'),
    path('api/', include('content.urls')),
    path("ckeditor5/", include('django_ckeditor_5.urls')),  
    path('api/users/search/', search_users, name='search_users'),  
    
    path('api/', include('resource_management.urls')),
    # path('api/', include('assets.urls')),  # API endpoints
    path('assets/', include('assets.urls', namespace='assets')),
    path('dashboard/', include('dashboard.urls')),
    path('resource-request/', include('resource_requests.urls')),
    path('api/', include('resource_requests.urls')),
)


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# urlpatterns += [
#     path('i18n/', include('django.conf.urls.i18n')),
# ]
