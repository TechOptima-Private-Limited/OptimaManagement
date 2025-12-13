# # from django.urls import path
# # from . import views

# # urlpatterns = [
# #     # Leave Types
# #     path('types/', views.LeaveTypeListCreateView.as_view(), name='leave_types'),
# #     path('types/<int:pk>/', views.LeaveTypeDetailView.as_view(), name='leave_type_detail'),
    
# #     # Leave Policies
# #     path('policies/', views.LeavePolicyListCreateView.as_view(), name='leave_policies'),
# #     path('policies/<int:pk>/', views.LeavePolicyDetailView.as_view(), name='leave_policy_detail'),
    
# #     # Leave Requests
# #     path('requests/', views.LeaveRequestListCreateView.as_view(), name='leave_requests'),
# #     path('requests/<int:pk>/', views.LeaveRequestDetailView.as_view(), name='leave_request_detail'),
# #     path('requests/<int:request_id>/approve/', views.approve_reject_leave, name='approve_reject_leave'),
# #     path('requests/<int:request_id>/cancel/', views.cancel_leave_request, name='cancel_leave_request'),
    
# #     # Leave Balances
# #     path('balances/', views.LeaveBalanceListView.as_view(), name='leave_balances'),
# #     path('summary/', views.leave_summary, name='leave_summary'),
    
# #     # Analytics & Reports
# #     path('analytics/', views.leave_analytics, name='leave_analytics'),
# #     path('initialize-balances/', views.initialize_yearly_balances, name='initialize_yearly_balances'),

    
# # ]

# from django.urls import path
# from . import views

# urlpatterns = [
#     # Leave Types
#     path('types/', views.LeaveTypeListCreateView.as_view(), name='leave_types'),
#     path('types/<int:pk>/', views.LeaveTypeDetailView.as_view(), name='leave_type_detail'),
    
#     # Leave Policies
#     path('policies/', views.LeavePolicyListCreateView.as_view(), name='leave_policies'),
#     path('policies/<int:pk>/', views.LeavePolicyDetailView.as_view(), name='leave_policy_detail'),
    
#     # Leave Requests
#     path('requests/', views.LeaveRequestListCreateView.as_view(), name='leave_requests'),
#     path('requests/<int:pk>/', views.LeaveRequestDetailView.as_view(), name='leave_request_detail'),
#     path('requests/<int:request_id>/approve/', views.approve_leave_request, name='approve_leave'),
#     path('requests/<int:request_id>/reject/', views.reject_leave_request, name='reject_leave'),
#     path('requests/<int:request_id>/cancel/', views.cancel_leave_request, name='cancel_leave'),
    
#     # Leave Balances
#     path('balances/', views.LeaveBalanceListView.as_view(), name='leave_balances'),
    
#     path('balances/check/<int:leave_type_id>/', views.check_leave_balance, name='check_leave_balance'),
#     path('summary/', views.leave_summary, name='leave_summary'),
    
#     # Notifications
#     path('notifications/', views.NotificationListView.as_view(), name='notifications'),
#     path('notifications/<int:pk>/mark-read/', views.mark_notification_read, name='mark_notification_read'),
    
#     # Analytics & Reports (HR Only)
#     path('analytics/', views.leave_analytics, name='leave_analytics'),
#     path('initialize-balances/', views.initialize_yearly_balances, name='initialize_yearly_balances'),
# ]



from django.urls import path
from . import views

urlpatterns = [
    # Leave Types
    path('types/', views.LeaveTypeListCreateView.as_view(), name='leave_types'),
    path('types/<int:pk>/', views.LeaveTypeDetailView.as_view(), name='leave_type_detail'),
    
    # Leave Policies
    path('policies/', views.LeavePolicyListCreateView.as_view(), name='leave_policies'),
    path('policies/<int:pk>/', views.LeavePolicyDetailView.as_view(), name='leave_policy_detail'),
    
    # Leave Requests
    path('requests/', views.LeaveRequestListCreateView.as_view(), name='leave_requests'),
    path('requests/<int:pk>/', views.LeaveRequestDetailView.as_view(), name='leave_request_detail'),
    path('requests/<int:request_id>/approve/', views.approve_leave_request, name='approve_leave'),
    path('requests/<int:request_id>/reject/', views.reject_leave_request, name='reject_leave'),
    path('requests/<int:request_id>/cancel/', views.cancel_leave_request, name='cancel_leave'),
    path('requests/<int:request_id>/test-balance/', views.test_balance_update, name='test_balance_update'),  # Debug endpoint
    
    # Leave Balances
    path('balances/', views.LeaveBalanceListView.as_view(), name='leave_balances'),
    path('balances/initialize/', views.initialize_my_balances, name='initialize_my_balances'),
    path('summary/', views.leave_summary, name='leave_summary'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/mark-read/', views.mark_notification_read, name='mark_notification_read'),
    
    # Analytics & Reports (HR Only)
    path('analytics/', views.leave_analytics, name='leave_analytics'),
    path('initialize-balances/', views.initialize_yearly_balances, name='initialize_yearly_balances'),
]