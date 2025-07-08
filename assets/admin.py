# assets/admin.py
from django.contrib import admin, messages
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from django import forms
from .models import AssetType, Asset, AssetAssignment, AssetAssignmentImage, AssetReturn, AssetHistory, EmployeeStatus, OffboardingAssetReturn
from .forms import AssetForm, AssetAssignmentForm, AssetReturnForm
from .utils import send_asset_assignment_notification, send_asset_return_report

class AssetHistoryInline(admin.TabularInline):
    model = AssetHistory
    extra = 0
    readonly_fields = ('performed_at',)

class AssetReturnInline(admin.TabularInline):
    model = AssetReturn
    form = AssetReturnForm
    extra = 0
    readonly_fields = ('returned_at', 'return_image_thumbnail')

    def return_image_thumbnail(self, obj):
        if obj.return_image:
            return format_html('<img src="{}" style="max-height: 100px;" />', obj.return_image.url)
        return "No Image"
    return_image_thumbnail.short_description = "Return Image"

class AssetAssignmentImageForm(forms.ModelForm):
    asset_name = forms.CharField(label="Asset", required=False, disabled=True)

    class Meta:
        model = AssetAssignmentImage
        fields = ('image',)

    def __init__(self, *args, **kwargs):
        asset_name = kwargs.pop('asset_name', None)
        super().__init__(*args, **kwargs)
        if asset_name:
            self.fields['asset_name'].initial = asset_name
        else:
            self.fields['asset_name'].initial = "Not assigned yet"

class AssetAssignmentImageInline(admin.TabularInline):
    model = AssetAssignmentImage
    form = AssetAssignmentImageForm
    extra = 0
    fields = ('asset_name', 'image')
    readonly_fields = ()

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        selected_assets = []
        if obj and obj.assets.exists():
            selected_assets = list(obj.assets.all())

        class DynamicFormset(formset):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                for i, form in enumerate(self.forms):
                    if i < len(selected_assets):
                        asset_name = str(selected_assets[i])
                        form.asset_name = asset_name
                        form.fields['asset_name'].initial = asset_name

        return DynamicFormset

@admin.register(AssetType)
class AssetTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'tag_prefix', 'description', 'asset_team_email', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'tag_prefix')

# @admin.register(Asset)
# class AssetAdmin(admin.ModelAdmin):
#     form = AssetForm
#     list_display = ('asset_tag', 'name', 'asset_type', 'assigned_employee', 'status', 'is_active')
#     list_filter = ('asset_type', 'status', 'is_active')
#     search_fields = ('asset_tag', 'name', 'serial_number', 'assignments__employee__username', 
#                      'assignments__employee__first_name', 'assignments__employee__last_name')
    
#     # Add fieldsets to organize the form and show the assignment field
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('asset_type', 'name', 'asset_tag', 'serial_number', 'status', 'is_active')
#         }),
#         ('Current Assignment', {
#             'fields': ('currently_assigned_to',),
#             'description': 'Current assignment information (read-only). Use "Asset assignments" menu to assign/reassign assets.',
#             'classes': ('collapse',)
#         }),
#         ('Additional Details', {
#             'fields': ('custom_attributes',),
#             'classes': ('collapse',)
#         }),
#         ('Images', {
#             'fields': ('image_before', 'image_after'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     inlines = [AssetHistoryInline]
#     actions = ['mark_as_damaged', 'mark_as_available']

#     def assigned_employee(self, obj):
#         """Display the employee who currently has this asset assigned"""
#         # Get active assignment (assignment without a return record)
#         current_assignment = obj.assignments.filter(
#             returns__isnull=True
#         ).first()
        
#         if current_assignment:
#             employee = current_assignment.employee
#             if employee.first_name and employee.last_name:
#                 full_name = f"{employee.first_name} {employee.last_name}"
#                 return f"{full_name} ({employee.username})"
#             elif employee.first_name:
#                 return f"{employee.first_name} ({employee.username})"
#             return employee.username
#         return "-"
    
