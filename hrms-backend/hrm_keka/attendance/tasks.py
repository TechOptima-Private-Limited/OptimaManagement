import logging
from datetime import date
from django.utils import timezone
from .models import BiometricDevice, AttendanceRecord, BiometricAttendanceLog
from employees.models import Employee
from django.db.models import Count

logger = logging.getLogger(__name__)

try:
    from zk import ZK
    BIOMETRIC_AVAILABLE = True
except ImportError:
    BIOMETRIC_AVAILABLE = False
    logger.warning("ZK library not available. Biometric features disabled.")

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
            minutes_since_sync = time_since_sync.total_seconds() / 60
            if minutes_since_sync < device.sync_interval_minutes:
                logger.info(f"⏭ Skipping {device_ip} - last sync {minutes_since_sync:.1f} min ago, interval is {device.sync_interval_minutes} min")
                continue

        logger.info(f"🔄 Auto Sync starting for device {device_ip}")

        try:
            # Match the robust logic in views.py
            zk = ZK(device_ip, port=4370, timeout=15, force_udp=False)
            conn = zk.connect()
            # Removed conn.disable_device() for reliability
            
            # Get names mapping
            try:
                users = conn.get_users()
                user_names = {str(user.user_id): user.name for user in users}
            except Exception as e:
                logger.error(f"Auto Sync: Failed to fetch users from {device_ip}: {str(e)}")
                user_names = {}
            
            # Fetch logs
            try:
                logs = conn.get_attendance()
            except Exception as e:
                conn.disconnect()
                raise Exception(f"Failed to fetch attendance logs: {str(e)}")
            
            # Filter logs for today
            filtered_logs = [log for log in logs if log_date_ist(log) == sync_date]

            # Disconnect early to free device
            conn.disconnect()
            conn = None

            device_synced_count = 0
            device_records_created = 0

            for log in filtered_logs:
                try:
                    biometric_user_id = str(log.user_id)
                    biometric_user_name = user_names.get(biometric_user_id, '')

                    # Date/Time conversion logic
                    raw_ts = log.timestamp
                    aware_ts = tz_ist.localize(raw_ts) if raw_ts.tzinfo is None else raw_ts.astimezone(tz_ist)

                    attendance_date = aware_ts.date()
                    attendance_time = aware_ts.time().replace(tzinfo=None)

                    employee = Employee.objects.filter(employee_id=biometric_user_id).first()

                    # Find or create AttendanceRecord, handling duplicates
                    if employee:
                        record = AttendanceRecord.objects.filter(employee=employee, date=attendance_date).first()
                    else:
                        record = AttendanceRecord.objects.filter(biometric_user_id=biometric_user_id, date=attendance_date, employee__isnull=True).first()

                    if not record:
                        record = AttendanceRecord.objects.create(
                            employee=employee,
                            date=attendance_date,
                            biometric_user_id=biometric_user_id if not employee else None,
                            biometric_user_name=biometric_user_name,
                            check_in_time=attendance_time,
                            status='PRESENT',
                            attendance_type='BIOMETRIC',
                            biometric_device_id=device_ip
                        )
                    else:
                        # Update existing with robust check-in/out logic
                        update_needed = False
                        if not record.check_in_time or attendance_time < record.check_in_time:
                            record.check_in_time = attendance_time
                            update_needed = True
                        
                        if attendance_time > record.check_in_time:
                            if not record.check_out_time or attendance_time > record.check_out_time:
                                record.check_out_time = attendance_time
                                update_needed = True

                        if employee and not record.employee:
                            record.employee = employee
                            update_needed = True

                        if update_needed:
                            record.attendance_type = 'BIOMETRIC'
                            record.biometric_device_id = device_ip
                            record.biometric_user_id = biometric_user_id
                            record.biometric_user_name = biometric_user_name
                            record.save()

                    # Store raw log, handling duplicates
                    bio_log = BiometricAttendanceLog.objects.filter(biometric_user_id=biometric_user_id, timestamp=aware_ts).first()
                    if not bio_log:
                        bio_log = BiometricAttendanceLog.objects.create(
                            biometric_user_id=biometric_user_id,
                            timestamp=aware_ts,
                            biometric_user_name=biometric_user_name,
                            device_id=device_ip,
                            date=attendance_date,
                            time=attendance_time,
                            employee=employee,
                            attendance_record=record
                        )
                    else:
                        # Update existing log if needed
                        if record and not bio_log.attendance_record:
                            bio_log.attendance_record = record
                            bio_log.save()
                        if employee and not bio_log.employee:
                            bio_log.employee = employee
                            bio_log.save()

                    device_synced_count += 1
                
                except Exception as eval_err:
                    logger.error(f"Error processing log in bg task for user {log.user_id}: {str(eval_err)}")

            # Normalize check-in/out after processing all logs for this device
            try:
                from django.db.models import Min, Max
                user_logs = BiometricAttendanceLog.objects.filter(
                    device_id=device_ip, 
                    date=sync_date
                ).values('biometric_user_id').annotate(
                    first_punch=Min('time'),
                    last_punch=Max('time'),
                    punch_count=Count('id')
                )

                for ul in user_logs:
                    uid = ul['biometric_user_id']
                    employee = Employee.objects.filter(employee_id=uid).first()
                    
                    if employee:
                        rec = AttendanceRecord.objects.filter(employee=employee, date=sync_date).first()
                    else:
                        rec = AttendanceRecord.objects.filter(biometric_user_id=uid, date=sync_date, employee__isnull=True).first()
                    
                    if rec:
                        update_fields = []
                        if rec.check_in_time != ul['first_punch']:
                            rec.check_in_time = ul['first_punch']
                            update_fields.append('check_in_time')
                        
                        # Only set check-out if there are at least 2 distinct punches
                        co = ul['last_punch'] if ul['punch_count'] >= 2 and ul['last_punch'] > ul['first_punch'] else None
                        if rec.check_out_time != co:
                            rec.check_out_time = co
                            update_fields.append('check_out_time')
                        
                        if update_fields:
                            rec.updated_at = timezone.now()
                            rec.save(update_fields=update_fields + ['updated_at'])
            except Exception as norm_err:
                logger.error(f"❌ Auto Sync: Failed to normalize records for {device_ip}: {str(norm_err)}")

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
