from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipient', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__username', 'recipient__first_name', 'recipient__last_name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'sender', 'notification_type', 'title', 'message', 'priority')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Related Objects', {
            'fields': ('related_attendance_record_id', 'related_leave_request_id'),
            'classes': ('collapse',)
        }),
        ('Action', {
            'fields': ('action_url', 'action_text'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipient', 'sender')