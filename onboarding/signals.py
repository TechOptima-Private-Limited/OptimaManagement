



# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Employee, Offboarding, ITSupporter
# from django.template.loader import render_to_string
# from resource_management.utils import send_email_notification
# from io import BytesIO
# from xhtml2pdf import pisa
# from django.core.mail import EmailMessage
# from django.conf import settings
# from django.contrib.auth.models import User
# @receiver(post_save, sender=Employee)
# def sync_user_account(sender, instance, created, **kwargs):
#     if not instance.employee_id or not instance.email:
#         print("ℹ️ Skipping user sync – employee_id or email missing.")
#         return

#     # Extract user-related fields
#     first = (instance.first_name or "").strip().lower()
#     last = (instance.last_name or "").strip().lower()
#     emp_id = (instance.employee_id or "").strip()

#     # Generate password
#     password = f"{last[:3].capitalize()}{first[:3]}@{emp_id[-3:]}" if len(emp_id) >= 3 else "Temp@123"

#     user_qs = User.objects.filter(email=instance.email)

#     if user_qs.exists():
#         user = user_qs.first()
#         user.username = emp_id
#         user.first_name = instance.first_name
#         user.last_name = instance.last_name
#         user.save()
#         print(f"✅ Updated User: {user.username}")
#     else:
#         # Check for username conflict
#         if User.objects.filter(username=emp_id).exists():
#             print(f"⚠️ Username {emp_id} already taken. Skipping.")
#             return

#         user = User.objects.create_user(
#             username=emp_id,
#             email=instance.email,
#             first_name=instance.first_name,
#             last_name=instance.last_name,
#             password=password
#         )
#         print(f"🆕 Created User: {user.username} with password: {password}")


# @receiver(post_save, sender=Employee)
# def send_it_asset_assignment_email(sender, instance, created, **kwargs):
#     """
#     Send email notification to IT team when:
#     1. HR completes employment details (department, position, employee_type)
#     2. IT notification hasn't been sent yet
#     3. NOT when employee initially submits the form
#     """
#     print(f"🔍 Signal triggered for Employee: {instance.full_name}")
#     print(f"   - Created: {created}")
#     print(f"   - IT notification sent: {instance.it_notification_sent}")
#     print(f"   - Is self submitted: {instance.is_self_submitted}")
#     print(f"   - Has employment details: Department={instance.department}, Position={instance.position}, Type={instance.employee_type}")
    
#     # Skip if IT notification already sent
#     if instance.it_notification_sent:
#         print("❌ Skipping: IT notification already sent")
#         return
    
#     # Skip if this is an employee self-submission without employment details
#     # (Employee submissions won't have department, position, employee_type filled)
#     if instance.is_self_submitted and not all([instance.department, instance.position, instance.employee_type]):
#         print("❌ Skipping: Employee self-submission without employment details completed by HR")
#         return
    
#     # Only send IT notification when employment details are complete
#     # This happens when HR reviews and completes the employee record
#     if not all([instance.department, instance.position, instance.employee_type]):
#         print("❌ Skipping: Employment details not complete (department, position, employee_type required)")
#         return
    
#     print("✅ Proceeding with IT notification email - Employment details completed by HR")
    
#     # Get all active IT supporters
#     it_supporters = ITSupporter.objects.filter(is_active=True)
#     print(f"🔍 Found {it_supporters.count()} active IT supporters")
    
#     if it_supporters.exists():
#         it_emails = [supporter.email for supporter in it_supporters]
#         print(f"📧 IT Emails: {it_emails}")
        
#         try:
#             # Simple plain text message
#             submission_status = "after HR review and approval" if instance.is_self_submitted else "by HR directly"
            
#             message = f"""Hi IT Team,

# An employee record has been completed {submission_status} and requires asset assignment.

# Employee Details:
# - Name: {instance.full_name}
# - Email: {instance.email}
# - Department: {instance.get_department_display()}
# - Position: {instance.get_position_display()}
# - Employee Type: {instance.get_employee_type_display()}
# - Joining Date: {instance.joining_date or 'Not specified'}

# Employment details have been finalized by HR. Please proceed with asset assignment (laptop, charger, access cards, etc.).


