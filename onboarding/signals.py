# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Employee, Offboarding, ITSupporter
# from django.core.mail import EmailMessage

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
        
#         # Email content for IT team
#         subject = f"Asset Assignment Required - Employee: {instance.name}"
#         message = f"""
# Hi IT Team,

# An employee record has been saved and requires asset assignment.

# Employee Details:
# - Name: {instance.name}
# - Email: {instance.email}
# - Position: {instance.position or 'Not specified'}
# - Employee Type: {instance.get_employee_type_display()}
# - Joining Date: {instance.joining_date or 'Not specified'}

# Please proceed with asset assignment (laptop, charger, access cards, etc.).

# Document Collection Status:
# - Aadhar/PAN: {'✓' if instance.aadhar_pan_collected else '✗'}
# - Payslips: {'✓' if instance.payslips_collected else '✗'}
# - Educational Certificates: {'✓' if instance.educational_certificates_collected else '✗'}
# - Previous Offer Letter: {'✓' if instance.previous_offer_letter_collected else '✗'}
# - Relieving/Experience Letters: {'✓' if instance.relieving_experience_letters_collected else '✗'}
# - Appraisal/Hike Letters: {'✓' if instance.appraisal_hike_letters_collected else '✗'}

# Best Regards,
# HR Team - Techoptima Pvt Ltd
#         """
#         from django.conf import settings

#         try:
#             # Send email to IT supporters
#             email_obj = EmailMessage(
#                 subject=subject,
#                 body=message,
#                 from_email=settings.DEFAULT_FROM_EMAIL,

#                 to=it_emails,
#             )
#             email_obj.content_subtype = "plain"
#             email_obj.send()
            
#             # Update the flag to prevent duplicate emails
#             Employee.objects.filter(pk=instance.pk).update(it_notification_sent=True)
#             print(f"✅ IT team notified for asset assignment - Employee: {instance.name}")
#             print(f"📧 Email sent to: {', '.join(it_emails)}")
            
#         except Exception as e:
#             print(f"❌ Failed to send IT notification email for {instance.name}: {str(e)}")
#     else:
#         print(f"⚠️ No active IT supporters found for asset assignment notification - Employee: {instance.name}")

# # Offboarding: send notification when Offboarding is created
# @receiver(post_save, sender=Offboarding)
# def send_offboarding_email(sender, instance, created, **kwargs):
#     if created and instance.employee and instance.employee.email:
#         employee = instance.employee
#         context = {
#             'employee_name': employee.name,
#             'last_working_date': instance.last_working_date,
#         }
#         plain_message = f"Hi {employee.name},\n\nYour offboarding process has been recorded.\nLast Working Date: {instance.last_working_date}\n\nBest Regards,\nHR Team"
#         email = EmailMessage(
#             subject=f"Offboarding Process Initiated - {employee.name}",
#             body=plain_message,
#             to=[employee.email],
#         )
#         email.content_subtype = "plain"
#         email.send()
#         print(f"✅ Offboarding email sent to {employee.email}")

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
            
#             # Email content for IT team
#             subject = f"Asset Collection Required - Employee Offboarding: {employee.name}"
#             message = f"""
# Hi IT Team,

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

# Remarks: {instance.remarks or 'None'}

# Best Regards,
# HR Team - Techoptima Pvt Ltd
#             """
            
#             try:
#                 # Send email to IT supporters
#                 email_obj = EmailMessage(
#                     subject=subject,
#                     body=message,
#                     to=it_emails,
#                 )
#                 email_obj.content_subtype = "plain"
#                 email_obj.send()
                
#                 print(f"✅ IT team notified for asset collection - Employee: {employee.name}")
#                 print(f"📧 Email sent to: {', '.join(it_emails)}")
                
#             except Exception as e:
#                 print(f"❌ Failed to send IT asset collection email for {employee.name}: {str(e)}")
#         else:
#             print(f"⚠️ No active IT supporters found for asset collection notification - Employee: {employee.name}")



# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Employee, Offboarding, ITSupporter
# from django.core.mail import EmailMessage
# from django.conf import settings

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
        
#         try:
#             # Simple plain text message - no template needed
#             message = f"""Hi IT Team,

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
            
