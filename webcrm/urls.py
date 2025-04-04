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

admin.site.site_header = 'Optima Management Hub'
admin.site.site_title = 'Optima Management Hub'
admin.site.index_title = 'Welcome to Optima Management Hub'
from django.http import HttpResponseForbidden
from .views import custom_404_view

handler404 = 'webcrm.views.custom_404_view'

print("STATIC_ROOT:", settings.STATIC_ROOT)
print("STATICFILES_DIRS:", settings.STATIC_URL)

urlpatterns = [
    path('favicon.ico', FaviconRedirect.as_view()),
    path('voip/', include('voip.urls')),
    path(
        'OAuth-2/authorize/',
        staff_member_required(get_refresh_token), 
        name='get_refresh_token'
    ),   
]

urlpatterns += static(
    settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
)

if 'rosetta' in settings.INSTALLED_APPS:
    urlpatterns += [
        path('rosetta/', include('rosetta.urls'))
    ]

urlpatterns += i18n_patterns(
    path(settings.SECRET_CRM_PREFIX, include('crm.urls')),
    path(settings.SECRET_CRM_PREFIX, include('common.urls')),
    path(settings.SECRET_CRM_PREFIX, include('tasks.urls')),
    path('', admin.site.urls),
    path('resource-management/', include('resource_management.urls')),
    path('contact-form/<uuid:uuid>/', contact_form, name='contact_form'),
    path('api/', include('content.urls')),
    path("ckeditor5/", include('django_ckeditor_5.urls')),  
    path('api/users/search/', search_users, name='search_users'),  
    path('api/', include('client.urls')),
    path('api/', include('resource_management.urls')),
    # path('api/', include('assets.urls')),  # API endpoints
    path('assets/', include('assets.urls', namespace='assets')),
    path('dashboard/', include('dashboard.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
)


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# urlpatterns += [
#     path('i18n/', include('django.conf.urls.i18n')),
# ]