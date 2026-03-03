from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model
from employees.models import Employee
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

def send_leave_email_notification(template_name, context, subject, recipients):
    """
    Send leave-related email notifications using existing email system
    """
    try:
        # Debug logging
        logger.info(f"🔍 Attempting to send email to: {recipients}")
        logger.info(f"📧 Subject: {subject}")
        
        # Ensure recipients is a list
        if isinstance(recipients, str):
            recipients = [recipients]
        
        # Filter out empty emails
        valid_recipients = [email for email in recipients if email and email.strip()]
        
        if not valid_recipients:
            logger.warning("❌ No valid email addresses found")
            return False
        
        # Render email content from template
        if template_name:
            try:
                email_content = render_to_string(template_name, context)
                content_subtype = "html"
            except Exception as template_error:
                logger.warning(f"⚠️ Template rendering failed: {template_error}, using plain text")
                email_content = context.get('plain_message', f"Leave request notification: {subject}")
                content_subtype = "plain"
        else:
            # Use plain text if no template provided
            email_content = context.get('plain_message', f"Leave request notification: {subject}")
            content_subtype = "plain"

        # Create email
        email = EmailMessage(
            subject=subject,
            body=email_content,
            to=valid_recipients,
        )
        email.content_subtype = content_subtype
        
        # Send email
        email.send()
        logger.info(f"✅ Leave email sent successfully to {valid_recipients}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send leave email: {e}")
        return False

def send_leave_request_notification(leave_request):
    """Send notification when leave request is submitted"""
    try:
        employee = leave_request.employee
        logger.info(f"🔍 Processing leave request notification for {employee.user.get_full_name()}")
        
        # Get approvers (manager and HR) with better error handling
        approvers = []
        
        # Add manager if exists - with proper error handling
        try:
            if hasattr(employee, 'manager') and employee.manager:
                if employee.manager.user.email:
                    approvers.append(employee.manager.user.email)
                    logger.info(f"✅ Added manager: {employee.manager.user.email}")
                else:
                    logger.warning(f"⚠️ Manager {employee.manager.user.get_full_name()} has no email")
            else:
                logger.info("ℹ️ No manager assigned to employee")
        except Exception as manager_error:
            logger.warning(f"⚠️ Error accessing manager: {manager_error}")
        
        # Add HR managers with better error handling
        try:
            # Try different ways to find HR users
            hr_users = []
            
            # Method 1: Check if profile exists and has role
            try:
                hr_users = User.objects.filter(profile__role__in=['HR_MANAGER', 'HR_EXECUTIVE', 'ADMIN'], is_active=True)
                logger.info(f"✅ Found {hr_users.count()} HR managers/Admins via profile.role")
            except:
                logger.info("ℹ️ Profile.role method failed, trying alternatives")
            
            # Method 2: If no profile-based HR found, try groups
            if not hr_users.exists():
                try:
                    hr_users = User.objects.filter(groups__name='HR_MANAGER', is_active=True)
                    logger.info(f"✅ Found {hr_users.count()} HR managers via groups")
                except:
                    logger.info("ℹ️ Groups method failed")
            
            # Method 3: Fallback - find superusers
            if not hr_users.exists():
                hr_users = User.objects.filter(is_superuser=True, is_active=True)
                logger.info(f"✅ Fallback: Found {hr_users.count()} superusers as HR")
            
            # Add HR emails
            hr_emails = [user.email for user in hr_users if user.email and user.email.strip()]
            approvers.extend(hr_emails)
            logger.info(f"✅ Added HR emails: {hr_emails}")
            
        except Exception as hr_error:
            logger.error(f"❌ Error finding HR users: {hr_error}")
        
        # Remove duplicates and empty emails
        approvers = list(set([email for email in approvers if email and email.strip()]))
        
        if not approvers:
            logger.warning("❌ No approvers found for leave request notification")
            # Create a plain text notification as fallback
            context = {
                'plain_message': f"""
New Leave Request Submitted

Employee: {employee.user.get_full_name()} ({employee.employee_id})
Leave Type: {leave_request.leave_type.name}
Dates: {leave_request.start_date} to {leave_request.end_date}
Days: {leave_request.days_requested}
Reason: {leave_request.reason}
                """
            }
            # Try to send to at least one admin
            admin_emails = [user.email for user in User.objects.filter(is_superuser=True) if user.email]
            if admin_emails:
                return send_leave_email_notification(
                    template_name=None,
                    context=context,
                    subject=f"New Leave Request - {employee.user.get_full_name()}",
                    recipients=admin_emails[:1]  # Send to first admin
                )
            return False

        # Email context
        context = {
            'employee_name': employee.user.get_full_name(),
            'employee_id': getattr(employee, 'employee_id', 'N/A'),
            'employee_position': getattr(employee, 'position', 'N/A'),
            'leave_type': leave_request.leave_type.name,
            'start_date': leave_request.start_date.strftime('%B %d, %Y'),
            'end_date': leave_request.end_date.strftime('%B %d, %Y'),
            'days_requested': leave_request.days_requested,
            'reason': leave_request.reason,
            'employee_comments': leave_request.employee_comments or 'None',
            'applied_on': leave_request.applied_on.strftime('%B %d, %Y'),
            'leave_duration': leave_request.get_leave_duration_display(),
            'company_name': 'Techoptima Pvt Ltd',
            'plain_message': f"""
New Leave Request from {employee.user.get_full_name()}

Employee: {employee.user.get_full_name()}
Leave Type: {leave_request.leave_type.name}
Dates: {leave_request.start_date} to {leave_request.end_date}
Days Requested: {leave_request.days_requested}
Reason: {leave_request.reason}

Please review and approve/reject this request.
            """
        }

        subject = f"New Leave Request - {employee.user.get_full_name()}"
        
        # Try to send with template first, fallback to plain text
        success = send_leave_email_notification(
            template_name='leave_management/leave_request_notification.html',
            context=context,
            subject=subject,
            recipients=approvers
        )
        
        if not success:
            # Fallback to plain text email
            logger.info("🔄 Retrying with plain text email")
            success = send_leave_email_notification(
                template_name=None,
                context=context,
                subject=subject,
                recipients=approvers
            )
        
        return success
        
    except Exception as e:
        logger.error(f"❌ Failed to send leave request notification: {e}")
        logger.error(f"❌ Error details: {str(e)}")
        return False
