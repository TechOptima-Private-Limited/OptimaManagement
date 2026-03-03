from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model
from employees.models import Employee
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class AttendanceNotificationService:

    @staticmethod
    def send_email(subject, context, recipients, template_name=None):
        try:
            if isinstance(recipients, str):
                recipients = [recipients]
            recipients = [email for email in recipients if email]

            if not recipients:
                logger.warning("❌ No valid recipients found")
                return False

            if template_name:
                content = render_to_string(template_name, context)
                content_subtype = "html"
            else:
                content = context.get("plain_message", "Notification")
                content_subtype = "plain"

            email = EmailMessage(subject=subject, body=content, to=recipients)
            email.content_subtype = content_subtype
            email.send()
            logger.info(f"📧 Email sent to {recipients}")
            return True
        except Exception as e:
            logger.error(f"❌ Email sending failed: {e}")
            return False

    @staticmethod
    def notify_attendance_request_submitted(record):
        employee = record.employee

        hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
        hr_emails = [user.email for user in hr_users if user.email]

        context = {
            'employee_name': employee.user.get_full_name(),
            'employee_id': employee.employee_id,
            'date': record.date,
            'check_in_time': record.check_in_time,
            'check_out_time': record.check_out_time,
            'edit_reason': record.edit_reason,
            'status': record.status,
            'notes': record.notes,
            'plain_message': f"""
Attendance Edit Request

Employee: {employee.user.get_full_name()}
Date: {record.date}
Check In: {record.check_in_time}
Check Out: {record.check_out_time}
Reason: {record.edit_reason}
Status: {record.status}

Please log in to approve/reject the request.
"""
        }

        return AttendanceNotificationService.send_email(
            subject=f"Attendance Edit Request - {employee.user.get_full_name()}",
            context=context,
            recipients=hr_emails,
            template_name='attendance/attendance_request_notification.html'  # optional
        )

    @staticmethod
    def notify_attendance_approved(record, approved_by):
        employee = record.employee
        if not employee.user.email:
            logger.warning("❌ No email for employee")
            return False

        context = {
            'employee_name': employee.user.get_full_name(),
            'date': record.date,
            'approved_by': approved_by.get_full_name() if approved_by else "Manager",
            'check_in_time': record.check_in_time,
            'check_out_time': record.check_out_time,
            'plain_message': f"""
Hi {employee.user.get_full_name()},

Your attendance edit request for {record.date} has been APPROVED.

Approved by: {approved_by.get_full_name() if approved_by else "Manager"}

Check In: {record.check_in_time}
Check Out: {record.check_out_time}

Thanks,
HR Team
"""
        }

        return AttendanceNotificationService.send_email(
            subject=f"Attendance Edit Approved - {record.date}",
            context=context,
            recipients=employee.user.email,
            template_name='attendance/attendance_approved_notification.html'  # optional
        )
