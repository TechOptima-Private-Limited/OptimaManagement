# from django.contrib.auth import get_user_model
# from employees.models import Employee
# from .models import Notification, LeaveBalance, LeaveRequest, LeaveType
# from .utils import (
#     send_leave_request_notification,
#     send_leave_approval_notification,
#     send_leave_rejection_notification,
#     send_team_leave_notification,
#     send_leave_cancellation_notification
# )
# import logging
# from datetime import datetime

# User = get_user_model()
# logger = logging.getLogger(__name__)

# class LeaveNotificationService:
#     @staticmethod
#     def create_notification(recipient, sender, notification_type, title, message, related_object_id=None, related_object_type=None):
#         """Create a notification record"""
#         try:
#             # Ensure recipient and sender are User objects
#             if not isinstance(recipient, User):
#                 logger.error(f"❌ Invalid recipient type: {type(recipient)}")
#                 return None
                
#             notification = Notification.objects.create(
#                 recipient=recipient,
#                 sender=sender,
#                 notification_type=notification_type,
#                 title=title,
#                 message=message,
#                 related_object_id=related_object_id,
#                 related_object_type=related_object_type
#             )
#             logger.info(f"✅ Notification created: {title} for {recipient.get_full_name()}")
#             return notification
#         except Exception as e:
#             logger.error(f"❌ Failed to create notification: {e}")
#             logger.exception("Full error traceback:")
#             return None
#     @staticmethod
#     def notify_leave_request_submitted(leave_request):
#         """Notify when a leave request is submitted"""
#         try:
#             logger.info(f"🔍 Starting notification process for leave request {leave_request.id}")
            
#             # Send email notifications first
#             email_success = send_leave_request_notification(leave_request)
#             if email_success:
#                 logger.info("✅ Email notification sent successfully")
#             else:
#                 logger.warning("⚠️ Email notification failed")
            
#             # Create in-app notifications (existing code)
#             employee = leave_request.employee
            
#             # Get approvers for in-app notifications
#             approvers = []
            
#             # Add manager if exists
#             if hasattr(employee, 'manager') and employee.manager:
#                 approvers.append(employee.manager.user)
            
#             # Add HR managers
#             try:
#                 hr_users = User.objects.filter(profile__role='HR_MANAGER')
#                 approvers.extend(hr_users)
#             except:
#                 # Fallback to superusers
#                 hr_users = User.objects.filter(is_superuser=True)
#                 approvers.extend(hr_users)
            
#             # Remove duplicates
#             approvers = list(set(approvers))
            
#             # Create in-app notifications
#             for approver in approvers:
#                 try:
#                     LeaveNotificationService.create_notification(
#                         recipient=approver,
#                         sender=employee.user,
#                         notification_type='LEAVE_REQUEST',
#                         title=f'New Leave Request from {employee.user.get_full_name()}',
#                         message=f'{employee.user.get_full_name()} has requested {leave_request.days_requested} days leave from {leave_request.start_date} to {leave_request.end_date}. Reason: {leave_request.reason[:100]}...',
#                         related_object_id=leave_request.id,
#                         related_object_type='leave_request'
#                     )
#                     logger.info(f"✅ In-app notification created for {approver.get_full_name()}")
#                 except Exception as notif_error:
#                     logger.error(f"❌ Failed to create in-app notification: {notif_error}")
            
#             return email_success
            
#         except Exception as e:
#             logger.error(f"❌ Error in notify_leave_request_submitted: {e}")
#             return False
#     @staticmethod
#     def notify_leave_request_submitted(leave_request):
#         """Notify when a leave request is submitted"""
#         employee = leave_request.employee
        
#         # Get approvers (manager and HR)
#         approvers = []
        
#         # Add manager if exists
#         if employee.manager:
#             approvers.append(employee.manager.user)
        
#         # Add HR managers
#         hr_users = User.objects.filter(profile__role='HR_MANAGER')
#         approvers.extend(hr_users)
        
#         # Remove duplicates
#         approvers = list(set(approvers))
        
#         # Create in-app notifications
#         for approver in approvers:
#             LeaveNotificationService.create_notification(
#                 recipient=approver,
#                 sender=employee.user,
#                 notification_type='LEAVE_REQUEST',
#                 title=f'New Leave Request from {employee.user.get_full_name()}',
#                 message=f'{employee.user.get_full_name()} has requested {leave_request.days_requested} days leave from {leave_request.start_date} to {leave_request.end_date}. Reason: {leave_request.reason[:100]}...',
#                 related_object_id=leave_request.id,
#                 related_object_type='leave_request'
#             )
        
#         # Send email notifications using your existing email system
#         send_leave_request_notification(leave_request)
    
