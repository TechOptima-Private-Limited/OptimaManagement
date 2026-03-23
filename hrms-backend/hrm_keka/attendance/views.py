from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions

from django.utils import timezone
import ipaddress
from django.conf import settings

from django.contrib.auth import get_user_model
import socket
from datetime import datetime, date
from .models import AttendanceRecord, BiometricDevice, WorkFromHomeRequest, AttendanceLocationPing, BiometricAttendanceLog
from django.db.models import Max, Q, Subquery
from .serializers import (
    AttendanceRecordSerializer, BiometricDeviceSerializer, AttendanceCreateSerializer, AttendanceUpdateSerializer,
    WorkFromHomeRequestSerializer, WorkFromHomeApplySerializer, AttendanceLocationPingSerializer
)
from employees.models import Employee
from utils.permissions import IsEmployee, IsHRManager
from utils.roles import (
    has_management_access,
    has_executive_access,
    can_manage_hr,
    get_permission_level,
    PERMISSION_LEVELS
)
from notifications.services import NotificationService

User = get_user_model()
import logging

logger = logging.getLogger(__name__)

# Biometric Integration
try:
    from zk import ZK
    BIOMETRIC_AVAILABLE = True
except ImportError:
    BIOMETRIC_AVAILABLE = False
    logger.warning("ZK library not available. Biometric features disabled.")


# ===========================
# BIOMETRIC DEVICE MANAGEMENT
# ===========================

