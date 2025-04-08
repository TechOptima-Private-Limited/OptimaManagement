from django.contrib import admin
from .models import ResourceRequest, DeliveryRequest, PMORequest, JobDescription, BuyRateGuidance
from .forms import ResourceRequestForm, DeliveryRequestFormSet

class DeliveryRequestInline(admin.StackedInline):
    model = DeliveryRequest
    formset = DeliveryRequestFormSet
    extra = 1
    can_delete = True

@admin.register(ResourceRequest)
class ResourceRequestAdmin(admin.ModelAdmin):
    form = ResourceRequestForm
    inlines = [DeliveryRequestInline]
    list_display = ('account_name', 'resource_request_raised_date', 'request_owner')
    search_fields = ('account_name', 'engagement_manager_delivery_director')

    def save_model(self, request, obj, form, change):
        if not change:  # Only set request_owner on creation
            obj.request_owner = request.user
        super().save_model(request, obj, form, change)

    def get_form(self, request, obj=None, **kwargs):
        return super().get_form(request, obj, **kwargs)  # No need to set initial value

@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'resource_request', 'competency_group', 'primary_skill', 'designation')
    list_filter = ('competency_group', 'location', 'business_type')
    search_fields = ('primary_skill', 'designation')
    def has_add_permission(self, request):
        return False  # Prevent adding DeliveryRequest directly

@admin.register(PMORequest)
class PMORequestAdmin(admin.ModelAdmin):
    list_display = ('ri_no', 'delivery_request', 'ri_created_date')
    search_fields = ('ri_no',)
    readonly_fields = [field.name for field in PMORequest._meta.fields if field.name != 'id']

@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'primary_skill', 'secondary_skill')
    search_fields = ('primary_skill', 'secondary_skill')

@admin.register(BuyRateGuidance)
class BuyRateGuidanceAdmin(admin.ModelAdmin):
    list_display = ('location', 'business_type', 'upper_limit', 'lower_limit')