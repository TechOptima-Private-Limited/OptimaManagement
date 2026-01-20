# assets/views.py
from io import BytesIO

import pandas as pd
from datetime import datetime

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.db.models import Count, Q
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.encoding import escape_uri_path
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from common.utils.helpers import get_today
from .models import (
    AssetType,
    Asset,
    AssetAssignment,
    AssetHistory,
    AssetReturn,
    AssetRepair,
    OffboardingAssetReturn,
    EmployeeStatus,
    AssetAssignmentImage,
    AssetImage,
)
from .serializers import AssetTypeSerializer, AssetSerializer, AssetAssignmentSerializer, AssetHistorySerializer
from .utils import send_asset_return_report
from dal import autocomplete
from django.contrib.auth.models import User
import importlib.util


def _safe_sheet_name(name: str) -> str:
    invalid_chars = set('[]:*?/\\')
    cleaned = ''.join('_' if c in invalid_chars else c for c in name)
    cleaned = cleaned.strip() or 'Sheet'
    return cleaned[:31]


def _df_from_rows(rows, columns):
    df = pd.DataFrame.from_records(rows, columns=columns)
    df = df.replace('nan', '')
    df = df.replace('None', '')
    for col in df.columns:
        series = df[col]
        if pd.api.types.is_datetime64tz_dtype(series):
            df[col] = series.dt.tz_localize(None)
            continue
        if pd.api.types.is_object_dtype(series):
            df[col] = series.map(
                lambda v: v.replace(tzinfo=None) if isinstance(v, datetime) and getattr(v, 'tzinfo', None) else v
            )
    return df


def _user_scoped_assets(user):
    if user.is_superuser:
        return Asset.objects.all()
    allowed_type_ids = AssetType.objects.filter(asset_team_email=user.email).values_list('id', flat=True)
    return Asset.objects.filter(asset_type_id__in=allowed_type_ids)


def _pick_excel_engine() -> str:
    if importlib.util.find_spec('xlsxwriter') is not None:
        return 'xlsxwriter'
    if importlib.util.find_spec('openpyxl') is not None:
        return 'openpyxl'
    raise RuntimeError("Missing Excel writer engine. Install 'xlsxwriter' or 'openpyxl'.")


