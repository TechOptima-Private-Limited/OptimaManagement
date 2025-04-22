from django.contrib import admin
from django.forms import DateInput
from .models import ResourceRequest, DeliveryRequest, PMORequest, BuyRateGuidance
from .forms import ResourceRequestForm, DeliveryRequestFormSet
import json
from django.core.serializers.json import DjangoJSONEncoder

# Custom DateInput widget with specific attributes
class EnhancedDateInput(DateInput):
    def __init__(self, attrs=None, format=None):
        default_attrs = {'class': 'vDateField', 'size': '10', 'type': 'text'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(attrs=default_attrs, format=format)

class DeliveryRequestInline(admin.StackedInline):
    model = DeliveryRequest
    formset = DeliveryRequestFormSet
    extra = 1
    max_num = 1
    can_delete = False
    template = 'admin/edit_inline/custom_stacked.html'
    
    # Override formfield to use custom widget for date fields
    def formfield_for_dbfield(self, db_field, **kwargs):
        if db_field.name in ['allocation_start_date', 'allocation_end_date', 'resource_required_date']:
            kwargs['widget'] = EnhancedDateInput(attrs={
                'class': 'vDateField datepicker',
                'size': '10',
                'autocomplete': 'off',
                'style': 'width:120px; padding:5px;'
            })
        
        # Hide approval token fields
        if db_field.name in ['approval_token', 'approval_token_expiry']:
            kwargs['widget'] = admin.widgets.AdminTextInputWidget(attrs={
                'style': 'display:none;'
            })
            
        return super().formfield_for_dbfield(db_field, **kwargs)

@admin.register(ResourceRequest)
class ResourceRequestAdmin(admin.ModelAdmin):
    form = ResourceRequestForm
    inlines = [DeliveryRequestInline]
    list_display = ('account_name', 'resource_request_raised_date', 'request_owner', 'get_latest_status')
    search_fields = ('account_name', 'engagement_manager_delivery_director')
    
    # Add these class attributes to override the default admin templates
    change_form_template = 'admin/resource_requests/resourcerequest/custom_change_form.html'
    add_form_template = 'admin/resource_requests/resourcerequest/custom_change_form.html'
    change_list_template = 'admin/change_list.html'  # Use default template

    def save_model(self, request, obj, form, change):
        if not change:
            obj.request_owner = request.user
        super().save_model(request, obj, form, change)
    
    # Add variables to changeform view
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        #print("I have initialized!")
        extra_context = extra_context or {}
        # Fetch guidance data
        guidance_records = BuyRateGuidance.objects.all()
        #print(f"Number of BuyRateGuidance records fetched in changeform_view: {guidance_records.count()}")
        guidance_data = {}
        for record in guidance_records:
            key = f"{record.location.lower()}_{record.business_type.lower().replace(' ', '_')}"
            guidance_data[key] = {
                'lower_limit': float(record.lower_limit),
                'upper_limit': float(record.upper_limit)
            }
        #print("Gided data: ", guidance_data)
        #print(type(guidance_data))
        guidance_json = json.dumps(guidance_data, cls=DjangoJSONEncoder)
        #print((f"Guidance data JSON in changeform_view: {guidance_json}"))
        #print(type(guidance_json))
        extra_context.update({
            'help_url': None,
            'copyright_string': None,
            'project_site': None,
            'project_site_name': 'Resource Management',
            'guidance_data_json': guidance_json,
        })
        return super().changeform_view(request, object_id, form_url, extra_context=extra_context)
    
    # Add variables to changelist view as well
    def changelist_view(self, request, extra_context=None):
        #print("I am the culprit")
        extra_context = extra_context or {}
        extra_context.update({
            'help_url': None,
            'copyright_string': None,
            'project_site': None,
            'project_site_name': 'Resource Management',
            'original': None,  # Add this to fix the missing 'original' variable
        })
        #print(request)
        return super().changelist_view(request, extra_context=extra_context)
    
    # Load jQuery UI explicitly
    class Media:
        css = {
            'all': (
                'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css',
            )
        }
        js = (
            'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js',
        )

    def get_latest_status(self, obj):
        """Return the status of the latest DeliveryRequest for this ResourceRequest."""
        latest_delivery = obj.delivery_requests.order_by('-id').first()  # Updated to use 'delivery_requests'
        return latest_delivery.status if latest_delivery else 'N/A'
    get_latest_status.short_description = 'Status'

@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'resource_request', 'competency_group', 'primary_skill', 'designation', 'status')
    list_filter = ('competency_group', 'location', 'business_type', 'status')
    search_fields = ('primary_skill', 'designation')
    
    # Add the same fixes to this admin class
    def changelist_view(self, request, extra_context=None):
        #print("DeliveryRequest changelist_view")
        extra_context = extra_context or {}
        extra_context.update({
            'help_url': None,
            'copyright_string': None,
            'project_site': None,
            'project_site_name': 'Resource Management',
            'original': None,
        })
        return super().changelist_view(request, extra_context=extra_context)
        
    def has_add_permission(self, request):
        return False

@admin.register(PMORequest)
class PMORequestAdmin(admin.ModelAdmin):
    list_display = ('ri_no', 'delivery_request', 'ri_created_date', 'is_approved')
    search_fields = ('ri_no',)
    readonly_fields = [field.name for field in PMORequest._meta.fields if field.name != 'id']
    
    # Add the same fixes to this admin class
    def changelist_view(self, request, extra_context=None):
        print("PMORequest changelist_view")
        extra_context = extra_context or {}
        extra_context.update({
            'help_url': None,
            'copyright_string': None,
            'project_site': None,
            'project_site_name': 'Resource Management',
            'original': None,
        })
        return super().changelist_view(request, extra_context=extra_context)

# @admin.register(JobDescription)
# class JobDescriptionAdmin(admin.ModelAdmin):
#     list_display = ('id', 'primary_skill', 'secondary_skill')
#     search_fields = ('primary_skill', 'secondary_skill')
    
#     # Add the same fixes to this admin class
#     def changelist_view(self, request, extra_context=None):
#         print("JobDescription changelist_view")
#         extra_context = extra_context or {}
#         extra_context.update({
#             'help_url': None,
#             'copyright_string': None,
#             'project_site': None,
#             'project_site_name': 'Resource Management',
#             'original': None,
#         })
#         return super().changelist_view(request, extra_context=extra_context)

@admin.register(BuyRateGuidance)
class BuyRateGuidanceAdmin(admin.ModelAdmin):
    list_display = ('location', 'business_type', 'upper_limit', 'lower_limit')
    
    # Add the same fixes to this admin class
    def changelist_view(self, request, extra_context=None):
        #print("BuyRateGuidance changelist_view")
        extra_context = extra_context or {}
        extra_context.update({
            'help_url': None,
            'copyright_string': None,
            'project_site': None,
            'project_site_name': 'Resource Management',
            'original': None,
        })
        return super().changelist_view(request, extra_context=extra_context)
