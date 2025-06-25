
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Employee, Offboarding, ITSupporter
from django.template.loader import render_to_string
from resource_management.utils import send_email_notification
from io import BytesIO
from xhtml2pdf import pisa
from django.core.mail import EmailMessage
from django.conf import settings

@receiver(post_save, sender=Employee)
def send_it_asset_assignment_email(sender, instance, created, **kwargs):
    """
    Send email notification to IT team when:
    1. HR creates a new employee (first time)
    2. HR updates an employee but IT notification hasn't been sent yet
    """
    print(f"🔍 Signal triggered for Employee: {instance.name}")
    print(f"   - Created: {created}")
    print(f"   - IT notification sent: {instance.it_notification_sent}")
    
    # Send email in two cases:
    # 1. New employee creation (created = True)
    # 2. Employee update where notification hasn't been sent yet (created = False and it_notification_sent = False)
    
    if not created and instance.it_notification_sent:
        print("❌ Skipping: Employee update but IT notification already sent")
        return
    
    print("✅ Proceeding with IT notification email...")
    
    # # Get all active IT supporters
    it_supporters = ITSupporter.objects.filter(is_active=True)
    print(f"🔍 Found {it_supporters.count()} active IT supporters")
    # Hardcoded IT support emails
    it_supporters = ["thotaganesh590@gmail.com"]
    print(f"📧 IT Emails: {it_supporters}")
    
    if it_supporters.exists():
        it_emails = [supporter.email for supporter in it_supporters]
        print(f"📧 IT Emails: {it_emails}")
        
        try:
            # Simple plain text message
            message = f"""Hi IT Team,

An employee record has been saved and requires asset assignment.

Employee Details:
- Name: {instance.name}
- Email: {instance.email}
- Position: {instance.position or 'Not specified'}
- Employee Type: {instance.get_employee_type_display()}
- Joining Date: {instance.joining_date or 'Not specified'}

Please proceed with asset assignment (laptop, charger, access cards, etc.).


Best Regards,
HR Team - Techoptima Pvt Ltd"""
            # Send email
            email = EmailMessage(
                subject=f"Asset Assignment Required - Employee: {instance.name}",
                body=message,
                to="thotaganesh590@gmail.com",
                # to=settings.IT_SUPPORT_EMAIL,  # Ensure from_email is set
            )
            email.content_subtype = "plain"
            email.send()
            
            # Update the flag to prevent duplicate emails
            Employee.objects.filter(pk=instance.pk).update(it_notification_sent=True)
            print(f"✅ IT team notified for asset assignment - Employee: {instance.name}")
            print(f"📧 Email sent to: {', '.join(it_emails)}")
            
        except Exception as e:
            print(f"❌ Failed to send IT notification email for {instance.name}: {str(e)}")
    else:
        print(f"⚠️ No active IT supporters found for asset assignment notification - Employee: {instance.name}")

@receiver(post_save, sender=Offboarding)
def send_offboarding_email(sender, instance, created, **kwargs):
    if created and instance.employee and instance.employee.email:
        employee = instance.employee
        
        # Simple plain text message
        message = f"""Hi {employee.name},

Your offboarding process has been recorded in our system.

Last Working Date: {instance.last_working_date}

Please ensure you complete all pending work and return company assets.

Best Regards,
HR Team - Techoptima Pvt Ltd"""
        
        try:
            email = EmailMessage(
                subject=f"Offboarding Process Initiated - {employee.name}",
                body=message,
                to=[employee.email],
            )
            email.content_subtype = "plain"
            email.send()
            print(f"✅ Offboarding email sent to {employee.email}")
            
        except Exception as e:
            print(f"❌ Failed to send offboarding email: {str(e)}")

