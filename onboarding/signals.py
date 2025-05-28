# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Employee
# from django.template.loader import render_to_string
# from resource_management.utils import send_email_notification
# from io import BytesIO
# from xhtml2pdf import pisa
# from django.core.mail import EmailMessage

# @receiver(post_save, sender=Employee)
# def send_offer_letter_on_create(sender, instance, created, **kwargs):
#     if created and instance.email:
#         context = {
#             'user': instance,  # used in email template
#             'employee': instance,
#             'user_name': instance.name,
#             'joining_date': instance.joining_date,
#             'position': instance.position,

#         }

#         # Render the offer letter HTML
#         html_content = render_to_string('offers/offer_letter_template.html', context)

#         # Generate PDF from HTML
#         result = BytesIO()
#         pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
#         if pdf.err:
#             print("❌ Failed to generate PDF")
#             return

#         pdf_file = result.getvalue()

#         # Store PDF in context if needed (optional)
#         context["offer_letter_pdf"] = pdf_file

#         # Send the email using your existing system
#         email_obj = EmailMessage(
#             subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
#             body="Hi {},\n\nPlease find your offer letter attached.".format(instance.name),
#             to=[instance.email],
#         )
#         email_obj.attach(f"OfferLetter_{instance.name}.pdf", pdf_file, "application/pdf")
#         email_obj.content_subtype = "plain"
#         email_obj.send()

#         print(f"✅ Offer letter PDF emailed to {instance.email}")
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Employee , Offboarding
from django.template.loader import render_to_string
from resource_management.utils import send_email_notification
from io import BytesIO
from xhtml2pdf import pisa
from django.core.mail import EmailMessage

@receiver(post_save, sender=Employee)
def send_offer_letter_on_create(sender, instance, created, **kwargs):
    if created and instance.email:
        # Map employee type to template file
        template_map = {
            'intern': 'offers/offer_letter_intern.html',
            'fresher': 'offers/offer_letter_fresher.html',
            'experienced': 'offers/offer_letter_experienced.html',
        }

        template_name = template_map.get(instance.employee_type, 'offers/offer_letter_experienced.html')

        context = {
            'user': instance,
            'employee': instance,
            'user_name': instance.name,
            'joining_date': instance.joining_date,
            'position': instance.position,
            'salary_lpa': instance.salary_lpa,
            # add any other context vars you want in the templates
        }

        # Render the offer letter HTML
        html_content = render_to_string(template_name, context)

        # Generate PDF from HTML
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
        if pdf.err:
            print("❌ Failed to generate PDF")
            return

        pdf_file = result.getvalue()

        # Send the email with attached PDF
        email_obj = EmailMessage(
            subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
            body=f"Hi {instance.name},\n\nPlease find your offer letter attached.",
            to=[instance.email],
        )
        email_obj.attach(f"OfferLetter_{instance.name}.pdf", pdf_file, "application/pdf")
        email_obj.content_subtype = "plain"
        email_obj.send()

        print(f"✅ Offer letter PDF emailed to {instance.email} using template {template_name}")
# Offboarding: send notification when Offboarding is created
@receiver(post_save, sender=Offboarding)
def send_offboarding_email(sender, instance, created, **kwargs):
    if created and instance.employee and instance.employee.email:
        employee = instance.employee
        context = {
            'employee_name': employee.name,
            'last_working_date': instance.last_working_date,
            'notice_period_days': instance.notice_period_days,
        }
        plain_message = f"Hi {employee.name},\n\nYour offboarding process has been recorded.\nLast Working Date: {instance.last_working_date}\nNotice Period: {instance.notice_period_days} days.\n\nBest Regards,\nHR Team"
        email = EmailMessage(
            subject=f"Offboarding Process Initiated - {employee.name}",
            body=plain_message,
            to=[employee.email],
        )
        email.content_subtype = "plain"
        email.send()
        print(f"✅ Offboarding email sent to {employee.email}")