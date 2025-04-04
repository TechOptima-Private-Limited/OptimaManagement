# assets/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver

email_validator = RegexValidator(
    regex=r'^[a-zA.Z0-9_.+-]+@[a-zA.Z0-9-]+\.[a-zA.Z0-9-.]+$',
    message="Enter a valid email address."
)

class AssetType(models.Model):
    name = models.CharField(max_length=100)
    tag_prefix = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    asset_team_email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Asset(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ASSIGNED', 'Assigned'),
        ('DAMAGED', 'Damaged'),
        ('LOST', 'Lost'),
    ]

    asset_type = models.ForeignKey(AssetType, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    asset_tag = models.CharField(max_length=50, unique=True)
    serial_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    custom_attributes = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    image_before = models.ImageField(upload_to='assets/before/', blank=True, null=True)
    image_after = models.ImageField(upload_to='assets/after/', blank=True, null=True)

    def __str__(self):
        return f"{self.asset_type.name} - {self.name} ({self.asset_tag})"

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['asset_tag']),
        ]

class AssetAssignment(models.Model):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    assets = models.ManyToManyField(Asset, related_name='assignments')
    manager_email = models.CharField(max_length=255, null=True, blank=True, validators=[email_validator])
    notes = models.TextField(blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assignment to {self.employee.username} at {self.assigned_at}"

    class Meta:
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['assigned_at']),
        ]

class AssetAssignmentImage(models.Model):
    assignment = models.ForeignKey(AssetAssignment, on_delete=models.CASCADE, related_name='images')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='assignments/')

    def __str__(self):
        return f"Image for {self.asset.asset_tag} in assignment {self.assignment.id}"

class AssetReturn(models.Model):
    CONDITION_CHOICES = [
        ('GOOD', 'Good'),
        ('DAMAGED', 'Damaged'),
        ('LOST', 'Lost'),
    ]

    assignment = models.ForeignKey(AssetAssignment, on_delete=models.CASCADE, related_name='returns')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    notes = models.TextField(blank=True)
    return_image = models.ImageField(upload_to='returns/', blank=True, null=True)
    returned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Return of {self.asset.asset_tag} at {self.returned_at}"

class AssetHistory(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=100)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    performed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.action} on {self.asset.asset_tag} at {self.performed_at}"

class EmployeeStatus(models.Model):
    employee = models.OneToOneField(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.employee.username} - {'Active' if self.is_active else 'Inactive'}"

@receiver(post_save, sender=AssetAssignment)
def update_asset_status_on_assignment(sender, instance, created, **kwargs):
    if created:
        print(f"post_save signal fired for AssetAssignment {instance.id}")
        for asset in instance.assets.all():
            print(f"Updating asset {asset.asset_tag} status to ASSIGNED")
            asset.status = 'ASSIGNED'
            asset.save()
            AssetHistory.objects.create(
                asset=asset,
                action="Status updated to ASSIGNED",
                performed_by=None,
            )

@receiver(m2m_changed, sender=AssetAssignment.assets.through)
def update_asset_status_on_assignment_change(sender, instance, action, pk_set, **kwargs):
    print(f"m2m_changed signal fired with action: {action}, pk_set: {pk_set}")
    if action == "post_add":
        if pk_set:
            assets = Asset.objects.filter(pk__in=pk_set)
            print(f"post_add: Processing {len(assets)} assets")
            for asset in assets:
                print(f"Updating asset {asset.asset_tag} status to ASSIGNED")
                asset.status = 'ASSIGNED'
                asset.save()
                AssetHistory.objects.create(
                    asset=asset,
                    action="Status updated to ASSIGNED",
                    performed_by=None,
                )
    elif action == "post_remove":
        if pk_set:
            assets = Asset.objects.filter(pk__in=pk_set)
            print(f"post_remove: Processing {len(assets)} assets")
            for asset in assets:
                active_assignments = AssetAssignment.objects.filter(
                    assets=asset,
                    returns__isnull=True
                ).count()
                if active_assignments == 0:
                    print(f"Setting asset {asset.asset_tag} to AVAILABLE (no active assignments)")
                    asset.status = 'AVAILABLE'
                    asset.save()
                    AssetHistory.objects.create(
                        asset=asset,
                        action="Status updated to AVAILABLE",
                        performed_by=None,
                    )
                else:
                    print(f"Asset {asset.asset_tag} still has {active_assignments} active assignments")

@receiver(post_save, sender=AssetReturn)
def update_asset_status_on_return(sender, instance, created, **kwargs):
    if created:
        asset = instance.asset
        assignment = instance.assignment
        assignment.assets.remove(asset)
        if instance.condition == 'GOOD':
            asset.status = 'AVAILABLE'
        else:
            asset.status = instance.condition
        asset.save()
        AssetHistory.objects.create(
            asset=asset,
            action=f"Status updated to {asset.status} after return",
            performed_by=None,
            notes=instance.notes
        )