# def send_leave_approval_notification(leave_request, approved_by):
#     """Send notification when leave is approved"""
#     try:
#         employee = leave_request.employee
        
#         if not employee.user.email:
#             logger.warning(f"No email found for employee {employee.user.get_full_name()}")
#             return False

#         # Email context
#         context = {
#             'employee_name': employee.user.get_full_name(),
#             'leave_type': leave_request.leave_type.name,
#             'start_date': leave_request.start_date.strftime('%B %d, %Y'),
#             'end_date': leave_request.end_date.strftime('%B %d, %Y'),
#             'days_requested': leave_request.days_requested,
#             'approved_by': approved_by.get_full_name(),
#             'approved_on': leave_request.approved_on.strftime('%B %d, %Y') if leave_request.approved_on else 'N/A',
#             'manager_comments': leave_request.manager_comments,
#             'company_name': 'Techoptima Pvt Ltd',
#         }

#         subject = f"Leave Request Approved - {leave_request.leave_type.name}"
        
#         # Send to employee
#         employee_success = send_leave_email_notification(
#             template_name='leave_management/leave_approved_notification.html',
#             context=context,
#             subject=subject,
#             recipients=[employee.user.email]
#         )
        
#         # Notify HR about the approval
#         hr_users = User.objects.filter(profile__role='HR_MANAGER')
#         hr_emails = [user.email for user in hr_users if user.email]
        
