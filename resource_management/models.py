# resource_management/models.py
from django.db import models
from django.contrib.auth.models import User
import datetime
import uuid

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
        ('APPROVER_APPROVED', 'Approver Approved'),  # New status
        ('APPROVER_REJECTED', 'Approver Rejected'),  # New status
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVOKED', 'Revoked')
    ]

    ticket_number = models.CharField(max_length=20, unique=True, default='ACC000000001')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_requests')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    access_level = models.ForeignKey(AccessLevel, on_delete=models.CASCADE)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    justification = models.TextField()
    duration = models.IntegerField(help_text="Access duration in days")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    requires_approval = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True, help_text="Additional notes or comments")
    approver_email = models.EmailField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_requests'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    approval_token = models.CharField(max_length=100, blank=True, null=True, unique=True)  # New field
    approval_token_expiry = models.DateTimeField(blank=True, null=True)  # New field
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests', verbose_name="Assigned To")

    def save(self, *args, **kwargs):
        if self._state.adding:  # Only if creating new instance
            prefix = 'ACC'
            date = datetime.datetime.now().strftime('%Y%m%d')
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
            self.expires_at = datetime.datetime.now() + datetime.timedelta(days=self.duration)
        
        if self.status == 'APPROVAL_REQUIRED' and not self.approval_token:
            self.approval_token = uuid.uuid4().hex
            self.approval_token_expiry = datetime.datetime.now() + datetime.timedelta(hours=24)  # Token expires in 24 hours
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number} - {self.user.username} - {self.resource.name}"

class AccessHistory(models.Model):
    access_request = models.ForeignKey(AccessRequest, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)
    performed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,  # Allow null values
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