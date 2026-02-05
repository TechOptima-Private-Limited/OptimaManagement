# assets/views.py
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.shortcuts import render, redirect
from django.urls import reverse
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from utils.permissions import AssetModelPermissions
from .models import AssetType, Asset, AssetAssignment, AssetHistory, AssetReturn, OffboardingAssetReturn, EmployeeStatus, AssetRepair
from .serializers import (
    AssetTypeSerializer,
    AssetSerializer,
    AssetAssignmentSerializer,
    AssetHistorySerializer,
    AssetReturnSerializer,
    OffboardingAssetReturnSerializer,
    EmployeeStatusSerializer,
    AssetRepairSerializer,
)
from .utils import send_asset_return_report
from .export_utils import generate_asset_export_excel
from dal import autocomplete
from django.contrib.auth.models import User
from notifications.services import NotificationService

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

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_assets_excel(request):
    """
    Export all asset management data to Excel file
    """
    from django.utils import timezone
    from io import BytesIO
    
    # Generate the Excel workbook
    wb = generate_asset_export_excel(request.user)
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    # Create response
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    
    # Set filename with timestamp
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f'asset_management_export_{timestamp}.xlsx'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response



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
    permission_classes = [IsAuthenticated, AssetModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        admin_groups = ['Admin', 'HR Admin', 'HR Manager', 'IT Support', 'Asset Team']
        if (
            user.is_superuser
            or user.is_staff
            or user.groups.filter(name__in=admin_groups).exists()
            or user.has_perm('assets.view_assettype')
        ):
            return qs
        return qs.filter(asset_team_email=user.email)

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated, AssetModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset().select_related('asset_type').prefetch_related('assignments__employee')
        user = self.request.user
        admin_groups = ['Admin', 'HR Admin', 'HR Manager', 'IT Support', 'Asset Team']
        if (
            user.is_superuser
            or user.is_staff
            or user.groups.filter(name__in=admin_groups).exists()
            or user.has_perm('assets.view_asset')
        ):
            # Admins see everything unless they explicitly ask for 'mine'
            if self.request.query_params.get('mine') == 'true':
                return qs.filter(assignments__employee=user, status='ASSIGNED').distinct()
            return qs
        
        # Non-admin users: If ?mine=true, show only their assigned assets
        if self.request.query_params.get('mine') == 'true':
            return qs.filter(assignments__employee=user, status='ASSIGNED').distinct()

        # Otherwise, they see assets of types they manage OR assets assigned to them
        asset_type_ids = AssetType.objects.filter(asset_team_email=user.email).values_list('id', flat=True)
        return qs.filter(
            models.Q(asset_type__id__in=asset_type_ids) | 
            models.Q(assignments__employee=user)
        ).distinct()

class AssetAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AssetAssignment.objects.all()
    serializer_class = AssetAssignmentSerializer
    permission_classes = [IsAuthenticated, AssetModelPermissions]
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        admin_groups = ['Admin', 'HR Admin', 'HR Manager', 'IT Support', 'Asset Team']
        if not (
            user.is_superuser
            or user.is_staff
            or user.groups.filter(name__in=admin_groups).exists()
            or user.has_perm('assets.view_assetassignment')
        ):
            qs = qs.filter(employee=user)
        
        # Add filtering by employee_id if provided
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
            
        return qs.prefetch_related('assets', 'asset_types').distinct()

    def perform_create(self, serializer):
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
        
        # Send email notifications
        try:
            from .utils import send_asset_assignment_notification
            send_asset_assignment_notification(assignment)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send asset assignment notification: {e}")

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
    permission_classes = [IsAuthenticated, AssetModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser or user.is_staff or user.has_perm('assets.view_assethistory'):
            return qs
        return qs.filter(performed_by=user)

class OffboardingAssetReturnViewSet(viewsets.ModelViewSet):
    queryset = OffboardingAssetReturn.objects.all()
    serializer_class = OffboardingAssetReturnSerializer
    permission_classes = [IsAuthenticated, AssetModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser or user.is_staff or user.has_perm('assets.view_offboardingassetreturn'):
            return qs
        return qs.filter(user=user)

class AssetReturnViewSet(viewsets.ModelViewSet):
    queryset = AssetReturn.objects.all()
    serializer_class = AssetReturnSerializer
    permission_classes = [IsAuthenticated, AssetModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser or user.is_staff or user.has_perm('assets.view_assetreturn'):
            return qs
        return qs.filter(assignment__employee=user)

class EmployeeStatusViewSet(viewsets.ModelViewSet):
    queryset = EmployeeStatus.objects.all()
    serializer_class = EmployeeStatusSerializer
    permission_classes = [IsAuthenticated, AssetModelPermissions]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        admin_groups = ['Admin', 'HR Admin', 'HR Manager', 'IT Support', 'Asset Team']
        if (
            user.is_superuser
            or user.is_staff
            or user.groups.filter(name__in=admin_groups).exists()
            or user.has_perm('assets.view_employeestatus')
        ):
            return qs
        return qs.filter(employee=user)

class AssetRepairViewSet(viewsets.ModelViewSet):
    queryset = AssetRepair.objects.all()
    serializer_class = AssetRepairSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # Admins and asset team members see all repairs
        if self.request.user.is_superuser:
            return qs
        if self.request.user.email in AssetType.objects.values_list('asset_team_email', flat=True):
            return qs
        # Regular users see only repairs for their assigned assets
        return qs.filter(asset__assignments__employee=self.request.user).distinct()
    
    def perform_create(self, serializer):
        # Auto-set reported_by to current user
        repair = serializer.save(reported_by=self.request.user)
        
        # Update asset repair status
        asset = repair.asset
        asset.is_under_repair = True
        asset.current_repair = repair
        asset.save()
        
        # Log the repair in asset history
        AssetHistory.objects.create(
            asset=asset,
            action=f"Repair reported: {repair.issue_description[:50]}",
            performed_by=self.request.user,
            notes=f"Status: {repair.get_status_display()}"
        )
        
        # Notify Admins and IT Support
        NotificationService.notify_asset_repair_request(repair)
    
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        repair = serializer.save()
        new_status = repair.status
        
        # If status changed to completed or failed, update asset
        if old_status != new_status and new_status in ['COMPLETED', 'FAILED']:
            asset = repair.asset
            asset.is_under_repair = False
            asset.current_repair = None
            asset.save()
            
            # Log the completion
            AssetHistory.objects.create(
                asset=asset,
                action=f"Repair {new_status.lower()}: {repair.issue_description[:50]}",
                performed_by=self.request.user,
                notes=f"Vendor: {repair.repair_vendor or 'N/A'}, Cost: {repair.repair_cost or 'N/A'}"
            )