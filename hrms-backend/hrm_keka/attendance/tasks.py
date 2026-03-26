import logging
import pytz
from datetime import date
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Min, Max
 
from .models import BiometricDevice, AttendanceRecord, BiometricAttendanceLog
from employees.models import Employee
 
logger = logging.getLogger(__name__)
 
try:
    from zk import ZK
    BIOMETRIC_AVAILABLE = True
except ImportError:
    BIOMETRIC_AVAILABLE = False
    logger.warning("ZK library not available.")
 
 
def auto_sync_biometric_devices():
 
    if not BIOMETRIC_AVAILABLE:
        return "ZK library missing"
 
    lock_key = "biometric_sync_lock"
 
    if not cache.add(lock_key, True, timeout=300):
        logger.info("Sync already running")
        return "Sync in progress"

    tz_ist = pytz.timezone("Asia/Kolkata")
    sync_date = date.today()

    total_devices = 0
    total_logs = 0
    total_records = 0

    try:

        total_device_rows = BiometricDevice.objects.count()
        devices = BiometricDevice.objects.filter(
            is_active=True,
            auto_sync_enabled=True
        )

        logger.info(
            f"Auto Sync device rows: total={total_device_rows}, enabled={devices.count()}, "
            f"enabled_ips={list(devices.values_list('ip_address', flat=True))}"
        )

        if not devices.exists():
            return "No devices"

        # 🔹 Cache employees (VERY IMPORTANT FOR PERFORMANCE)
        # Devices may send user ids that match either Employee.employee_id or the linked User.username
        # (e.g. "TO-00087"). Build a lookup across both plus a few normalized variants.
        employees = {}
        for e in Employee.objects.select_related('user').all():
            keys = []
            if e.employee_id:
                keys.append(str(e.employee_id))
            if getattr(e, 'user', None) and getattr(e.user, 'username', None):
                keys.append(str(e.user.username))

            normalized_keys = set()
            for k in keys:
                k = k.strip()
                if not k:
                    continue
                normalized_keys.add(k)
                normalized_keys.add(k.upper())
                normalized_keys.add(k.replace(' ', ''))
                normalized_keys.add(k.upper().replace(' ', ''))
                normalized_keys.add(k.upper().replace('-', ''))
                normalized_keys.add(k.upper().replace('_', ''))
                normalized_keys.add(k.upper().replace('-', '_'))
                normalized_keys.add(k.upper().replace('_', '-'))

            for k in normalized_keys:
                if k and k not in employees:
                    employees[k] = e

        for device in devices:

            device_ip = device.ip_address
            conn = None

            try:

                logger.info(f"Sync starting {device_ip}")

                zk = ZK(
                    device_ip,
                    port=4370,
                    timeout=10,
                    force_udp=False,
                    ommit_ping=True,
                )

                zk.ommit_ping = True
                logger.info(
                    f"ZK init {device_ip}: ommit_ping={getattr(zk, 'ommit_ping', None)}, "
                    f"force_udp={getattr(zk, 'force_udp', None)}"
                )

                # 🔹 Connection retry
                last_conn_err = None
                for i in range(3):
                    try:
                        conn = zk.connect()
                        break
                    except Exception as conn_err:
                        last_conn_err = conn_err
                        logger.error(
                            f"ZK connect failed {device_ip} attempt {i + 1}/3: "
                            f"{type(conn_err).__name__}: {conn_err}"
                        )
                        time.sleep(2)

                if not conn:
                    raise last_conn_err or Exception("Device connection failed")

                users = {}
                try:
                    for u in conn.get_users():
                        users[str(u.user_id)] = u.name
                except Exception:
                    pass

                logs = conn.get_attendance()
 
                for log in logs:

                    ts = log.timestamp

                    if ts.tzinfo is None:
                        ts = tz_ist.localize(ts)
                    else:
                        ts = ts.astimezone(tz_ist)

                    if ts.date() != sync_date:
                        continue

                    uid = str(log.user_id)
                    name = users.get(uid, "")

                    employee = employees.get(uid) or employees.get(uid.strip()) or employees.get(uid.strip().upper())
                    if not employee:
                        uid_norm = uid.strip().upper()
                        uid_compact = uid_norm.replace(' ', '')
                        employee = (
                            employees.get(uid_compact)
                            or employees.get(uid_compact.replace('-', ''))
                            or employees.get(uid_compact.replace('_', ''))
                            or employees.get(uid_compact.replace('-', '_'))
                            or employees.get(uid_compact.replace('_', '-'))
                        )

                    attendance_date = ts.date()
                    attendance_time = ts.time().replace(tzinfo=None)

                    bulk_logs.append(
                        BiometricAttendanceLog(
                            biometric_user_id=uid,
                            biometric_user_name=name,
                            timestamp=ts,
                            device_id=device_ip,
                            date=attendance_date,
                            time=attendance_time,
                            employee=employee
                        )
                    )

                # 🔹 Bulk insert logs
                BiometricAttendanceLog.objects.bulk_create(
                    bulk_logs,
                    ignore_conflicts=True
                )

                total_logs += len(bulk_logs)

                # 🔹 Normalize attendance
                summaries = (
                    BiometricAttendanceLog.objects
                    .filter(device_id=device_ip, date=sync_date)
                    .values("biometric_user_id")
                    .annotate(
                        first=Min("time"),
                        last=Max("time"),
                        count=Count("id")
                    )
                )

                with transaction.atomic():

                    for s in summaries:

                        uid = s["biometric_user_id"]
                        employee = employees.get(uid) or employees.get(str(uid).strip()) or employees.get(str(uid).strip().upper())
                        if not employee:
                            uid_norm = str(uid).strip().upper()
                            uid_compact = uid_norm.replace(' ', '')
                            employee = (
                                employees.get(uid_compact)
                                or employees.get(uid_compact.replace('-', ''))
                                or employees.get(uid_compact.replace('_', ''))
                                or employees.get(uid_compact.replace('-', '_'))
                                or employees.get(uid_compact.replace('_', '-'))
                            )

                        checkin = s["first"]
                        checkout = s["last"] if s["count"] >= 2 else None

                        record = None

                        if employee:
                            record = (
                                AttendanceRecord.objects.filter(
                                    employee=employee,
                                    date=sync_date,
                                )
                                .order_by("-id")
                                .first()
                            )

                        if not record:
                            record = (
                                AttendanceRecord.objects.filter(
                                    date=sync_date,
                                )
                                .filter(
                                    Q(employee__isnull=True, biometric_user_id=uid)
                                    | Q(employee__employee_id=uid)
                                )
                                .order_by("-id")
                                .first()
                            )

                        if not record:
                            record = AttendanceRecord.objects.create(
                                employee=employee,
                                date=sync_date,
                                biometric_user_id=uid,
                                check_in_time=checkin,
                                check_out_time=checkout,
                                attendance_type="BIOMETRIC",
                                status="PRESENT",
                                biometric_device_id=device_ip,
                            )
                        else:
                            record.check_in_time = checkin
                            record.check_out_time = checkout
                            if employee and not record.employee:
                                record.employee = employee
                            record.attendance_type = "BIOMETRIC"
                            record.status = "PRESENT"
                            record.biometric_device_id = device_ip
                            record.biometric_user_id = uid
                            record.save()

                        total_records += 1

                device.last_sync = timezone.now()
                device.save()

                total_devices += 1

                logger.info(f"Sync success {device_ip}")

            except Exception as e:
                logger.error(f"Device {device_ip} failed: {e}")
 
            finally:
                if conn:
                    try:
                        conn.disconnect()
                    except Exception:
                        pass
 
        return (
            f"Synced {total_synced_devices} devices | "
            f"{total_logs_processed} logs processed | "
            f"{total_records_created} attendance records"
        )
 
    finally:
        cache.delete(lock_key)