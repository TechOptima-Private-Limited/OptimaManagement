# from rest_framework import serializers
# from .models import Employee, Department, OnboardingTask
# from authentication.serializers import UserSerializer

# class DepartmentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Department
#         fields = '__all__'
# from django.contrib.auth import get_user_model
# User = get_user_model()
# class EmployeeSerializer(serializers.ModelSerializer):
#     user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
#     department_id = serializers.PrimaryKeyRelatedField(
#         queryset=Department.objects.all(), source='department', write_only=True
#     )
#     manager = serializers.PrimaryKeyRelatedField(
#         queryset=Employee.objects.all(), required=False, allow_null=True
#     )
#     salary = serializers.CharField(write_only=True)
#     decrypted_salary = serializers.SerializerMethodField(read_only=True)

#     class Meta:
#         model = Employee
#         fields = [
#             'id', 'user', 'employee_id', 'department_id', 'position',
#             'hire_date', 'salary', 'decrypted_salary', 'manager'
#         ]

#     def get_decrypted_salary(self, obj):
#         request = self.context.get('request')
#         if request and request.user:
#             if (hasattr(request.user, 'profile') and 
#                 request.user.profile.role == 'HR_MANAGER') or request.user == obj.user:
#                 return obj.get_decrypted_salary()
#         return None



# class OnboardingTaskSerializer(serializers.ModelSerializer):
#     assigned_by = UserSerializer(read_only=True)
#     employee = EmployeeSerializer(read_only=True)
    
#     class Meta:
#         model = OnboardingTask
#         fields = '__all__'


# employees/serializers.py

# from rest_framework import serializers
# from .models import Employee, Department, OnboardingTask
# from authentication.serializers import UserSerializer
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class DepartmentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Department
#         fields = '__all__'

# class ManagerSerializer(serializers.ModelSerializer):
#     """Simplified serializer for manager info to avoid circular references"""
#     user_info = serializers.SerializerMethodField()
    
#     class Meta:
#         model = Employee
#         fields = ['id', 'employee_id', 'position', 'user_info']
    
#     def get_user_info(self, obj):
#         if obj.user:
#             return {
#                 'id': obj.user.id,
#                 'first_name': obj.user.first_name,
#                 'last_name': obj.user.last_name,
#                 'full_name': obj.user.get_full_name()
#             }
#         return None

# class EmployeeSerializer(serializers.ModelSerializer):
#     # For writing (accepts user ID)
#     user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    
#     # For writing (accepts department ID)
#     department_id = serializers.PrimaryKeyRelatedField(
#         queryset=Department.objects.all(), 
#         source='department', 
#         write_only=True,
#         required=False,
#         allow_null=True
#     )
    
#     # For reading (returns full department data)
#     department = DepartmentSerializer(read_only=True)
    
#     # For writing (accepts manager employee ID)
#     manager_id = serializers.PrimaryKeyRelatedField(
#         queryset=Employee.objects.all(),
#         source='manager',
#         write_only=True,
#         required=False, 
#         allow_null=True
#     )
    
#     # For reading (returns manager's info)
#     manager = ManagerSerializer(read_only=True)
    
#     # For reading (returns user's full info)
#     user_info = serializers.SerializerMethodField(read_only=True)
    
#     # Salary fields
#     salary = serializers.CharField(write_only=True, required=False, allow_blank=True)
#     decrypted_salary = serializers.SerializerMethodField(read_only=True)
    
#     # Subordinates (employees who report to this employee)
#     subordinates_count = serializers.SerializerMethodField(read_only=True)

#     class Meta:
#         model = Employee
#         fields = [
#             'id', 'user', 'user_info', 'employee_id', 'department_id', 'department', 
#             'position', 'hire_date', 'salary', 'decrypted_salary', 'manager_id', 
#             'manager', 'status', 'subordinates_count', 'created_at', 'updated_at'
#         ]

#     def get_decrypted_salary(self, obj):
#         request = self.context.get('request')
#         if request and request.user:
#             if (hasattr(request.user, 'profile') and 
#                 request.user.profile.role == 'HR_MANAGER') or request.user == obj.user:
#                 return obj.get_decrypted_salary()
#         return ""

#     def get_user_info(self, obj):
#         if obj.user:
#             return {
#                 'id': obj.user.id,
#                 'first_name': obj.user.first_name,
#                 'last_name': obj.user.last_name,
#                 'email': obj.user.email,
#                 'full_name': obj.user.get_full_name()
#             }
#         return None
    
#     def get_subordinates_count(self, obj):
#         """Count how many employees report to this employee"""
#         return Employee.objects.filter(manager=obj).count()




# employees/serializers.py
from rest_framework import serializers
from .models import Employee, Department, OnboardingTask
from authentication.models import User, UserProfile  # Import from auth app
from authentication.serializers import UserSerializer
from django.core.mail import EmailMessage

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class ManagerSerializer(serializers.ModelSerializer):
    """Simplified serializer for manager info to avoid circular references"""
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'position', 'user_info']
    
    def get_user_info(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'email': obj.user.email,
                'full_name': obj.user.get_full_name(),
                'username': obj.user.username
            }
        return None

