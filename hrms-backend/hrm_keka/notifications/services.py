from django.contrib.auth import get_user_model
from .models import Notification
from employees.models import Employee
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationService:
    
    @staticmethod
    def create_notification(recipient, notification_type, title, message, **kwargs):
        """Create a new notification"""
        try:
            notification = Notification.objects.create(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                sender=kwargs.get('sender'),
                priority=kwargs.get('priority', 'MEDIUM'),
                related_attendance_record_id=kwargs.get('attendance_record_id'),
                related_leave_request_id=kwargs.get('leave_request_id'),
                action_url=kwargs.get('action_url', ''),
                action_text=kwargs.get('action_text', ''),
            )
            logger.info(f"✅ Notification created for {recipient.get_full_name()}: {title}")
            return notification
        except Exception as e:
            logger.error(f"❌ Failed to create notification: {str(e)}")
            return None
    
    @staticmethod
    def notify_attendance_edit_request(attendance_record, requested_data=None):
        """Notify HR about attendance edit request"""
        try:
            # Get HR users
            hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
            
            employee = attendance_record.employee
            title = f"Attendance Edit Request from {employee.user.get_full_name()}"
            
            # Build message with comparison
            current_data = {
                'check_in': attendance_record.check_in_time or 'Not recorded',
                'check_out': attendance_record.check_out_time or 'Not recorded',
                'status': attendance_record.status,
                'notes': attendance_record.notes or 'None'
            }
            
            if requested_data:
                message = f"""
Employee {employee.user.get_full_name()} has requested to edit attendance for {attendance_record.date}.

Reason: {attendance_record.edit_reason}

Current → Requested:
• Check In: {current_data['check_in']} → {requested_data.get('check_in_time', 'No change')}
• Check Out: {current_data['check_out']} → {requested_data.get('check_out_time', 'No change')}
• Status: {current_data['status']} → {requested_data.get('status', 'No change')}
• Notes: {current_data['notes']} → {requested_data.get('notes', 'No change')}
                """.strip()
            else:
                message = f"""
Employee {employee.user.get_full_name()} has requested to edit attendance for {attendance_record.date}.

Reason: {attendance_record.edit_reason}

Current Record:
• Check In: {current_data['check_in']}
• Check Out: {current_data['check_out']}
• Status: {current_data['status']}
• Notes: {current_data['notes']}
                """.strip()
            
            # Create notifications for all HR users
            for hr_user in hr_users:
                NotificationService.create_notification(
                    recipient=hr_user,
                    notification_type='ATTENDANCE_EDIT_REQUEST',
                    title=title,
                    message=message,
                    sender=employee.user,
                    priority='HIGH',
                    attendance_record_id=attendance_record.id,
                    action_url='/attendance',
                    action_text='Review Request'
                )
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create attendance edit notifications: {str(e)}")
            return False
    
    @staticmethod 
    def notify_attendance_edit_result(attendance_record, approved, approver):
        """Notify employee about attendance edit approval/rejection"""
        try:
            employee = attendance_record.employee
            approver_name = approver.get_full_name() if approver else "HR Manager"
            
            if approved:
                title = f"✅ Attendance Edit Approved for {attendance_record.date}"
                message = f"""
Your attendance edit request for {attendance_record.date} has been approved by {approver_name}.

Your attendance record has been updated with the requested changes.
                """.strip()
                notification_type = 'ATTENDANCE_EDIT_APPROVED'
                priority = 'MEDIUM'
            else:
                title = f"❌ Attendance Edit Rejected for {attendance_record.date}"
                message = f"""
Your attendance edit request for {attendance_record.date} has been rejected by {approver_name}.

Your original attendance record remains unchanged. If you have questions, please contact HR.
                """.strip()
                notification_type = 'ATTENDANCE_EDIT_REJECTED'
                priority = 'HIGH'
            
            NotificationService.create_notification(
                recipient=employee.user,
                notification_type=notification_type,
                title=title,
                message=message,
                sender=approver,
                priority=priority,
                attendance_record_id=attendance_record.id,
                action_url='/attendance',
                action_text='View Attendance'
            )
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create approval result notification: {str(e)}")
            return False
    
    @staticmethod
    def get_user_notifications(user, limit=50, unread_only=False):
        """Get notifications for a user"""
        try:
            queryset = Notification.objects.filter(recipient=user)
            
            if unread_only:
                queryset = queryset.filter(is_read=False)
            
            return queryset[:limit]
            
        except Exception as e:
            logger.error(f"❌ Failed to get notifications: {str(e)}")
            return []
    
    @staticmethod
    def get_unread_count(user):
        """Get unread notification count for user"""
        try:
            return Notification.objects.filter(recipient=user, is_read=False).count()
        except Exception as e:
            logger.error(f"❌ Failed to get unread count: {str(e)}")
            return 0
    
    @staticmethod
    def mark_notification_read(notification_id, user):
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id, recipient=user)
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"❌ Failed to mark notification as read: {str(e)}")
            return False
    
    @staticmethod
    def mark_all_read(user):
        """Mark all notifications as read for user"""
        try:
            count = Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
            return count
        except Exception as e:
            logger.error(f"❌ Failed to mark all notifications as read: {str(e)}")
            return 0
    
    @staticmethod
    def create_system_notification(title, message, recipients=None, priority='MEDIUM'):
        """Create system-wide notifications"""
        try:
            if recipients is None:
                recipients = User.objects.filter(is_active=True)
            
            notifications_created = 0
            for user in recipients:
                if NotificationService.create_notification(
                    recipient=user,
                    notification_type='SYSTEM',
                    title=title,
                    message=message,
                    priority=priority
                ):
                    notifications_created += 1
            
            return notifications_created
            
        except Exception as e:
            logger.error(f"❌ Failed to create system notifications: {str(e)}")
            return 0