@receiver(post_save, sender=Offboarding)
def notify_it_team_for_asset_collection(sender, instance, created, **kwargs):
    """
    Send email notification to IT team when offboarding is created
    """
    if created and instance.employee:
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
- Name: {employee.name}
- Email: {employee.email}
- Position: {employee.position or 'Not specified'}
- Last Working Date: {instance.last_working_date}

Asset Status:
- Laptop Returned: {'Yes' if instance.laptop_returned else 'No'}
- Charger Returned: {'Yes' if instance.charger_returned else 'No'}

Please ensure all company assets are collected before the last working date.

{f'Remarks: {instance.remarks}' if instance.remarks else ''}

Best Regards,
HR Team - Techoptima Pvt Ltd"""
                
                email = EmailMessage(
                    subject=f"Asset Collection Required - Employee Offboarding: {employee.name}",
                    body=message,
                    to=it_emails,
                )
                email.content_subtype = "plain"
                email.send()
                
                print(f"✅ IT team notified for asset collection - Employee: {employee.name}")
                print(f"📧 Email sent to: {', '.join(it_emails)}")
                
            except Exception as e:
                print(f"❌ Failed to send IT asset collection email for {employee.name}: {str(e)}")
        else:
            print(f"⚠️ No active IT supporters found for asset collection notification - Employee: {employee.name}")





# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Employee, Offboarding, ITSupporter  # Restored ITSupporter import
# from django.contrib.auth.models import User
# from django.template.loader import render_to_string
# from resource_management.utils import send_email_notification
# from io import BytesIO
# from xhtml2pdf import pisa
# from django.core.mail import EmailMessage
# from django.conf import settings

# @receiver(post_save, sender=Employee)
# def create_user_for_employee(sender, instance, created, **kwargs):
#     """
#     Create a User record when Employee is created
#     """
#     if created and not instance.user:
#         print(f"🔍 Creating User for Employee: {instance.name}")
        
#         try:
#             # Create username from email (part before @)
#             username = instance.email.split('@')[0]
            
#             # Check if username already exists, if so add a number
#             counter = 1
#             original_username = username
#             while User.objects.filter(username=username).exists():
#                 username = f"{original_username}{counter}"
#                 counter += 1
            
#             # Create the User
#             user = User.objects.create_user(
#                 username=username,
#                 email=instance.email,
#                 first_name=instance.name.split()[0] if instance.name.split() else instance.name,
#                 last_name=' '.join(instance.name.split()[1:]) if len(instance.name.split()) > 1 else '',
#                 is_active=True,
#                 is_staff=False,  # You can change this as needed
#             )
            
#             # Link the user to the employee
#             instance.user = user
#             instance.save()
            
#             print(f"✅ User created successfully: {username} for {instance.name}")
            
#         except Exception as e:
#             print(f"❌ Failed to create User for {instance.name}: {str(e)}")

# @receiver(post_save, sender=Employee)
# def send_it_asset_assignment_email(sender, instance, created, **kwargs):
#     """
#     Send email notification to IT team when:
#     1. HR creates a new employee (first time)
#     2. HR updates an employee but IT notification hasn't been sent yet
#     """
#     print(f"🔍 Signal triggered for Employee: {instance.name}")
#     print(f"   - Created: {created}")
#     print(f"   - IT notification sent: {instance.it_notification_sent}")
    
#     # Send email in two cases:
#     # 1. New employee creation (created = True)
#     # 2. Employee update where notification hasn't been sent yet (created = False and it_notification_sent = False)
    
#     if not created and instance.it_notification_sent:
#         print("❌ Skipping: Employee update but IT notification already sent")
#         return
    
#     print("✅ Proceeding with IT notification email...")
    
#     # Get all active IT supporters
#     it_supporters = ITSupporter.objects.filter(is_active=True)
#     print(f"🔍 Found {it_supporters.count()} active IT supporters")
    
#     if it_supporters.exists():
#         it_emails = [supporter.email for supporter in it_supporters]
#         print(f"📧 IT Emails: {it_emails}")
    
