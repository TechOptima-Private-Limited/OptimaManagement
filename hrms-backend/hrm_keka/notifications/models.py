from django.db import models
from django.contrib.auth import get_user_model
from employees.models import Employee

User = get_user_model()

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('ATTENDANCE_EDIT_REQUEST', 'Attendance Edit Request'),
        ('ATTENDANCE_EDIT_APPROVED', 'Attendance Edit Approved'),
        ('ATTENDANCE_EDIT_REJECTED', 'Attendance Edit Rejected'),
        ('LEAVE_REQUEST', 'Leave Request'),
        ('LEAVE_APPROVED', 'Leave Approved'),
        ('LEAVE_REJECTED', 'Leave Rejected'),
        ('SYSTEM', 'System Notification'),
        ('REMINDER', 'Reminder'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='app_notifications')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='app_sent_notifications')
    
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Optional related objects
    related_attendance_record_id = models.IntegerField(null=True, blank=True)
    related_leave_request_id = models.IntegerField(null=True, blank=True)
    
    # Metadata
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Action buttons (optional)
    action_url = models.URLField(blank=True)
    action_text = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.get_full_name()}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = models.DateTimeField(auto_now=True)
            self.save(update_fields=['is_read', 'read_at'])
    
    def get_time_since(self):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - self.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{diff.seconds // 60} minutes ago"
        elif diff < timedelta(days=1):
            return f"{diff.seconds // 3600} hours ago"
        elif diff < timedelta(days=7):
            return f"{diff.days} days ago"
        else:
            return self.created_at.strftime("%b %d, %Y")
    
    def get_icon(self):
        icon_map = {
            'ATTENDANCE_EDIT_REQUEST': '🕐',
            'ATTENDANCE_EDIT_APPROVED': '✅',
            'ATTENDANCE_EDIT_REJECTED': '❌',
            'LEAVE_REQUEST': '📅',
            'LEAVE_APPROVED': '✅',
            'LEAVE_REJECTED': '❌',
            'SYSTEM': '🔔',
            'REMINDER': '⏰',
        }
        return icon_map.get(self.notification_type, '🔔')
    
    def get_color_class(self):
        color_map = {
            'ATTENDANCE_EDIT_REQUEST': 'bg-blue-50 border-blue-200 text-blue-800',
            'ATTENDANCE_EDIT_APPROVED': 'bg-green-50 border-green-200 text-green-800',
            'ATTENDANCE_EDIT_REJECTED': 'bg-red-50 border-red-200 text-red-800',
            'LEAVE_REQUEST': 'bg-purple-50 border-purple-200 text-purple-800',
            'LEAVE_APPROVED': 'bg-green-50 border-green-200 text-green-800',
            'LEAVE_REJECTED': 'bg-red-50 border-red-200 text-red-800',
            'SYSTEM': 'bg-gray-50 border-gray-200 text-gray-800',
            'REMINDER': 'bg-yellow-50 border-yellow-200 text-yellow-800',
        }
        return color_map.get(self.notification_type, 'bg-gray-50 border-gray-200 text-gray-800')