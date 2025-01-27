from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

def get_email_content_for_optima(page_name, client_name, client_details):
    """
    Prepare the subject and body for the email notification.
    """
    # Email Subject
    subject = f"New Inquiry: {page_name} by {client_name}"
    
    # Email Body
    body = f"""
    <html>
        <body>
            <p>Hurray!,</p>
            <p>We have received a new inquiry from the website. Below are the details:</p>
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th style="text-align: left;">Field</th>
                    <th style="text-align: left;">Details</th>
                </tr>
                <tr><td><b>Page Name</b></td><td>{client_details['page_name']}</td></tr>
                <tr><td><b>Client Name</b></td><td>{client_details['first_name']} {client_details['last_name']}</td></tr>
                <tr><td><b>Email</b></td><td>{client_details['email']}</td></tr>
                <tr><td><b>Company</b></td><td>{client_details['company']}</td></tr>
                <tr><td><b>Country</b></td><td>{client_details['country']}</td></tr>
                <tr><td><b>Phone</b></td><td>{client_details['phone']}</td></tr>
                <tr><td><b>Contact Reason</b></td><td>{client_details['contact_reason']}</td></tr>
                <tr><td><b>Message</b></td><td>{client_details['message']}</td></tr>
                <tr><td><b>Job Title</b></td><td>{client_details['job_title'] or 'Not provided'}</td></tr>
            </table>
            <p>Regards,</p>
            <p>Team Optima</p>
        </body>
    </html>
    """
    return subject, body

def get_email_content(page_name, name):
    print(page_name," -------------- ", name)
    email_templates = {
        "signup": {
            "subject": f"Welcome to our service {name}!",
            "body": f"Dear {name},\n\nThank you for signing up. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "aiengineering": {
            "subject": "AI Engineering Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our AI Engineering services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "datascience": {
            "subject": "Data Science Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Data Science services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "aiquality": {
            "subject": "AI Quality Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our AI Quality services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "aiassurance": {
            "subject": "AI Assurance Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our AI Assurance services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "cloudtransformation": {
            "subject": "Cloud Transformation Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Cloud Transformation services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "cloudmigrations": {
            "subject": "Cloud Migrations Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Cloud Migrations services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "cloudoperations": {
            "subject": "Cloud Operations Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Cloud Operations services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "cloudnativeapps": {
            "subject": "Cloud Native Application Development Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Cloud Native Application Development services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "clouddevops": {
            "subject": "Cloud DevOps Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Cloud DevOps services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "enterprisedevelopment": {
            "subject": "Enterprise Application Development Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Enterprise Application Development services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "enterpriseplatform": {
            "subject": "Enterprise Platform Development Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Enterprise Platform Development services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "agiledevops": {
            "subject": "Agile DevOps Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Agile DevOps services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "supportmaintenance": {
            "subject": "Support and Maintenance Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Support and Maintenance services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "intelligentautomation": {
            "subject": "Intelligent Automation RPA Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Intelligent Automation RPA services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "lowcode": {
            "subject": "Low Code Application Inquiry",
            "body": f"Dear {name},\n\nThank you for your interest in our Low Code Application services. Our team will reach out to you shortly.\n\nBest regards,\nYour Team"
        },
        "BecomeAClient": {
            "subject": "Become A Client",
            "body": (
                f"Dear {name},\n\n"
                "Thank you for expressing interest in becoming a client with us.\n\n"
                "Our team will reach out to you shortly to discuss how we can best support your goals and requirements.\n\n"
                "Best regards,\n"
                "Team TechOptima"
            )
        }
    }

    # Get template or default
    template = email_templates.get(page_name, {
        "subject": "Welcome!",
        "body": f"Dear {name},\n\nThank you for reaching out. Our team will reach out to you shortly.\n\nBest regards,\nTeam TechOptima"
    })

    return template["subject"], template["body"]

def send_email_notification(to_email, subject, body, is_html=False):
    """
    Send an email with support for both plain text and HTML content.

    Args:
        to_email (str): Recipient's email address.
        subject (str): Email subject.
        body (str): Email body content.
        is_html (bool): If True, send the email as HTML; otherwise, send as plain text.
    """
    try:
        if is_html:
            # Send email as HTML
            email = EmailMultiAlternatives(
                subject=subject,
                body="Your email client does not support HTML content. Please enable HTML rendering to view this message.",
                from_email=settings.EMAIL_HOST_USER,
                to=[to_email]
            )
            email.attach_alternative(body, "text/html")
        else:
            # Send email as plain text
            email = EmailMultiAlternatives(
                subject=subject,
                body=body,
                from_email=settings.EMAIL_HOST_USER,
                to=[to_email]
            )
        
        email.send()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False