#     try:
#         # Simple plain text message
#         message = f"""Hi IT Team,

# An employee record has been saved and requires asset assignment.

# Employee Details:
# - Name: {instance.name}
# - Email: {instance.email}
# - Position: {instance.position or 'Not specified'}
# - Employee Type: {instance.get_employee_type_display()}
# - Joining Date: {instance.joining_date or 'Not specified'}

# Please proceed with asset assignment (laptop, charger, access cards, etc.).


# Best Regards,
# HR Team - Techoptima Pvt Ltd"""
#         # Send email
#         email = EmailMessage(
#             subject=f"Asset Assignment Required - Employee: {instance.name}",
#             body=message,
#             to=it_emails,  # Using hardcoded emails
#             # to=settings.IT_SUPPORT_EMAIL,  # Ensure from_email is set
#         )
#         email.content_subtype = "plain"
#         email.send()
        
#         # Update the flag to prevent duplicate emails
#         Employee.objects.filter(pk=instance.pk).update(it_notification_sent=True)
#         print(f"✅ IT team notified for asset assignment - Employee: {instance.name}")
#         print(f"📧 Email sent to: {', '.join(it_emails)}")
        
#     except Exception as e:
#         print(f"❌ Failed to send IT notification email for {instance.name}: {str(e)}")

# @receiver(post_save, sender=Offboarding)
# def send_offboarding_email(sender, instance, created, **kwargs):
#     if created and instance.employee and instance.employee.email:
#         employee = instance.employee
        
#         # Simple plain text message
#         message = f"""Hi {employee.name},

# Your offboarding process has been recorded in our system.

# Last Working Date: {instance.last_working_date}

# Please ensure you complete all pending work and return company assets.

# Best Regards,
# HR Team - Techoptima Pvt Ltd"""
        
#         try:
#             email = EmailMessage(
#                 subject=f"Offboarding Process Initiated - {employee.name}",
#                 body=message,
#                 to=[employee.email],
#             )
#             email.content_subtype = "plain"
#             email.send()
#             print(f"✅ Offboarding email sent to {employee.email}")
            
#         except Exception as e:
#             print(f"❌ Failed to send offboarding email: {str(e)}")

# @receiver(post_save, sender=Offboarding)
# def notify_it_team_for_asset_collection(sender, instance, created, **kwargs):
#     """
#     Send email notification to IT team when offboarding is created
#     """
#     if created and instance.employee:
#         # Get all active IT supporters
#         it_supporters = ITSupporter.objects.filter(is_active=True)
        
#         if it_supporters.exists():
#             it_emails = [supporter.email for supporter in it_supporters]
#             employee = instance.employee
        
#         try:
#             # Simple plain text message
#             message = f"""Hi IT Team,

# An employee offboarding has been initiated and requires asset collection.

# Employee Details:
# - Name: {employee.name}
# - Email: {employee.email}
# - Position: {employee.position or 'Not specified'}
# - Last Working Date: {instance.last_working_date}

# Asset Status:
# - Laptop Returned: {'Yes' if instance.laptop_returned else 'No'}
# - Charger Returned: {'Yes' if instance.charger_returned else 'No'}

# Please ensure all company assets are collected before the last working date.

# {f'Remarks: {instance.remarks}' if instance.remarks else ''}

# Best Regards,
# HR Team - Techoptima Pvt Ltd"""
            
#             email = EmailMessage(
#                 subject=f"Asset Collection Required - Employee Offboarding: {employee.name}",
#                 body=message,
#                 to=it_emails,  # Using hardcoded emails
#             )
#             email.content_subtype = "plain"
#             email.send()
            
#             print(f"✅ IT team notified for asset collection - Employee: {employee.name}")
#             print(f"📧 Email sent to: {', '.join(it_emails)}")
            
#         except Exception as e:
#             print(f"❌ Failed to send IT asset collection email for {employee.name}: {str(e)}")