# dashboard/urls.py
from django.urls import path
from . import views

# Define the app_name to associate with the namespace


urlpatterns = [
    path('employee/<int:user_id>/', views.employee_summary, name='employee_summary'),
]