#     @staticmethod
#     def notify_leave_approved(leave_request, approved_by):
#         """Notify when leave is approved"""
#         employee = leave_request.employee
        
#         # Create in-app notification for employee
#         LeaveNotificationService.create_notification(
#             recipient=employee.user,
#             sender=approved_by,
#             notification_type='LEAVE_APPROVED',
#             title='Leave Request Approved',
#             message=f'Your leave request from {leave_request.start_date} to {leave_request.end_date} has been approved by {approved_by.get_full_name()}.',
#             related_object_id=leave_request.id,
#             related_object_type='leave_request'
#         )
        
#         # Create team notifications
#         LeaveNotificationService.notify_team_about_leave(leave_request, 'approved')
        
#         # Send email notifications
#         send_leave_approval_notification(leave_request, approved_by)
#         send_team_leave_notification(leave_request, 'approved')
    
#     @staticmethod
#     def notify_leave_rejected(leave_request, rejected_by, rejection_reason):
#         """Notify when leave is rejected"""
#         employee = leave_request.employee
        
#         # Create in-app notification for employee
#         LeaveNotificationService.create_notification(
#             recipient=employee.user,
#             sender=rejected_by,
#             notification_type='LEAVE_REJECTED',
#             title='Leave Request Rejected',
#             message=f'Your leave request from {leave_request.start_date} to {leave_request.end_date} has been rejected by {rejected_by.get_full_name()}. Reason: {rejection_reason}',
#             related_object_id=leave_request.id,
#             related_object_type='leave_request'
#         )
        
#         # Send email notification
#         send_leave_rejection_notification(leave_request, rejected_by)
    
#     @staticmethod
#     def notify_team_about_leave(leave_request, status):
#         """Notify team members when someone gets leave approved"""
#         employee = leave_request.employee
        
#         # Get team members (employees in same department)
#         team_members = Employee.objects.filter(
#             department=employee.department
#         ).exclude(id=employee.id)
        
#         # Also include direct reports if this person is a manager
#         direct_reports = Employee.objects.filter(manager=employee)
        
#         # Combine and remove duplicates
#         all_team_members = set(list(team_members) + list(direct_reports))
        
#         for team_member in all_team_members:
#             if status == 'approved':
#                 title = f'{employee.user.get_full_name()} will be on leave'
#                 message = f'{employee.user.get_full_name()} will be on {leave_request.leave_type.name} from {leave_request.start_date} to {leave_request.end_date} ({leave_request.days_requested} days). Plan accordingly.'
#                 notification_type = 'TEAM_LEAVE_ALERT'
#             else:
#                 title = f'{employee.user.get_full_name()} leave cancelled'
#                 message = f'{employee.user.get_full_name()} leave from {leave_request.start_date} to {leave_request.end_date} has been cancelled.'
#                 notification_type = 'LEAVE_CANCELLED'
            
#             LeaveNotificationService.create_notification(
#                 recipient=team_member.user,
#                 sender=employee.user,
#                 notification_type=notification_type,
#                 title=title,
#                 message=message,
#                 related_object_id=leave_request.id,
#                 related_object_type='leave_request'
#             )
    
#     @staticmethod
#     def notify_leave_cancelled(leave_request):
#         """Notify when leave is cancelled"""
#         employee = leave_request.employee
        
#         # Create team notifications about cancellation
#         LeaveNotificationService.notify_team_about_leave(leave_request, 'cancelled')
        
#         # Create HR notifications
#         hr_users = User.objects.filter(profile__role='HR_MANAGER')
#         for hr_user in hr_users:
#             LeaveNotificationService.create_notification(
#                 recipient=hr_user,
#                 sender=employee.user,
#                 notification_type='LEAVE_CANCELLED',
#                 title=f'Leave Cancelled - {employee.user.get_full_name()}',
#                 message=f'{employee.user.get_full_name()} has cancelled their leave from {leave_request.start_date} to {leave_request.end_date}.',
#                 related_object_id=leave_request.id,
#                 related_object_type='leave_request'
#             )
        
#         # Send email notifications
#         send_leave_cancellation_notification(leave_request)


# class LeaveBalanceService:
#     """Service for managing leave balances"""
    
#     @staticmethod
#     def get_or_create_balance(employee, leave_type, year=None):
#         """Get or create leave balance for employee"""
#         if not year:
#             year = datetime.now().year
            
#         balance, created = LeaveBalance.objects.get_or_create(
#             employee=employee,
#             leave_type=leave_type,
#             year=year,
#             defaults={
#                 'total_days': leave_type.days_allowed_per_year,
#                 'used_days': 0,
#                 'remaining_days': leave_type.days_allowed_per_year
#             }
#         )
#         return balance
    
