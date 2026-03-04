# from django.urls import path
# from . import views

# urlpatterns = [
#     path('records/', views.AttendanceRecordListView.as_view(), name='attendance_records'),
#     path('manual/', views.manual_attendance, name='manual_attendance'),
#     path('location/ping/', views.ping_location, name='attendance_location_ping'),
#     path('biometric-sync/', views.biometric_sync, name='biometric_sync'),
#     path('devices/', views.BiometricDeviceListView.as_view(), name='biometric_devices'),
#  # Add these two new URLs for approval workflow
#     path('pending-edits/', views.get_pending_edits, name='pending_edits'),
#     path('approve-edit/<int:record_id>/', views.approve_edit, name='approve_edit'),

#     path('wfh/apply/', views.apply_work_from_home, name='apply_wfh'),
#     path('wfh/status/', views.check_wfh_status, name='check_wfh_status'),
#     path('wfh/requests/', views.get_wfh_requests, name='get_wfh_requests'),
#     path('wfh/requests/<int:request_id>/approve/', views.approve_wfh_request, name='approve_wfh_request'),
# ]


from django.urls import path
from . import views

urlpatterns = [
    # Attendance Records
    path('records/', views.AttendanceRecordListView.as_view(), name='attendance_records'),
    path('manual/', views.manual_attendance, name='manual_attendance'),
    path('location/ping/', views.ping_location, name='attendance_location_ping'),
    
    # Biometric Integration
    path('biometric/sync/', views.sync_biometric_logs, name='sync_biometric_logs'),
    path('biometric/fetch/', views.fetch_biometric_logs, name='fetch_biometric_logs'),
    path('biometric-sync/', views.biometric_sync, name='biometric_sync'),  # Legacy endpoint
    path('devices/', views.BiometricDeviceListView.as_view(), name='biometric_devices'),
    
    # Approval Workflow
    path('pending-edits/', views.get_pending_edits, name='pending_edits'),
    path('approve-edit/<int:record_id>/', views.approve_edit, name='approve_edit'),

    # Work From Home
    path('wfh/apply/', views.apply_work_from_home, name='apply_wfh'),
    path('wfh/status/', views.check_wfh_status, name='check_wfh_status'),
    path('wfh/requests/', views.get_wfh_requests, name='get_wfh_requests'),
    path('wfh/requests/<int:request_id>/approve/', views.approve_wfh_request, name='approve_wfh_request'),
    path('wfh-today/', views.wfh_today, name='wfh_today'),
]