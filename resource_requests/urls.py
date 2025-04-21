from django.urls import path
from . import views

# app_name = 'resource_request'

urlpatterns = [
    path('resource-request/add/', views.resource_request_create, name='resourcerequest_add'),
    path('resource-request/', views.resource_request_list, name='resourcerequest_changelist'),
    # path('job-description/add/', views.job_description_create, name='jobdescription_add'),
    path('job-description/', views.job_description_list, name='jobdescription_changelist'),
    path('pmo-approve/<int:request_id>/<str:token>/<str:action>/', views.handle_pmo_approval, name='pmo_approve'),
    # path('api/buy-rate-guidance/', views.get_buy_rate_guidance, name='buy_rate_guidance'),
]