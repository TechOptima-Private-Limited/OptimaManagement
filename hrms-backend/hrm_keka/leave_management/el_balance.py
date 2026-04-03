"""
Earned Leave (code EL) uses LeaveLedger — not LeaveBalance — for accrual / deduction / expiry.
This module builds API payloads that match LeaveBalanceSerializer shape so the UI shows ledger truth.
"""
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from .models import LeaveLedger, LeaveType
from .serializers import LeaveTypeSerializer
from employees.serializers import EmployeeSerializer


def get_el_balance_payload(employee, year):
    """
    Synthetic balance row for EL from LeaveLedger totals.
    Returns None if EL leave type is not configured.
    """
    el_type = LeaveType.objects.filter(code='EL', is_active=True).first()
    if not el_type:
        return None

    today = timezone.localdate()
    if year == today.year:
        from .tasks import ensure_el_monthly_accruals

        ensure_el_monthly_accruals(employee=employee, year=year)

    remaining = (
        LeaveLedger.objects.filter(
            employee=employee,
            leave_type=el_type,
            transaction_type='ACCRUAL',
            remaining_days__gt=0,
            expiry_date__gte=today,
        ).aggregate(total=Sum('remaining_days'))['total']
        or Decimal('0.00')
    )

    used = (
        LeaveLedger.objects.filter(
            employee=employee,
            leave_type=el_type,
            transaction_type='DEDUCTION',
            transaction_date__year=year,
        ).aggregate(total=Sum('days'))['total']
        or Decimal('0.00')
    )

    accrued_year = (
        LeaveLedger.objects.filter(
            employee=employee,
            leave_type=el_type,
            transaction_type='ACCRUAL',
            transaction_date__year=year,
        ).aggregate(total=Sum('days'))['total']
        or Decimal('0.00')
    )

    return {
        'id': None,
        'employee': EmployeeSerializer(employee).data,
        'leave_type': LeaveTypeSerializer(el_type).data,
        'leave_type_name': el_type.name,
        'employee_name': employee.user.get_full_name() if employee.user_id else '',
        'year': year,
        'total_days': float(accrued_year),
        'used_days': float(used),
        'carried_forward_days': 0.0,
        'remaining_days': float(remaining),
    }


def strip_el_from_balance_rows(rows):
    """Remove mistaken LeaveBalance rows for EL (ledger is source of truth)."""
    if not rows:
        return rows
    out = []
    for row in rows:
        lt = row.get('leave_type') if isinstance(row, dict) else None
        code = (lt or {}).get('code') if isinstance(lt, dict) else None
        if code == 'EL':
            continue
        out.append(row)
    return out


def merge_el_balance(rows, employee, year):
    """Replace any EL row with ledger-based payload."""
    rows = strip_el_from_balance_rows(rows)
    el_payload = get_el_balance_payload(employee, year)
    if el_payload:
        rows.append(el_payload)
    return sorted(rows, key=lambda r: (r.get('leave_type') or {}).get('name', '') or '')
