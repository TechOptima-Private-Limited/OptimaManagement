from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ResourceRequest(models.Model):
    resource_request_raised_date = models.DateField(auto_now_add=True, editable=False)
    request_owner = models.ForeignKey(User, on_delete=models.CASCADE, editable=False)
    account_name = models.CharField(max_length=100)
    engagement_manager_delivery_director = models.CharField(max_length=100)
    business_unit = models.CharField(max_length=50, choices=[
        ('Corporate', 'Corporate'),
        ('Cigniti-Digital', 'Cigniti-Digital'),
    ])
    region = models.CharField(max_length=50, blank=True)
    function = models.CharField(max_length=50, blank=True)
    bdm_client_partner = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.account_name} - {self.resource_request_raised_date}"

class DeliveryRequest(models.Model):
    resource_request = models.ForeignKey(ResourceRequest, on_delete=models.CASCADE, related_name='delivery_requests')
    id = models.AutoField(primary_key=True)
    competency_group = models.CharField(max_length=50, choices=[
        ('AI/ML', 'AI/ML'),
        ('Development', 'Development'),
        ('Quality Assurance', 'Quality Assurance'),
    ])
    primary_skill = models.CharField(max_length=50, blank=True)
    trainable = models.BooleanField(default=False)
    is_replacement_indent = models.BooleanField(default=False)
    emp_id_replaced = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=50, choices=[
        ('Associate Consultant I', 'Associate Consultant I'),
        ('Project Lead', 'Project Lead'),
    ])
    billing_title_in_sow = models.CharField(max_length=100, blank=True)
    allocation_type = models.CharField(max_length=20, choices=[
        ('Billing', 'Billing'),
        ('Non Billing', 'Non Billing'),
    ])
    offer_type = models.CharField(max_length=20, choices=[
        ('Employee', 'Employee'),
        ('Contractor', 'Contractor'),
        ('Contract to Hire', 'Contract to Hire'),
    ])
    operating_model = models.CharField(max_length=20, choices=[
        ('Hybrid', 'Hybrid'),
        ('WFO', 'WFO'),
    ])
    frequency = models.CharField(max_length=20, choices=[
        ('2 days a week', '2 days a week'),
        ('3 days a week', '3 days a week'),
        ('Every day', 'Every day'),
    ])
    allocation_start_date = models.DateField()
    allocation_end_date = models.DateField()
    resource_required_date = models.DateField()
    location = models.CharField(max_length=20, choices=[
        ('Offshore', 'Offshore'),
        ('Onsite', 'Onsite'),
        ('Near_Shore', 'Near_Shore'),
    ])
    country = models.CharField(max_length=50)
    opportunity_probability = models.CharField(max_length=50, choices=[
        ('0-25% - RFP/RFI/Discussion Stage', '0-25% - RFP/RFI/Discussion Stage'),
        ('25-50% - RFP/Proposal Submitted', '25-50% - RFP/Proposal Submitted'),
        ('50-75% - SOW Submitted / Verbally confirmed', '50-75% - SOW Submitted / Verbally confirmed'),
        ('100% - Received Signed SOW', '100% - Received Signed SOW'),
    ])
    client_interview = models.BooleanField(default=False)
    business_type = models.CharField(max_length=20, choices=[
        ('Managed Services', 'Managed Services'),
        ('Pure Staffing', 'Pure Staffing'),
        ('Managed Staffing', 'Managed Staffing'),
    ])
    bill_rate_sow_usd_hr = models.DecimalField(max_digits=10, decimal_places=2)
    buy_rate_guidance_from_usd_hr = models.DecimalField(max_digits=10, decimal_places=2)
    buy_rate_guidance_to_usd_hr = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_buy_rate_tag_usd_hr = models.DecimalField(max_digits=10, decimal_places=2)
    address = models.TextField(blank=True)
    verification = models.CharField(max_length=50, blank=True)
    buddy_mentor_name = models.CharField(max_length=100, blank=True)
    l1_panel_name = models.CharField(max_length=100)
    l2_panel_name = models.CharField(max_length=100, blank=True)
    job_description = models.ForeignKey('JobDescription', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Delivery Request {self.id} for {self.resource_request}"

class PMORequest(models.Model):
    delivery_request = models.OneToOneField(DeliveryRequest, on_delete=models.CASCADE, related_name='pmo_request')
    id = models.AutoField(primary_key=True)
    ri_no = models.CharField(max_length=50, unique=True, editable=False)
    ri_created_date = models.DateField(auto_now_add=True, editable=False)
    business_unit = models.CharField(max_length=50, editable=False)
    account_name = models.CharField(max_length=100, editable=False)
    competency_group = models.CharField(max_length=50, editable=False)
    billing_title_in_sow = models.CharField(max_length=100, editable=False)
    primary_skill = models.CharField(max_length=50, editable=False)
    designation = models.CharField(max_length=50, editable=False)
    location = models.CharField(max_length=20, editable=False)
    operating_model = models.CharField(max_length=20, editable=False)
    frequency = models.CharField(max_length=20, editable=False)
    resource_required_date = models.DateField(editable=False)
    business_type = models.CharField(max_length=20, editable=False)
    opportunity_probability = models.CharField(max_length=50, editable=False)

    def __str__(self):
        return f"PMO Request {self.ri_no}"

class JobDescription(models.Model):
    id = models.AutoField(primary_key=True)
    primary_skill = models.CharField(max_length=50)
    secondary_skill = models.CharField(max_length=50, blank=True)
    technical_skills = models.TextField(blank=True)
    domain_skills = models.TextField(blank=True)
    soft_skills = models.TextField(blank=True)
    leadership_skills = models.TextField(blank=True)
    education_qualification = models.CharField(max_length=100, blank=True)
    experience_in_years = models.CharField(max_length=20, blank=True)
    certifications = models.TextField(blank=True)
    uploaded_file = models.FileField(upload_to='job_descriptions/', null=True, blank=True)

    def __str__(self):
        return f"Job Description {self.id} - {self.primary_skill}"

class BuyRateGuidance(models.Model):
    location = models.CharField(max_length=20)
    business_type = models.CharField(max_length=20)
    upper_limit = models.DecimalField(max_digits=10, decimal_places=2)
    lower_limit = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.location} - {self.business_type}"