#     @staticmethod
#     def deduct_leave_balance(leave_request):
#         """Deduct leave days from balance when leave is approved"""
#         try:
#             year = leave_request.start_date.year
#             balance = LeaveBalanceService.get_or_create_balance(
#                 leave_request.employee, 
#                 leave_request.leave_type, 
#                 year
#             )
            
#             # Check if enough balance available
#             if balance.remaining_days < leave_request.days_requested:
#                 raise ValueError(f"Insufficient leave balance. Available: {balance.remaining_days}, Requested: {leave_request.days_requested}")
            
#             # Deduct the days
#             balance.used_days += leave_request.days_requested
#             balance.remaining_days = balance.total_days - balance.used_days
#             balance.save()
            
#             logger.info(f"✅ Deducted {leave_request.days_requested} days from {leave_request.employee.user.get_full_name()}'s {leave_request.leave_type.name} balance")
#             return balance
            
#         except Exception as e:
#             logger.error(f"❌ Failed to deduct leave balance: {e}")
#             raise e
    
#     @staticmethod
#     def restore_leave_balance(leave_request):
#         """Restore leave days when leave is cancelled"""
#         try:
#             year = leave_request.start_date.year
#             balance = LeaveBalance.objects.get(
#                 employee=leave_request.employee,
#                 leave_type=leave_request.leave_type,
#                 year=year
#             )
            
#             # Restore the days
#             balance.used_days -= leave_request.days_requested
#             balance.remaining_days = balance.total_days - balance.used_days
#             balance.save()
            
#             logger.info(f"✅ Restored {leave_request.days_requested} days to {leave_request.employee.user.get_full_name()}'s {leave_request.leave_type.name} balance")
#             return balance
            
#         except LeaveBalance.DoesNotExist:
#             logger.error(f"❌ Leave balance not found for restoration")
#             return None
#         except Exception as e:
#             logger.error(f"❌ Failed to restore leave balance: {e}")
#             raise e
    
#     @staticmethod
#     def check_leave_balance(employee, leave_type, days_requested, year=None):
#         """Check if employee has enough leave balance"""
#         if not year:
#             year = datetime.now().year
            
#         balance = LeaveBalanceService.get_or_create_balance(employee, leave_type, year)
#         return balance.remaining_days >= days_requested, balance.remaining_days




# from django.contrib.auth import get_user_model
# from employees.models import Employee
# from .models import Notification, LeaveBalance, LeaveRequest, LeaveType
# from .utils import (
#     send_leave_request_notification,
#     send_leave_approval_notification,
#     send_leave_rejection_notification,
#     send_team_leave_notification,
#     send_leave_cancellation_notification
# )
# import logging
# from datetime import datetime
# from decimal import Decimal

# User = get_user_model()
# logger = logging.getLogger(__name__)

# class LeaveNotificationService:
#     @staticmethod
#     def create_notification(recipient, sender, notification_type, title, message, related_object_id=None, related_object_type=None):
#         """Create a notification record"""
#         try:
#             # Ensure recipient and sender are User objects
#             if not isinstance(recipient, User):
#                 logger.error(f"❌ Invalid recipient type: {type(recipient)}")
#                 return None
                
#             notification = Notification.objects.create(
#                 recipient=recipient,
#                 sender=sender,
#                 notification_type=notification_type,
#                 title=title,
#                 message=message,
#                 related_object_id=related_object_id,
#                 related_object_type=related_object_type
#             )
#             logger.info(f"✅ Notification created: {title} for {recipient.get_full_name()}")
#             return notification
#         except Exception as e:
#             logger.error(f"❌ Failed to create notification: {e}")
#             logger.exception("Full error traceback:")
#             return None

#     @staticmethod
#     def notify_leave_request_submitted(leave_request):
#         """Notify when a leave request is submitted"""
#         try:
#             logger.info(f"🔍 Starting notification process for leave request {leave_request.id}")
            
#             # Send email notifications first
#             email_success = send_leave_request_notification(leave_request)
#             if email_success:
#                 logger.info("✅ Email notification sent successfully")
#             else:
#                 logger.warning("⚠️ Email notification failed")
            
#             # Create in-app notifications (existing code)
#             employee = leave_request.employee
            
#             # Get approvers for in-app notifications
#             approvers = []
            
#             # Add manager if exists
#             if hasattr(employee, 'manager') and employee.manager:
#                 approvers.append(employee.manager.user)
            
#             # Add HR managers
#             try:
#                 hr_users = User.objects.filter(profile__role='HR_MANAGER')
#                 approvers.extend(hr_users)
#             except:
#                 # Fallback to superusers
#                 hr_users = User.objects.filter(is_superuser=True)
#                 approvers.extend(hr_users)
            
