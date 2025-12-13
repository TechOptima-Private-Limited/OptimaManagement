from django.urls import path
from . import views

urlpatterns = [
    # Notification CRUD
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('unread-count/', views.get_unread_count, name='unread_count'),
    path('<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    
    # Admin/HR only
    path('system/create/', views.create_system_notification, name='create_system_notification'),
]