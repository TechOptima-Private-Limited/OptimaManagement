

# from django.shortcuts import render, get_object_or_404
# from rest_framework import generics, status
# from rest_framework.decorators import api_view
from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions

from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import datetime, date
from .models import AttendanceRecord, BiometricDevice, WorkFromHomeRequest, AttendanceLocationPing
from .serializers import (
    AttendanceRecordSerializer, BiometricDeviceSerializer, AttendanceCreateSerializer,
    WorkFromHomeRequestSerializer, WorkFromHomeApplySerializer, AttendanceLocationPingSerializer
)
from employees.models import Employee
from utils.permissions import IsEmployee, IsHRManager
from notifications.services import NotificationService

User = get_user_model()

# Helper function to get manager's team employees (same as leave management)
def get_manager_team_employees(user):
    """Get list of employee IDs that a manager can access (team + self)"""
    try:
        manager_employee = Employee.objects.get(user=user)
        team_employee_ids = Employee.objects.filter(
            manager=manager_employee,
            status='ACTIVE'
        ).values_list('id', flat=True)
        # Include manager's own ID
        return list(team_employee_ids) + [manager_employee.id]
    except Employee.DoesNotExist:
        return []

class AttendanceRecordListView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    # Keep authenticated access; use has_perm in logic to expand access for extras
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = AttendanceRecord.objects.all()
        
        # Visibility filters
        target_employee_id = self.request.query_params.get('employee_id')
        include_peers = self.request.query_params.get('include_peers') == 'true'

        if not user.has_perm('attendance.view_attendancerecord'):
            # Fallback to role-based scoping when user doesn't have explicit view permission
            if hasattr(user, 'profile'):
                user_role = user.profile.role

                if user_role in ['HR_MANAGER', 'ADMIN']:
                    if target_employee_id:
                        queryset = queryset.filter(employee_id=target_employee_id)
                elif user_role == 'MANAGER':
                    allowed_employee_ids = get_manager_team_employees(user)
                    if target_employee_id:
                        if int(target_employee_id) in allowed_employee_ids:
                            queryset = queryset.filter(employee_id=target_employee_id)
                        else:
                            queryset = queryset.none()
                    else:
                        queryset = queryset.filter(employee_id__in=allowed_employee_ids)
                else:
                    # For EMPLOYEE and IT_SUPPORTER: 
                    # Default to showing ONLY own records unless include_peers=true is passed (used by My Team page)
                    try:
                        employee = Employee.objects.get(user=user)
                        
                        if target_employee_id:
                            if int(target_employee_id) == employee.id:
                                queryset = queryset.filter(employee=employee)
                            elif include_peers and employee.manager:
                                is_peer = Employee.objects.filter(
                                    id=target_employee_id,
                                    manager=employee.manager,
                                    status='ACTIVE'
                                ).exists()
                                if is_peer:
                                    queryset = queryset.filter(employee_id=target_employee_id)
                                else:
                                    queryset = queryset.none()
                            else:
                                queryset = queryset.none()
                        else:
                            if include_peers and employee.manager:
                                peers = Employee.objects.filter(
                                    manager=employee.manager,
                                    status='ACTIVE'
                                ).values_list('id', flat=True)
                                allowed_ids = [employee.id] + list(peers)
                                queryset = queryset.filter(employee_id__in=allowed_ids)
                            else:
                                queryset = queryset.filter(employee=employee)
                    except Employee.DoesNotExist:
                        queryset = queryset.none()
            else:
                try:
                    employee = Employee.objects.get(user=user)
                    queryset = queryset.filter(employee=employee)
                except Employee.DoesNotExist:
                    queryset = queryset.none()
        elif target_employee_id:
            queryset = queryset.filter(employee_id=target_employee_id)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset.order_by('-date')
    
    def list(self, request, *args, **kwargs):
        """Override to include pending approvals summary for HR and Managers"""
        response = super().list(request, *args, **kwargs)
        
        user = request.user
        print(f"🔍 Current user: {user}")
        
        if hasattr(user, 'profile'):
            user_role = user.profile.role
            print(f"🔍 User role: {user_role}")

            if user.has_perm('attendance.view_attendancerecord') or user_role == 'HR_MANAGER':
                pending_count = AttendanceRecord.objects.filter(is_pending_approval=True).count()
            elif user_role == 'MANAGER':
                allowed_employee_ids = get_manager_team_employees(user)
                pending_count = AttendanceRecord.objects.filter(
                    is_pending_approval=True,
                    employee_id__in=allowed_employee_ids
                ).count()
            else:
                pending_count = 0
            
            # Add pending approvals data for HR and Managers
            if user_role in ['HR_MANAGER', 'MANAGER']:
                response.data = {
                    'results': response.data.get('results', response.data),
                    'pending_approvals_count': pending_count,
                    'has_pending_approvals': pending_count > 0,
                    'user_role': user_role
                }
        
        return response

