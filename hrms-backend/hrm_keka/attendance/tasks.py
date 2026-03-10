from celery import shared_task
from django.utils import timezone
from datetime import date
from .models import BiometricDevice, AttendanceRecord, BiometricAttendanceLog
from employees.models import Employee
import logging

logger = logging.getLogger(__name__)

try:
    from zk import ZK
    BIOMETRIC_AVAILABLE = True
except ImportError:
    BIOMETRIC_AVAILABLE = False
    logger.warning("ZK library not available. Biometric features disabled.")

@shared_task
def auto_sync_biometric_devices():
    """
    Periodic background task to sync all active biometric devices.
    Runs globally and creates attendance records.
    """
    if not BIOMETRIC_AVAILABLE:
        logger.error("Auto Sync Failed: ZK library not available.")
        return "ZK missing"

    active_devices = BiometricDevice.objects.filter(is_active=True, auto_sync_enabled=True)
    if not active_devices.exists():
        logger.info("Auto Sync: No active biometric devices found.")
        return "No active devices"

    sync_date = date.today()
    total_synced_devices = 0
    total_logs_processed = 0
    total_records_created = 0

    # Ensure timezone info is accurate for IST processing (same logic as views.py)
    import pytz
    tz_ist = pytz.timezone('Asia/Kolkata')

    def log_date_ist(log):
        ts = log.timestamp
        if ts.tzinfo is None:
            ts = tz_ist.localize(ts)
        return ts.astimezone(tz_ist).date()

    for device in active_devices:
        device_ip = device.ip_address
        
        # Check if due for sync
        if device.last_sync:
            time_since_sync = timezone.now() - device.last_sync
            if time_since_sync.total_seconds() < (device.sync_interval_minutes * 60):
                logger.debug(f"⏭ Skipping {device_ip} - not due for sync yet")
                continue

        logger.info(f"🔄 Auto Sync starting for device {device_ip}")

        try:
            zk = ZK(device_ip, port=4370, timeout=10) # slightly longer timeout for bg task
            conn = zk.connect()
            conn.disable_device()

            # Get names mapping
            users = conn.get_users()
            user_names = {str(user.user_id): user.name for user in users}
            
            # Fetch logs
            logs = conn.get_attendance()
            
            # Filter logs for today
            filtered_logs = [log for log in logs if log_date_ist(log) == sync_date]

            conn.enable_device()
            conn.disconnect()

            device_synced_count = 0
            device_records_created = 0

            for log in filtered_logs:
                try:
                    biometric_user_id = str(log.user_id)
                    biometric_user_name = user_names.get(biometric_user_id, '')

                    # Date/Time conversion logic
                    raw_ts = log.timestamp
                    if raw_ts.tzinfo is None:
                        aware_ts = tz_ist.localize(raw_ts)
                    else:
                        aware_ts = raw_ts.astimezone(tz_ist)

                    attendance_date = aware_ts.date()
                    attendance_time = aware_ts.time().replace(tzinfo=None)

                    employee = Employee.objects.filter(employee_id=biometric_user_id).first()

                    # Find existing record
                    if employee:
                        record = AttendanceRecord.objects.filter(
                            employee=employee,
                            date=attendance_date
                        ).first()
                    else:
                        record = AttendanceRecord.objects.filter(
                            biometric_user_id=biometric_user_id,
                            date=attendance_date,
                            employee__isnull=True
                        ).first()

                    if not record:
                        # Create new record
                        record = AttendanceRecord.objects.create(
                            employee=employee,
                            biometric_user_id=biometric_user_id,
                            biometric_user_name=biometric_user_name,
                            date=attendance_date,
                            check_in_time=attendance_time,
                            status='PRESENT',
                            attendance_type='BIOMETRIC',
                            biometric_device_id=device_ip
                        )
                        device_records_created += 1
                    else:
                        # Update existing
                        if not record.check_in_time:
                            record.check_in_time = attendance_time
                        elif not record.check_out_time and attendance_time > record.check_in_time:
                            record.check_out_time = attendance_time
                        elif attendance_time > record.check_in_time:
                            record.check_out_time = attendance_time

                        if employee and not record.employee:
                            record.employee = employee

                        record.attendance_type = 'BIOMETRIC'
                        record.biometric_device_id = device_ip
                        record.biometric_user_id = biometric_user_id
                        record.biometric_user_name = biometric_user_name
                        record.save()

                    # Store raw log
                    bio_log, bio_created = BiometricAttendanceLog.objects.get_or_create(
                        biometric_user_id=biometric_user_id,
                        timestamp=log.timestamp,
                        defaults={
                            'biometric_user_name': biometric_user_name,
                            'device_id': device_ip,
                            'date': attendance_date,
                            'time': attendance_time,
                            'employee': employee,
                            'attendance_record': record
                        }
                    )
                    if not bio_created:
                        if record and not bio_log.attendance_record:
                            bio_log.attendance_record = record
                            bio_log.save()
                        if employee and not bio_log.employee:
                            bio_log.employee = employee
                            bio_log.save()

                    device_synced_count += 1
                
                except Exception as eval_err:
                    logger.error(f"Error processing log in bg task for user {log.user_id}: {str(eval_err)}")

            # Update device last sync
            device.last_sync = timezone.now()
            device.save()
            
            logger.info(f"✅ Auto Sync successful for {device_ip}. Processed {device_synced_count} logs.")
            
            total_synced_devices += 1
            total_logs_processed += device_synced_count
            total_records_created += device_records_created

        except Exception as e:
            logger.error(f"❌ Auto Sync failed to connect to device {device_ip}: {str(e)}")
            # Continue to next device
            continue
            
    return f"Synced {total_synced_devices} devices, processed {total_logs_processed} logs, created {total_records_created} records"