#             email = EmailMessage(
#                 subject=f" Asset Assignment - {instance.name}",
#                 body=message,
#                 from_email=settings.DEFAULT_FROM_EMAIL,  # ✅ Ensure from_email is set
#                 to=it_emails,
#                 # reply_to=[settings.EMAIL_HOST_USER],  # Optional: for clarity
#             )
#             email.content_subtype = "plain"
#             email.send(fail_silently=False)
            
#             # Update the flag to prevent duplicate emails
#             Employee.objects.filter(pk=instance.pk).update(it_notification_sent=True)
#             print(f"✅ IT team notified for asset assignment - Employee: {instance.name}")
#             print(f"📧 Email sent to: {', '.join(it_emails)}")
            
#         except Exception as e:
#             print(f"❌ Failed to send IT notification email for {instance.name}: {str(e)}")
#     else:
#         print(f"⚠️ No active IT supporters found for asset assignment notification - Employee: {instance.name}")

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
#                 to=[employee.email],  # No from_email - just like your working code
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
            
#             try:
#                 # Simple plain text message
#                 message = f"""Hi IT Team,

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
                
#                 email = EmailMessage(
#                     subject=f"Asset Collection Required - Employee Offboarding: {employee.name}",
#                     body=message,
#                     to=it_emails,  # No from_email - just like your working code
#                 )
#                 email.content_subtype = "plain"
#                 email.send()
                
#                 print(f"✅ IT team notified for asset collection - Employee: {employee.name}")
#                 print(f"📧 Email sent to: {', '.join(it_emails)}")
                
#             except Exception as e:
#                 print(f"❌ Failed to send IT asset collection email for {employee.name}: {str(e)}")
#         else:
#             print(f"⚠️ No active IT supporters found for asset collection notification - Employee: {employee.name}")



# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Employee , Offboarding
# from django.template.loader import render_to_string
# from resource_management.utils import send_email_notification
# from io import BytesIO
# from xhtml2pdf import pisa
# from django.core.mail import EmailMessage

# @receiver(post_save, sender=Employee)
# def send_offer_letter_on_create(sender, instance, created, **kwargs):
#     if created and instance.email:
#         # Map employee type to template file
#         template_map = {
#             'fresher': 'offers/offer_letter_fresher.html',
#             'employee': 'offers/offer_letter_experienced.html',
#         }

#         template_name = template_map.get(instance.employee_type, 'offers/offer_letter_experienced.html')

#         context = {
#             'user': instance,
#             'employee': instance,
#             # 'user_name': instance.name,
#             'joining_date': instance.joining_date,
#             'position': instance.position,
#             # 'salary_lpa': instance.salary_lpa,
#             # add any other context vars you want in the templates
#         }

#         # Render the offer letter HTML
#         html_content = render_to_string(template_name, context)

#         # Generate PDF from HTML
#         result = BytesIO()
#         pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
#         if pdf.err:
#             print("❌ Failed to generate PDF")
#             return

#         pdf_file = result.getvalue()

#         # Send the email with attached PDF
#         email_obj = EmailMessage(
#             subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
#             body=f"Hi {instance.name},\n\nPlease find your offer letter attached.",
#             to=[instance.email],
#         )
#         email_obj.attach(f"OfferLetter_{instance.name}.pdf", pdf_file, "application/pdf")
#         email_obj.content_subtype = "plain"
#         email_obj.send()

#         print(f"✅ Offer letter PDF emailed to {instance.email} using template {template_name}")
# # Offboarding: send notification when Offboarding is created
# @receiver(post_save, sender=Offboarding)
# def send_offboarding_email(sender, instance, created, **kwargs):
#     if created and instance.employee and instance.employee.email:
#         employee = instance.employee
#         context = {
#             'employee_name': employee.name,
#             'last_working_date': instance.last_working_date,
#             'notice_period_days': instance.notice_period_days,
#         }
#         plain_message = f"Hi {employee.name},\n\nYour offboarding process has been recorded.\nLast Working Date: {instance.last_working_date}\nNotice Period: {instance.notice_period_days} days.\n\nBest Regards,\nHR Team"
#         email = EmailMessage(
#             subject=f"Offboarding Process Initiated - {employee.name}",
#             body=plain_message,
#             to=[employee.email],
#         )
#         email.content_subtype = "plain"
#         email.send()
#         print(f"✅ Offboarding email sent to {employee.email}")



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
    
    # Get all active IT supporters
    it_supporters = ITSupporter.objects.filter(is_active=True)
    print(f"🔍 Found {it_supporters.count()} active IT supporters")
    
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
                to=it_emails,
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