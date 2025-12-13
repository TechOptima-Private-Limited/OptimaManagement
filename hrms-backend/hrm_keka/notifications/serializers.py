from rest_framework import serializers
from .models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    time_since = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    color_class = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 
            'priority', 'is_read', 'read_at', 'created_at',
            'action_url', 'action_text',
            'related_attendance_record_id', 'related_leave_request_id',
            'sender_name', 'time_since', 'icon', 'color_class'
        ]
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else "System"
    
    def get_time_since(self, obj):
        return obj.get_time_since()
    
    def get_icon(self, obj):
        return obj.get_icon()
    
    def get_color_class(self, obj):
        return obj.get_color_class()

class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'notification_type', 'title', 'message', 'priority',
            'action_url', 'action_text'
        ]