#             # Remove duplicates
#             approvers = list(set(approvers))
            
#             # Create in-app notifications
#             for approver in approvers:
#                 try:
#                     LeaveNotificationService.create_notification(
#                         recipient=approver,
#                         sender=employee.user,
#                         notification_type='LEAVE_REQUEST',
#                         title=f'New Leave Request from {employee.user.get_full_name()}',
#                         message=f'{employee.user.get_full_name()} has requested {leave_request.days_requested} days leave from {leave_request.start_date} to {leave_request.end_date}. Reason: {leave_request.reason[:100]}...',
#                         related_object_id=leave_request.id,
#                         related_object_type='leave_request'
#                     )
#                     logger.info(f"✅ In-app notification created for {approver.get_full_name()}")
#                 except Exception as notif_error:
#                     logger.error(f"❌ Failed to create in-app notification: {notif_error}")
            
#             return email_success
            
#         except Exception as e:
#             logger.error(f"❌ Error in notify_leave_request_submitted: {e}")
#             return False
    
#     @staticmethod
#     def notify_leave_approved(leave_request, approved_by):
#         """Notify when leave is approved"""
#         employee = leave_request.employee
        
#         # Create in-app notification for employee
#         LeaveNotificationService.create_notification(
#             recipient=employee.user,
#             sender=approved_by,
#             notification_type='LEAVE_APPROVED',
#             title='Leave Request Approved',
#             message=f'Your leave request from {leave_request.start_date} to {leave_request.end_date} has been approved by {approved_by.get_full_name()}.',
#             related_object_id=leave_request.id,
#             related_object_type='leave_request'
#         )
        
#         # Create team notifications
#         LeaveNotificationService.notify_team_about_leave(leave_request, 'approved')
        
#         # Send email notifications
#         send_leave_approval_notification(leave_request, approved_by)
#         send_team_leave_notification(leave_request, 'approved')
    
#     @staticmethod
#     def notify_leave_rejected(leave_request, rejected_by, rejection_reason):
#         """Notify when leave is rejected"""
#         employee = leave_request.employee
        
#         # Create in-app notification for employee
#         LeaveNotificationService.create_notification(
#             recipient=employee.user,
#             sender=rejected_by,
#             notification_type='LEAVE_REJECTED',
#             title='Leave Request Rejected',
#             message=f'Your leave request from {leave_request.start_date} to {leave_request.end_date} has been rejected by {rejected_by.get_full_name()}. Reason: {rejection_reason}',
#             related_object_id=leave_request.id,
#             related_object_type='leave_request'
#         )
        
#         # Send email notification
#         send_leave_rejection_notification(leave_request, rejected_by)
    
#     @staticmethod
#     def notify_team_about_leave(leave_request, status):
#         """Notify team members when someone gets leave approved"""
#         employee = leave_request.employee
        
#         # Get team members (employees in same department)
#         team_members = Employee.objects.filter(
#             department=employee.department
#         ).exclude(id=employee.id)
        
#         # Also include direct reports if this person is a manager
#         direct_reports = Employee.objects.filter(manager=employee)
        
#         # Combine and remove duplicates
#         all_team_members = set(list(team_members) + list(direct_reports))
        
#         for team_member in all_team_members:
#             if status == 'approved':
#                 title = f'{employee.user.get_full_name()} will be on leave'
#                 message = f'{employee.user.get_full_name()} will be on {leave_request.leave_type.name} from {leave_request.start_date} to {leave_request.end_date} ({leave_request.days_requested} days). Plan accordingly.'
#                 notification_type = 'TEAM_LEAVE_ALERT'
#             else:
#                 title = f'{employee.user.get_full_name()} leave cancelled'
#                 message = f'{employee.user.get_full_name()} leave from {leave_request.start_date} to {leave_request.end_date} has been cancelled.'
#                 notification_type = 'LEAVE_CANCELLED'
            
#             LeaveNotificationService.create_notification(
#                 recipient=team_member.user,
#                 sender=employee.user,
#                 notification_type=notification_type,
#                 title=title,
#                 message=message,
#                 related_object_id=leave_request.id,
#                 related_object_type='leave_request'
#             )
    
#     @staticmethod
#     def notify_leave_cancelled(leave_request):
#         """Notify when leave is cancelled"""
#         employee = leave_request.employee
        
#         # Create team notifications about cancellation
#         LeaveNotificationService.notify_team_about_leave(leave_request, 'cancelled')
        