# Best Regards,
# HR Team - Techoptima Pvt Ltd"""
#             # Send email
#             subject_line = f"Asset Assignment Required - Employee Ready: {instance.full_name}"
#             if instance.is_self_submitted:
#                 subject_line = f"Asset Assignment Required - Employee Reviewed & Approved: {instance.full_name}"
            
#             email = EmailMessage(
#                 subject=subject_line,
#                 body=message,
#                 to=it_emails,
#             )
#             email.content_subtype = "plain"
#             email.send()
            
#             # Update the flag to prevent duplicate emails
#             Employee.objects.filter(pk=instance.pk).update(it_notification_sent=True)
#             print(f"✅ IT team notified for asset assignment - Employee: {instance.full_name}")
#             print(f"📧 Email sent to: {', '.join(it_emails)}")
            
#         except Exception as e:
#             print(f"❌ Failed to send IT notification email for {instance.full_name}: {str(e)}")
#     else:
#         print(f"⚠️ No active IT supporters found for asset assignment notification - Employee: {instance.full_name}")

# # onboarding/signals.py - Add this simple signal

# @receiver(post_save, sender=Offboarding)
# def notify_it_team_for_asset_collection(sender, instance, created, **kwargs):
#     """
#     Send email notification to IT team when HR creates offboarding record
#     """
#     if created and instance.user:
#         print(f"🔍 Offboarding signal triggered for: {instance.user.username}")
        
#         # Get all active IT supporters
#         it_supporters = ITSupporter.objects.filter(is_active=True)
        
#         if it_supporters.exists():
#             it_emails = [supporter.email for supporter in it_supporters]
#             employee = instance.user
            
#             try:
#                 # Simple notification message
#                 message = f"""Hi IT Team,

# An employee offboarding has been initiated by HR and requires asset collection.

# Employee Details:
# - Username: {employee.username}
# - Email: {employee.email}
# - Last Working Date: {instance.last_working_date}

# {f'HR Remarks: {instance.remarks}' if instance.remarks else 'No additional remarks from HR.'}

# Next Steps:
# 1. Contact the employee to arrange asset return
# 2. Use the "Offboarding Asset Return" in Asset Management to process returns
# 3. Ensure all company assets are collected before the last working date


# Best Regards,
# HR Team - Techoptima Pvt Ltd"""
                
#                 # Send email to IT team
#                 email = EmailMessage(
#                     subject=f"Asset Collection Required - Employee Offboarding: {employee.first_name} {employee.last_name}",
#                     body=message,
#                     to=it_emails,
#                 )
#                 email.content_subtype = "plain"
#                 email.send()
                
#                 print(f"✅ IT team notified for asset collection - Employee: {employee.first_name} {employee.last_name}")
#                 print(f"📧 Email sent to: {', '.join(it_emails)}")
                
#             except Exception as e:
#                 print(f"❌ Failed to send IT asset collection email for {employee.first_name} {employee.last_name}: {str(e)}")
#         else:
#             print(f"⚠️ No active IT supporters found for asset collection notification")
#     else:
#         print("❌ Offboarding signal skipped - not a new record or no user associated")



from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Employee, Offboarding, ITSupporter
from django.template.loader import render_to_string
from resource_management.utils import send_email_notification
from io import BytesIO
from xhtml2pdf import pisa
from django.core.mail import EmailMessage
from django.conf import settings
from django.contrib.auth.models import User

@receiver(post_save, sender=Employee)
def sync_user_account(sender, instance, created, **kwargs):
    # Skip if employee_id or company_email is missing
    if not instance.employee_id or not instance.company_email:
        print("ℹ️ Skipping user sync – employee_id or company_email missing.")
        return

    # Extract user-related fields
    first = (instance.first_name or "").strip().lower()
    last = (instance.last_name or "").strip().lower()
    emp_id = (instance.employee_id or "").strip()

    # Generate password
    password = f"{last[:3].capitalize()}{first[:3]}@{emp_id[-3:]}" if len(emp_id) >= 3 else "Temp@123"

    # Use company_email instead of personal email for User account
    user_qs = User.objects.filter(email=instance.company_email)

    if user_qs.exists():
        user = user_qs.first()
        user.username = emp_id
        user.first_name = instance.first_name
        user.last_name = instance.last_name
        
        user.save()
        print(f"✅ Updated User: {user.username} with company email: {user.email}")
    else:
        # Check for username conflict
        if User.objects.filter(username=emp_id).exists():
            print(f"⚠️ Username {emp_id} already taken. Skipping.")
            return

        user = User.objects.create_user(
            username=emp_id,
            email=instance.company_email,  # Use company email for User account
            first_name=instance.first_name,
            last_name=instance.last_name,
            password=password,
            is_active=True
        )
        print(f"🆕 Created User: {user.username} with company email: {user.email} and password: {password}")


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
- Personal Email: {instance.email}
- Company Email: {instance.company_email or 'Not Set'}
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

