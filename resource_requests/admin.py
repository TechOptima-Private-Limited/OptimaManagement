from django.contrib import admin
from .models import BusinessUnit, BuyRateGuidance, JobDescription, ResourceRequest, DeliveryRequest, PMORequest, Notification, ReferenceData


@admin.register(ReferenceData)
class ReferenceDataAdmin(admin.ModelAdmin):
    list_display = ('category', 'value')
    list_filter = ('category',)
    search_fields = ('value',)

@admin.register(BusinessUnit)
class BusinessUnitAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(BuyRateGuidance)
class BuyRateGuidanceAdmin(admin.ModelAdmin):
    list_display = ('location', 'business_type', 'from_rate', 'to_rate')
    list_filter = ('location', 'business_type')
    search_fields = ('location', 'business_type')

@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'primary_skill', 'created_at')
    search_fields = ('primary_skill', 'technical_skills')
    list_filter = ('created_at',)

@admin.register(ResourceRequest)
class ResourceRequestAdmin(admin.ModelAdmin):
    list_display = ('account_name', 'business_unit', 'request_owner', 'resource_request_raised_date')
    list_filter = ('business_unit', 'resource_request_raised_date')
    search_fields = ('account_name', 'engagement_manager_delivery_director')

@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'resource_request', 'competency_group', 'primary_skill', 'designation')
    list_filter = ('location', 'business_type', 'opportunity_probability')
    search_fields = ('competency_group', 'primary_skill', 'designation')

@admin.register(PMORequest)
class PMORequestAdmin(admin.ModelAdmin):
    list_display = ('ri_no', 'account_name', 'business_unit', 'ri_created_date')
    list_filter = ('business_unit', 'ri_created_date')
    search_fields = ('ri_no', 'account_name')
    readonly_fields = ('ri_no', 'ri_created_date', 'business_unit', 'account_name', 'competency_group',
                      'billing_title_in_sow', 'primary_skill', 'designation', 'location', 'operating_model',
                      'frequency', 'resource_required_date', 'business_type', 'opportunity_probability')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('message',)