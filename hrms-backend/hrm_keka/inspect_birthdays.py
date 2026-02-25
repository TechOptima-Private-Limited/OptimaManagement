import os
import django
from datetime import date

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from employees.models import EmployeeBirthday, Employee

with open('birthday_inspection.txt', 'w', encoding='utf-8') as f:
    f.write(f"Current Date: {date.today()}\n")
    f.write("-" * 30 + "\n")

    active_employees = Employee.objects.filter(status='ACTIVE')
    f.write(f"Total Active Employees: {active_employees.count()}\n")

    birthdays = EmployeeBirthday.objects.filter(employee__status='ACTIVE')
    f.write(f"Total Birthdays for Active Employees: {birthdays.count()}\n")

    for b in birthdays:
        emp_name = b.employee.user.get_full_name()
        days = b.days_until_birthday
        is_today = b.is_birthday_today
        f.write(f"Employee: {emp_name:20} | Birth Date: {b.birth_date} | Days Until: {days:3} | Is Today: {is_today}\n")

    upcoming = [b for b in birthdays if 0 < b.days_until_birthday <= 7]
    f.write("-" * 30 + "\n")
    f.write(f"Upcoming Birthdays (Next 7 days): {len(upcoming)}\n")
    for b in upcoming:
        f.write(f"- {b.employee.user.get_full_name()} on {b.birth_date.strftime('%B %d')}\n")

    all_b = EmployeeBirthday.objects.all()
    f.write(f"\nTotal Birthdays in system (including inactive): {all_b.count()}\n")
    for b in all_b:
        f.write(f"- {b.employee.user.get_full_name()} ({b.employee.status}): {b.birth_date}\n")
