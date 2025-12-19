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
from webpush.models import PushInformation, SubscriptionInfo
import logging

logger = logging.getLogger(__name__)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        unread_only = self.request.query_params.get('unread_only', 'false').lower() == 'true'
        
        return NotificationService.get_user_notifications(
            user=user,
            unread_only=unread_only
        )
    
    def list(self, request, *args, **kwargs):
        """Override to include unread count without double-nesting results"""
        response = super().list(request, *args, **kwargs)
        
        unread_count = NotificationService.get_unread_count(request.user)
        total_count = Notification.objects.filter(recipient=request.user).count()
        
        if isinstance(response.data, dict) and 'results' in response.data:
            # Response is already paginated, just add extra fields
            response.data['unread_count'] = unread_count
            response.data['total_count'] = total_count
        else:
            # Response is a simple list, wrap it
            response.data = {
                'results': response.data,
                'unread_count': unread_count,
                'total_count': total_count
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_webpush_info(request):
    """Custom endpoint to save webpush subscription using JWT authentication"""
    try:
        user = request.user
        subscription_data = request.data.get('subscription')
        
        if not subscription_data:
            return Response({'error': 'Subscription data is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Log for debugging
        logger.info(f"💾 Saving push subscription for user {user.email}")
        
        endpoint = subscription_data.get('endpoint')
        keys = subscription_data.get('keys', {})
        auth = keys.get('auth')
        p256dh = keys.get('p256dh')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        if not all([endpoint, auth, p256dh]):
            return Response({'error': 'Incomplete subscription data'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 🟢 PREVENTION: Prune old subscriptions for this user on the same browser/device
        # This prevents duplicate notifications if the user clicks "Enable" multiple times
        # or if the browser generates a new endpoint.
        old_subscriptions = PushInformation.objects.filter(
            user=user,
            subscription__user_agent=user_agent
        ).exclude(subscription__endpoint=endpoint)
        
        if old_subscriptions.exists():
            logger.info(f"🧹 Pruning {old_subscriptions.count()} old subscriptions for {user.email}")
            for old_pi in old_subscriptions:
                old_sub = old_pi.subscription
                old_pi.delete()
                # Also delete the SubscriptionInfo if not shared
                if not PushInformation.objects.filter(subscription=old_sub).exists():
                    old_sub.delete()

        # 1. Get or create SubscriptionInfo
        sub_info, created = SubscriptionInfo.objects.get_or_create(
            endpoint=endpoint,
            defaults={
                'auth': auth, 
                'p256dh': p256dh,
                'user_agent': user_agent
            }
        )
        if not created:
            sub_info.auth = auth
            sub_info.p256dh = p256dh
            sub_info.user_agent = user_agent
            sub_info.save()
            
        # 2. Get or create PushInformation for this user and subscription
        PushInformation.objects.get_or_create(
            user=user,
            subscription=sub_info
        )
        
        return Response({'message': 'Push subscription saved successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"❌ Error saving push info: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)