@login_required
def export_all_assets_excel(request):
    scoped_assets = _user_scoped_assets(request.user)

    if request.user.is_superuser:
        asset_types_qs = AssetType.objects.all()
    else:
        asset_types_qs = AssetType.objects.filter(asset_team_email=request.user.email)

    assignments_qs = AssetAssignment.objects.filter(assets__in=scoped_assets).distinct().prefetch_related('assets', 'asset_types').select_related('employee')
    returns_qs = AssetReturn.objects.filter(asset__in=scoped_assets).select_related('assignment', 'asset')
    repairs_qs = AssetRepair.objects.filter(asset__in=scoped_assets).select_related('asset')
    history_qs = AssetHistory.objects.filter(asset__in=scoped_assets).select_related('asset', 'performed_by')
    offboarding_qs = OffboardingAssetReturn.objects.filter(returned_assets__in=scoped_assets).distinct().prefetch_related('returned_assets', 'user')
    if request.user.is_superuser:
        employee_status_qs = EmployeeStatus.objects.filter(employee__isnull=False).select_related('employee')
    else:
        employee_ids = set(assignments_qs.values_list('employee_id', flat=True))
        employee_ids.update(offboarding_qs.values_list('user_id', flat=True))
        employee_status_qs = EmployeeStatus.objects.filter(employee_id__in=employee_ids).select_related('employee')
    assignment_images_qs = AssetAssignmentImage.objects.filter(asset__in=scoped_assets).select_related('assignment', 'asset')
    asset_images_qs = AssetImage.objects.filter(asset__in=scoped_assets).select_related('asset')

    try:
        engine = _pick_excel_engine()
    except Exception as e:
        return HttpResponse(str(e), status=500, content_type='text/plain')

    output = BytesIO()
    try:
        writer_ctx = pd.ExcelWriter(output, engine=engine)
    except Exception as e:
        return HttpResponse(str(e), status=500, content_type='text/plain')

    with writer_ctx as writer:
        asset_types_rows = list(
            asset_types_qs.values('id', 'name', 'category', 'tag_prefix', 'description', 'asset_team_email', 'is_active')
        )
        _df_from_rows(asset_types_rows, ['id', 'name', 'category', 'tag_prefix', 'description', 'asset_team_email', 'is_active']).to_excel(
            writer, _safe_sheet_name('Asset Types'), index=False
        )

        assets_rows = list(
            scoped_assets.select_related('asset_type', 'previously_used_by').values(
                'id',
                'asset_type__name',
                'name',
                'asset_tag',
                'serial_number',
                'status',
                'purchased_date',
                'previously_used_by__username',
                'laptop_age',
                'is_active',
                'custom_attributes',
            )
        )
        _df_from_rows(
            assets_rows,
            [
                'id',
                'asset_type__name',
                'name',
                'asset_tag',
                'serial_number',
                'status',
                'purchased_date',
                'previously_used_by__username',
                'laptop_age',
                'is_active',
                'custom_attributes',
            ],
        ).rename(
            columns={
                'asset_type__name': 'asset_type',
                'previously_used_by__username': 'previously_used_by',
            }
        ).to_excel(writer, _safe_sheet_name('Assets'), index=False)

        assignment_rows = []
        for a in assignments_qs:
            assignment_rows.append(
                {
                    'id': a.id,
                    'employee': getattr(a.employee, 'username', ''),
                    'assets': ', '.join(a.assets.values_list('asset_tag', flat=True)),
                    'asset_types': ', '.join(a.asset_types.values_list('name', flat=True)),
                    'manager_email': a.manager_email,
                    'notes': a.notes,
                    'assigned_at': a.assigned_at,
                    'updated_at': a.updated_at,
                }
            )
        _df_from_rows(
            assignment_rows,
            ['id', 'employee', 'assets', 'asset_types', 'manager_email', 'notes', 'assigned_at', 'updated_at'],
        ).to_excel(writer, _safe_sheet_name('Assignments'), index=False)

        return_rows = []
        for r in returns_qs:
            return_rows.append(
                {
                    'id': r.id,
                    'assignment_id': r.assignment_id,
                    'asset_tag': getattr(r.asset, 'asset_tag', ''),
                    'condition': r.condition,
                    'notes': r.notes,
                    'return_image': getattr(r.return_image, 'name', ''),
                    'returned_at': r.returned_at,
                }
            )
        _df_from_rows(
            return_rows,
            ['id', 'assignment_id', 'asset_tag', 'condition', 'notes', 'return_image', 'returned_at'],
        ).to_excel(writer, _safe_sheet_name('Returns'), index=False)

        repair_rows = list(
            repairs_qs.values(
                'id',
                'asset__asset_tag',
                'status',
                'issue_description',
                'vendor',
                'ticket_reference',
                'case_id',
                'started_at',
                'completed_at',
                'total_repair_cost',
                'repair_done_under_warranty',
                'notes',
                'created_by_id',
                'created_at',
                'updated_at',
            )
        )
        _df_from_rows(
            repair_rows,
            [
                'id',
                'asset__asset_tag',
                'status',
                'issue_description',
                'vendor',
                'ticket_reference',
                'case_id',
                'started_at',
                'completed_at',
                'total_repair_cost',
                'repair_done_under_warranty',
                'notes',
                'created_by_id',
                'created_at',
                'updated_at',
            ],
        ).rename(columns={'asset__asset_tag': 'asset_tag'}).to_excel(writer, _safe_sheet_name('Repairs'), index=False)

        history_rows = list(
            history_qs.values(
                'id',
                'asset__asset_tag',
                'action',
                'performed_by__username',
                'performed_at',
                'notes',
            )
        )
        _df_from_rows(
            history_rows,
            ['id', 'asset__asset_tag', 'action', 'performed_by__username', 'performed_at', 'notes'],
        ).rename(
            columns={'asset__asset_tag': 'asset_tag', 'performed_by__username': 'performed_by'}
        ).to_excel(writer, _safe_sheet_name('History'), index=False)

        offboarding_rows = []
        for o in offboarding_qs:
            offboarding_rows.append(
                {
                    'id': o.id,
                    'user': getattr(o.user, 'username', ''),
                    'returned_assets': ', '.join(o.returned_assets.values_list('asset_tag', flat=True)),
                    'laptop_status': o.laptop_status,
                    'damaged_assets_file': getattr(o.damaged_assets_file, 'name', ''),
                    'remarks': o.remarks,
                    'is_offboarded': o.is_offboarded,
                    'created_at': o.created_at,
                    'updated_at': o.updated_at,
                }
            )
        _df_from_rows(
            offboarding_rows,
            [
                'id',
                'user',
                'returned_assets',
                'laptop_status',
                'damaged_assets_file',
                'remarks',
                'is_offboarded',
                'created_at',
                'updated_at',
            ],
        ).to_excel(writer, _safe_sheet_name('Offboarding Returns'), index=False)

        employee_status_rows = list(
            employee_status_qs.values('id', 'employee__username', 'is_active')
        )
        _df_from_rows(
            employee_status_rows,
            ['id', 'employee__username', 'is_active'],
        ).rename(columns={'employee__username': 'employee'}).to_excel(writer, _safe_sheet_name('Employee Status'), index=False)

        assignment_image_rows = list(
            assignment_images_qs.values('id', 'assignment_id', 'asset__asset_tag', 'image', 'asset_id')
        )
        _df_from_rows(
            assignment_image_rows,
            ['id', 'assignment_id', 'asset_id', 'asset__asset_tag', 'image'],
        ).rename(columns={'asset__asset_tag': 'asset_tag'}).to_excel(writer, _safe_sheet_name('Assignment Images'), index=False)

        asset_image_rows = list(
            asset_images_qs.values('id', 'asset_id', 'asset__asset_tag', 'kind', 'image', 'uploaded_at')
        )
        _df_from_rows(
            asset_image_rows,
            ['id', 'asset_id', 'asset__asset_tag', 'kind', 'image', 'uploaded_at'],
        ).rename(columns={'asset__asset_tag': 'asset_tag'}).to_excel(writer, _safe_sheet_name('Asset Images'), index=False)

    output.seek(0)
    today = get_today()
    filename = escape_uri_path(f"asset_management_export_{request.user.username}_{today}.xlsx")
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@login_required
def asset_summary(request):
    by_type = Asset.objects.values('asset_type__name').annotate(total=Count('id')).order_by('asset_type__name')
    by_status = Asset.objects.values('status').annotate(total=Count('id')).order_by('status')
    by_employee = AssetAssignment.objects.values('employee__username').annotate(total=Count('assets')).order_by('employee__username')

    context = {
        'by_type': by_type,
        'by_status': by_status,
        'by_employee': by_employee,
    }
    return render(request, 'assets/summary.html', context)

