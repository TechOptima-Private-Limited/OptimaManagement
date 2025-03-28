# resource_management/models.py
from django.db import models
from django.contrib.auth.models import User
import datetime
import uuid
from django.utils import timezone

class ResourceType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Resource(models.Model):
    name = models.CharField(max_length=200)
    resource_type = models.ForeignKey(ResourceType, on_delete=models.CASCADE, related_name='resources')
    description = models.TextField()
    endpoint = models.CharField(max_length=255, blank=True, null=True)
    environment = models.CharField(max_length=50, choices=[
        ('DEV', 'Development'),
        ('QA', 'Quality Assurance'),
        ('UAT', 'User Acceptance Testing'),
        ('PROD', 'Production')
    ])
    resource_team_email = models.EmailField(default='resource-team@example.com')
    requires_approval = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['resource_type', 'name']

    def __str__(self):
        return f"{self.resource_type.name} - {self.name}"

class AccessLevel(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField()

    def __str__(self):
        return self.name

class AccessRequest(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent')
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVAL_REQUIRED', 'Approval Required'),
        ('APPROVER_APPROVED', 'Approver Approved'),
        ('APPROVER_REJECTED', 'Approver Rejected'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVOKED', 'Revoked')
    ]

    ticket_number = models.CharField(max_length=20, unique=True, default='ACC000000001', verbose_name="Ticket Number")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_requests', verbose_name="Requester")
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, verbose_name="Resource")
    access_level = models.ForeignKey(AccessLevel, on_delete=models.CASCADE, verbose_name="Access Level")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM', verbose_name="Priority")
    justification = models.TextField(verbose_name="Justification")
    duration = models.IntegerField(help_text="Access duration in days", verbose_name="Duration (days)")
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests',
        verbose_name="Assigned To"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Status")
    requires_approval = models.BooleanField(default=False, verbose_name="Requires Approval")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes or comments", verbose_name="Notes")
    approver_email = models.EmailField(null=True, blank=True, verbose_name="Approver Email")
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_requests',
        verbose_name="Approved By"
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name="Approved At")
    requested_at = models.DateTimeField(auto_now_add=True, verbose_name="Requested At")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Expires At")
    approval_token = models.CharField(max_length=100, blank=True, null=True, unique=True, verbose_name="Approval Token")
    approval_token_expiry = models.DateTimeField(blank=True, null=True, verbose_name="Approval Token Expiry")

    def save(self, *args, **kwargs):
        if self._state.adding:  # Only if creating new instance
            prefix = 'ACC'
            date = timezone.now().strftime('%Y%m%d')
            last_ticket = AccessRequest.objects.filter(
                ticket_number__startswith=f'{prefix}{date}'
            ).order_by('-ticket_number').first()
            
            if last_ticket:
                last_number = int(last_ticket.ticket_number[-4:])
                new_number = str(last_number + 1).zfill(4)
            else:
                new_number = '0001'
            
            self.ticket_number = f'{prefix}{date}{new_number}'
        
        if not self.expires_at and self.duration:
            self.expires_at = timezone.now() + datetime.timedelta(days=self.duration)
        
        if self.status == 'APPROVAL_REQUIRED' and not self.approval_token:
            self.approval_token = uuid.uuid4().hex
            self.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number} - {self.user.username} - {self.resource.name}"

class AccessHistory(models.Model):
    access_request = models.ForeignKey(AccessRequest, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)
    performed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='access_history'
    )
    performed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.action} on {self.access_request.ticket_number} at {self.performed_at}"
    
class EmailThread(models.Model):
    ticket_number = models.CharField(max_length=20, unique=True)
    thread_index = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Thread for {self.ticket_number}"