def validate_biometric_device_ip(ip_str):
    """
    Validate that the IP address is a valid private network IP to prevent SSRF.
    """
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private
    except ValueError:
        return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_biometric_logs(request):
    """
    ✅ Sync biometric logs and create attendance records
    - Stores ALL biometric data, even if employee doesn't exist
    - Creates attendance records from biometric logs
    - Returns data for frontend display
    """
    if not BIOMETRIC_AVAILABLE:
        return Response({
            'error': 'Biometric library not available. Install pyzk: pip install pyzk'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    device_ip = request.data.get('device_ip')
    sync_date_str = request.data.get('sync_date')
    
    if not device_ip:
        return Response({'error': 'device_ip is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate device IP to prevent SSRF attacks
    if not validate_biometric_device_ip(device_ip):
        return Response({'error': 'Invalid device IP address. Only private network IPs are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Parse sync date or use today
    if sync_date_str:
        try:
            sync_date = datetime.strptime(sync_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        sync_date = date.today()
    
    # Check permissions: HR, Management, or IT roles can sync historical data
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    
    can_sync_historical = (
        can_manage_hr(user_role) or 
        has_management_access(user_role) or
        user_role in ['IT_SUPPORT', 'SYSTEM_ADMIN', 'DEVOPS_ENGINEER']
    )
    
    if not can_sync_historical and sync_date != date.today():
        return Response(
            {'error': 'Only HR, Managers, and IT staff can sync historical data'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        logger.info(f"🔄 Starting biometric sync for device {device_ip}, date {sync_date}")
        
        # Connect to biometric device with increased timeout (15 seconds)
        logger.info(f"Attempting ZK connection to {device_ip}:4370")
        zk = ZK(device_ip, port=4370, timeout=15, force_udp=False)
        conn = None
        
        # Implement a simple retry for connection
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Connection attempt {attempt + 1}/{max_retries + 1}...")
                conn = zk.connect()
                logger.info(f"✅ Connected to {device_ip}")
                break
            except Exception as conn_err:
                logger.error(f"❌ Connection attempt {attempt + 1} failed: {str(conn_err)}")
                if attempt == max_retries:
                    raise conn_err
                import time
                time.sleep(2)

        if not conn:
            raise Exception("Could not establish connection to device (conn is None)")

        # Get all users from device (for names)
        try:
            logger.info("Fetching users from device...")
            users = conn.get_users()
            user_names = {str(user.user_id): user.name for user in users}
            logger.info(f"📋 Found {len(user_names)} users in device")
        except Exception as e:
            logger.error(f"❌ Failed to fetch users: {str(e)}")
            user_names = {}
        
        # Fetch all attendance logs
        try:
            logger.info("Fetching attendance logs from device...")
            logs = conn.get_attendance()
            logger.info(f"📊 Fetched {len(logs)} total logs from device")
        except Exception as e:
            logger.error(f"❌ Failed to fetch attendance logs: {str(e)}")
            try:
                conn.disconnect()
            except:
                pass
            raise Exception(f"Failed to fetch attendance logs: {str(e)}")

        # Setup IST timezone for correct date/time conversion
        # ZK devices return naive datetimes in device-local time (IST).
        # We must localize before filtering by date to avoid off-by-one at midnight.
        import pytz
        tz_ist = pytz.timezone('Asia/Kolkata')

        def log_date_ist(log):
            """Return the IST date for a raw ZK log entry."""
            ts = log.timestamp
            if ts.tzinfo is None:
                ts = tz_ist.localize(ts)
            return ts.astimezone(tz_ist).date()

        # Filter logs for the specified date using IST-converted timestamps
        filtered_logs = [log for log in logs if log_date_ist(log) == sync_date]
        logger.info(f"📅 Filtered to {len(filtered_logs)} logs for date {sync_date}")
        
        # Always disconnect as soon as logs are fetched to free up the device
        try:
            conn.disconnect()
            conn = None # Mark as disconnected
        except Exception as e:
            logger.error(f"Error during device disconnect: {str(e)}")
        
        # Process and store ALL logs
        synced_count = 0
        attendance_records_created = []

        for log in filtered_logs:
            try:
                biometric_user_id = str(log.user_id)
                biometric_user_name = user_names.get(biometric_user_id, '')

                # ZK device returns naive datetimes in device-local time (IST).
                # Make them timezone-aware so Django stores the correct time.
                raw_ts = log.timestamp
                if raw_ts.tzinfo is None:
                    # Naive — treat as IST (device-local time)
                    aware_ts = tz_ist.localize(raw_ts)
                else:
                    # Already aware — convert to IST just in case
                    aware_ts = raw_ts.astimezone(tz_ist)

                attendance_date = aware_ts.date()
                attendance_time = aware_ts.time().replace(tzinfo=None)  # store as plain time
                
                logger.info(f"🔍 Processing: {biometric_user_id} ({biometric_user_name}) at {log.timestamp}")
                
                # Try to find employee (optional)
                employee = Employee.objects.filter(employee_id=biometric_user_id).first()
                if employee:
                    logger.info(f"✅ Matched employee: {employee.employee_id}")
                else:
                    logger.info(f"ℹ️ No employee match - will store as biometric-only record")
                
                # CREATE/UPDATE ATTENDANCE RECORD
                if employee:
                    record, created = AttendanceRecord.objects.get_or_create(
                        employee=employee,
                        date=attendance_date,
                        defaults={
                            'check_in_time': attendance_time,
                            'status': 'PRESENT',
                            'attendance_type': 'BIOMETRIC',
                            'biometric_device_id': device_ip,
                            'biometric_user_id': biometric_user_id,
                            'biometric_user_name': biometric_user_name
                        }
                    )
                else:
                    record, created = AttendanceRecord.objects.get_or_create(
                        biometric_user_id=biometric_user_id,
                        date=attendance_date,
                        employee__isnull=True,
                        defaults={
                            'biometric_user_name': biometric_user_name,
                            'check_in_time': attendance_time,
                            'status': 'PRESENT',
                            'attendance_type': 'BIOMETRIC',
                            'biometric_device_id': device_ip
                        }
                    )
                
                if created:
                    logger.info(f"✨ Created NEW attendance record for {biometric_user_id}")
                    attendance_records_created.append(record.id)
                else:
                    # Update existing record
                    update_needed = False
                    
                    # Update check-in ONLY if it's currently missing or the new punch is EARLIER
                    if not record.check_in_time or attendance_time < record.check_in_time:
                        record.check_in_time = attendance_time
                        update_needed = True
                        logger.info(f"   → Updated check_in: {attendance_time}")
                    
                    # Update check-out ONLY if the new punch is LATER than the current check-in
                    # and (currently missing OR the new punch is LATER than current check-out)
                    if attendance_time > record.check_in_time:
                        if not record.check_out_time or attendance_time > record.check_out_time:
                            record.check_out_time = attendance_time
                            update_needed = True
                            logger.info(f"   → Updated check_out: {attendance_time}")
                    
                    # Update biometric info if it was linked to employee later
                    if employee and not record.employee:
                        record.employee = employee
                        update_needed = True
                        logger.info(f"   → Linked to employee: {employee.employee_id}")
                    
                    if update_needed:
                        record.attendance_type = 'BIOMETRIC'
                        record.biometric_device_id = device_ip
                        record.biometric_user_id = biometric_user_id
                        record.biometric_user_name = biometric_user_name
                        record.save()
                        logger.info(f"📝 Updated attendance record for {biometric_user_id}")
                
                # ALWAYS STORE THE RAW BIOMETRIC LOG
                bio_log, bio_created = BiometricAttendanceLog.objects.get_or_create(
                    biometric_user_id=biometric_user_id,
                    timestamp=aware_ts,
                    defaults={
                        'biometric_user_name': biometric_user_name,
                        'device_id': device_ip,
                        'date': attendance_date,
                        'time': attendance_time,
                        'employee': employee,
                        'attendance_record': record
                    }
                )
                if bio_created:
                    logger.info(f"📁 Saved raw biometric log for {biometric_user_id} at {log.timestamp}")
                else:
                    # If it already existed but wasn't linked to a record, link it now
                    if record and not bio_log.attendance_record:
                        bio_log.attendance_record = record
                        bio_log.save()
                    if employee and not bio_log.employee:
                        bio_log.employee = employee
                        bio_log.save()

                synced_count += 1
                
            except Exception as e:
                logger.error(f"❌ Error processing log for {log.user_id}: {str(e)}", exc_info=True)

        # After storing logs, normalize attendance check-in/out per user for the day
        # using all raw biometric punches we just stored.
        try:
            day_logs = BiometricAttendanceLog.objects.filter(
                date=sync_date
            ).order_by('timestamp')

            by_user = {}
            for bl in day_logs:
                by_user.setdefault(bl.biometric_user_id, []).append(bl)

            for uid, logs_for_user in by_user.items():
                if not logs_for_user:
                    continue

                first_ts = logs_for_user[0].timestamp
                last_ts = logs_for_user[-1].timestamp

                # Ensure we use the localized time for display
                ci = first_ts.astimezone(tz_ist).time().replace(tzinfo=None)
                co = last_ts.astimezone(tz_ist).time().replace(tzinfo=None)

                # logic: if multiple punches exist, first is check-in, last is check-out
                if len(logs_for_user) < 2:
                    co = None
                elif ci == co:
                    co = None

                employee = Employee.objects.filter(employee_id=uid).first()
                if employee:
                    rec = AttendanceRecord.objects.filter(employee=employee, date=sync_date).first()
                else:
                    rec = AttendanceRecord.objects.filter(biometric_user_id=uid, date=sync_date, employee__isnull=True).first()

                if not rec:
                    continue

                update_fields = []
                
                # Check-in: Take the earliest punch
                if not rec.check_in_time or ci < rec.check_in_time:
                    rec.check_in_time = ci
                    update_fields.append('check_in_time')
                
                # Check-out: Take the latest punch found today, as long as it's later than check-in
                effective_co = co
                if rec.check_in_time and effective_co and effective_co <= rec.check_in_time:
                    effective_co = None
                
                if rec.check_out_time != effective_co:
                    rec.check_out_time = effective_co
                    update_fields.append('check_out_time')

                if update_fields:
                    rec.updated_at = timezone.now()
                    rec.save(update_fields=update_fields + ['updated_at'])
        except Exception as e:
            logger.error(f"❌ Failed to normalize biometric check-in/out on {sync_date}: {str(e)}", exc_info=True)
        
        # Update device last sync time
        device, device_created = BiometricDevice.objects.get_or_create(
            ip_address=device_ip,
            defaults={
                'device_id': f'DEVICE_{device_ip.replace(".", "_")}',
                'device_name': f'Biometric Device {device_ip}',
                'location': 'Office',
                'is_active': True
            }
        )
        device.last_sync = timezone.now()
        device.save()
        
        logger.info(f"✅ Sync complete: {synced_count}/{len(filtered_logs)} records processed")
        logger.info(f"✅ Created {len(attendance_records_created)} new attendance records")
        
        return Response({
            'success': True,
            'synced_count': synced_count,
            'total_logs': len(filtered_logs),
            'sync_date': sync_date.isoformat(),
            'device_ip': device_ip,
            'attendance_records_created': len(attendance_records_created),
            'debug_info': {
                'total_logs_on_device': len(logs),
                'logs_for_date': len(filtered_logs),
                'successfully_synced': synced_count,
                'users_in_device': len(user_names)
            }
        }, status=status.HTTP_200_OK)
        
    except (socket.timeout, socket.error, Exception) as e:
        error_msg = str(e)
        logger.error(f"❌ Biometric sync failure for {device_ip}: {error_msg}")
        
        # Ensure connection is closed if it was established
        if 'conn' in locals() and conn:
            try:
                conn.disconnect()
            except:
                pass
        
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return Response({
                'error': f'Connection to biometric device {device_ip} timed out. This often happens if the device is busy or has a large number of logs to fetch.',
                'code': 'TIMEOUT'
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
            
        return Response({
            'error': f'Failed to connect to biometric device: {error_msg}',
            'code': 'CONNECTION_ERROR'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_biometric_logs(request):
    """Fetch raw biometric logs without storing them"""
    if not BIOMETRIC_AVAILABLE:
        return Response({
            'error': 'Biometric library not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    device_ip = request.data.get('device_ip')
    fetch_date_str = request.data.get('fetch_date')
    
    if not device_ip:
        return Response({'error': 'device_ip is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Parse fetch date or use today
    if fetch_date_str:
        try:
            fetch_date = datetime.strptime(fetch_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        fetch_date = date.today()
    
    try:
        zk = ZK(device_ip, port=4370, timeout=5)
        conn = zk.connect()
        conn.disable_device()
        
        logs = conn.get_attendance()
        filtered_logs = [log for log in logs if log.timestamp.date() == fetch_date]
        logger.debug("Fetched biometric logs total=%s filtered=%s date=%s", len(logs), len(filtered_logs), fetch_date)
        conn.enable_device()
        conn.disconnect()
        
        # Format logs for response
        formatted_logs = []
        for log in filtered_logs:
            employee = Employee.objects.filter(employee_id=log.user_id).first()
            formatted_logs.append({
                'biometric_user_id': log.user_id,
                'employee_name': employee.user.get_full_name() if employee else 'Unknown',
                'employee_id': employee.employee_id if employee else None,
                'timestamp': log.timestamp.isoformat(),
                'date': log.timestamp.date().isoformat(),
                'time': log.timestamp.time().isoformat(),
                'employee_found': employee is not None
            })
        
        return Response({
            'success': True,
            'total_logs': len(formatted_logs),
            'fetch_date': fetch_date.isoformat(),
            'logs': formatted_logs
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error("Failed to fetch biometric logs", exc_info=True)
        return Response({
            'error': 'Failed to fetch logs'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Helper function to get manager's team employees
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
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        logger.debug("AttendanceRecordListView user_id=%s", getattr(user, 'id', None))
        
        queryset = AttendanceRecord.objects.all()
        
        # Get user role and permission level
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        include_peers = self.request.query_params.get('include_peers') == 'true'
        
        # Check Django permission first
        if not user.has_perm('attendance.view_attendancerecord'):
            # Fallback to role-based scoping
            if permission_level >= PERMISSION_LEVELS['EXECUTIVE']:
                # C-Level can see all records
                pass
            elif permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
                # VP/Director/HR can see all records
                pass
            elif permission_level >= PERMISSION_LEVELS['LEAD'] or has_management_access(user_role):
                # Managers and Leads see their team + self
                allowed_employee_ids = get_manager_team_employees(user)
                queryset = queryset.filter(employee__id__in=allowed_employee_ids)
                logger.debug("AttendanceRecordListView scoped to manager/team user_id=%s", getattr(user, 'id', None))
            else:
                # Regular employees
                try:
                    employee = Employee.objects.get(user=user)
                    if include_peers:
                        # Find peers (employees with the same manager)
                        peer_ids = []
                        if employee.manager:
                            peers = Employee.objects.filter(
                                manager=employee.manager,
                                status='ACTIVE'
                            ).values_list('id', flat=True)
                            peer_ids = list(peers)
                        
                        allowed_ids = [employee.id] + peer_ids
                        queryset = queryset.filter(employee_id__in=allowed_ids)
                        logger.debug("AttendanceRecordListView scoped to peers employee_id=%s", employee.id)
                    else:
                        # Only own records
                        queryset = queryset.filter(employee=employee)
                        logger.debug("AttendanceRecordListView scoped to self employee_id=%s", employee.id)
                except Employee.DoesNotExist:
                    queryset = AttendanceRecord.objects.none()
        
        # Filter by employee_id if provided (for dashboard/personal status)
        employee_id_param = self.request.query_params.get('employee_id')
        if employee_id_param:
            queryset = queryset.filter(employee__employee_id=employee_id_param)
            logger.debug("AttendanceRecordListView filtered by employee_id param")

        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        # De-duplicate results (important when biometric/manual sync creates multiple rows)
        # Keep the latest row per (employee, date) for employee-linked records
        # and per (biometric_user_id, date) for biometric-only records.
        try:
            base_ids = queryset.values('pk')

            employee_latest_ids = AttendanceRecord.objects.filter(
                pk__in=base_ids,
                employee__isnull=False,
            ).values('employee_id', 'date').annotate(
                latest_id=Max('id')
            ).values('latest_id')

            biometric_latest_ids = AttendanceRecord.objects.filter(
                pk__in=base_ids,
                employee__isnull=True,
            ).exclude(
                biometric_user_id__isnull=True
            ).values('biometric_user_id', 'date').annotate(
                latest_id=Max('id')
            ).values('latest_id')

            queryset = queryset.filter(
                Q(id__in=Subquery(employee_latest_ids)) |
                Q(id__in=Subquery(biometric_latest_ids)) |
                Q(employee__isnull=True, biometric_user_id__isnull=True)
            )
        except Exception:
            # If de-dupe fails for any reason, fall back to original queryset.
            pass
        
        return queryset.order_by('-date')
    
    def list(self, request, *args, **kwargs):
        """Override to include pending approvals summary"""
        response = super().list(request, *args, **kwargs)
        
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Calculate pending approvals based on role
        if user.has_perm('attendance.view_attendancerecord') or permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']:
            pending_count = AttendanceRecord.objects.filter(is_pending_approval=True).count()
        elif has_management_access(user_role):
            allowed_employee_ids = get_manager_team_employees(user)
            pending_count = AttendanceRecord.objects.filter(
                is_pending_approval=True,
                employee__id__in=allowed_employee_ids
            ).count()
        else:
            pending_count = 0
        
        # Add pending approvals data for appropriate roles
        if permission_level >= PERMISSION_LEVELS['MANAGER'] or can_manage_hr(user_role):
            results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
            response.data = {
                'results': results,
                'pending_approvals_count': pending_count,
                'has_pending_approvals': pending_count > 0,
                'user_role': user_role
            }
        
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_attendance(request):
    """Create attendance record or submit edit request"""
    try:
        employee = Employee.objects.get(user=request.user)
        serializer = AttendanceCreateSerializer(data=request.data)
        update_serializer = AttendanceUpdateSerializer(data=request.data)
        
        if serializer.is_valid() or update_serializer.is_valid():
            validated = serializer.validated_data if serializer.is_valid() else update_serializer.validated_data
            entry_date = validated.get('date') or timezone.now().date()
            today = timezone.now().date()
            is_past_date = entry_date < today
            
            # Check if record already exists for this date
            existing_record = AttendanceRecord.objects.filter(
                employee=employee,
                date=entry_date
            ).first()
            
            new_check_in = validated.get('check_in_time')
            new_check_out = validated.get('check_out_time')
            new_status = validated.get('status')
            new_notes = validated.get('notes', '')
            new_ci_lat = validated.get('check_in_lat')
            new_ci_lng = validated.get('check_in_lng')
            new_co_lat = validated.get('check_out_lat')
            new_co_lng = validated.get('check_out_lng')
            
            user_profile = getattr(request.user, 'profile', None)
            user_role = getattr(user_profile, 'role', None) if user_profile else None
            
            # Check if user can bypass approval (HR or high-level management)
            can_bypass_approval = (
                can_manage_hr(user_role) or 
                get_permission_level(user_role) >= PERMISSION_LEVELS['SENIOR_LEADER']
            )

            if existing_record:
                # Allow direct checkout update ONLY if it's for TODAY
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

                # HR or Senior Leaders can directly update without approval
                if can_bypass_approval:
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
                logger.info("Processing attendance edit request for user_id=%s date=%s", request.user.id, existing_record.date)
                existing_record.original_check_in_time = existing_record.check_in_time
                existing_record.original_check_out_time = existing_record.check_out_time
                existing_record.original_status = existing_record.status
                existing_record.original_notes = existing_record.notes
                
                # Update with NEW requested values
                existing_record.check_in_time = new_check_in
                existing_record.check_out_time = new_check_out
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
                
                existing_record.save()
                logger.info("Attendance edit request saved record_id=%s pending=%s", existing_record.id, existing_record.is_pending_approval)
                
                return Response({
                    'message': 'Edit request submitted! HR and managers have been notified for approval.',
                    'requires_approval': True,
                    'is_pending_approval': True,
                    'record_id': existing_record.id
                }, status=status.HTTP_200_OK)
            else:
                # New record
                if is_past_date and not can_bypass_approval:
                    # New record for past date requires approval
                    attendance_record = AttendanceRecord.objects.create(
                        employee=employee,
                        is_pending_approval=True,
                        edit_reason=request.data.get('edit_reason', 'Forgot to mark attendance'),
                        **serializer.validated_data
                    )
                    
                    attendance_record._requested_data = serializer.validated_data
                    attendance_record.save()
                    
                    return Response({
                        'message': 'Attendance request for past date submitted! HR and managers have been notified for approval.',
                        'requires_approval': True,
                        'is_pending_approval': True,
                        'record_id': attendance_record.id
                    }, status=status.HTTP_200_OK)
                else:
                    # New record for today or created by authorized user
                    attendance_record = AttendanceRecord.objects.create(
                        employee=employee,
                        **serializer.validated_data
                    )
                    logger.info("New attendance record created record_id=%s user_id=%s", attendance_record.id, request.user.id)
                    return Response(
                        AttendanceRecordSerializer(attendance_record).data,
                        status=status.HTTP_201_CREATED
                    )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manual_attendance user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_edits(request):
    """Get records with pending approval flag"""
    user = request.user
    user_profile = getattr(user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    permission_level = get_permission_level(user_role) if user_role else 0
    
    # Determine access level
    if user.has_perm('attendance.view_attendancerecord') or permission_level >= PERMISSION_LEVELS['SENIOR_LEADER']:
        pending_records = AttendanceRecord.objects.filter(is_pending_approval=True)
    elif has_management_access(user_role):
        allowed_employee_ids = get_manager_team_employees(user)
        pending_records = AttendanceRecord.objects.filter(
            is_pending_approval=True,
            employee_id__in=allowed_employee_ids
        )
    else:
        # Regular employees see only their own pending records
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
    """Approve or reject attendance edit - HR/Manager/Senior Leaders"""
    logger.info("Approve edit called record_id=%s user_id=%s", record_id, getattr(request.user, 'id', None))
    
    user_profile = getattr(request.user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    permission_level = get_permission_level(user_role) if user_role else 0
    
    # Check if user has appropriate permissions
    has_permission = (
        request.user.has_perm('attendance.change_attendancerecord') or
        permission_level >= PERMISSION_LEVELS['MANAGER'] or
        can_manage_hr(user_role)
    )
    
    if not has_permission:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        record = AttendanceRecord.objects.get(id=record_id, is_pending_approval=True)
        logger.debug("Approve edit found pending record_id=%s", record_id)
        
        # For managers (not senior leaders/HR), check if they can access this record
        if permission_level == PERMISSION_LEVELS['MANAGER'] and not can_manage_hr(user_role):
            allowed_employee_ids = get_manager_team_employees(request.user)
            if record.employee.id not in allowed_employee_ids:
                return Response(
                    {'error': 'Permission denied - not your team member'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Try to get approver Employee record
        try:
            approver = Employee.objects.get(user=request.user)
            logger.debug("Approve edit approver_employee_id=%s", approver.id)
        except Employee.DoesNotExist:
            logger.warning("Approve edit: no Employee record for user_id=%s", getattr(request.user, 'id', None))
            approver = None
        
        action = request.data.get('action')  # 'approve' or 'reject'
        logger.debug("Approve edit action=%s record_id=%s", action, record_id)
        
        if action == 'approve':
            new_data = request.data.get('new_data', {})
            logger.debug("Approve edit new_data keys=%s", list(new_data.keys()) if isinstance(new_data, dict) else None)
            
            # Apply changes provided by approver
            if new_data:
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
            record.approved_by = approver
            record.approval_date = timezone.now()
            record.save()
            
            # Send approval email
            if record.employee.user.email:
                send_approval_result_email(
                    employee_email=record.employee.user.email,
                    employee_name=record.employee.user.get_full_name(),
                    date=str(record.date),
                    approved=True,
                    approver_name=approver.user.get_full_name() if approver else 'Manager'
                )

            logger.info("Attendance edit approved record_id=%s", record_id)
            return Response({'message': 'Edit approved and applied!'}, status=status.HTTP_200_OK)
            
        elif action == 'reject':
            record.is_pending_approval = False
            record.approved_by = approver
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
            logger.info("Attendance edit rejected record_id=%s", record_id)
            return Response({'message': 'Edit rejected! Original data preserved.'}, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
    except AttendanceRecord.DoesNotExist:
        logger.info("Approve edit record not found or not pending record_id=%s", record_id)
        return Response(
            {'error': 'Record not found or not pending approval'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error("Error in approve_edit record_id=%s user_id=%s", record_id, getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsEmployee])
def ping_location(request):
    """Record an hourly location ping for the current user"""
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
@permission_classes([IsAuthenticated])
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
                    is_pending_approval=False,
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
        return Response(
            {'error': 'Device not found or inactive'}, 
            status=status.HTTP_404_NOT_FOUND
        )


class BiometricDeviceListView(generics.ListCreateAPIView):
    queryset = BiometricDevice.objects.all()
    serializer_class = BiometricDeviceSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class BiometricDeviceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update or delete a biometric device"""
    queryset = BiometricDevice.objects.all()
    serializer_class = BiometricDeviceSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


# ===========================
# WORK FROM HOME
# ===========================

@api_view(['POST'])
@permission_classes([IsEmployee])
def apply_work_from_home(request):
    """Apply for work from home"""
    try:
        employee = Employee.objects.get(user=request.user)
        serializer = WorkFromHomeApplySerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.info("WFH serializer invalid user_id=%s", getattr(request.user, 'id', None))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if already applied for this date range
        logger.debug("Checking existing WFH request employee_id=%s", employee.id)
        existing_request = WorkFromHomeRequest.objects.filter(
            employee=employee,
            start_date__lte=serializer.validated_data['end_date'],
            end_date__gte=serializer.validated_data['start_date']
        ).first()
        
        if existing_request:
            msg = f"Already applied for WFH during this period ({existing_request.start_date} to {existing_request.end_date}). Status: {existing_request.status}"
            logger.info("Duplicate WFH request employee_id=%s", employee.id)
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)
            
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
            
            hr_users = User.objects.filter(profile__role__in=['HR_MANAGER', 'HR_EXECUTIVE', 'ADMIN'], is_active=True)
            recipients.extend(list(hr_users))
            
            # Deduplicate
            recipients = list(set(recipients))
            
            for recipient in recipients:
                NotificationService.create_notification(
                    recipient=recipient,
                    notification_type='WFH_REQUEST',
                    title=f"New WFH Request: {employee.user.get_full_name()}",
                    message=f"{employee.user.get_full_name()}" + (f" has requested WFH from {wfh_request.start_date} to {wfh_request.end_date}." if wfh_request.start_date != wfh_request.end_date else f" has requested WFH for {wfh_request.start_date}.") + f" Reason: {wfh_request.reason[:50]}...",
                    sender=request.user,
                    action_url='/attendance/wfh-requests',
                    action_text='Review Request'
                )
        except Exception as e:
            logger.warning("Failed to send WFH push notification", exc_info=True)
        
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
            
            if wfh_request:
                return Response({
                    'has_wfh_request': True,
                    'status': wfh_request.status,
                    'can_work_from_home': wfh_request.status == 'APPROVED',
                    'request': WorkFromHomeRequestSerializer(wfh_request).data,
                    'is_hr_admin': False
                })
            else:
                return Response({
                    'has_wfh_request': False,
                    'can_work_from_home': False,
                    'request': None,
                    'is_hr_admin': False
                })
        except WorkFromHomeRequest.DoesNotExist:
            # This should not happen with filter().first() but kept for safety
            return Response({
                'has_wfh_request': False,
                'can_work_from_home': False,
                'request': None,
                'is_hr_admin': False
            })
    
    except Exception as e:
        logger.error("Error in check_wfh_status user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({
            'has_wfh_request': False,
            'can_work_from_home': False,
            'request': None,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsEmployee])
def get_wfh_requests(request):
    """Get WFH requests based on user role and permission level"""
    try:
        user = request.user
        user_profile = getattr(user, 'profile', None)
        user_role = getattr(user_profile, 'role', None) if user_profile else None
        permission_level = get_permission_level(user_role) if user_role else 0
        
        # Determine access level
        if permission_level >= PERMISSION_LEVELS['SENIOR_LEADER'] or can_manage_hr(user_role):
            # C-Level, VP, Directors, HR see all requests
            requests = WorkFromHomeRequest.objects.all().select_related(
                'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
            ).order_by('-applied_at')
            logger.debug("WFH requests: fetching all")
            
        elif has_management_access(user_role):
            # Managers see team requests + their own
            allowed_employee_ids = get_manager_team_employees(user)
            requests = WorkFromHomeRequest.objects.filter(
                employee_id__in=allowed_employee_ids
            ).select_related(
                'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
            ).order_by('-applied_at')
            logger.debug("WFH requests: fetching team")
            
        else:
            # Regular employees see only their own
            try:
                employee = Employee.objects.get(user=user)
                requests = WorkFromHomeRequest.objects.filter(
                    employee=employee
                ).select_related(
                    'employee', 'employee__user', 'employee__department', 'approved_by', 'approved_by__user'
                ).order_by('-applied_at')
                logger.debug("WFH requests: fetching own employee_id=%s", employee.id)
            except Employee.DoesNotExist:
                requests = WorkFromHomeRequest.objects.none()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            requests = requests.filter(status=status_filter.upper())
            logger.debug("WFH requests filtered by status")
        
        # Serialize the data
        serializer = WorkFromHomeRequestSerializer(requests, many=True)
        
        return Response({
            'results': serializer.data,
            'count': requests.count(),
            'user_role': user_role,
            'permission_level': permission_level,
        })
    
    except Exception as e:
        logger.error("Error in get_wfh_requests user_id=%s", getattr(request.user, 'id', None), exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsEmployee])
def approve_wfh_request(request, request_id):
    """Approve or reject WFH request - HR, Managers, and Senior Leaders"""
    user = request.user
    user_profile = getattr(user, 'profile', None)
    user_role = getattr(user_profile, 'role', None) if user_profile else None
    permission_level = get_permission_level(user_role) if user_role else 0
    
    # Check if user has appropriate permissions
    has_permission = (
        permission_level >= PERMISSION_LEVELS['MANAGER'] or 
        can_manage_hr(user_role)
    )
    
    if not has_permission:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        wfh_request = WorkFromHomeRequest.objects.get(id=request_id, status='PENDING')
        
        # For managers (not senior leaders/HR), check if they can access this request
        if permission_level == PERMISSION_LEVELS['MANAGER'] and not can_manage_hr(user_role):
            allowed_employee_ids = get_manager_team_employees(user)
            if wfh_request.employee.id not in allowed_employee_ids:
                return Response(
                    {'error': 'Permission denied - not your team member'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
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
                    message=f"Your WFH request for {wfh_request.start_date}" + (f" to {wfh_request.end_date}" if wfh_request.start_date != wfh_request.end_date else "") + " has been approved.",
                    sender=request.user,
                    action_url='/attendance',
                    action_text='View Attendance'
                )
            except Exception as e:
                logger.warning("Failed to send WFH approval push", exc_info=True)
            
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
                    message=f"Your WFH request for {wfh_request.start_date}" + (f" to {wfh_request.end_date}" if wfh_request.start_date != wfh_request.end_date else "") + f" has been rejected. Reason: {wfh_request.rejection_reason}",
                    sender=request.user,
                    action_url='/attendance',
                    action_text='View Attendance'
                )
            except Exception as e:
                logger.warning("Failed to send WFH rejection push", exc_info=True)
            
            return Response({'message': 'Work from home request rejected!'})
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    except WorkFromHomeRequest.DoesNotExist:
        return Response(
            {'error': 'Request not found or already processed'}, 
            status=status.HTTP_404_NOT_FOUND
        )


# Email functions
from django.core.mail import EmailMessage

def send_wfh_request_email(wfh_request):
    """Send WFH request email to HR and managers"""
    try:
        hr_users = User.objects.filter(
            profile__role__in=['HR_MANAGER', 'HR_EXECUTIVE', 'ADMIN'], 
            is_active=True
        )
        recipients = [user.email for user in hr_users if user.email]
        
        # Also notify the employee's direct manager
        if wfh_request.employee.manager and wfh_request.employee.manager.user.email:
            if wfh_request.employee.manager.user.email not in recipients:
                recipients.append(wfh_request.employee.manager.user.email)
        
        if not recipients:
            logger.warning("No HR Manager or Manager email found for WFH request_id=%s", wfh_request.id)
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
                    <p><strong>Requested Period:</strong> {wfh_request.start_date.strftime('%B %d, %Y')}{f" to {wfh_request.end_date.strftime('%B %d, %Y')}" if wfh_request.start_date != wfh_request.end_date else ""}</p>
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
        logger.info("WFH request email sent request_id=%s", wfh_request.id)
        
    except Exception as e:
        logger.error("Failed to send WFH request email request_id=%s", wfh_request.id, exc_info=True)


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
                    
                    <p>Your work from home request for <strong>{wfh_request.start_date.strftime('%B %d, %Y')}{f" to {wfh_request.end_date.strftime('%B %d, %Y')}" if wfh_request.start_date != wfh_request.end_date else ""}</strong> has been <strong>{'approved' if approved else 'rejected'}</strong>.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Request Details:</strong></p>
                    <p><strong>Period:</strong> {wfh_request.start_date.strftime('%B %d, %Y')}{f" to {wfh_request.end_date.strftime('%B %d, %Y')}" if wfh_request.start_date != wfh_request.end_date else ""}</p>
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
        logger.info("WFH %s email sent request_id=%s", 'approval' if approved else 'rejection', wfh_request.id)
        
    except Exception as e:
        logger.error("Failed to send WFH %s email request_id=%s", 'approval' if approved else 'rejection', wfh_request.id, exc_info=True)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wfh_today(request):
    """Get employees who have approved WFH today"""
    today = timezone.now().date()
    
    # Filter for approved WFH requests that cover today
    wfh_requests = WorkFromHomeRequest.objects.filter(
        status='APPROVED',
        start_date__lte=today,
        end_date__gte=today
    ).select_related('employee', 'employee__user', 'employee__department')
    
    results = []
    for wfh in wfh_requests:
        emp = wfh.employee
        user = emp.user
        results.append({
            'employee_id': emp.id,
            'employee_name': f"{user.first_name} {user.last_name}",
            'department': emp.department.name if emp.department else "N/A",
            'start_date': wfh.start_date,
            'end_date': wfh.end_date,
            'initials': f"{user.first_name[0]}{user.last_name[0]}" if user.first_name and user.last_name else ""
        })
    
    return Response(results)