@api_view(['POST'])
def manual_attendance(request):
    """Create attendance record or submit edit request"""
    try:
        employee = Employee.objects.get(user=request.user)
        serializer = AttendanceCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            entry_date = serializer.validated_data['date']
            today = timezone.now().date()
            is_past_date = entry_date < today
            
            # Check if record already exists for this date
            existing_record = AttendanceRecord.objects.filter(
                employee=employee,
                date=entry_date
            ).first()
            
            new_check_in = serializer.validated_data.get('check_in_time')
            new_check_out = serializer.validated_data.get('check_out_time')
            new_status = serializer.validated_data.get('status')
            new_notes = serializer.validated_data.get('notes', '')
            new_ci_lat = serializer.validated_data.get('check_in_lat')
            new_ci_lng = serializer.validated_data.get('check_in_lng')
            new_co_lat = serializer.validated_data.get('check_out_lat')
            new_co_lng = serializer.validated_data.get('check_out_lng')
            
            user_role = getattr(getattr(request.user, 'profile', None), 'role', None)
            is_hr_manager = user_role == 'HR_MANAGER'

            if existing_record:
                # Allow direct checkout update ONLY if:
                # - It is for TODAY (not a past date)
                # - existing record belongs to same date/employee (already ensured)
                # - new payload only adds/updates check_out_time
                # - and does not modify check_in_time (or leaves it empty)
                # - and record is not already pending approval
                if (
                    not is_past_date and
                    not existing_record.is_pending_approval and
                    new_check_out is not None and
                    (new_check_in is None or new_check_in == existing_record.check_in_time)
                ):
                    existing_record.check_out_time = new_check_out
                    if new_co_lat is not None:
                        existing_record.check_out_lat = new_co_lat
                    if new_co_lng is not None:
                        existing_record.check_out_lng = new_co_lng
                    if new_status:
                        existing_record.status = new_status
                    existing_record.notes = new_notes or existing_record.notes
                    existing_record.attendance_type = existing_record.attendance_type or 'MANUAL'
                    existing_record.save(update_fields=['check_out_time', 'check_out_lat', 'check_out_lng', 'status', 'notes', 'attendance_type', 'updated_at'])

                    return Response(
                        AttendanceRecordSerializer(existing_record).data,
                        status=status.HTTP_200_OK
                    )

                # HR Manager can directly update without approval
                if is_hr_manager:
                    existing_record.check_in_time = new_check_in if new_check_in is not None else existing_record.check_in_time
                    existing_record.check_out_time = new_check_out if new_check_out is not None else existing_record.check_out_time
                    if new_ci_lat is not None:
                        existing_record.check_in_lat = new_ci_lat
                    if new_ci_lng is not None:
                        existing_record.check_in_lng = new_ci_lng
                    if new_co_lat is not None:
                        existing_record.check_out_lat = new_co_lat
                    if new_co_lng is not None:
                        existing_record.check_out_lng = new_co_lng
                    existing_record.status = new_status or existing_record.status
                    existing_record.notes = new_notes or existing_record.notes
                    existing_record.attendance_type = existing_record.attendance_type or 'MANUAL'
                    existing_record.is_pending_approval = False
                    existing_record.edit_reason = ''
                    existing_record.save()
                    return Response(
                        AttendanceRecordSerializer(existing_record).data,
                        status=status.HTTP_200_OK
                    )

                # Otherwise, treat as an edit that requires approval
                # STORE ORIGINAL VALUES FIRST
                print(f"🔄 Processing edit request for {employee.user} on {existing_record.date}")
                existing_record.original_check_in_time = existing_record.check_in_time
                existing_record.original_check_out_time = existing_record.check_out_time
                existing_record.original_status = existing_record.status
                existing_record.original_notes = existing_record.notes
                
                # Update with NEW requested values
                existing_record.check_in_time = new_check_in
                existing_record.check_out_time = new_check_out
                # Capture requested location edits as well (approval required)
                if new_ci_lat is not None:
                    existing_record.check_in_lat = new_ci_lat
                if new_ci_lng is not None:
                    existing_record.check_in_lng = new_ci_lng
                if new_co_lat is not None:
                    existing_record.check_out_lat = new_co_lat
                if new_co_lng is not None:
                    existing_record.check_out_lng = new_co_lng
                existing_record.status = new_status
                existing_record.notes = new_notes
                
                # Set pending approval flag
                existing_record.is_pending_approval = True
                existing_record.edit_reason = request.data.get('edit_reason', 'Attendance correction')
                
                # Store requested data in signals for email
                existing_record._requested_data = {
                    'check_in_time': new_check_in,
                    'check_out_time': new_check_out,
                    'status': new_status,
                    'notes': new_notes,
                    'check_in_lat': new_ci_lat,
                    'check_in_lng': new_ci_lng,
                    'check_out_lat': new_co_lat,
                    'check_out_lng': new_co_lng,
                }
                
                existing_record.save()  # This will trigger the signal to send email
                print(f"✅ Edit request saved - is_pending_approval: {existing_record.is_pending_approval}")
                
                return Response({
                    'message': 'Edit request submitted! HR and managers have been notified for approval.',
                    'requires_approval': True,
                    'is_pending_approval': True,
                    'record_id': existing_record.id
                }, status=status.HTTP_200_OK)
            else:
                # New record
                if is_past_date and not is_hr_manager:
                    # New record for past date requires approval
                    attendance_record = AttendanceRecord.objects.create(
                        employee=employee,
                        is_pending_approval=True,
                        edit_reason=request.data.get('edit_reason', 'Forgot to mark attendance'),
                        **serializer.validated_data
                    )
                    
                    # Store requested data for email signals (even for new records)
                    attendance_record._requested_data = serializer.validated_data
                    attendance_record.save() # Triggers signal
                    
                    return Response({
                        'message': 'Attendance request for past date submitted! HR and managers have been notified for approval.',
                        'requires_approval': True,
                        'is_pending_approval': True,
                        'record_id': attendance_record.id
                    }, status=status.HTTP_200_OK)
                else:
                    # New record for today or created by HR - create normally
                    attendance_record = AttendanceRecord.objects.create(
                        employee=employee,
                        **serializer.validated_data
                    )
                    print(f"✅ New attendance record created for {employee.user}")
                    return Response(
                        AttendanceRecordSerializer(attendance_record).data,
                        status=status.HTTP_201_CREATED
                    )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Error in manual_attendance: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_edits(request):
    """Get records with pending approval flag - Updated for manager permissions"""
    user = request.user
    
    # Updated permissions: Allow all authenticated users to see relevant pending records
    if user.has_perm('attendance.view_attendancerecord') or (hasattr(user, 'profile') and user.profile.role == 'HR_MANAGER'):
        pending_records = AttendanceRecord.objects.filter(is_pending_approval=True)
    elif hasattr(user, 'profile') and user.profile.role == 'MANAGER':
        allowed_employee_ids = get_manager_team_employees(user)
        pending_records = AttendanceRecord.objects.filter(
            is_pending_approval=True,
            employee_id__in=allowed_employee_ids
        )
    else:
        # Regular employees/IT Supporters can only see their own pending records
        try:
            employee = Employee.objects.get(user=user)
            pending_records = AttendanceRecord.objects.filter(
                employee=employee,
                is_pending_approval=True
            )
        except Employee.DoesNotExist:
            pending_records = AttendanceRecord.objects.none()
    
    data = []
    for record in pending_records:
        data.append({
            'id': record.id,
            'employee_name': record.employee.user.get_full_name(),
            'employee_id': record.employee.employee_id,
            'date': record.date,
            'edit_reason': record.edit_reason,
            'current_check_in_time': record.check_in_time,
            'current_check_out_time': record.check_out_time,
            'current_status': record.status,
            'current_notes': record.notes,
            'created_at': record.created_at,
        })
    
    return Response(data, status=status.HTTP_200_OK)

