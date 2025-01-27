from django.urls import path
from . import views

urlpatterns = [
    path('clients/', views.save_client_info, name='save_client'),
    path('clients/list/', views.get_client_list, name='get_clients'),
]