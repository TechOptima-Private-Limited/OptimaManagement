from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

class ReferenceData(models.Model):
    category = models.CharField(max_length=50)  # e.g., 'competency_group', 'designation'
    value = models.CharField(max_length=100)

    class Meta:
        unique_together = ('category', 'value')

    def __str__(self):
        return f"{self.category}: {self.value}"
# Standalone reference data for Business Unit
class BusinessUnit(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

# Buy Rate Guidance reference table
class BuyRateGuidance(models.Model):
    location = models.CharField(max_length=50, choices=[('Onsite', 'Onsite'), ('Near_Shore', 'Near Shore'), ('Offshore', 'Offshore')])
    business_type = models.CharField(max_length=50, choices=[('Pure Staffing', 'Pure Staffing'), ('Managed Services', 'Managed Services'), ('Managed Staffing', 'Managed Staffing')])
    from_rate = models.FloatField(validators=[MinValueValidator(0)])
    to_rate = models.FloatField(validators=[MinValueValidator(0)])

    class Meta:
        unique_together = ('location', 'business_type')

    def __str__(self):
        return f"{self.location} - {self.business_type}"

# Job Description model
class JobDescription(models.Model):
    id = models.AutoField(primary_key=True)
    primary_skill = models.CharField(max_length=100)
    secondary_skill = models.CharField(max_length=100, blank=True)
    technical_skills = models.TextField(blank=True)
    domain_skills = models.TextField(blank=True)
    soft_skills = models.TextField(blank=True)
    leadership_skills = models.TextField(blank=True)
    education_qualification = models.CharField(max_length=200, blank=True)
    experience_years = models.PositiveIntegerField(blank=True, null=True)
    certifications = models.TextField(blank=True)
    file = models.FileField(upload_to='job_descriptions/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"JD {self.id} - {self.primary_skill}"

# Resource Request (parent model for Account Details and Business/Project Details)
class ResourceRequest(models.Model):
    resource_request_raised_date = models.DateField(default=timezone.now)
    request_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='resource_requests')
    account_name = models.CharField(max_length=100)
    engagement_manager_delivery_director = models.CharField(max_length=100)
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.SET_NULL, null=True)
    region = models.CharField(max_length=50, blank=True)
    function = models.CharField(max_length=100, blank=True)  # Only for Corporate BU
    bdm_client_partner = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.account_name} - {self.id}"

# Delivery Request (Filled By Delivery section)
class DeliveryRequest(models.Model):
    ALLOCATION_TYPES = [('Billing', 'Billing'), ('Non Billing', 'Non Billing')]
    OFFER_TYPES = [('Employee', 'Employee'), ('Contractor', 'Contractor'), ('Contract to Hire', 'Contract to Hire')]
    OPPORTUNITY_PROBABILITY = [
        ('0-25%', '0-25% - RFP/RFI/Discussion Stage'),
        ('25-50%', '25-50% - RFP/Proposal Submitted'),
        ('50-75%', '50-75% - SOW Submitted / Verbally Confirmed'),
        ('100%', '100% - Received Signed SOW'),
    ]

    id = models.AutoField(primary_key=True)
    resource_request = models.ForeignKey(ResourceRequest, on_delete=models.CASCADE, related_name='delivery_requests')
    job_description = models.ForeignKey(JobDescription, on_delete=models.SET_NULL, null=True, blank=True)
    competency_group = models.CharField(max_length=100)
    primary_skill = models.CharField(max_length=100, blank=True)
    trainable = models.BooleanField(default=False)
    is_replacement_indent = models.BooleanField(default=False)
    emp_id_replaced = models.CharField(max_length=50, blank=True)
    designation = models.CharField(max_length=100)
    billing_title_in_sow = models.CharField(max_length=100, blank=True)
    allocation_type = models.CharField(max_length=50, choices=ALLOCATION_TYPES)
    offer_type = models.CharField(max_length=50, choices=OFFER_TYPES)
    operating_model = models.CharField(max_length=50, blank=True)  # e.g., Hybrid
    frequency = models.CharField(max_length=50, blank=True)  # e.g., 2 days a week
    allocation_start_date = models.DateField()
    allocation_end_date = models.DateField(blank=True, null=True)
    resource_required_date = models.DateField()
    location = models.CharField(max_length=50, choices=[('Onsite', 'Onsite'), ('Near_Shore', 'Near Shore'), ('Offshore', 'Offshore')])
    country = models.CharField(max_length=50)
    opportunity_probability = models.CharField(max_length=50, choices=OPPORTUNITY_PROBABILITY)
    client_interview = models.BooleanField(default=False)
    business_type = models.CharField(max_length=50, choices=[('Pure Staffing', 'Pure Staffing'), ('Managed Services', 'Managed Services'), ('Managed Staffing', 'Managed Staffing')])
    bill_rate_sow_usd_hr = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True)
    delivery_buy_rate_tag_usd_hr = models.FloatField(validators=[MinValueValidator(0)])
    address = models.TextField(blank=True)
    buddy_mentor_name = models.CharField(max_length=100, blank=True)
    l1_panel_name = models.CharField(max_length=100)
    l2_panel_name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Delivery {self.id} - {self.resource_request}"

# PMO Request (Filled By PMO section, read-only)
class PMORequest(models.Model):
    id = models.AutoField(primary_key=True)
    delivery_request = models.OneToOneField(DeliveryRequest, on_delete=models.CASCADE, related_name='pmo_request')
    ri_no = models.CharField(max_length=100, unique=True)
    ri_created_date = models.DateField(default=timezone.now)
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.SET_NULL, null=True)
    account_name = models.CharField(max_length=100)
    competency_group = models.CharField(max_length=100)
    billing_title_in_sow = models.CharField(max_length=100, blank=True)
    primary_skill = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100)
    location = models.CharField(max_length=50)
    operating_model = models.CharField(max_length=50, blank=True)
    frequency = models.CharField(max_length=50, blank=True)
    resource_required_date = models.DateField()
    business_type = models.CharField(max_length=50)
    opportunity_probability = models.CharField(max_length=50)

    def save(self, *args, **kwargs):
        if not self.ri_no:
            self.ri_no = f"{self.business_unit.name}-{self.account_name}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PMO {self.ri_no}"

# Notification model
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user} - {self.created_at}"