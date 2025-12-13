from django.urls import path
from . import views

# urlpatterns = [
#     path('', views.EmployeeListCreateView.as_view(), name='employee_list'),
#     path('<int:pk>/', views.EmployeeDetailView.as_view(), name='employee_detail'),
#     path('departments/', views.DepartmentListCreateView.as_view(), name='department_list'),
#     path('onboarding/', views.OnboardingTaskListCreateView.as_view(), name='onboarding_tasks'),
#     path('onboarding/<int:task_id>/complete/', views.complete_onboarding_task, name='complete_task'),


#     # New Users URLs
#     path('users/', views.UserListView.as_view(), name='user-list'),  # Users without employee records
#     path('birthdays/', views.EmployeeBirthdayListView.as_view(), name='employee-birthdays'),
#     path('festivals/', views.FestivalListView.as_view(), name='festivals'),
#     path('birthday-festival/', views.dashboard_birthday_festival_data, name='dashboard-birthday-festival'),
   
#      # Profile related URLs
#     path('profile-data/', views.get_employee_profile_data, name='employee-profile-data'),
    

# ]

urlpatterns = [
    # Employee CRUD
    path('', views.EmployeeListCreateView.as_view(), name='employee_list'),
    path('<int:pk>/', views.EmployeeDetailView.as_view(), name='employee_detail'),
    
    # Department management
    path('departments/', views.DepartmentListCreateView.as_view(), name='department_list'),
    
    # Onboarding
    path('onboarding/', views.OnboardingTaskListCreateView.as_view(), name='onboarding_tasks'),
    path('onboarding/<int:task_id>/complete/', views.complete_onboarding_task, name='complete_task'),
    
    # User management
    path('users/', views.UserListView.as_view(), name='user_list'),
    
    # Profile-specific endpoints - UPDATED
    path('profile-data/', views.get_employee_profile_data, name='employee_profile_data'),
    path('managers/profile-data/', views.get_manager_profile_data, name='manager-profile-data'),
    path('managers-with-teams/', views.get_all_managers_with_teams, name='managers_with_teams'),  # Add this line
    
    # Birthday and festival endpoints
    path('birthdays/', views.EmployeeBirthdayListView.as_view(), name='employee_birthdays'),
    path('festivals/', views.FestivalListView.as_view(), name='festivals'),
    path('birthday-festival/', views.dashboard_birthday_festival_data, name='dashboard_birthday_festival'),
]