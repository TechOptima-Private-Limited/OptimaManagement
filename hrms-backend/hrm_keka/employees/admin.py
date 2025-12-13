from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Employee  # assuming Employee is defined here

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee_id', 'department', 'position')  # adjust fields as needed



from django.contrib import admin
from .models import Department, Employee, OnboardingTask, EmployeeBirthday, Festival

# Your existing admin registrations...

@admin.register(EmployeeBirthday)
class EmployeeBirthdayAdmin(admin.ModelAdmin):
    list_display = ['employee', 'formatted_birth_date', 'age_today', 'days_until_birthday', 'notify_team']
    list_filter = ['notify_team', 'employee__department']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering = ['birth_date']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('employee__user')


@admin.register(Festival)
class FestivalAdmin(admin.ModelAdmin):
    list_display = ['name', 'formatted_date', 'festival_type', 'emoji', 'is_holiday', 'days_until_festival']
    list_filter = ['festival_type', 'is_holiday', 'is_recurring', 'notify_employees']
    search_fields = ['name', 'description']
    ordering = ['date']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'date')
        }),
        ('Festival Details', {
            'fields': ('festival_type', 'icon', 'emoji')
        }),
        ('Settings', {
            'fields': ('is_holiday', 'is_recurring', 'notify_employees')
        }),
    )