#         if hr_emails:
#             hr_context = context.copy()
#             hr_subject = f"Leave Approved - {employee.user.get_full_name()}"
            
#             hr_success = send_leave_email_notification(
#                 template_name='leave_management/leave_approved_hr_notification.html',
#                 context=hr_context,
#                 subject=hr_subject,
#                 recipients=hr_emails
#             )
        
#         return employee_success
        
#     except Exception as e:
#         logger.error(f"Failed to send leave approval notification: {e}")
#         return False

def send_leave_approval_notification(leave_request, approved_by):
    """Send notification when leave is approved"""
    try:
        employee = leave_request.employee
        
        if not employee.user.email:
            logger.warning(f"No email found for employee {employee.user.get_full_name()}")
            return False

        # # *** UPDATE BALANCE HERE AS BACKUP ***
        # try:
        #     from .services import LeaveBalanceService
        #     from .models import LeaveBalance
            
        #     # Get or create balance record
        #     balance = LeaveBalanceService.get_or_create_balance(
        #         employee,
        #         leave_request.leave_type,
        #         leave_request.start_date.year
        #     )
            
        #     # Calculate correct balance based on ALL approved requests
        #     from django.db.models import Sum
        #     total_approved_days = leave_request.__class__.objects.filter(
        #         employee=employee,
        #         leave_type=leave_request.leave_type,
        #         status='APPROVED',
        #         start_date__year=leave_request.start_date.year
        #     ).aggregate(total=Sum('days_requested'))['total'] or 0
            
        #     correct_used = float(total_approved_days)
        #     correct_remaining = float(balance.total_days) - correct_used
            
        #     # Update if different
        #     if balance.used_days != correct_used or balance.remaining_days != correct_remaining:
        #         balance.used_days = correct_used
        #         balance.remaining_days = correct_remaining
        #         balance.save()
        #         logger.info(f"✅ Balance updated in notification: {employee.user.get_full_name()} - {leave_request.leave_type.name} - Used: {correct_used}, Remaining: {correct_remaining}")
            
        # except Exception as balance_error:
        #     logger.error(f"❌ Balance update in notification failed: {balance_error}")

        # Email context
        context = {
            'employee_name': employee.user.get_full_name(),
            'leave_type': leave_request.leave_type.name,
            'start_date': leave_request.start_date.strftime('%B %d, %Y'),
            'end_date': leave_request.end_date.strftime('%B %d, %Y'),
            'days_requested': leave_request.days_requested,
            'approved_by': approved_by.get_full_name(),
            'approved_on': leave_request.approved_on.strftime('%B %d, %Y') if leave_request.approved_on else 'N/A',
            'manager_comments': leave_request.manager_comments,
            'company_name': 'Techoptima Pvt Ltd',
        }

        subject = f"Leave Request Approved - {leave_request.leave_type.name}"
        
        # Send to employee
        employee_success = send_leave_email_notification(
            template_name='leave_management/leave_approved_notification.html',
            context=context,
            subject=subject,
            recipients=[employee.user.email]
        )
        
        # Notify HR about the approval
        hr_users = User.objects.filter(profile__role='HR_MANAGER')
        hr_emails = [user.email for user in hr_users if user.email]
        
        if hr_emails:
            hr_context = context.copy()
            hr_subject = f"Leave Approved - {employee.user.get_full_name()}"
            
            hr_success = send_leave_email_notification(
                template_name='leave_management/leave_approved_hr_notification.html',
                context=hr_context,
                subject=hr_subject,
                recipients=hr_emails
            )
        
        return employee_success
        
    except Exception as e:
        logger.error(f"Failed to send leave approval notification: {e}")
        return False

