import logging
import time
import pytz
from datetime import date
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Min, Max, Q
from django.db import transaction

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

        devices = BiometricDevice.objects.filter(
            is_active=True,
            auto_sync_enabled=True
        )

        logger.info(f"Auto Sync started. Devices: {devices.count()}")

        if not devices.exists():
            return "No devices"

        # 🔹 Cache employees
        employees = {}
        for e in Employee.objects.select_related('user').all():
            keys = []

            if e.employee_id:
                keys.append(str(e.employee_id))

            if getattr(e, 'user', None) and getattr(e.user, 'username', None):
                keys.append(str(e.user.username))

            for k in keys:
                if k:
                    employees[k.strip().upper()] = e

        # 🔹 Loop devices
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

                # 🔹 Retry connection
                for i in range(3):
                    try:
                        conn = zk.connect()
                        break
                    except Exception as e:
                        logger.error(f"Connect failed {device_ip} attempt {i+1}: {e}")
                        time.sleep(2)

                if not conn:
                    raise Exception("Connection failed")

                users = {}
                try:
                    for u in conn.get_users():
                        users[str(u.user_id)] = u.name
                except Exception:
                    pass

                logs = conn.get_attendance()
                conn.disconnect()

                bulk_logs = []  # ✅ FIXED

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

                    employee = employees.get(uid.strip().upper())

                    bulk_logs.append(
                        BiometricAttendanceLog(
                            biometric_user_id=uid,
                            biometric_user_name=name,
                            timestamp=ts,
                            device_id=device_ip,
                            date=ts.date(),
                            time=ts.time().replace(tzinfo=None),
                            employee=employee
                        )
                    )

                # 🔹 Save logs
                BiometricAttendanceLog.objects.bulk_create(
                    bulk_logs,
                    ignore_conflicts=True
                )

                total_logs += len(bulk_logs)

                # 🔹 Create attendance
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
                        employee = employees.get(uid.strip().upper())

                        checkin = s["first"]
                        checkout = s["last"] if s["count"] >= 2 else None

                        record = AttendanceRecord.objects.filter(
                            employee=employee,
                            date=sync_date
                        ).first()

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
                             # Keep earliest check-in across all synced devices.
                            if not record.check_in_time or (checkin and checkin < record.check_in_time):
                                record.check_in_time = checkin

                            # Keep latest check-out across all synced devices.
                            if checkout:
                                if not record.check_out_time or checkout > record.check_out_time:
                                    record.check_out_time = checkout
                            record.save()

                        total_records += 1

                device.last_sync = timezone.now()
                device.save()

                total_devices += 1

                logger.info(f"Sync success {device_ip}")

            except Exception as e:
                logger.error(f"Device {device_ip} failed: {e}")

                if conn:
                    try:
                        conn.disconnect()
                    except Exception:
                        pass

        # ✅ FINAL LOG (IMPORTANT)
        logger.info(
            f"Sync completed: Synced {total_devices} devices | "
            f"{total_logs} logs processed | {total_records} attendance records"
        )

        return (
            f"Synced {total_devices} devices | "
            f"{total_logs} logs processed | "
            f"{total_records} attendance records"
        )

    finally:
        cache.delete(lock_key)