
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Employee, Offboarding, ITSupporter
from django.template.loader import render_to_string
from resource_management.utils import send_email_notification
from io import BytesIO
from django.core.mail import EmailMessage
from django.conf import settings

@receiver(post_save, sender=Employee)
def send_it_asset_assignment_email(sender, instance, created, **kwargs):
    """
    Send email notification to IT team when:
    1. HR completes employment details (department, position, employee_type)
    2. IT notification hasn't been sent yet
    3. NOT when employee initially submits the form
    """
    print(f"🔍 Signal triggered for Employee: {instance.full_name}")
    print(f"   - Created: {created}")
    print(f"   - IT notification sent: {instance.it_notification_sent}")
    print(f"   - Is self submitted: {instance.is_self_submitted}")
    print(f"   - Has employment details: Department={instance.department}, Position={instance.position}, Type={instance.employee_type}")
    
    # Skip if IT notification already sent
    if instance.it_notification_sent:
        print("❌ Skipping: IT notification already sent")
        return
    
    # Skip if this is an employee self-submission without employment details
    # (Employee submissions won't have department, position, employee_type filled)
    if instance.is_self_submitted and not all([instance.department, instance.position, instance.employee_type]):
        print("❌ Skipping: Employee self-submission without employment details completed by HR")
        return
    
    # Only send IT notification when employment details are complete
    # This happens when HR reviews and completes the employee record
    if not all([instance.department, instance.position, instance.employee_type]):
        print("❌ Skipping: Employment details not complete (department, position, employee_type required)")
        return
    
    print("✅ Proceeding with IT notification email - Employment details completed by HR")
    
    # Get all active IT supporters
    it_supporters = ITSupporter.objects.filter(is_active=True)
    print(f"🔍 Found {it_supporters.count()} active IT supporters")
    
    if it_supporters.exists():
        it_emails = [supporter.email for supporter in it_supporters]
        print(f"📧 IT Emails: {it_emails}")
        
        try:
            # Simple plain text message
            submission_status = "after HR review and approval" if instance.is_self_submitted else "by HR directly"
            
            message = f"""Hi IT Team,

An employee record has been completed {submission_status} and requires asset assignment.

Employee Details:
- Name: {instance.full_name}
- Email: {instance.email}
- Department: {instance.get_department_display()}
- Position: {instance.get_position_display()}
- Employee Type: {instance.get_employee_type_display()}
- Joining Date: {instance.joining_date or 'Not specified'}

Employment details have been finalized by HR. Please proceed with asset assignment (laptop, charger, access cards, etc.).


Best Regards,
HR Team - Techoptima Pvt Ltd"""
            # Send email
            subject_line = f"Asset Assignment Required - Employee Ready: {instance.full_name}"
            if instance.is_self_submitted:
                subject_line = f"Asset Assignment Required - Employee Reviewed & Approved: {instance.full_name}"
            
            email = EmailMessage(
                subject=subject_line,
                body=message,
                to=it_emails,
            )
            email.content_subtype = "plain"
            email.send()
            
            # Update the flag to prevent duplicate emails
            Employee.objects.filter(pk=instance.pk).update(it_notification_sent=True)
            print(f"✅ IT team notified for asset assignment - Employee: {instance.full_name}")
            print(f"📧 Email sent to: {', '.join(it_emails)}")
            
        except Exception as e:
            print(f"❌ Failed to send IT notification email for {instance.full_name}: {str(e)}")
    else:
        print(f"⚠️ No active IT supporters found for asset assignment notification - Employee: {instance.full_name}")

@receiver(post_save, sender=Offboarding)
def send_offboarding_email(sender, instance, created, **kwargs):
    try:
        if created and instance.employee and instance.employee.email:
            employee = instance.employee

            # Simple plain text message
            message = f"""Hi {employee.full_name},

Your offboarding process has been recorded in our system.

Last Working Date: {instance.last_working_date}

Please ensure you complete all pending work and return company assets.

Best Regards,
HR Team - Techoptima Pvt Ltd"""

            try:
                email = EmailMessage(
                    subject=f"Offboarding Process Initiated - {employee.full_name}",
                    body=message,
                    to=[employee.email],
                )
                email.content_subtype = "plain"
                # Avoid raising exceptions on SMTP failures
                email.send(fail_silently=True)
                print(f"✅ Offboarding email attempted to {employee.email}")

            except Exception as e:
                print(f"❌ Failed to send offboarding email: {str(e)}")
    except Exception as e:
        # Ensure no exception from this signal can break the API response
        print(f"❌ Offboarding employee email notification failed due to system error: {str(e)}")

@receiver(post_save, sender=Offboarding)
def notify_it_team_for_asset_collection(sender, instance, created, **kwargs):
    """
    Send email notification to IT team when offboarding is created
    """
    if created and instance.employee:
        try:
            # Get all active IT supporters
            it_supporters = ITSupporter.objects.filter(is_active=True)

            if it_supporters.exists():
                it_emails = [supporter.email for supporter in it_supporters]
                employee = instance.employee

                try:
                    # Simple plain text message
                    message = f"""Hi IT Team,

An employee offboarding has been initiated and requires asset collection.

Employee Details:
- Name: {employee.full_name}
- Email: {employee.email}
- Position: {employee.get_position_display() if employee.position else 'Not specified'}
- Last Working Date: {instance.last_working_date}

Asset Status:
- Laptop Returned: {'Yes' if instance.laptop_returned else 'No'}
- Charger Returned: {'Yes' if instance.charger_returned else 'No'}

Please ensure all company assets are collected before the last working date.

{f'Remarks: {instance.remarks}' if instance.remarks else ''}

Best Regards,
HR Team - Techoptima Pvt Ltd"""

                    email = EmailMessage(
                        subject=f"Asset Collection Required - Employee Offboarding: {employee.full_name}",
                        body=message,
                        to=it_emails,
                    )
                    email.content_subtype = "plain"
                    email.send()

                    print(f"✅ IT team notified for asset collection - Employee: {employee.full_name}")
                    print(f"📧 Email sent to: {', '.join(it_emails)}")

                except Exception as e:
                    print(f"❌ Failed to send IT asset collection email for {employee.full_name}: {str(e)}")
            else:
                print(f"⚠️ No active IT supporters found for asset collection notification - Employee: {instance.employee.full_name}")
        except Exception as e:
            # Catch any DB/config issues so offboarding creation never fails due to notifications
            print(f"❌ Offboarding IT notification failed due to system error: {str(e)}")