# onboarding/signals.py - Add this simple signal

# onboarding/signals.py - Updated signal with employee soft delete

@receiver(post_save, sender=Offboarding)
def notify_it_team_for_asset_collection(sender, instance, created, **kwargs):
    """
    Send email notification to IT team when HR creates offboarding record
    AND soft delete the corresponding employee
    """
    if created and instance.user:
        print(f"🔍 Offboarding signal triggered for: {instance.user.username}")
        
        # 1. SOFT DELETE THE EMPLOYEE RECORD
        try:
            # Find employee by company email first, then personal email
            employee = None
            
            # Try to find employee by company email (User.email = Employee.company_email)
            employee = Employee.objects.filter(company_email=instance.user.email).first()
            
            # If not found, try to find by personal email (fallback)
            if not employee:
                employee = Employee.objects.filter(email=instance.user.email).first()
            
            if employee and not employee.is_deleted:
                employee.soft_delete()
                print(f"✅ Employee '{employee.full_name}' soft deleted successfully")
            elif employee and employee.is_deleted:
                print(f"⚠️ Employee '{employee.full_name}' was already soft deleted")
            else:
                print(f"❌ No employee record found for user {instance.user.email}")
                
        except Exception as e:
            print(f"❌ Error soft deleting employee for {instance.user.email}: {str(e)}")
        
        # 2. DEACTIVATE THE USER ACCOUNT
        try:
            instance.user.is_active = False
            instance.user.save()
            print(f"✅ User account '{instance.user.username}' deactivated")
        except Exception as e:
            print(f"❌ Error deactivating user {instance.user.username}: {str(e)}")
        
        # 3. SEND EMAIL TO IT TEAM (existing functionality)
        it_supporters = ITSupporter.objects.filter(is_active=True)
        
        if it_supporters.exists():
            it_emails = [supporter.email for supporter in it_supporters]
            employee_info = instance.user
            
            try:
                # Enhanced notification message
                message = f"""Hi IT Team,

An employee offboarding has been initiated by HR and requires asset collection.

Employee Details:
- Username: {employee_info.username}
- Email: {employee_info.email}
- Full Name: {employee_info.first_name} {employee_info.last_name}
- Last Working Date: {instance.last_working_date}

{f'HR Remarks: {instance.remarks}' if hasattr(instance, 'remarks') and instance.remarks else 'No additional remarks from HR.'}

AUTOMATIC ACTIONS TAKEN:
✅ Employee record has been soft deleted from the system
✅ User account has been deactivated

Next Steps:
1. Contact the employee to arrange asset return
2. Use the "Offboarding Asset Return" in Asset Management to process returns
3. Ensure all company assets are collected before the last working date

Best Regards,
HR Team - Techoptima Pvt Ltd"""
                
                # Send email to IT team
                email = EmailMessage(
                    subject=f"Asset Collection Required - Employee Offboarding: {employee_info.first_name} {employee_info.last_name}",
                    body=message,
                    to=it_emails,
                )
                email.content_subtype = "plain"
                email.send()
                
                print(f"✅ IT team notified for asset collection - Employee: {employee_info.first_name} {employee_info.last_name}")
                print(f"📧 Email sent to: {', '.join(it_emails)}")
                
            except Exception as e:
                print(f"❌ Failed to send IT asset collection email for {employee_info.first_name} {employee_info.last_name}: {str(e)}")
        else:
            print(f"⚠️ No active IT supporters found for asset collection notification")
    else:
        print("❌ Offboarding signal skipped - not a new record or no user associated")