class EmployeeSerializer(serializers.ModelSerializer):
    # Add fields for user and profile creation
    user_data = serializers.DictField(write_only=True, required=False)
    profile_data = serializers.DictField(write_only=True, required=False)
    
    # For existing user assignment (optional)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    
    # Department handling
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )
    department = DepartmentSerializer(read_only=True)
    
    # Manager handling
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='manager',
        write_only=True,
        required=False,
        allow_null=True
    )
    manager = ManagerSerializer(read_only=True)
    
    # User info for reading
    user_info = serializers.SerializerMethodField(read_only=True)
    
    subordinates_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_data', 'profile_data', 'user_info', 
            'employee_id', 'department_id', 'department', 'sub_department', 'location',
            'position', 'hire_date', 'manager_id', 'manager', 
            'status', 'subordinates_count', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        user_data = validated_data.pop('user_data', None)
        profile_data = validated_data.pop('profile_data', None)
        
        # Create user if user_data is provided (new employee creation)
        if user_data:
            # Create user without password
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
            )
            # Set unusable password until employee registers
            user.set_unusable_password()
            user.save()
            
            # Create user profile
            if profile_data:
                UserProfile.objects.create(user=user, **profile_data)
            else:
                UserProfile.objects.create(user=user)
            
            validated_data['user'] = user
        
       # Create employee record
        employee = super().create(validated_data)
        
        # Send welcome email if user was created
        if user_data:
            self.send_welcome_email(employee)
        
        return employee

    def send_welcome_email(self, employee):
        """Send welcome email to newly created employee"""
        try:
            print(f"📧 Preparing welcome email for: {employee.user.get_full_name()}")
            
            # Registration URL
            registration_url = "http://localhost:3002/register"
            
            # Simple HTML email content
            subject = f"Welcome to Our Company - Complete Your Registration"
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; background-color: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px;">
                        <h1>Welcome to Our Company!</h1>
                    </div>
                    
                    <div style="font-size: 18px; margin-bottom: 20px;">
                        <p>Hi <strong>{employee.user.first_name} {employee.user.last_name}</strong>,</p>
                        
                        <p>Welcome to our team! We're excited to have you join us as a <strong>{employee.position}</strong> in the <strong>{employee.department.name if employee.department else 'Not Assigned'}</strong> department.</p>
                        
                        <p>Your employee account has been created successfully. To complete your registration and set up your password, please use the information below:</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <h3>Your Account Details:</h3>
                        <p><strong>Email:</strong> <span style="background-color: #fef3c7; padding: 2px 4px; border-radius: 3px; font-weight: bold;">{employee.user.email}</span></p>
                        <p><strong>Employee ID:</strong> <span style="background-color: #fef3c7; padding: 2px 4px; border-radius: 3px; font-weight: bold;">{employee.employee_id}</span></p>
                        <p><strong>Start Date:</strong> {employee.hire_date.strftime('%B %d, %Y') if employee.hire_date else 'TBD'}</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <p><strong>Please complete your registration by setting up your password:</strong></p>
                        <a href="{registration_url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Complete Registration</a>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>Use the email address <strong>{employee.user.email}</strong> to log in</li>
                            <li>You'll need to create a secure password during registration</li>
                            <li>Please complete your registration within 7 days</li>
                            <li>If you have any questions, contact our HR team</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center;">
                        <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
                        <p><a href="{registration_url}">{registration_url}</a></p>
                        
                        <p>Welcome aboard!<br>
                        <strong>HR Team</strong></p>
                    </div>
                </div>
            </div>
            """
            
            # Send email
            email = EmailMessage(
                subject=subject,
                body=html_content,
                to=[employee.user.email],
            )
            email.content_subtype = "html"
            email.send()
            
            print(f"✅ Welcome email sent to {employee.user.email}")
            
        except Exception as e:
            print(f"❌ Failed to send welcome email: {str(e)}")
            # Don't raise exception to avoid breaking employee creatio

    def get_user_info(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'email': obj.user.email,
                'full_name': obj.user.get_full_name(),
                'username': obj.user.username
            }
        return None

    def get_subordinates_count(self, obj):
        return Employee.objects.filter(manager=obj).count()
class OnboardingTaskSerializer(serializers.ModelSerializer):
    assigned_by = UserSerializer(read_only=True)
    employee = EmployeeSerializer(read_only=True)
    
    class Meta:
        model = OnboardingTask
        fields = '__all__'




from rest_framework import serializers
from .models import Employee, Department, OnboardingTask, EmployeeBirthday, Festival
from authentication.models import User, UserProfile
from authentication.serializers import UserSerializer
from django.core.mail import EmailMessage
from datetime import date, timedelta

# Your existing serializers remain the same...

class EmployeeBirthdaySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    employee_position = serializers.SerializerMethodField()
    avatar_initials = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeBirthday
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 
            'employee_department', 'employee_position', 'avatar_initials',
            'birth_date', 'formatted_birth_date', 'is_birthday_today',
            'days_until_birthday', 'age_today', 'notify_team'
        ]

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()

    def get_employee_id(self, obj):
        return obj.employee.employee_id

    def get_employee_department(self, obj):
        return obj.employee.department.name if obj.employee.department else 'Not Assigned'

    def get_employee_position(self, obj):
        return obj.employee.position or 'Not Assigned'

    def get_avatar_initials(self, obj):
        first_name = obj.employee.user.first_name
        last_name = obj.employee.user.last_name
        return f"{first_name[0] if first_name else ''}{last_name[0] if last_name else ''}".upper()


class FestivalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Festival
        fields = [
            'id', 'name', 'description', 'date', 'formatted_date',
            'formatted_date_with_year', 'festival_type', 'icon', 'emoji',
            'is_holiday', 'is_recurring', 'is_today', 'days_until_festival',
            'notify_employees'
        ]