#         # Create HR notifications
#         hr_users = User.objects.filter(profile__role='HR_MANAGER')
#         for hr_user in hr_users:
#             LeaveNotificationService.create_notification(
#                 recipient=hr_user,
#                 sender=employee.user,
#                 notification_type='LEAVE_CANCELLED',
#                 title=f'Leave Cancelled - {employee.user.get_full_name()}',
#                 message=f'{employee.user.get_full_name()} has cancelled their leave from {leave_request.start_date} to {leave_request.end_date}.',
#                 related_object_id=leave_request.id,
#                 related_object_type='leave_request'
#             )
        
#         # Send email notifications
#         send_leave_cancellation_notification(leave_request)


# class LeaveBalanceService:
#     """Service for managing leave balances"""
    
#     @staticmethod
#     def get_or_create_balance(employee, leave_type, year=None):
#         """Get or create leave balance for employee"""
#         if not year:
#             year = datetime.now().year
            
#         balance, created = LeaveBalance.objects.get_or_create(
#             employee=employee,
#             leave_type=leave_type,
#             year=year,
#             defaults={
#                 'total_days': leave_type.days_allowed_per_year,
#                 'used_days': 0,
#                 'remaining_days': leave_type.days_allowed_per_year
#             }
#         )
        
#         if created:
#             logger.info(f"✅ Created new leave balance for {employee.user.get_full_name()} - {leave_type.name} - {year}")
        
#         return balance
    
#     @staticmethod
#     def check_leave_balance(employee, leave_type, days_requested, year=None):
#         """Check if employee has enough leave balance"""
#         if not year:
#             year = datetime.now().year
            
#         balance = LeaveBalanceService.get_or_create_balance(employee, leave_type, year)
        
#         # Convert to Decimal for precise calculation
#         remaining_days = Decimal(str(balance.remaining_days))
#         days_requested_decimal = Decimal(str(days_requested))
        
#         has_sufficient_balance = remaining_days >= days_requested_decimal
        
#         logger.info(f"🔍 Balance check for {employee.user.get_full_name()}: {leave_type.name} - Available: {remaining_days}, Requested: {days_requested_decimal}, Sufficient: {has_sufficient_balance}")
        
#         return has_sufficient_balance, float(remaining_days)
    
#     @staticmethod
#     def deduct_leave_balance(leave_request):
#         """Deduct leave days from balance when leave is approved"""
#         try:
#             year = leave_request.start_date.year
#             balance = LeaveBalanceService.get_or_create_balance(
#                 leave_request.employee, 
#                 leave_request.leave_type, 
#                 year
#             )
            
#             # Convert to Decimal for precise calculation
#             current_used = Decimal(str(balance.used_days))
#             current_remaining = Decimal(str(balance.remaining_days))
#             days_to_deduct = Decimal(str(leave_request.days_requested))
            
#             # Check if enough balance available
#             if current_remaining < days_to_deduct:
#                 raise ValueError(f"Insufficient leave balance. Available: {current_remaining}, Requested: {days_to_deduct}")
            
#             # Deduct the days
#             new_used = current_used + days_to_deduct
#             new_remaining = Decimal(str(balance.total_days)) - new_used
            
#             # Update balance
#             balance.used_days = float(new_used)
#             balance.remaining_days = float(new_remaining)
#             balance.save()
            
#             logger.info(f"✅ Deducted {days_to_deduct} days from {leave_request.employee.user.get_full_name()}'s {leave_request.leave_type.name} balance. New remaining: {new_remaining}")
#             return balance
            
#         except Exception as e:
#             logger.error(f"❌ Failed to deduct leave balance: {e}")
#             raise e
    
#     @staticmethod
#     def restore_leave_balance(leave_request):
#         """Restore leave days when leave is cancelled or reverted"""
#         try:
#             year = leave_request.start_date.year
#             balance = LeaveBalance.objects.filter(
#                 employee=leave_request.employee,
#                 leave_type=leave_request.leave_type,
#                 year=year
#             ).first()
            
#             if not balance:
#                 logger.warning(f"⚠️ No leave balance found for restoration - {leave_request.employee.user.get_full_name()}")
#                 return None
            
#             # Convert to Decimal for precise calculation
#             current_used = Decimal(str(balance.used_days))
#             days_to_restore = Decimal(str(leave_request.days_requested))
            
#             # Don't restore more than was used
#             if current_used < days_to_restore:
#                 days_to_restore = current_used
#                 logger.warning(f"⚠️ Attempting to restore more days than used. Restoring only {days_to_restore}")
            
#             # Restore the days
#             new_used = current_used - days_to_restore
#             new_remaining = Decimal(str(balance.total_days)) - new_used
            
#             # Update balance
#             balance.used_days = float(new_used)
#             balance.remaining_days = float(new_remaining)
#             balance.save()
            
