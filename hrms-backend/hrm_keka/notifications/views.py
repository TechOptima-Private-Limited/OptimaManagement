from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification
from .services import NotificationService
from .serializers import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        unread_only = self.request.query_params.get('unread_only', 'false').lower() == 'true'
        limit = int(self.request.query_params.get('limit', 50))
        
        return NotificationService.get_user_notifications(
            user=user,
            limit=limit,
            unread_only=unread_only
        )
    
    def list(self, request, *args, **kwargs):
        """Override to include unread count"""
        response = super().list(request, *args, **kwargs)
        
        # Add unread count to response
        unread_count = NotificationService.get_unread_count(request.user)
        
        response.data = {
            'results': response.data,
            'unread_count': unread_count,
            'total_count': Notification.objects.filter(recipient=request.user).count()
        }
        
        return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a specific notification as read"""
    try:
        success = NotificationService.mark_notification_read(notification_id, request.user)
        
        if success:
            return Response({'message': 'Notification marked as read'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"❌ Error marking notification as read: {str(e)}")
        return Response({'error': 'Failed to mark notification as read'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current user"""
    try:
        count = NotificationService.mark_all_read(request.user)
        return Response({
            'message': f'{count} notifications marked as read',
            'count': count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Error marking all notifications as read: {str(e)}")
        return Response({'error': 'Failed to mark notifications as read'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Get unread notification count"""
    try:
        count = NotificationService.get_unread_count(request.user)
        return Response({'unread_count': count}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Error getting unread count: {str(e)}")
        return Response({'error': 'Failed to get unread count'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """Delete a notification"""
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.delete()
        return Response({'message': 'Notification deleted'}, status=status.HTTP_200_OK)
        
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"❌ Error deleting notification: {str(e)}")
        return Response({'error': 'Failed to delete notification'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin/HR only views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_system_notification(request):
    """Create system-wide notification (HR/Admin only)"""
    if not (hasattr(request.user, 'profile') and 
            request.user.profile.role in ['HR_MANAGER', 'ADMIN']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        title = request.data.get('title')
        message = request.data.get('message')
        priority = request.data.get('priority', 'MEDIUM')
        
        if not title or not message:
            return Response({'error': 'Title and message are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        count = NotificationService.create_system_notification(
            title=title,
            message=message,
            priority=priority
        )
        
        return Response({
            'message': f'System notification sent to {count} users',
            'count': count
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"❌ Error creating system notification: {str(e)}")
        return Response({'error': 'Failed to create system notification'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)