# employees/models.py

from django.db import models
from django.contrib.auth import get_user_model
from utils.encryption import encryption_util

User = get_user_model()

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Employee(models.Model):
    EMPLOYMENT_STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('TERMINATED', 'Terminated'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    position = models.CharField(max_length=100, null=True, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    salary = models.CharField(max_length=255, blank=True)  # Encrypted
    # manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='subordinates'  # This creates the reverse relationship
    )
    status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES, default='ACTIVE')  # ADD THIS FIELD
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Encrypt salary
        if self.salary:
            self.salary = encryption_util.encrypt(self.salary)
        super().save(*args, **kwargs)
    def delete(self, *args, **kwargs):
        """
        Override delete to also remove the associated User and UserProfile
        """
        user = self.user
        # First delete the employee record
        super().delete(*args, **kwargs)
        # Then delete the user (which will cascade delete UserProfile)
        if user:
            user.delete()
    def get_decrypted_salary(self):
        return encryption_util.decrypt(self.salary) if self.salary else ''

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.employee_id}"
    @property
    def team_members(self):
        """Get all employees who report to this employee"""
        return self.subordinates.filter(status='ACTIVE')

    @property
    def team_count(self):
        """Count of team members"""
        return self.subordinates.filter(status='ACTIVE').count()
class OnboardingTask(models.Model):
    TASK_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='onboarding_tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=TASK_STATUS_CHOICES, default='PENDING')
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.employee.user.get_full_name()}"

from datetime import date
class EmployeeBirthday(models.Model):
    """
    Store employee birthday information
    """
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='birthday_info')
    birth_date = models.DateField(help_text="Employee's birth date")
    notify_team = models.BooleanField(default=True, help_text="Whether to notify team about this birthday")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Employee Birthday"
        verbose_name_plural = "Employee Birthdays"

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.birth_date.strftime('%B %d')}"

    @property
    def is_birthday_today(self):
        """Check if today is the employee's birthday"""
        today = date.today()
        return (self.birth_date.month == today.month and 
                self.birth_date.day == today.day)

    @property
    def days_until_birthday(self):
        """Calculate days until next birthday"""
        today = date.today()
        this_year_birthday = self.birth_date.replace(year=today.year)
        
        if this_year_birthday < today:
            # Birthday already passed this year, calculate for next year
            next_birthday = this_year_birthday.replace(year=today.year + 1)
        else:
            next_birthday = this_year_birthday
            
        return (next_birthday - today).days

    @property
    def age_today(self):
        """Calculate current age"""
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))

    @property
    def formatted_birth_date(self):
        """Return formatted birth date"""
        return self.birth_date.strftime('%B %d')


class Festival(models.Model):
    """
    Store festival and holiday information
    """
    FESTIVAL_TYPES = [
        ('NATIONAL', 'National Holiday'),
        ('RELIGIOUS', 'Religious Festival'),
        ('CULTURAL', 'Cultural Event'),
        ('COMPANY', 'Company Event'),
        ('INTERNATIONAL', 'International Day'),
        ('SEASONAL', 'Seasonal Festival'),
    ]

    name = models.CharField(max_length=100, help_text="Festival name")
    description = models.TextField(blank=True, help_text="Festival description")
    date = models.DateField(help_text="Festival date")
    festival_type = models.CharField(max_length=20, choices=FESTIVAL_TYPES, default='NATIONAL')
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or emoji")
    emoji = models.CharField(max_length=10, blank=True, help_text="Festival emoji")
    is_holiday = models.BooleanField(default=False, help_text="Whether this is a company holiday")
    is_recurring = models.BooleanField(default=True, help_text="Whether this festival repeats yearly")
    notify_employees = models.BooleanField(default=True, help_text="Whether to notify employees")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Festival"
        verbose_name_plural = "Festivals"
        ordering = ['date']

    def __str__(self):
        return f"{self.name} - {self.date.strftime('%B %d, %Y')}"

    @property
    def is_today(self):
        """Check if festival is today"""
        today = date.today()
        return (self.date.month == today.month and 
                self.date.day == today.day)

    @property
    def days_until_festival(self):
        """Calculate days until festival"""
        today = date.today()
        
        if self.is_recurring:
            # For recurring festivals, check this year and next year
            this_year_festival = self.date.replace(year=today.year)
            
            if this_year_festival < today:
                # Festival already passed this year
                next_festival = this_year_festival.replace(year=today.year + 1)
            else:
                next_festival = this_year_festival
        else:
            # For non-recurring festivals, use the exact date
            next_festival = self.date
            
        if next_festival < today:
            return -1  # Festival has passed and won't recur
            
        return (next_festival - today).days

    @property
    def formatted_date(self):
        """Return formatted date"""
        return self.date.strftime('%B %d')

    @property
    def formatted_date_with_year(self):
        """Return formatted date with year"""
        return self.date.strftime('%B %d, %Y')