#             logger.info(f"✅ Restored {days_to_restore} days to {leave_request.employee.user.get_full_name()}'s {leave_request.leave_type.name} balance. New remaining: {new_remaining}")
#             return balance
            
#         except Exception as e:
#             logger.error(f"❌ Failed to restore leave balance: {e}")
#             raise e
    
#     @staticmethod
#     def get_employee_balance_summary(employee, year=None):
#         """Get complete balance summary for an employee"""
#         if not year:
#             year = datetime.now().year
            
#         balances = LeaveBalance.objects.filter(employee=employee, year=year)
        
#         summary = {
#             'year': year,
#             'balances': [],
#             'total_allocated': 0,
#             'total_used': 0,
#             'total_remaining': 0
#         }
        
#         for balance in balances:
#             balance_info = {
#                 'leave_type': balance.leave_type.name,
#                 'total_days': float(balance.total_days),
#                 'used_days': float(balance.used_days),
#                 'remaining_days': float(balance.remaining_days),
#                 'utilization_percentage': round((float(balance.used_days) / float(balance.total_days)) * 100, 2) if balance.total_days > 0 else 0
#             }
#             summary['balances'].append(balance_info)
#             summary['total_allocated'] += float(balance.total_days)
#             summary['total_used'] += float(balance.used_days)
#             summary['total_remaining'] += float(balance.remaining_days)
        
#         return summary




from django.contrib.auth import get_user_model
from employees.models import Employee
from .models import Notification, LeaveBalance, LeaveRequest, LeaveType
from .utils import (
    send_leave_request_notification,
    send_leave_approval_notification,
    send_leave_rejection_notification,
    send_team_leave_notification,
    send_leave_cancellation_notification
)
import logging
from datetime import datetime
from decimal import Decimal

User = get_user_model()
logger = logging.getLogger(__name__)

from notifications.services import NotificationService