def send_leave_rejection_notification(leave_request, rejected_by):
    """Send notification when leave is rejected"""
    try:
        employee = leave_request.employee
        
        if not employee.user.email:
            logger.warning(f"No email found for employee {employee.user.get_full_name()}")
            return False

        # Email context
        context = {
            'employee_name': employee.user.get_full_name(),
            'leave_type': leave_request.leave_type.name,
            'start_date': leave_request.start_date.strftime('%B %d, %Y'),
            'end_date': leave_request.end_date.strftime('%B %d, %Y'),
            'days_requested': leave_request.days_requested,
            'rejected_by': rejected_by.get_full_name(),
            'rejection_reason': leave_request.rejection_reason or leave_request.manager_comments,
            'company_name': 'Techoptima Pvt Ltd',
        }

        subject = f"Leave Request Rejected - {leave_request.leave_type.name}"
        
        return send_leave_email_notification(
            template_name='leave_management/leave_rejected_notification.html',
            context=context,
            subject=subject,
            recipients=[employee.user.email]
        )
        
    except Exception as e:
        logger.error(f"Failed to send leave rejection notification: {e}")
        return False

def send_team_leave_notification(leave_request, status='approved'):
    """Send notification to team members about colleague's leave"""
    try:
        employee = leave_request.employee
        
        # Get team members (same department)
        team_members = Employee.objects.filter(
            department=employee.department
        ).exclude(id=employee.id)
        
        # Also include direct reports if this person is a manager
        direct_reports = Employee.objects.filter(manager=employee)
        
        # Combine and get unique team members
        all_team_members = set(list(team_members) + list(direct_reports))
        team_emails = [tm.user.email for tm in all_team_members if tm.user.email]
        
        if not team_emails:
            logger.info(f"No team members found for {employee.user.get_full_name()}")
            return True

        # Email context
        context = {
            'employee_name': employee.user.get_full_name(),
            'employee_position': employee.position,
            'department_name': employee.department.name if employee.department else 'N/A',
            'leave_type': leave_request.leave_type.name,
            'start_date': leave_request.start_date.strftime('%B %d, %Y'),
            'end_date': leave_request.end_date.strftime('%B %d, %Y'),
            'days_requested': leave_request.days_requested,
            'status': status,
            'company_name': 'Techoptima Pvt Ltd',
        }

        if status == 'approved':
            subject = f"Team Notice: {employee.user.get_full_name()} will be on {leave_request.leave_type.name}"
            template_name = 'leave_management/team_leave_approved_notification.html'
        else:
            subject = f"Team Notice: {employee.user.get_full_name()} leave cancelled"
            template_name = 'leave_management/team_leave_cancelled_notification.html'
        
        return send_leave_email_notification(
            template_name=template_name,
            context=context,
            subject=subject,
            recipients=team_emails
        )
        
    except Exception as e:
        logger.error(f"Failed to send team leave notification: {e}")
        return False

def send_leave_cancellation_notification(leave_request):
    """Send notification when leave is cancelled"""
    try:
        employee = leave_request.employee
        
        # Notify HR about cancellation
        hr_users = User.objects.filter(profile__role='HR_MANAGER')
        hr_emails = [user.email for user in hr_users if user.email]
        
        if not hr_emails:
            logger.warning("No HR managers found for leave cancellation notification")
            return False

        # Email context
        context = {
            'employee_name': employee.user.get_full_name(),
            'employee_id': employee.employee_id,
            'leave_type': leave_request.leave_type.name,
            'start_date': leave_request.start_date.strftime('%B %d, %Y'),
            'end_date': leave_request.end_date.strftime('%B %d, %Y'),
            'days_requested': leave_request.days_requested,
            'company_name': 'Techoptima Pvt Ltd',
        }

        subject = f"Leave Cancelled - {employee.user.get_full_name()}"
        
        # Send to HR
        hr_success = send_leave_email_notification(
            template_name='leave_management/leave_cancelled_hr_notification.html',
            context=context,
            subject=subject,
            recipients=hr_emails
        )
        
        # Send team notification about cancellation
        team_success = send_team_leave_notification(leave_request, status='cancelled')
        
        return hr_success and team_success
        
    except Exception as e:
        logger.error(f"Failed to send leave cancellation notification: {e}")
        return False