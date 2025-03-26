# resource_management/management/commands/notify_expiring_access.py
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from resource_management.models import AccessRequest
from django.conf import settings

class Command(BaseCommand):
    help = 'Notify users of expiring access'

    def handle(self, *args, **kwargs):
        # Find access requests expiring in the next 2 days
        threshold = timezone.now() + timedelta(days=2)
        expiring_requests = AccessRequest.objects.filter(
            status='APPROVED',
            expires_at__lte=threshold,
            expires_at__gte=timezone.now()
        )

        for request in expiring_requests:
            subject = f"Access Expiring Soon - {request.ticket_number}"
            message = f"""
            Dear {request.user.get_full_name() or request.user.username},

            Your access to {request.resource.name} (Ticket: {request.ticket_number}) will expire on {request.expires_at}.

            Please submit a new request if you need continued access.

            Regards,
            Resource Management Team
            """
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f"Notified {request.user.email} about expiring access"))