class LeaveNotificationService:
    @staticmethod
    def create_notification(recipient, sender, notification_type, title, message, related_object_id=None, related_object_type=None):
        """Create a notification record using central service"""
        kwargs = {
            'sender': sender,
            'priority': 'MEDIUM'
        }
        if related_object_type == 'leave_request':
            kwargs['leave_request_id'] = related_object_id
            kwargs['action_url'] = '/leave'
            kwargs['action_text'] = 'View Leave'
            
        return NotificationService.create_notification(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            **kwargs
        )

    @staticmethod
    def notify_leave_request_submitted(leave_request):
        """Notify when a leave request is submitted"""
        try:
            logger.info(f"🔍 Starting notification process for leave request {leave_request.id}")
            
            # Send email notifications first
            email_success = send_leave_request_notification(leave_request)
            if email_success:
                logger.info("✅ Email notification sent successfully")
            else:
                logger.warning("⚠️ Email notification failed")
            
            # Create in-app notifications (existing code)
            employee = leave_request.employee
            
            # Get approvers for in-app notifications
            approvers = []
            
            # Add manager if exists
            if hasattr(employee, 'manager') and employee.manager:
                approvers.append(employee.manager.user)
            
            # Add HR managers and Admins
            try:
                hr_users = User.objects.filter(profile__role__in=['HR_MANAGER', 'HR_EXECUTIVE', 'ADMIN'])
                approvers.extend(hr_users)
            except:
                # Fallback to superusers
                hr_users = User.objects.filter(is_superuser=True)
                approvers.extend(hr_users)
            
            # Remove duplicates
            approvers = list(set(approvers))
            
            # Create in-app notifications
            for approver in approvers:
                try:
                    LeaveNotificationService.create_notification(
                        recipient=approver,
                        sender=employee.user,
                        notification_type='LEAVE_REQUEST',
                        title=f'New Leave Request from {employee.user.get_full_name()}',
                        message=f'{employee.user.get_full_name()} has requested {leave_request.days_requested} days leave from {leave_request.start_date} to {leave_request.end_date}. Reason: {leave_request.reason[:100]}...',
                        related_object_id=leave_request.id,
                        related_object_type='leave_request'
                    )
                    logger.info(f"✅ In-app notification created for {approver.get_full_name()}")
                except Exception as notif_error:
                    logger.error(f"❌ Failed to create in-app notification: {notif_error}")
            
            return email_success
            
        except Exception as e:
            logger.error(f"❌ Error in notify_leave_request_submitted: {e}")
            return False
    
    @staticmethod
    def notify_leave_approved(leave_request, approved_by):
        """Notify when leave is approved"""
        employee = leave_request.employee
        
        # Create in-app notification for employee
        LeaveNotificationService.create_notification(
            recipient=employee.user,
            sender=approved_by,
            notification_type='LEAVE_APPROVED',
            title='Leave Request Approved',
            message=f'Your leave request from {leave_request.start_date} to {leave_request.end_date} has been approved by {approved_by.get_full_name()}.',
            related_object_id=leave_request.id,
            related_object_type='leave_request'
        )
        
        # Create team notifications
        LeaveNotificationService.notify_team_about_leave(leave_request, 'approved')
        
        # Send email notifications
        send_leave_approval_notification(leave_request, approved_by)
        send_team_leave_notification(leave_request, 'approved')
    
    @staticmethod
    def notify_leave_rejected(leave_request, rejected_by, rejection_reason):
        """Notify when leave is rejected"""
        employee = leave_request.employee
        
        # Create in-app notification for employee
        LeaveNotificationService.create_notification(
            recipient=employee.user,
            sender=rejected_by,
            notification_type='LEAVE_REJECTED',
            title='Leave Request Rejected',
            message=f'Your leave request from {leave_request.start_date} to {leave_request.end_date} has been rejected by {rejected_by.get_full_name()}. Reason: {rejection_reason}',
            related_object_id=leave_request.id,
            related_object_type='leave_request'
        )
        
        # Send email notification
        send_leave_rejection_notification(leave_request, rejected_by)
    
    @staticmethod
    def notify_team_about_leave(leave_request, status):
        """Notify team members when someone gets leave approved"""
        employee = leave_request.employee
        
        # Get team members (employees in same department)
        team_members = Employee.objects.filter(
            department=employee.department
        ).exclude(id=employee.id)
        
        # Also include direct reports if this person is a manager
        direct_reports = Employee.objects.filter(manager=employee)
        
        # Combine and remove duplicates
        all_team_members = set(list(team_members) + list(direct_reports))
        
        for team_member in all_team_members:
            if status == 'approved':
                title = f'{employee.user.get_full_name()} will be on leave'
                message = f'{employee.user.get_full_name()} will be on {leave_request.leave_type.name} from {leave_request.start_date} to {leave_request.end_date} ({leave_request.days_requested} days). Plan accordingly.'
                notification_type = 'TEAM_LEAVE_ALERT'
            else:
                title = f'{employee.user.get_full_name()} leave cancelled'
                message = f'{employee.user.get_full_name()} leave from {leave_request.start_date} to {leave_request.end_date} has been cancelled.'
                notification_type = 'LEAVE_CANCELLED'
            
            LeaveNotificationService.create_notification(
                recipient=team_member.user,
                sender=employee.user,
                notification_type=notification_type,
                title=title,
                message=message,
                related_object_id=leave_request.id,
                related_object_type='leave_request'
            )
    
    @staticmethod
    def notify_leave_cancelled(leave_request):
        """Notify when leave is cancelled"""
        employee = leave_request.employee
        
        # Create team notifications about cancellation
        LeaveNotificationService.notify_team_about_leave(leave_request, 'cancelled')
        
        # Create HR notifications
        hr_users = User.objects.filter(profile__role='HR_MANAGER')
        for hr_user in hr_users:
            LeaveNotificationService.create_notification(
                recipient=hr_user,
                sender=employee.user,
                notification_type='LEAVE_CANCELLED',
                title=f'Leave Cancelled - {employee.user.get_full_name()}',
                message=f'{employee.user.get_full_name()} has cancelled their leave from {leave_request.start_date} to {leave_request.end_date}.',
                related_object_id=leave_request.id,
                related_object_type='leave_request'
            )
        
        # Send email notifications
        send_leave_cancellation_notification(leave_request)


