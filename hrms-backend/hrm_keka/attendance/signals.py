from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import EmailMessage
from django.conf import settings
from .models import AttendanceRecord
from employees.models import Employee
from notifications.services import NotificationService
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=AttendanceRecord)
def store_previous_pending_status(sender, instance, **kwargs):
    """Store the previous pending status to detect changes"""
    try:
        if instance.pk:
            old_instance = AttendanceRecord.objects.get(pk=instance.pk)
            instance._previous_pending = old_instance.is_pending_approval
        else:
            instance._previous_pending = False
    except AttendanceRecord.DoesNotExist:
        instance._previous_pending = False

@receiver(post_save, sender=AttendanceRecord)
def send_attendance_notifications(sender, instance, created, **kwargs):
    """Send email notifications when attendance edit request is created"""
    
    # Get previous pending status
    previous_pending = getattr(instance, '_previous_pending', False)
    current_pending = instance.is_pending_approval
    
    # Send email when is_pending_approval changes from False to True
    if not previous_pending and current_pending:
        print(f"🔔 Sending edit approval request email for {instance}")
        send_edit_approval_request_email(instance)
        
        # Send Push Notification to HR
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
            
            for hr_user in hr_users:
                NotificationService.create_notification(
                    recipient=hr_user,
                    notification_type='ATTENDANCE_EDIT_REQUEST',
                    title=f"Attendance Edit ID {instance.id}: {instance.employee.user.get_full_name()}",
                    message=f"{instance.employee.user.get_full_name()} has requested an attendance edit for {instance.date}.",
                    sender=instance.employee.user,
                    action_url='/attendance',
                    action_text='Review Edit'
                )
        except Exception as e:
            logger.error(f"⚠️ Failed to send attendance edit push: {str(e)}")

# def send_edit_approval_request_email(pending_record):
#     """Send simple email to HR only with current and requested data"""
#     try:
#         employee = pending_record.employee
#         print(f"📧 Preparing email for employee: {employee.user.get_full_name()}")
        
#         # Get HR Managers from User profiles ONLY
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
        
#         # Get HR users only (no team managers)
#         hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
        
#         recipients = []
#         for user in hr_users:
#             if user.email:
#                 recipients.append(user.email)
#                 print(f"📬 Added HR recipient: {user.email}")
        
#         if not recipients:
#             print("❌ No HR Manager email found")
#             return
        
#         print(f"📧 Sending email to: {recipients}")
        
#         # Get requested data if available
#         requested_data = getattr(pending_record, '_requested_data', {})
        
#         # Simple email content with comparison
#         subject = f"Attendance Edit Request - {employee.user.get_full_name()} ({pending_record.date})"
        
#         # Simple HTML message with current vs requested comparison
#         html_content = f"""
#         <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
#             <h2 style="color: #2563eb;">🔔 Attendance Edit Request</h2>
            
#             <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
#                 <h3>Employee Details:</h3>
#                 <p><strong>Name:</strong> {employee.user.get_full_name()}</p>
#                 <p><strong>Employee ID:</strong> {employee.employee_id}</p>
#                 <p><strong>Date:</strong> {pending_record.date}</p>
#                 <p><strong>Reason:</strong> {pending_record.edit_reason}</p>
#             </div>
            
#             <div style="display: flex; gap: 20px; margin: 20px 0;">
#                 <!-- Current Record -->
#                 <div style="flex: 1; background-color: #fef3c7; padding: 20px; border-radius: 8px;">
#                     <h3 style="color: #d97706;">📋 Current Record</h3>
#                     <p><strong>Check In:</strong> {pending_record.check_in_time or 'Not recorded'}</p>
#                     <p><strong>Check Out:</strong> {pending_record.check_out_time or 'Not recorded'}</p>
#                     <p><strong>Status:</strong> {pending_record.status}</p>
#                     <p><strong>Notes:</strong> {pending_record.notes or 'None'}</p>
#                 </div>
                
#                 <!-- Requested Changes -->
#                 <div style="flex: 1; background-color: #dcfce7; padding: 20px; border-radius: 8px;">
#                     <h3 style="color: #16a34a;">✏️ Requested Changes</h3>
#                     <p><strong>Check In:</strong> {requested_data.get('check_in_time') or 'Not changed'}</p>
#                     <p><strong>Check Out:</strong> {requested_data.get('check_out_time') or 'Not changed'}</p>
#                     <p><strong>Status:</strong> {requested_data.get('status') or 'Not changed'}</p>
#                     <p><strong>Notes:</strong> {requested_data.get('notes') or 'Not changed'}</p>
#                 </div>
#             </div>
            
#             <p style="color: #6b7280; font-size: 14px; text-align: center;">
#                 Please check the HR system for approval.
#             </p>
#         </div>
#         """
        
#         # Send email
#         email = EmailMessage(
#             subject=subject,
#             body=html_content,
#             to=recipients,
#         )
#         email.content_subtype = "html"
#         email.send()
        
#         print(f"✅ Edit approval request email sent to HR for {employee.user.get_full_name()}")
#         logger.info(f"✅ Attendance edit email sent to {recipients}")
        
#     except Exception as e:
#         print(f"❌ Failed to send edit approval request email: {str(e)}")
#         logger.error(f"❌ Email sending failed: {str(e)}")
# Fixed signals.py - Show what employee REQUESTED vs what was ORIGINAL

