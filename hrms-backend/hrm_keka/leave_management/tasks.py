import logging
import time
import os
from datetime import datetime, date, timedelta
from decimal import Decimal

from django.utils import timezone
from django.core.cache import cache

from .models import LeaveType, LeaveBalance, LeaveLedger
from employees.models import Employee

logger = logging.getLogger(__name__)

def auto_reset_yearly_leaves():
    """
    Called periodically (e.g. hourly) to check if any leave types need reseting today.
    """
    today = timezone.localdate()
    # Cache key changes daily, so it will lock per day
    lock_key = f"leave_reset_{today.strftime('%Y_%m_%d')}"
    
    # Check if we already ran successfully today
    if cache.get(lock_key):
        return "Already ran today"
    
    types_reset = 0
    records_created_or_updated = 0
    
    # Find active leave types with a start_date
    leave_types = LeaveType.objects.filter(is_active=True).exclude(start_date__isnull=True)
    
    for lt in leave_types:
        if lt.start_date.month == today.month and lt.start_date.day == today.day:
            types_reset += 1
            employees = Employee.objects.filter(status='ACTIVE')
            current_year = today.year
            previous_year = current_year - 1
            
            for emp in employees:
                # Get last year's balance to determine carry forward
                prev_balance = LeaveBalance.objects.filter(
                    employee=emp, leave_type=lt, year=previous_year
                ).first()
                
                carried_forward = 0.0
                if prev_balance and lt.is_carry_forward:
                    remaining = float(prev_balance.remaining_days)
                    max_cf = float(lt.max_carry_forward_days)
                    carried_forward = min(max(remaining, 0.0), max_cf)
                
                # Create or update current year balance
                curr_balance, created = LeaveBalance.objects.get_or_create(
                    employee=emp,
                    leave_type=lt,
                    year=current_year,
                    defaults={
                        'total_days': float(lt.days_allowed_per_year),
                        'used_days': 0.0,
                        'carried_forward_days': carried_forward,
                        'remaining_days': float(lt.days_allowed_per_year) + carried_forward
                    }
                )
                
                if not created:
                    # Update carry forward if needed
                    # Only update if carried forward days differ to prevent overwriting used_days incorrectly
                    if float(curr_balance.carried_forward_days) != float(carried_forward):
                        curr_balance.carried_forward_days = carried_forward
                        curr_balance.save() # Note: The save method dynamically updates remaining_days
                        records_created_or_updated += 1
                else:
                    records_created_or_updated += 1

    # Mark as run for today
    cache.set(lock_key, True, timeout=86400) # 24 hours lock
    
    if types_reset > 0:
        logger.info(f"✅ Leave Reset: {types_reset} types reset, {records_created_or_updated} balance records created/updated.")
        return f"{types_reset} types reset, {records_created_or_updated} records created/updated"
    
    return "No resets needed today"


def ensure_el_monthly_accruals(employee=None, year=None):
    """
    Create missing monthly EL accrual ledger rows (annual quota / 12 per month) from
    policy/hire through the current month for the given calendar year.
    Idempotent: at most one ACCRUAL per employee per calendar month (matched by
    transaction_date year/month). Only materializes rows for year == today's year.
    """
    today = timezone.localdate()
    year = year or today.year
    if year != today.year:
        return 0

    el_type = LeaveType.objects.filter(code='EL', is_active=True).first()
    if not el_type:
        return 0

    annual = Decimal(str(el_type.days_allowed_per_year))
    monthly = (annual / Decimal('12')).quantize(Decimal('0.01'))

    qs = Employee.objects.filter(status='ACTIVE')
    if employee is not None:
        qs = qs.filter(pk=employee.pk)

    end_month = today.month
    created_total = 0

    policy_start_month = 1
    if el_type.start_date:
        sd = el_type.start_date
        if sd.year > year:
            return 0
        if sd.year == year:
            policy_start_month = sd.month

    for emp in qs.iterator():
        hire_month = 1
        if emp.hire_date:
            hd = emp.hire_date
            if hd > today:
                continue
            if hd.year > year:
                continue
            if hd.year == year:
                hire_month = hd.month

        start_month = max(policy_start_month, hire_month)
        if start_month > end_month:
            continue

        for month in range(start_month, end_month + 1):
            if LeaveLedger.objects.filter(
                employee=emp,
                leave_type=el_type,
                transaction_type='ACCRUAL',
                transaction_date__year=year,
                transaction_date__month=month,
            ).exists():
                continue

            txn_date = date(year, month, 1)
            months_valid = 24 if emp.is_client_employee else 15
            expiry_date = txn_date + timedelta(days=int(30.436875 * months_valid))

            LeaveLedger.objects.create(
                employee=emp,
                leave_type=el_type,
                transaction_type='ACCRUAL',
                transaction_date=txn_date,
                days=monthly,
                remaining_days=monthly,
                expiry_date=expiry_date,
                description=f"Monthly EL Accrual for {txn_date.strftime('%b %Y')}",
            )
            created_total += 1

    if created_total:
        logger.info(f"✅ EL accrual ensure: created {created_total} ledger row(s) for {year}.")
    return created_total