class LeaveBalanceService:
    """Service for managing leave balances"""
    @staticmethod
    def _to_decimal(value):
        """Safely convert any numeric value to Decimal"""
        if value is None:
            return Decimal('0')
        return Decimal(str(value))
    @staticmethod
    def get_or_create_balance(employee, leave_type, year=None):
        """Get or create leave balance for employee"""
        if not year:
            year = datetime.now().year
        
        try:
            balance = LeaveBalance.objects.get(
                employee=employee,
                leave_type=leave_type,
                year=year
            )
            return balance
        except LeaveBalance.DoesNotExist:
            pass
        
        # Calculate used days from existing approved requests
        from django.db.models import Sum
        approved_days = LeaveRequest.objects.filter(
            employee=employee,
            leave_type=leave_type,
            status='APPROVED',
            balance_deducted=True,  # Only count requests where balance was actually deducted
            start_date__year=year
        ).aggregate(total=Sum('days_requested'))['total'] or 0
        
        used_days = float(approved_days)
        total_days = float(leave_type.days_allowed_per_year)
        remaining_days = total_days - used_days
        
        balance = LeaveBalance.objects.create(
            employee=employee,
            leave_type=leave_type,
            year=year,
            total_days=total_days,
            used_days=used_days,
            remaining_days=remaining_days
        )
        
        logger.info(f"✅ Created leave balance: {employee.user.get_full_name()} - {leave_type.name} - {year}")
        return balance
    @staticmethod 
    def check_leave_balance(employee, leave_type, days_requested, year=None):
        """Check if employee has enough leave balance"""
        if not year:
            year = datetime.now().year
            
        balance = LeaveBalanceService.get_or_create_balance(employee, leave_type, year)
        remaining_days = float(balance.remaining_days)
        days_requested_float = float(days_requested)
        
        has_sufficient = remaining_days >= days_requested_float
        
        logger.info(f"🔍 Balance check: {employee.user.get_full_name()} - {leave_type.name} - Available: {remaining_days}, Requested: {days_requested_float}, Sufficient: {has_sufficient}")
        
        return has_sufficient, remaining_days
    
    @staticmethod
    def deduct_leave_balance(leave_request):
        """Deduct leave days from balance when leave is approved - WITH PROTECTION"""
        try:
            # PROTECTION: Check if balance already deducted
            if leave_request.balance_deducted:
                logger.warning(f"⚠️ Balance already deducted for leave {leave_request.id}")
                return None
            
            year = leave_request.start_date.year
            balance = LeaveBalanceService.get_or_create_balance(
                leave_request.employee,
                leave_request.leave_type,
                year
            )
            
            days_to_deduct = float(leave_request.days_requested)
            current_remaining = float(balance.remaining_days)
            
            # Check sufficient balance
            if current_remaining < days_to_deduct:
                raise ValueError(f"Insufficient balance: {current_remaining} available, {days_to_deduct} requested")
            
            # Update balance
            balance.used_days = float(balance.used_days) + days_to_deduct
            balance.save()  # remaining_days auto-calculates in model save()
            
            # MARK AS DEDUCTED to prevent double deduction
            leave_request.balance_deducted = True
            leave_request.save(update_fields=['balance_deducted'])
            
            logger.info(f"✅ Balance deducted: {leave_request.employee.user.get_full_name()} - {leave_request.leave_type.name} - Used: {balance.used_days}, Remaining: {balance.remaining_days}")
            return balance
            
        except Exception as e:
            logger.error(f"❌ Balance deduction failed: {e}")
            raise e
    
    @staticmethod
    def restore_leave_balance(leave_request):
        """Restore leave days when leave is cancelled"""
        try:
            # Only restore if balance was actually deducted
            if not leave_request.balance_deducted:
                logger.warning(f"⚠️ No balance to restore for leave {leave_request.id}")
                return None
            
            year = leave_request.start_date.year
            balance = LeaveBalance.objects.filter(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=year
            ).first()
            
            if not balance:
                logger.warning(f"⚠️ No balance record found for restoration")
                return None
            
            days_to_restore = float(leave_request.days_requested)
            
            # Restore balance
            balance.used_days = max(0, float(balance.used_days) - days_to_restore)
            balance.save()  # remaining_days auto-calculates
            
            # MARK AS NOT DEDUCTED
            leave_request.balance_deducted = False
            leave_request.save(update_fields=['balance_deducted'])
            
            logger.info(f"✅ Balance restored: {leave_request.employee.user.get_full_name()} - {leave_request.leave_type.name} - Used: {balance.used_days}, Remaining: {balance.remaining_days}")
            return balance
            
        except Exception as e:
            logger.error(f"❌ Balance restoration failed: {e}")
            raise e
    
    @staticmethod
    def get_employee_balance_summary(employee, year=None):
        """Get complete balance summary for an employee"""
        if not year:
            year = datetime.now().year
            
        balances = LeaveBalance.objects.filter(employee=employee, year=year)
        
        summary = {
            'year': year,
            'balances': [],
            'total_allocated': 0,
            'total_used': 0,
            'total_remaining': 0
        }
        
        for balance in balances:
            balance_info = {
                'leave_type': balance.leave_type.name,
                'total_days': float(balance.total_days),
                'used_days': float(balance.used_days),
                'remaining_days': float(balance.remaining_days),
                'utilization_percentage': round((float(balance.used_days) / float(balance.total_days)) * 100, 2) if balance.total_days > 0 else 0
            }
            summary['balances'].append(balance_info)
            summary['total_allocated'] += float(balance.total_days)
            summary['total_used'] += float(balance.used_days)
            summary['total_remaining'] += float(balance.remaining_days)
        
        return summary