def send_edit_approval_request_email(pending_record):
    """Send email to HR showing ORIGINAL vs REQUESTED values"""
    try:
        employee = pending_record.employee
        print(f"📧 Preparing email for employee: {employee.user.get_full_name()}")
        
        # Get HR Managers from User profiles ONLY
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
        
        recipients = []
        for user in hr_users:
            if user.email:
                recipients.append(user.email)
                print(f"📬 Added HR recipient: {user.email}")
        
        if not recipients:
            print("❌ No HR Manager email found")
            return
        
        print(f"📧 Sending email to: {recipients}")
        
        # Get requested data if available
        requested_data = getattr(pending_record, '_requested_data', {})
        
        subject = f"Attendance Edit Request - {employee.user.get_full_name()} ({pending_record.date})"
        
        # Email with CLEAR comparison - Original vs Requested
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🔔 Attendance Edit Request</h2>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Employee Details:</h3>
                <p><strong>Name:</strong> {employee.user.get_full_name()}</p>
                <p><strong>Employee ID:</strong> {employee.employee_id}</p>
                <p><strong>Date:</strong> {pending_record.date}</p>
                <p><strong>Reason:</strong> {pending_record.edit_reason}</p>
            </div>
            
            <div style="display: flex; gap: 20px; margin: 20px 0;">
                <!-- ORIGINAL Record (Before Edit) -->
                <div style="flex: 1; background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 2px solid #fca5a5;">
                    <h3 style="color: #dc2626;">📋 ORIGINAL Record (Before Edit)</h3>
                    <p><strong>Check In:</strong> {pending_record.original_check_in_time or 'Not recorded'}</p>
                    <p><strong>Check Out:</strong> {pending_record.original_check_out_time or 'Not recorded'}</p>
                    <p><strong>Status:</strong> {pending_record.original_status or 'Not set'}</p>
                    <p><strong>Notes:</strong> {pending_record.original_notes or 'None'}</p>
                </div>
                
                <!-- REQUESTED Changes (What Employee Wants) -->
                <div style="flex: 1; background-color: #dcfce7; padding: 20px; border-radius: 8px; border: 2px solid #86efac;">
                    <h3 style="color: #16a34a;">✏️ REQUESTED Changes (What Employee Wants)</h3>
                    <p><strong>Check In:</strong> {pending_record.check_in_time or 'Not recorded'}</p>
                    <p><strong>Check Out:</strong> {pending_record.check_out_time or 'Not recorded'}</p>
                    <p><strong>Status:</strong> {pending_record.status}</p>
                    <p><strong>Notes:</strong> {pending_record.notes or 'None'}</p>
                </div>
            </div>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="color: #1d4ed8; font-weight: bold;">📝 Action Required:</p>
                <p style="color: #1e40af;">Please review the REQUESTED changes (green box) and approve or reject in the HR system.</p>
                <p style="color: #1e40af;">The approval form will be pre-filled with the employee's requested values.</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Please check the HR system for approval.
            </p>
        </div>
        """
        
        # Send email
        email = EmailMessage(
            subject=subject,
            body=html_content,
            to=recipients,
        )
        email.content_subtype = "html"
        email.send()
        
        print(f"✅ Edit approval request email sent to HR for {employee.user.get_full_name()}")
        logger.info(f"✅ Attendance edit email sent to {recipients}")
        
    except Exception as e:
        print(f"❌ Failed to send edit approval request email: {str(e)}")
        logger.error(f"❌ Email sending failed: {str(e)}")
def send_approval_result_email(employee_email, employee_name, date, approved, approver_name):
    """Send email to employee about approval/rejection result"""
    try:
        # Also send push notification
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            recipient = User.objects.get(email=employee_email)
            
            NotificationService.create_notification(
                recipient=recipient,
                notification_type='ATTENDANCE_EDIT_APPROVED' if approved else 'ATTENDANCE_EDIT_REJECTED',
                title=f"Attendance Edit {'Approved' if approved else 'Rejected'}",
                message=f"Your attendance edit for {date} has been {'approved' if approved else 'rejected'}.",
                action_url='/attendance',
                action_text='View Attendance'
            )
        except Exception as e:
            print(f"⚠️ Failed to send attendance edit result push: {str(e)}")

        if not employee_email:
            print(f"❌ No email found for employee {employee_name}")
            return
        
        # Create subject and content based on approval status
        if approved:
            subject = f"✅ Attendance Edit Approved - {date}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">✅ Attendance Edit Approved</h2>
                
                <p>Hi {employee_name},</p>
                
                <p>Good news! Your attendance edit request for <strong>{date}</strong> has been <strong>APPROVED</strong>.</p>
                
                <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Approved by:</strong> {approver_name}</p>
                    <p>Your attendance record has been updated with the approved changes.</p>
                </div>
                
                <p>Best Regards,<br>HR Team</p>
            </div>
            """
        else:
            subject = f"❌ Attendance Edit Rejected - {date}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">❌ Attendance Edit Rejected</h2>
                
                <p>Hi {employee_name},</p>
                
                <p>Your attendance edit request for <strong>{date}</strong> has been <strong>REJECTED</strong>.</p>
                
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Reviewed by:</strong> {approver_name}</p>
                    <p>Your original attendance record remains unchanged.</p>
                </div>
                
                <p>If you have questions, please contact HR.</p>
                
                <p>Best Regards,<br>HR Team</p>
            </div>
            """
        
        # Send email
        email = EmailMessage(
            subject=subject,
            body=html_content,
            to=[employee_email],
        )
        email.content_subtype = "html"
        email.send()
        
        print(f"✅ Approval result email sent to {employee_email}")
        
    except Exception as e:
        print(f"❌ Failed to send approval result email: {str(e)}")