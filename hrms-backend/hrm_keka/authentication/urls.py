from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('employee-register/', views.employee_register, name='employee_register'),
    path('login/', views.login, name='login'),
    path('captcha/', views.get_captcha, name='get_captcha'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/permissions/', views.me_permissions, name='me_permissions'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('users/', views.admin_user_list, name='admin_user_list'),
    path('users/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),
    path('users/<int:user_id>/set-password/', views.admin_set_user_password, name='admin_set_user_password'),
    path('users/<int:user_id>/role-access/', views.user_role_access, name='user_role_access'),
    path('users/<int:user_id>/extra-permissions/', views.set_user_extra_permissions, name='set_user_extra_permissions'),
    path('groups/', views.admin_group_list, name='admin_group_list'),
    path('groups/<int:group_id>/', views.admin_group_detail, name='admin_group_detail'),
    path('groups/create/', views.admin_group_detail, name='admin_group_create'),
    path('permissions/', views.admin_permission_list, name='admin_permission_list'),
    path('permissions/<int:permission_id>/', views.admin_permission_detail, name='admin_permission_detail'),
]