from .signals import send_approval_result_email

@api_view(['POST']) 
@permission_classes([IsAuthenticated])
def approve_edit(request, record_id):
    """Approve or reject attendance edit - HR/Manager only"""
    print(f"🔍 Approve edit called for record_id: {record_id}")
    print(f"🔍 Request data: {request.data}")
    print(f"🔍 Current user: {request.user}")
    print(f"🔍 User role: {getattr(request.user.profile, 'role', 'No profile')}")
    
    # Updated permission check: allow via Django change perm OR HR/Manager role
    if not (
        request.user.has_perm('attendance.change_attendancerecord') or
        (hasattr(request.user, 'profile') and request.user.profile.role in ['HR_MANAGER', 'MANAGER'])
    ):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        record = AttendanceRecord.objects.get(id=record_id, is_pending_approval=True)
        print(f"✅ Found pending record: {record}")
        
        # For managers, check if they can access this record
        if request.user.profile.role == 'MANAGER':
            allowed_employee_ids = get_manager_team_employees(request.user)
            if record.employee.id not in allowed_employee_ids:
                return Response({'error': 'Permission denied - not your team member'}, 
                              status=status.HTTP_403_FORBIDDEN)
        
        # Try to get approver Employee record, but make it optional
        try:
            approver = Employee.objects.get(user=request.user)
            print(f"✅ Found approver employee: {approver}")
        except Employee.DoesNotExist:
            print(f"⚠️ No Employee record found for user {request.user.username}, proceeding without approver reference")
            approver = None
        
        action = request.data.get('action')  # 'approve' or 'reject'
        print(f"🔍 Action: {action}")
        
        if action == 'approve':
            # HR/Manager provides the new data manually in the request
            new_data = request.data.get('new_data', {})
            print(f"🔍 New data: {new_data}")
            
            # Apply changes provided by HR/Manager
            if 'check_in_time' in new_data:
                record.check_in_time = new_data['check_in_time']
            if 'check_out_time' in new_data:
                record.check_out_time = new_data['check_out_time']
            if 'status' in new_data:
                record.status = new_data['status']
            if 'notes' in new_data:
                record.notes = new_data['notes']
            
            # Clear flag and set approval info
            record.is_pending_approval = False
            record.approved_by = approver  # This can be None if no Employee record exists
            record.approval_date = timezone.now()
            record.save()
            
            # Send approval email to employee
            if record.employee.user.email:
                send_approval_result_email(
                    employee_email=record.employee.user.email,
                    employee_name=record.employee.user.get_full_name(),
                    date=str(record.date),
                    approved=True,
                    approver_name=approver.user.get_full_name() if approver else 'Manager'
                )

            print(f"✅ Record approved and updated")
            return Response({'message': 'Edit approved and applied!'}, status=status.HTTP_200_OK)
            
        elif action == 'reject':
            # Just clear the flag, don't change any data
            record.is_pending_approval = False
            record.approved_by = approver  # This can be None if no Employee record exists
            record.approval_date = timezone.now()
            record.save()
            
            if record.employee.user.email:
                send_approval_result_email(
                    employee_email=record.employee.user.email,
                    employee_name=record.employee.user.get_full_name(),
                    date=str(record.date),
                    approved=False,
                    approver_name=approver.user.get_full_name() if approver else 'Manager'
                )
            print(f"✅ Record rejected")
            return Response({'message': 'Edit rejected! Original data preserved.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid action. Use "approve" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)
        
    except AttendanceRecord.DoesNotExist:
        print(f"❌ Record not found: {record_id}")
        return Response({'error': 'Record not found or not pending approval'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Error in approve_edit: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsEmployee])
def ping_location(request):
    """Record an hourly (or on-demand) location ping for the current user."""
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AttendanceLocationPingSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.now().date()
    attendance_record = AttendanceRecord.objects.filter(employee=employee, date=today).first()

    ping = AttendanceLocationPing.objects.create(
        employee=employee,
        attendance_record=attendance_record,
        latitude=serializer.validated_data['latitude'],
        longitude=serializer.validated_data['longitude'],
        source='BROWSER'
    )

    return Response({
        'message': 'Location ping recorded',
        'attendance_record_id': attendance_record.id if attendance_record else None,
        'timestamp': ping.timestamp
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def biometric_sync(request):
    """API endpoint for biometric device integration"""
    device_id = request.data.get('device_id')
    attendance_data = request.data.get('attendance_data', [])
    
    try:
        device = BiometricDevice.objects.get(device_id=device_id, is_active=True)
        created_records = []
        
        for record in attendance_data:
            try:
                employee = Employee.objects.get(employee_id=record['employee_id'])
                
                attendance_record, created = AttendanceRecord.objects.get_or_create(
                    employee=employee,
                    date=datetime.strptime(record['date'], '%Y-%m-%d').date(),
                    is_pending_approval=False,  # Biometric records are auto-approved
                    defaults={
                        'check_in_time': record.get('check_in_time'),
                        'check_out_time': record.get('check_out_time'),
                        'status': record.get('status', 'PRESENT'),
                        'attendance_type': 'BIOMETRIC',
                        'biometric_device_id': device_id,
                    }
                )
                
                if created:
                    created_records.append(attendance_record.id)
            
            except Employee.DoesNotExist:
                continue
        
        # Update device last sync time
        device.last_sync = timezone.now()
        device.save()
        
        return Response({
            'message': f'{len(created_records)} attendance records created',
            'created_records': created_records
        })
    
    except BiometricDevice.DoesNotExist:
        return Response({'error': 'Device not found or inactive'}, status=status.HTTP_404_NOT_FOUND)

class BiometricDeviceListView(generics.ListCreateAPIView):
    queryset = BiometricDevice.objects.all()
    serializer_class = BiometricDeviceSerializer
    # Allow users with appropriate model perms to manage devices
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

# Work From Home Views - Updated for Manager Support

@api_view(['POST'])
@permission_classes([IsEmployee])
def apply_work_from_home(request):
    """Apply for work from home"""
    try:
        employee = Employee.objects.get(user=request.user)
        serializer = WorkFromHomeApplySerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"❌ WFH Serializer Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if any overlapping WFH exists for these dates
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        print(f"🔍 Checking if overlapping WFH exists for {employee.user} from {start_date} to {end_date}")
        overlapping_request = WorkFromHomeRequest.objects.filter(
            employee=employee,
            start_date__lte=end_date,
            end_date__gte=start_date
        ).first()
        
        if overlapping_request:
            msg = f"Already applied for WFH during some of these dates ({overlapping_request.start_date} to {overlapping_request.end_date}). Status: {overlapping_request.status}"
            print(f"⚠️ {msg}")
            return Response({
                'error': msg
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Create WFH request
        wfh_request = WorkFromHomeRequest.objects.create(
            employee=employee,
            **serializer.validated_data
        )
        
        # Send email to HR and managers
        send_wfh_request_email(wfh_request)
        
        # Send Notification to manager and HR
        try:
            recipients = []
            if employee.manager:
                recipients.append(employee.manager.user)
            
            hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
            recipients.extend(list(hr_users))
            
            # Deduplicate
            recipients = list(set(recipients))
            
            date_range_str = f"{wfh_request.start_date} to {wfh_request.end_date}" if wfh_request.start_date != wfh_request.end_date else f"{wfh_request.start_date}"
            
            for recipient in recipients:
                NotificationService.create_notification(
                    recipient=recipient,
                    notification_type='WFH_REQUEST',
                    title=f"New WFH Request: {employee.user.get_full_name()}",
                    message=f"{employee.user.get_full_name()} has requested WFH for {date_range_str}. Reason: {wfh_request.reason[:50]}...",
                    sender=request.user,
                    action_url='/attendance/wfh-requests',
                    action_text='Review Request'
                )
        except Exception as e:
            print(f"⚠️ Failed to send WFH push notification: {str(e)}")
        
        return Response({
            'message': 'Work from home request submitted successfully!',
            'request_id': wfh_request.id
        }, status=status.HTTP_201_CREATED)
    
    except Employee.DoesNotExist:
        return Response({
            'error': 'Only employees can apply for work from home. HR staff do not need WFH approval.'
        }, status=status.HTTP_403_FORBIDDEN)

@api_view(['GET'])
@permission_classes([IsEmployee])
def check_wfh_status(request):
    """Check WFH status for today or specific date"""
    try:
        # Check if user has employee record
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            # If user doesn't have employee record (like HR admin), return default
            return Response({
                'has_wfh_request': False,
                'can_work_from_home': False,
                'request': None,
                'is_hr_admin': True
            })
        
        check_date = request.query_params.get('date', timezone.now().date())
        
        if isinstance(check_date, str):
            check_date = datetime.strptime(check_date, '%Y-%m-%d').date()
        
        try:
            wfh_request = WorkFromHomeRequest.objects.filter(
                employee=employee,
                start_date__lte=check_date,
                end_date__gte=check_date
            ).first()
            
            if not wfh_request:
                raise WorkFromHomeRequest.DoesNotExist()
            return Response({
                'has_wfh_request': True,
                'status': wfh_request.status,
                'can_work_from_home': wfh_request.status == 'APPROVED',
                'request': WorkFromHomeRequestSerializer(wfh_request).data,
                'is_hr_admin': False
            })
        except WorkFromHomeRequest.DoesNotExist:
            return Response({
                'has_wfh_request': False,
                'can_work_from_home': False,
                'request': None,
                'is_hr_admin': False
            })
    
    except Exception as e:
        print(f"❌ Error in check_wfh_status: {str(e)}")
        return Response({
            'has_wfh_request': False,
            'can_work_from_home': False,
            'request': None,
            'error': str(e)
        })

@api_view(['GET'])
@permission_classes([IsEmployee])
def get_wfh_requests(request):
    """Get WFH requests - HR can see all, Manager sees team, employees see their own"""
    try:
        user = request.user
        
        if hasattr(user, 'profile'):
            user_role = user.profile.role
            
            if user_role in ['HR_MANAGER', 'ADMIN']:
                # HR and Admin see all requests
                requests = WorkFromHomeRequest.objects.all().select_related(
                    'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
                ).order_by('-applied_at')
                print(f"👑 {user_role} - fetching all requests")
                
            elif user_role == 'MANAGER':
                # Manager sees team requests + their own
                allowed_employee_ids = get_manager_team_employees(user)
                requests = WorkFromHomeRequest.objects.filter(
                    employee_id__in=allowed_employee_ids
                ).select_related(
                    'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
                ).order_by('-applied_at')
                print(f"👨‍💼 Manager - fetching team requests")
                
            else:
                # Employee and IT_SUPPORTER see only their own + peers
                try:
                    employee = Employee.objects.get(user=user)
                    peer_ids = []
                    if employee.manager:
                        peers = Employee.objects.filter(
                            manager=employee.manager,
                            status='ACTIVE'
                        ).values_list('id', flat=True)
                        peer_ids = list(peers)
                    
                    allowed_ids = [employee.id] + peer_ids
                    requests = WorkFromHomeRequest.objects.filter(
                        employee_id__in=allowed_ids
                    ).select_related(
                        'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
                    ).order_by('-applied_at')
                    print(f"👨‍💼 {user_role} {employee.employee_id} - fetching own+peers requests")
                except Employee.DoesNotExist:
                    requests = WorkFromHomeRequest.objects.none()
        else:
            # No profile - employee only
            employee = Employee.objects.get(user=user)
            requests = WorkFromHomeRequest.objects.filter(employee=employee).select_related(
                'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
            ).order_by('-applied_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            requests = requests.filter(status=status_filter.upper())
            print(f"🔽 Filtered by status '{status_filter}': {requests.count()} requests")
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            requests = requests.filter(start_date__gte=start_date)
            print(f"📅 Filtered by start_date '{start_date}': {requests.count()} requests")
        if end_date:
            requests = requests.filter(end_date__lte=end_date)
            print(f"📅 Filtered by end_date '{end_date}': {requests.count()} requests")
        
        # Serialize the data
        serializer = WorkFromHomeRequestSerializer(requests, many=True)
        serialized_data = serializer.data
        
        return Response({
            'results': serialized_data,
            'count': requests.count(),
            'user_role': getattr(user.profile, 'role', 'EMPLOYEE') if hasattr(user, 'profile') else 'EMPLOYEE',
            'debug_info': {
                'server_date': str(timezone.now().date()),
                'server_time': str(timezone.now()),
                'user': str(user),
                'is_hr': hasattr(user, 'profile') and user.profile.role == 'HR_MANAGER',
                'is_manager': hasattr(user, 'profile') and user.profile.role == 'MANAGER'
            }
        })
    
    except Employee.DoesNotExist:
        print("❌ Employee profile not found for current user - returning empty WFH list")
        role = getattr(getattr(request.user, 'profile', None), 'role', 'EMPLOYEE')
        return Response({
            'results': [],
            'count': 0,
            'user_role': role,
            'debug_info': {
                'server_date': str(timezone.now().date()),
                'server_time': str(timezone.now()),
                'user': str(request.user),
                'is_hr': hasattr(request.user, 'profile') and getattr(request.user.profile, 'role', '') == 'HR_MANAGER',
                'is_manager': hasattr(request.user, 'profile') and getattr(request.user.profile, 'role', '') == 'MANAGER'
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"❌ Error in get_wfh_requests: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsEmployee])  # Changed from IsHRManager to IsEmployee
def approve_wfh_request(request, request_id):
    """Approve or reject WFH request - HR and Manager can approve"""
    user = request.user
    
    # Check if user has appropriate permissions
    if not (hasattr(user, 'profile') and 
            user.profile.role in ['HR_MANAGER', 'MANAGER']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        wfh_request = WorkFromHomeRequest.objects.get(id=request_id, status='PENDING')
        
        # For managers, check if they can access this request
        if user.profile.role == 'MANAGER':
            allowed_employee_ids = get_manager_team_employees(user)
            if wfh_request.employee.id not in allowed_employee_ids:
                return Response({'error': 'Permission denied - not your team member'}, 
                              status=status.HTTP_403_FORBIDDEN)
        
        action = request.data.get('action')  # 'approve' or 'reject'
        
        try:
            approver = Employee.objects.get(user=user)
        except Employee.DoesNotExist:
            approver = None
        
        if action == 'approve':
            wfh_request.status = 'APPROVED'
            wfh_request.approved_by = approver
            wfh_request.approved_at = timezone.now()
            wfh_request.save()
            
            # Send approval email
            send_wfh_approval_email(wfh_request, approved=True)
            
            # Send Notification to employee
            try:
                NotificationService.create_notification(
                    recipient=wfh_request.employee.user,
                    notification_type='WFH_APPROVED',
                    title="WFH Request Approved",
                    message=f"Your WFH request from {wfh_request.start_date} to {wfh_request.end_date} has been approved.",
                    sender=request.user,
                    action_url='/attendance',
                    action_text='View Attendance'
                )
            except Exception as e:
                print(f"⚠️ Failed to send WFH approval push: {str(e)}")
            
            return Response({'message': 'Work from home request approved!'})
        
        elif action == 'reject':
            wfh_request.status = 'REJECTED'
            wfh_request.approved_by = approver
            wfh_request.approved_at = timezone.now()
            wfh_request.rejection_reason = request.data.get('rejection_reason', 'No reason provided')
            wfh_request.save()
            
            # Send rejection email
            send_wfh_approval_email(wfh_request, approved=False)
            
            # Send Notification to employee
            try:
                NotificationService.create_notification(
                    recipient=wfh_request.employee.user,
                    notification_type='WFH_REJECTED',
                    title="WFH Request Rejected",
                    message=f"Your WFH request from {wfh_request.start_date} to {wfh_request.end_date} has been rejected. Reason: {wfh_request.rejection_reason}",
                    sender=request.user,
                    action_url='/attendance',
                    action_text='View Attendance'
                )
            except Exception as e:
                print(f"⚠️ Failed to send WFH rejection push: {str(e)}")
            
            return Response({'message': 'Work from home request rejected!'})
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    except WorkFromHomeRequest.DoesNotExist:
        return Response({'error': 'Request not found or already processed'}, status=status.HTTP_404_NOT_FOUND)

# Email functions updated to include managers
# def send_wfh_request_email(wfh_request):
from django.core.mail import EmailMessage

def send_wfh_request_email(wfh_request):
    """Send WFH request email to HR and managers"""
    try:
        # Get HR Managers
        hr_users = User.objects.filter(profile__role='HR_MANAGER', is_active=True)
        recipients = [user.email for user in hr_users if user.email]
        
        # Also notify the employee's direct manager if they have one
        if wfh_request.employee.manager and wfh_request.employee.manager.user.email:
            if wfh_request.employee.manager.user.email not in recipients:
                recipients.append(wfh_request.employee.manager.user.email)
        
        if not recipients:
            print("❌ No HR Manager or Manager email found")
            return
        
        subject = f"Work From Home Request - {wfh_request.employee.user.get_full_name()}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; background-color: #7c3aed; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px;">
                    <h1>🏠 Work From Home Request</h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Employee Details:</h3>
                    <p><strong>Name:</strong> {wfh_request.employee.user.get_full_name()}</p>
                    <p><strong>Employee ID:</strong> {wfh_request.employee.employee_id}</p>
                    <p><strong>Start Date:</strong> {wfh_request.start_date.strftime('%B %d, %Y')}</p>
                    <p><strong>End Date:</strong> {wfh_request.end_date.strftime('%B %d, %Y')}</p>
                    <p><strong>Applied On:</strong> {wfh_request.applied_at.strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #0066cc;">Reason for Work From Home:</h3>
                    <p style="font-style: italic; color: #333;">{wfh_request.reason}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p><strong>Please review and approve/reject this request in the system.</strong></p>
                </div>
            </div>
        </div>
        """
        
        email = EmailMessage(
            subject=subject,
            body=html_content,
            to=recipients,
        )
        email.content_subtype = "html"
        email.send()
        
        print(f"✅ WFH request email sent to HR and managers for {wfh_request.employee.user.get_full_name()}")
        
    except Exception as e:
        print(f"❌ Failed to send WFH request email: {str(e)}")

def send_wfh_approval_email(wfh_request, approved=True):
    """Send approval/rejection email to employee"""
    try:
        subject = f"Work From Home Request {'Approved' if approved else 'Rejected'}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; background-color: {'#16a34a' if approved else '#dc2626'}; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px;">
                    <h1>{'✅ Request Approved!' if approved else '❌ Request Rejected'}</h1>
                </div>
                
                <div style="font-size: 18px; margin-bottom: 20px;">
                    <p>Hi <strong>{wfh_request.employee.user.first_name}</strong>,</p>
                    
                    <p>Your work from home request from <strong>{wfh_request.start_date.strftime('%B %d, %Y')}</strong> to <strong>{wfh_request.end_date.strftime('%B %d, %Y')}</strong> has been <strong>{'approved' if approved else 'rejected'}</strong>.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Request Details:</strong></p>
                    <p><strong>Duration:</strong> {wfh_request.start_date.strftime('%B %d, %Y')} to {wfh_request.end_date.strftime('%B %d, %Y')}</p>
                    <p><strong>Reason:</strong> {wfh_request.reason}</p>
                    <p><strong>{'Approved' if approved else 'Rejected'} by:</strong> {wfh_request.approved_by.user.get_full_name() if wfh_request.approved_by else 'Manager'}</p>
                </div>
                
                {'<div style="background-color: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #16a34a;"><p><strong>You can now work from home on the requested date. Make sure to check in using the "Work From Home" option on the dashboard.</strong></p></div>' if approved else f'<div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;"><p><strong>Rejection Reason:</strong> {wfh_request.rejection_reason}</p></div>'}
            </div>
        </div>
        """
        
        email = EmailMessage(
            subject=subject,
            body=html_content,
            to=[wfh_request.employee.user.email],
        )
        email.content_subtype = "html"
        email.send()
        
        print(f"✅ WFH {'approval' if approved else 'rejection'} email sent to {wfh_request.employee.user.email}")
        
    except Exception as e:
        print(f"❌ Failed to send WFH approval email: {str(e)}")