from django.urls import path
from . import views

app_name = 'onboarding'

urlpatterns = [
    # Employee-facing HTML template routes (external access)
    path('employee-form/', views.employee_onboarding_form, name='employee_onboarding_form'),
    path('employee-form/<str:encoded_data>/', views.employee_onboarding_form, name='employee_onboarding_form_encoded'),
    path('success/', views.employee_onboarding_success, name='employee_onboarding_success'),
]

# API URL patterns - these will be included under /api/onboarding/ prefix
api_urlpatterns = [
    # Employee Management APIs
    path('employees/', views.employee_list, name='api_employee_list'),
    path('employees/create/', views.employee_create, name='api_employee_create'),
    path('employees/<int:employee_id>/', views.employee_update, name='api_employee_update'),
    path('employees/<int:employee_id>/soft_delete/', views.employee_soft_delete, name='api_employee_soft_delete'),
    path('employees/<int:employee_id>/restore/', views.employee_restore, name='api_employee_restore'),
    path('employees/<int:employee_id>/update_status/', views.employee_update_status, name='api_employee_update_status'),
    path('employees/<int:employee_id>/documents_status/', views.employee_documents_status, name='api_employee_documents_status'),
    path('employees/<int:employee_id>/upload_documents/', views.employee_upload_documents, name='api_employee_upload_documents'),
    path('employees/<int:employee_id>/list_documents/', views.employee_list_documents, name='api_employee_list_documents'),
    
    # Link validation and submission APIs
    path('validate-link/<str:encoded_data>/', views.validate_onboarding_link, name='api_validate_onboarding_link'),
    path('submit/', views.employee_self_submit, name='api_employee_self_submit'),
    path('submit/<str:encoded_data>/', views.employee_self_submit, name='api_employee_self_submit_with_link'),
    
    # Offboarding APIs
    path('offboarding/', views.offboarding_list, name='api_offboarding_list'),
    path('offboarding/create/', views.offboarding_create, name='api_offboarding_create'),
    path('offboarding/<int:offboarding_id>/', views.offboarding_delete, name='api_offboarding_delete'),
]