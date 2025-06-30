from django.urls import path
from . import views
# from .views import admin_user_assets_api

app_name = 'onboarding'

urlpatterns = [
    # Direct access (without encoded link)
    path('employee-onboarding/', views.employee_onboarding_form, name='employee_onboarding_form'),
    
    # Timestamped link access (with encoded data)
    path('employee-onboarding/<str:encoded_data>/', views.employee_onboarding_form, name='employee_onboarding_form_encoded'),
    
    # Success page
    path('success/', views.employee_onboarding_success, name='employee_onboarding_success'),

    path('user-assets/<int:user_id>/', views.admin_user_assets_api, name='admin_user_assets_api'),
]