# @login_required
# def return_assets_form(request):
#     if 'selected_assignments' not in request.session:
#         messages.error(request, "No assignments selected for return.")
#         return redirect('admin:assets_assetassignment_changelist')

#     assignment_ids = request.session.get('selected_assignments', [])
#     queryset = AssetAssignment.objects.filter(id__in=assignment_ids)

#     if request.method == 'POST':
#         for assignment in queryset:
#             if not assignment.assets.exists():
#                 messages.warning(request, f"No assets to return for {assignment.employee.username}.")
#                 continue

#             cleared = True
#             for asset in assignment.assets.all():
#                 condition = request.POST.get(f'condition_{asset.id}', 'GOOD')
#                 notes = request.POST.get(f'notes_{asset.id}', '')
#                 image = request.FILES.get(f'image_{asset.id}')
#                 print(f"Returning asset {asset.asset_tag} (ID: {asset.id}) with condition {condition}")
#                 asset_return = AssetReturn(
#                     assignment=assignment,
#                     asset=asset,
#                     condition=condition,
#                     notes=notes,
#                     return_image=image
#                 )
#                 asset_return.save()
#                 print(f"AssetReturn {asset_return.id} created for asset {asset.asset_tag}")
#                 if image:
#                     asset.image_after = image
#                     asset.save()
#                     print(f"Updated image_after for asset {asset.asset_tag}")
#                 if condition in ['DAMAGED', 'LOST']:
#                     cleared = False

#                 AssetHistory.objects.filter(
#                     asset=asset,
#                     action__startswith="Status updated to",
#                     performed_by__isnull=True
#                 ).update(performed_by=request.user)

#                 AssetHistory.objects.create(
#                     asset=asset,
#                     action=f"Returned from {assignment.employee.username}",
#                     performed_by=request.user,
#                     notes=notes,
#                 )
#                 print(f"Created AssetHistory entry for return of asset {asset.asset_tag}")

#             send_asset_return_report(assignment, cleared, request.user)
#             print(f"Sent return report for assignment {assignment.id}")

