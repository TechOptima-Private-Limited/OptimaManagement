# assets/admin.py
from django.contrib import admin, messages
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from django import forms
from .models import AssetType, Asset, AssetAssignment, AssetAssignmentImage, AssetReturn, AssetHistory, EmployeeStatus
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

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    form = AssetForm
    list_display = ('asset_tag', 'name', 'asset_type', 'status', 'is_active')
    list_filter = ('asset_type', 'status', 'is_active')
    search_fields = ('asset_tag', 'name', 'serial_number')
    inlines = [AssetHistoryInline]

    actions = ['mark_as_damaged', 'mark_as_available']

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
                    asset_return = AssetReturn(
                        assignment=assignment,
                        asset=asset,
                        condition=condition,
                        notes=notes,
                        return_image=image
                    )
                    asset_return.save()
                    if image:
                        asset.image_after = image
                        asset.save()
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

                send_asset_return_report(assignment, cleared, request.user)

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
        super().save_model(request, obj, form, change)
        selected_assets = form.cleaned_data['assets']
        if change:
            for idx, asset in enumerate(selected_assets):
                image = request.FILES.get(f'assetassignmentimage_set-{idx}-image')
                if image:
                    AssetAssignmentImage.objects.create(
                        assignment=obj,
                        asset=asset,
                        image=image
                    )
                    asset.image_before = image
                    asset.save()
        action = "Updated assets for" if change else "Assigned assets to"
        for asset in selected_assets:
            AssetHistory.objects.create(
                asset=asset,
                action=f"{action} {obj.employee.username}",
                performed_by=request.user,
                notes=obj.notes
            )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
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