def auto_monthly_el_accrual():
    """Background hook: ensure EL accruals exist through the current month (idempotent)."""
    n = ensure_el_monthly_accruals()
    return f"ensure_el_monthly_accruals created {n} row(s)"

def auto_expire_el_ledgers():
    today = timezone.localdate()
    lock_key = f"el_expiry_{today.strftime('%Y_%m_%d')}"
    
    if cache.get(lock_key):
        return "Already ran today"
        
    expired_ledgers = LeaveLedger.objects.filter(
        transaction_type='ACCRUAL',
        remaining_days__gt=0,
        expiry_date__lt=today
    )
    
    count = 0
    for ledger in expired_ledgers:
        LeaveLedger.objects.create(
            employee=ledger.employee,
            leave_type=ledger.leave_type,
            transaction_type='EXPIRED',
            transaction_date=today,
            days=ledger.remaining_days,
            description=f"Expired from accrual on {ledger.transaction_date}"
        )
        ledger.remaining_days = Decimal('0.00')
        ledger.save(update_fields=['remaining_days'])
        count += 1
        
    cache.set(lock_key, True, timeout=86400)
    if count > 0:
        logger.info(f"✅ EL Daily Expiry: Expired {count} ledger entries.")
    return f"{count} entries expired"

def auto_encash_client_el():
    today = timezone.localdate()
    lock_key = f"el_encash_{today.strftime('%Y_%m_%d')}"
    
    if today.month != 3 or today.day != 31 or cache.get(lock_key):
        return "Not March 31 or already ran"
        
    el_type = LeaveType.objects.filter(code='EL').first()
    if not el_type:
        return "EL not configured"
        
    clients = Employee.objects.filter(status='ACTIVE', is_client_employee=True)
    count = 0
    for emp in clients:
        if emp.hire_date:
            years_since_hire = today.year - emp.hire_date.year
            if years_since_hire > 0 and years_since_hire % 2 == 0:
                from .models import LeaveLedger
                active_ledgers = LeaveLedger.objects.filter(
                    employee=emp,
                    leave_type=el_type,
                    transaction_type='ACCRUAL',
                    remaining_days__gt=0
                )
                from django.db.models import Sum
                total_to_encash = active_ledgers.aggregate(total=Sum('remaining_days'))['total'] or Decimal('0.00')
                
                if total_to_encash > 0:
                    LeaveLedger.objects.create(
                        employee=emp,
                        leave_type=el_type,
                        transaction_type='ENCASHMENT',
                        transaction_date=today,
                        days=total_to_encash,
                        description=f"Biennial Client EL Encashment"
                    )
                    active_ledgers.update(remaining_days=Decimal('0.00'))
                    count += 1

    cache.set(lock_key, True, timeout=86400 * 5)
    logger.info(f"✅ EL Client Encashment completed for {count} employees.")
    return f"{count} employees encashed"