#         messages.success(request, "Assets have been returned and a report has been sent.")
#         if 'selected_assignments' in request.session:
#             del request.session['selected_assignments']
#         return redirect('admin:assets_assetassignment_changelist')

#     return render(request, 'assets/return_assets.html', {
#         'assignments': queryset,
#         'admin_changelist_url': reverse('admin:assets_assetassignment_changelist'),
#     })


# Replace the return_assets_form function in your views.py with this:

# @login_required
# def return_assets_form(request):
#     if 'selected_assignments' not in request.session:
#         messages.error(request, "No assignments selected for return.")
#         return redirect('admin:assets_assetassignment_changelist')

#     assignment_ids = request.session.get('selected_assignments', [])
#     queryset = AssetAssignment.objects.filter(id__in=assignment_ids)

#     if request.method == 'POST':
#         for assignment in queryset:
#             if not assignment.assets.exists():
#                 messages.warning(request, f"No assets to return for {assignment.employee.username}.")
#                 continue

#             cleared = True
#             returned_assets = []
            
#             for asset in assignment.assets.all():
#                 condition = request.POST.get(f'condition_{asset.id}', 'GOOD')
#                 notes = request.POST.get(f'notes_{asset.id}', '')
#                 image = request.FILES.get(f'image_{asset.id}')
                
#                 print(f"Returning asset {asset.asset_tag} (ID: {asset.id}) with condition {condition}")
                
#                 # Check if return already exists
#                 existing_return = AssetReturn.objects.filter(
#                     assignment=assignment,
#                     asset=asset
#                 ).first()
                
#                 if not existing_return:
#                     asset_return = AssetReturn(
#                         assignment=assignment,
#                         asset=asset,
#                         condition=condition,
#                         notes=notes,
#                         return_image=image
#                     )
#                     asset_return.save()
#                     print(f"AssetReturn {asset_return.id} created for asset {asset.asset_tag}")
                    
#                     # Update image if provided
#                     if image:
#                         asset.image_after = image
#                         asset.save()
#                         print(f"Updated image_after for asset {asset.asset_tag}")
                    
#                     # Update asset status based on condition
#                     if condition == 'GOOD':
#                         asset.status = 'AVAILABLE'
#                     elif condition == 'DAMAGED':
#                         asset.status = 'DAMAGED'
#                     elif condition == 'LOST':
#                         asset.status = 'LOST'
                    
#                     asset.save()
#                     print(f"Asset {asset.asset_tag} status updated to {asset.status}")
                    
#                     if condition in ['DAMAGED', 'LOST']:
#                         cleared = False
                    
#                     # Update history records
#                     AssetHistory.objects.filter(
#                         asset=asset,
#                         action__startswith="Status updated to",
#                         performed_by__isnull=True
#                     ).update(performed_by=request.user)
                    
#                     AssetHistory.objects.create(
#                         asset=asset,
#                         action=f"Returned from {assignment.employee.username} - Status: {asset.status}",
#                         performed_by=request.user,
#                         notes=notes,
#                     )
#                     print(f"Created AssetHistory entry for return of asset {asset.asset_tag}")
                    
#                     returned_assets.append(asset)
#                 else:
#                     print(f"Asset {asset.asset_tag} already has a return record")
            
#             # Remove returned assets from the assignment
#             for asset in returned_assets:
#                 assignment.assets.remove(asset)
#                 print(f"Removed {asset.asset_tag} from assignment")
            
#             # Send return report
#             if returned_assets:
#                 send_asset_return_report(assignment, cleared, request.user)
#                 print(f"Sent return report for assignment {assignment.id}")
            
#             # If user is being offboarded, mark them as inactive
#             if request.POST.get(f'offboard_user_{assignment.employee.id}'):
#                 assignment.employee.is_active = False
#                 assignment.employee.save()
#                 messages.info(request, f"User {assignment.employee.username} has been marked as inactive.")

#         messages.success(request, "Assets have been returned and are now available for reassignment.")
        
#         # Clean up any inconsistencies
#         from .utils import cleanup_returned_assets
#         cleanup_returned_assets()
        
#         if 'selected_assignments' in request.session:
#             del request.session['selected_assignments']
        
#         return redirect('admin:assets_assetassignment_changelist')