#     assigned_employee.short_description = "Assigned To"
#     assigned_employee.admin_order_field = 'assignments__employee__last_name'

#     def get_queryset(self, request):
#         """Optimize queryset to reduce database queries"""
#         queryset = super().get_queryset(request)
#         return queryset.select_related('asset_type').prefetch_related(
#             'assignments__employee',
#             'assignments__returns'
#         )

#     def mark_as_damaged(self, request, queryset):
#         for asset in queryset:
#             if asset.status != 'DAMAGED':
#                 asset.status = 'DAMAGED'
#                 asset.save()
#                 AssetHistory.objects.create(
#                     asset=asset,
#                     action="Marked as Damaged",
#                     performed_by=request.user,
#                 )
#         self.message_user(request, "Selected assets marked as damaged.")
#     mark_as_damaged.short_description = "Mark selected assets as damaged"

#     def mark_as_available(self, request, queryset):
#         for asset in queryset:
#             if asset.status != 'AVAILABLE':
#                 asset.status = 'AVAILABLE'
#                 asset.save()
#                 AssetHistory.objects.create(
#                     asset=asset,
#                     action="Marked as Available",
#                     performed_by=request.user,
#                 )
#         self.message_user(request, "Selected assets marked as available.")
#     mark_as_available.short_description = "Mark selected assets as available"
# In assets/admin.py - Enhanced assigned_employee method

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    form = AssetForm
    list_display = ('asset_tag', 'name', 'asset_type', 'assigned_employee', 'status', 'is_active')
    list_filter = ('asset_type', 'status', 'is_active')
    search_fields = ('asset_tag', 'name', 'serial_number', 'assignments__employee__username', 
                     'assignments__employee__first_name', 'assignments__employee__last_name', 
                     'assignments__employee__email')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('asset_type', 'name', 'asset_tag', 'serial_number', 'status', 'is_active')
        }),
        ('Current Assignment', {
            'fields': ('currently_assigned_to',),
            'description': 'Current assignment information (read-only). Use "Asset assignments" menu to assign/reassign assets.',
            'classes': ('collapse',)
        }),
        ('Additional Details', {
            'fields': ('custom_attributes',),
            'classes': ('collapse',)
        }),
        ('Images', {
            'fields': ('image_before', 'image_after'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [AssetHistoryInline]
    actions = ['mark_as_damaged', 'mark_as_available']

    def assigned_employee(self, obj):
        """Display the employee with first/last name who currently has this asset assigned"""
        current_assignment = obj.assignments.filter(returns__isnull=True).first()
        
        if current_assignment:
            employee = current_assignment.employee
            
            # Try to get full name from first_name and last_name
            if employee.first_name and employee.last_name:
                full_name = f"{employee.first_name} {employee.last_name}"
                return f"{full_name} ({employee.username})"
            elif employee.first_name:
                return f"{employee.first_name} ({employee.username})"
            else:
                # If no first/last name, try to derive from email or username
                return self.get_display_name_from_username(employee)
        
        return "-"
    
    def get_display_name_from_username(self, employee):
        """Extract display name from username or email"""
        # If email exists, try to extract name from email
        if employee.email:
            email_part = employee.email.split('@')[0]
            # Try to split by common separators
            if '.' in email_part:
                parts = email_part.split('.')
                if len(parts) >= 2:
                    first_name = parts[0].title()
                    last_name = parts[1].title()
                    return f"{first_name} {last_name} ({employee.username})"
            elif '_' in email_part:
                parts = email_part.split('_')
                if len(parts) >= 2:
                    first_name = parts[0].title()
                    last_name = parts[1].title()
                    return f"{first_name} {last_name} ({employee.username})"
        
        # If username has separators, try to extract names
        username = employee.username
        if '.' in username:
            parts = username.split('.')
            if len(parts) >= 2:
                first_name = parts[0].title()
                last_name = parts[1].title()
                return f"{first_name} {last_name} ({username})"
        elif '_' in username:
            parts = username.split('_')
            if len(parts) >= 2:
                first_name = parts[0].title()
                last_name = parts[1].title()
                return f"{first_name} {last_name} ({username})"
        
        # If no pattern found, just return username
        return username
    
    assigned_employee.short_description = "Assigned To"
    assigned_employee.admin_order_field = 'assignments__employee__last_name'

    def get_queryset(self, request):
        """Optimize queryset to reduce database queries"""
        queryset = super().get_queryset(request)
        return queryset.select_related('asset_type').prefetch_related(
            'assignments__employee',
            'assignments__returns'
        )

    def mark_as_damaged(self, request, queryset):
        for asset in queryset:
            if asset.status != 'DAMAGED':
                asset.status = 'DAMAGED'
                asset.save()
                AssetHistory.objects.create(
                    asset=asset,
                    action="Marked as Damaged",
                    performed_by=request.user,
                )
        self.message_user(request, "Selected assets marked as damaged.")
    mark_as_damaged.short_description = "Mark selected assets as damaged"

    def mark_as_available(self, request, queryset):
        for asset in queryset:
            if asset.status != 'AVAILABLE':
                asset.status = 'AVAILABLE'
                asset.save()
                AssetHistory.objects.create(
                    asset=asset,
                    action="Marked as Available",
                    performed_by=request.user,
                )
        self.message_user(request, "Selected assets marked as available.")
    mark_as_available.short_description = "Mark selected assets as available"
@admin.register(AssetAssignment)
class AssetAssignmentAdmin(admin.ModelAdmin):
    form = AssetAssignmentForm
    list_display = ('employee', 'manager_email', 'assigned_at', 'updated_at', 'asset_count')
    list_filter = ('assigned_at',)
    search_fields = ('employee__username', 'manager_email')
    inlines = [AssetAssignmentImageInline]
    actions = ['return_assets']

    def get_inline_instances(self, request, obj=None):
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)

    def asset_count(self, obj):
        return obj.assets.count()
    asset_count.short_description = "Number of Assets"

    def return_assets(self, request, queryset):
        print("Entering return_assets action")
        if 'apply' in request.POST:
            print("Processing return form submission")
            for assignment in queryset:
                if not assignment.assets.exists():
                    messages.warning(request, f"No assets to return for {assignment.employee.username}.")
                    continue

                cleared = True
                for asset in assignment.assets.all():
                    condition = request.POST.get(f'condition_{asset.id}', 'GOOD')
                    notes = request.POST.get(f'notes_{asset.id}', '')
                    image = request.FILES.get(f'image_{asset.id}')
                    print(f"Returning asset {asset.asset_tag} (ID: {asset.id}) with condition {condition}")
                    asset_return = AssetReturn(
                        assignment=assignment,
                        asset=asset,
                        condition=condition,
                        notes=notes,
                        return_image=image
                    )
                    asset_return.save()
                    print(f"AssetReturn {asset_return.id} created for asset {asset.asset_tag}")
                    if image:
                        asset.image_after = image
                        asset.save()
                        print(f"Updated image_after for asset {asset.asset_tag}")
                    if condition in ['DAMAGED', 'LOST']:
                        cleared = False

                    AssetHistory.objects.filter(
                        asset=asset,
                        action__startswith="Status updated to",
                        performed_by__isnull=True
                    ).update(performed_by=request.user)

                    AssetHistory.objects.create(
                        asset=asset,
                        action=f"Returned from {assignment.employee.username}",
                        performed_by=request.user,
                        notes=notes,
                    )
                    print(f"Created AssetHistory entry for return of asset {asset.asset_tag}")

                send_asset_return_report(assignment, cleared, request.user)
                print(f"Sent return report for assignment {assignment.id}")

            self.message_user(request, "Assets have been returned and a report has been sent.")
            return redirect('admin:assets_assetassignment_changelist')

        request.session['selected_assignments'] = [obj.id for obj in queryset]
        print(f"Stored assignment IDs in session: {request.session['selected_assignments']}")
        return render(request, 'admin/redirect_to_return.html', {
            'return_url': reverse('assets:return_assets_form'),
            'admin_changelist_url': reverse('admin:assets_assetassignment_changelist'),
        })

    return_assets.short_description = "Return assets for selected employees"

    def save_formset(self, request, form, formset, change):
        if formset.model == AssetAssignmentImage:
            selected_assets = list(form.instance.assets.all())
            for i, form_instance in enumerate(formset):
                if i < len(selected_assets) and form_instance.cleaned_data.get('image'):
                    form_instance.instance.asset = selected_assets[i]
                    form_instance.instance.save()
                    asset = form_instance.instance.asset
                    asset.image_before = form_instance.instance.image
                    asset.save()
        super().save_formset(request, form, formset, change)

    def save_model(self, request, obj, form, change):
        print(f"Saving AssetAssignment {obj.id if obj.id else 'new'}, change={change}")
        super().save_model(request, obj, form, change)
        selected_assets = form.cleaned_data['assets']
        print(f"Selected assets: {[asset.asset_tag for asset in selected_assets]}")
        # Ensure the assets are associated with the assignment
        if not change:  # On add
            obj.assets.set(selected_assets)
        action = "Updated assets for" if change else "Assigned assets to"
        for asset in selected_assets:
            AssetHistory.objects.create(
                asset=asset,
                action=f"{action} {obj.employee.username}",
                performed_by=request.user,
                notes=obj.notes
            )

    def save_related(self, request, form, formsets, change):
        print(f"Saving related objects for AssetAssignment {form.instance.id}, change={change}")
        super().save_related(request, form, formsets, change)
        # Ensure assets are saved before signals fire
        if not change:  # On add
            selected_assets = form.cleaned_data['assets']
            form.instance.assets.set(selected_assets)
            print(f"Assets set for AssetAssignment {form.instance.id}: {[asset.asset_tag for asset in selected_assets]}")
        # Only send the notification after the images are saved on the edit page
        if change:
            send_asset_assignment_notification(form.instance)

    def get_form(self, request, obj=None, **kwargs):
        form_class = super().get_form(request, obj, **kwargs)
        if request.method == 'POST':
            form = form_class(request.POST, request.FILES)
            if form.is_valid():
                selected_assets = form.cleaned_data.get('assets', [])
                self.inlines[0].extra = len(selected_assets)
            else:
                self.inlines[0].extra = 0
        elif obj and obj.assets.exists():
            self.inlines[0].extra = obj.assets.count()
        else:
            self.inlines[0].extra = 0
        self.parent_form = form_class
        return form_class

    def response_add(self, request, obj, post_url_continue=None):
        self.message_user(request, "Asset assignment created successfully. Please upload images on the next page.")
        return redirect(reverse('admin:assets_assetassignment_change', args=[obj.id]))

    def response_change(self, request, obj):
        self.message_user(request, "Asset assignment updated successfully.")
        return redirect('admin:assets_assetassignment_changelist')

@admin.register(EmployeeStatus)
class EmployeeStatusAdmin(admin.ModelAdmin):
    list_display = ('employee', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('employee__username',)

from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from assets.models import AssetAssignment, Asset
# from onboarding.models import Offboarding
from django.contrib.auth.models import User

# assets/admin.py - Add this simple admin
class OffboardingAssetReturnAdmin(admin.ModelAdmin):
    list_display = ['user_display', 'user_email', 'assets_status', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email']
    list_display_links = ['user_display']
    date_hierarchy = 'created_at'

    readonly_fields = ['dynamic_asset_checkboxes']
    exclude = ['returned_assets']  # Managed manually

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'dynamic_asset_checkboxes')
        }),
        ('Damaged Assets & Remarks', {
            'fields': ('damaged_assets_file', 'remarks'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

    # def formfield_for_foreignkey(self, db_field, request, **kwargs):
    #     if db_field.name == "user":
    #         kwargs["queryset"] = User.objects.filter(is_active=False).order_by('username')
    #     return super().formfield_for_foreignkey(db_field, request, **kwargs)
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            # Filter: is_active=False AND user not already offboarded
            already_offboarded_user_ids = OffboardingAssetReturn.objects.filter(is_offboarded=True).values_list('user_id', flat=True)
            kwargs["queryset"] = User.objects.filter(is_active=False).exclude(id__in=already_offboarded_user_ids).order_by('username')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def user_display(self, obj):
        if obj.user.first_name or obj.user.last_name:
            full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return format_html('<strong>{}</strong><br><small style="color: #666;">@{}</small>', 
                               full_name, obj.user.username)
        return format_html('<strong>@{}</strong>', obj.user.username)
    user_display.short_description = 'User'
    user_display.admin_order_field = 'user__username'

    def user_email(self, obj):
        return obj.user.email or '—'
    user_email.short_description = 'Email'
    user_email.admin_order_field = 'user__email'

    def assets_status(self, obj):
        total = obj.returned_assets.count()
        if total > 0:
            return format_html('<span style="color: green;">✓ Returned {}</span>', total)
        return format_html('<span style="color: red;">✗ None Returned</span>')
    assets_status.short_description = 'Returned Assets'

    def dynamic_asset_checkboxes(self, obj):
        return mark_safe("""
        <div id="returned-assets-container"><em>Select a user to load assigned assets.</em></div>
        <script>
        document.addEventListener("DOMContentLoaded", function () {
            const userSelect = document.getElementById("id_user");
            const container = document.getElementById("returned-assets-container");

            function loadAssets(userId) {
                if (!userId) {
                    container.innerHTML = "<em>Select a user to load assigned assets.</em>";
                    return;
                }

                fetch(`${window.location.origin}/onboarding/user-assets/${userId}/`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.assets && data.assets.length > 0) {
                            let html = "<strong>Returned Assets:</strong><ul style='list-style:none; padding:0;'>";
                            data.assets.forEach(asset => {
                                html += `<li>
                                    <label>
                                        <input type="checkbox" name="returned_asset_${asset.id}" />
                                        ${asset.type} - ${asset.name} (${asset.tag})
                                    </label>
                                </li>`;
                            });
                            html += "</ul>";
                            container.innerHTML = html;
                        } else {
                            container.innerHTML = "<em>No assets assigned to this user.</em>";
                        }
                    })
                    .catch(err => {
                        container.innerHTML = "<em>Error loading assets.</em>";
                        console.error(err);
                    });
            }

            if (userSelect) {
                userSelect.addEventListener("change", () => {
                    loadAssets(userSelect.value);
                });

                if (userSelect.value) {
                    loadAssets(userSelect.value);
                }
            }
        });
        </script>
        """)

    dynamic_asset_checkboxes.short_description = "Returned Assets"

    # def save_model(self, request, obj, form, change):
    #     super().save_model(request, obj, form, change)
    #     returned_ids = [
    #         int(k.replace("returned_asset_", ""))
    #         for k in request.POST if k.startswith("returned_asset_")
    #     ]
    #     assets = Asset.objects.filter(id__in=returned_ids)
    #     obj.returned_assets.set(assets)
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        returned_ids = [
            int(k.replace("returned_asset_", ""))
            for k in request.POST if k.startswith("returned_asset_")
        ]
        assets = Asset.objects.filter(id__in=returned_ids)
        obj.returned_assets.set(assets)

        # Automatically mark as offboarded (optional)
        if not obj.is_offboarded:
            obj.is_offboarded = True
            obj.save()


# Register the admin
admin.site.register(OffboardingAssetReturn, OffboardingAssetReturnAdmin)