#     return render(request, 'assets/return_assets.html', {
#         'assignments': queryset,
#         'admin_changelist_url': reverse('admin:assets_assetassignment_changelist'),
#     })
@login_required
def return_assets_form(request):
    if 'selected_assignments' not in request.session:
        messages.error(request, "No assignments selected for return.")
        return redirect('admin:assets_assetassignment_changelist')

    assignment_ids = request.session.get('selected_assignments', [])
    queryset = AssetAssignment.objects.filter(id__in=assignment_ids)

    if request.method == 'POST':
        for assignment in queryset:
            if not assignment.assets.exists():
                messages.warning(request, f"No assets to return for {assignment.employee.username}.")
                continue

            cleared = True
            for asset in assignment.assets.all():
                condition = request.POST.get(f'condition_{asset.id}', 'GOOD')
                notes = request.POST.get(f'notes_{asset.id}', '')
                image = request.FILES.get(f'image_{asset.id}')
                
                # Create the return record
                asset_return = AssetReturn(
                    assignment=assignment,
                    asset=asset,
                    condition=condition,
                    notes=notes,
                    return_image=image
                )
                asset_return.save()
                
                # The signal will automatically update asset status to AVAILABLE
                print(f"AssetReturn created for asset {asset.asset_tag}")
                
                # Update image if provided
                if image:
                    asset.image_after = image
                    asset.save()
                
                if condition in ['DAMAGED', 'LOST']:
                    cleared = False

                # Create history record
                AssetHistory.objects.create(
                    asset=asset,
                    action=f"Returned from {assignment.employee.username}",
                    performed_by=request.user,
                    notes=notes,
                )

            send_asset_return_report(assignment, cleared, request.user)

        messages.success(request, "Assets have been returned and are now available for reassignment.")
        
        if 'selected_assignments' in request.session:
            del request.session['selected_assignments']
        
        return redirect('admin:assets_assetassignment_changelist')

    return render(request, 'assets/return_assets.html', {
        'assignments': queryset,
        'admin_changelist_url': reverse('admin:assets_assetassignment_changelist'),
    })

class AssetTypeViewSet(viewsets.ModelViewSet):
    queryset = AssetType.objects.all()
    serializer_class = AssetTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser:
            return qs.filter(asset_team_email=self.request.user.email)
        return qs

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser:
            asset_team_emails = AssetType.objects.filter(asset_team_email=self.request.user.email).values_list('id', flat=True)
            return qs.filter(asset_type__id__in=asset_team_emails)
        return qs

class AssetAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AssetAssignment.objects.all()
    serializer_class = AssetAssignmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser:
            qs = qs.filter(employee=self.request.user)
        
        # Add filtering by employee_id if provided
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
            
        return qs.prefetch_related('assets', 'asset_types').distinct()

    def perform_create(self, serializer):
        print("1")
        # Set the current user as the creator if not provided
        if 'employee' not in serializer.validated_data:
            serializer.validated_data['employee'] = self.request.user
        
        # Save the assignment
        assignment = serializer.save()
        
        # Log the assignment
        for asset in assignment.assets.all():
            AssetHistory.objects.create(
                asset=asset,
                action=f"Assigned to {assignment.employee.username}",
                performed_by=self.request.user,
                notes=assignment.notes
            )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_assets = set(old_instance.assets.all())
        
        # Save the updated assignment
        assignment = serializer.save()
        new_assets = set(assignment.assets.all())
        
        # Handle removed assets
        removed_assets = old_assets - new_assets
        for asset in removed_assets:
            # Only set AVAILABLE if asset is not part of any other assignments
            still_assigned_elsewhere = AssetAssignment.objects.filter(assets=asset).exclude(id=assignment.id).exists()
            if not still_assigned_elsewhere:
                asset.status = 'AVAILABLE'
                asset.save()
                AssetHistory.objects.create(
                    asset=asset,
                    action="Removed from assignment",
                    performed_by=self.request.user,
                    notes=f"Removed from assignment to {assignment.employee.username}"
                )
        
        # Handle added assets
        added_assets = new_assets - old_assets
        print("2")
        for asset in added_assets:
            asset.status = 'ASSIGNED'
            asset.save()
            AssetHistory.objects.create(
                asset=asset,
                action=f"Assigned to {assignment.employee.username}",
                performed_by=self.request.user,
                notes=assignment.notes
            )

class AssetHistoryViewSet(viewsets.ModelViewSet):
    queryset = AssetHistory.objects.all()
    serializer_class = AssetHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser:
            return qs.filter(performed_by=self.request.user)
        return qs