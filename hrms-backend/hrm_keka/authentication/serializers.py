# from rest_framework import serializers
# from django.contrib.auth import authenticate
# from django.contrib.auth.models import Group, Permission
# from .models import User, UserProfile




# class EmployeeRegistrationSerializer(serializers.Serializer):
#     """Simple employee registration with just email and password"""
#     email = serializers.EmailField()
#     password = serializers.CharField(write_only=True, min_length=8)
#     password_confirm = serializers.CharField(write_only=True)
    
#     def validate_email(self, value):
#         """Check if user exists and has unusable password"""
#         try:
#             user = User.objects.get(email=value)
#             if user.has_usable_password():
#                 raise serializers.ValidationError("This account has already been activated.")
#             return value
#         except User.DoesNotExist:
#             raise serializers.ValidationError("No account found with this email address.")
    
#     def validate(self, attrs):
#         if attrs['password'] != attrs['password_confirm']:
#             raise serializers.ValidationError("Passwords don't match")
#         return attrs
    
#     def save(self):
#         """Set password for existing user"""
#         email = self.validated_data['email']
#         password = self.validated_data['password']
        
#         user = User.objects.get(email=email)
#         user.set_password(password)
#         user.save()
        
#         return user
# class UserRegistrationSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True, min_length=8)
#     password_confirm = serializers.CharField(write_only=True)
    
#     class Meta:
#         model = User
#         fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
    
#     def validate(self, attrs):
#         if attrs['password'] != attrs['password_confirm']:
#             raise serializers.ValidationError("Passwords don't match")
#         return attrs
    
#     def create(self, validated_data):
#         validated_data.pop('password_confirm')
#         user = User.objects.create_user(**validated_data)   
#         UserProfile.objects.create(user=user)
#         return user

# class UserProfileSerializer(serializers.ModelSerializer):
#     phone_number = serializers.SerializerMethodField()
#     address = serializers.SerializerMethodField()
#     emergency_contact = serializers.SerializerMethodField()
    
#     class Meta:
#         model = UserProfile
#         fields = ['role', 'phone_number', 'address', 'date_of_birth', 'emergency_contact']
    
#     def get_phone_number(self, obj):
#         return obj.get_decrypted_phone()
    
#     def get_address(self, obj):
#         return obj.get_decrypted_address()
    
#     def get_emergency_contact(self, obj):
#         return obj.get_decrypted_emergency_contact()

# # class UserSerializer(serializers.ModelSerializer):
# #     profile = UserProfileSerializer(read_only=True)
# #     groups = serializers.SerializerMethodField()
    
# #     class Meta:
# #         model = User
# #         fields = ['id', 'username', 'email', 'first_name','role', 'last_name', 'is_superuser', 'profile', 'groups']
    
# #     def get_groups(self, obj):
# #         """Return group names for the user so frontend can derive effective role."""
# #         return list(obj.groups.values_list('name', flat=True))


# class UserSerializer(serializers.ModelSerializer):
#     profile = UserProfileSerializer(read_only=True)
#     groups = serializers.SerializerMethodField()
#     role = serializers.SerializerMethodField()  # ✅ ADD THIS

#     class Meta:
#         model = User
#         fields = [
#             'id',
#             'username',
#             'email',
#             'first_name',
#             'last_name',
#             'is_superuser',
#             'role',       # ✅ now valid
#             'profile',
#             'groups'
#         ]

#     def get_groups(self, obj):
#         return list(obj.groups.values_list('name', flat=True))

#     def get_role(self, obj):
#         return getattr(getattr(obj, 'profile', None), 'role', None)


# class UserProfileUpdateSerializer(serializers.ModelSerializer):
#     """Serializer for updating user profile with decryption"""
#     phone_number = serializers.CharField(allow_blank=True, required=False)
#     address = serializers.CharField(allow_blank=True, required=False)
#     emergency_contact = serializers.CharField(allow_blank=True, required=False)
    
#     class Meta:
#         model = UserProfile
#         fields = ['role', 'phone_number', 'address', 'date_of_birth', 'emergency_contact']
    
#     def update(self, instance, validated_data):
#         # Handle encrypted fields manually
#         phone_number = validated_data.get('phone_number')
#         address = validated_data.get('address')
#         emergency_contact = validated_data.get('emergency_contact')
        
#         # Update non-encrypted fields first
#         instance.role = validated_data.get('role', instance.role)
#         instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        
#         # Handle encrypted fields - don't encrypt if empty
#         if phone_number is not None:
#             if phone_number.strip():
#                 from utils.encryption import encryption_util
#                 instance.phone_number = encryption_util.encrypt(phone_number.strip())
#             else:
#                 instance.phone_number = ''
                
#         if address is not None:
#             if address.strip():
#                 from utils.encryption import encryption_util
#                 instance.address = encryption_util.encrypt(address.strip())
#             else:
#                 instance.address = ''
                
#         if emergency_contact is not None:
#             if emergency_contact.strip():
#                 from utils.encryption import encryption_util
#                 instance.emergency_contact = encryption_util.encrypt(emergency_contact.strip())
#             else:
#                 instance.emergency_contact = ''
        
#         instance.save()
#         return instance

# class UserProfileReadSerializer(serializers.ModelSerializer):
#     """Serializer for reading user profile with decryption"""
#     phone_number = serializers.SerializerMethodField()
#     address = serializers.SerializerMethodField()
#     emergency_contact = serializers.SerializerMethodField()
    
#     class Meta:
#         model = UserProfile
#         fields = ['role', 'phone_number', 'address', 'date_of_birth', 'emergency_contact']
    
#     def get_phone_number(self, obj):
#         return obj.get_decrypted_phone()
    
#     def get_address(self, obj):
#         return obj.get_decrypted_address()
    
#     def get_emergency_contact(self, obj):
#         return obj.get_decrypted_emergency_contact()

# class UserUpdateSerializer(serializers.ModelSerializer):
#     """Serializer for updating user basic info"""
#     profile = UserProfileUpdateSerializer(required=False)
    
#     class Meta:
#         model = User
#         fields = ['first_name', 'last_name', 'profile']
    
#     def update(self, instance, validated_data):
#         profile_data = validated_data.pop('profile', None)
        
#         # Update user fields
#         instance.first_name = validated_data.get('first_name', instance.first_name)
#         instance.last_name = validated_data.get('last_name', instance.last_name)
#         instance.save()
        
#         # Update profile if provided
#         if profile_data and hasattr(instance, 'profile'):
#             profile_serializer = UserProfileUpdateSerializer(instance.profile, data=profile_data, partial=True)
#             if profile_serializer.is_valid():
#                 profile_serializer.save()
        
#         return instance

# class UserDetailSerializer(serializers.ModelSerializer):
#     """Serializer for reading user details with profile"""
#     profile = UserProfileReadSerializer(read_only=True)
    
#     class Meta:
#         model = User
#         fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

# class AdminUserSerializer(serializers.ModelSerializer):
#     """Admin/HR serializer for managing users and basic permissions"""
#     profile = UserProfileUpdateSerializer(required=False)
#     groups = serializers.PrimaryKeyRelatedField(
#         many=True, queryset=Group.objects.all(), required=False
#     )
#     user_permissions = serializers.PrimaryKeyRelatedField(
#         many=True, queryset=Permission.objects.all(), required=False
#     )

#     class Meta:
#         model = User
#         fields = [
#             'id', 'username', 'email', 'first_name', 'last_name',
#             'is_active', 'is_staff', 'is_superuser',
#             'last_login', 'date_joined', 'profile',
#             'groups', 'user_permissions'
#         ]
#         read_only_fields = ['last_login', 'date_joined']

#     def update(self, instance, validated_data):
#         profile_data = validated_data.pop('profile', None)
#         groups = validated_data.pop('groups', None)
#         user_perms = validated_data.pop('user_permissions', None)

#         instance.username = validated_data.get('username', instance.username)
#         instance.email = validated_data.get('email', instance.email)
#         instance.first_name = validated_data.get('first_name', instance.first_name)
#         instance.last_name = validated_data.get('last_name', instance.last_name)
#         if 'is_active' in validated_data:
#             instance.is_active = validated_data['is_active']
#         if 'is_staff' in validated_data:
#             instance.is_staff = validated_data['is_staff']
#         if 'is_superuser' in validated_data:
#             instance.is_superuser = validated_data['is_superuser']
#         instance.save()

#         # Update groups and user permissions if provided
#         if groups is not None:
#             instance.groups.set(groups)
#         if user_perms is not None:
#             instance.user_permissions.set(user_perms)

#         if profile_data:
#             if hasattr(instance, 'profile'):
#                 profile_serializer = UserProfileUpdateSerializer(instance.profile, data=profile_data, partial=True)
#                 profile_serializer.is_valid(raise_exception=True)
#                 profile_serializer.save()

#         return instance



from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group, Permission
from .models import User, UserProfile


# =====================================================
# Employee self-registration (activate existing user)
# =====================================================
class EmployeeRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if user.has_usable_password():
                raise serializers.ValidationError("This account has already been activated.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address.")

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def save(self):
        user = User.objects.get(email=self.validated_data['email'])
        user.set_password(self.validated_data['password'])
        user.save()
        return user


# =====================================================
# Admin/HR user creation
# =====================================================
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)  # role defaults apply here only
        return user


# =====================================================
# Profile serializers
# =====================================================
class UserProfileSerializer(serializers.ModelSerializer):
    phone_number = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    emergency_contact = serializers.SerializerMethodField()
    aadhaar_number = serializers.SerializerMethodField()
    pan_number = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone_number', 'address', 'date_of_birth',
            'emergency_contact', 'gender', 'blood_group',
            'aadhaar_number', 'pan_number',
        ]

    def get_phone_number(self, obj):
        return obj.get_decrypted_phone()

    def get_address(self, obj):
        return obj.get_decrypted_address()

    def get_emergency_contact(self, obj):
        return obj.get_decrypted_emergency_contact()

    def get_aadhaar_number(self, obj):
        return obj.get_decrypted_aadhaar()

    def get_pan_number(self, obj):
        return obj.get_decrypted_pan()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True)
    aadhaar_number = serializers.CharField(required=False, allow_blank=True)
    pan_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone_number', 'address', 'date_of_birth',
            'emergency_contact', 'gender', 'blood_group',
            'aadhaar_number', 'pan_number',
        ]

    def update(self, instance, validated_data):
        from utils.encryption import encryption_util

        if 'role' in validated_data:
            instance.role = validated_data['role']

        if 'date_of_birth' in validated_data:
            instance.date_of_birth = validated_data['date_of_birth']

        if 'gender' in validated_data:
            instance.gender = validated_data['gender']

        if 'blood_group' in validated_data:
            instance.blood_group = validated_data['blood_group']

        if 'phone_number' in validated_data:
            value = validated_data['phone_number']
            instance.phone_number = (
                encryption_util.encrypt(value.strip()) if value.strip() else ''
            )

        if 'address' in validated_data:
            value = validated_data['address']
            instance.address = (
                encryption_util.encrypt(value.strip()) if value.strip() else ''
            )

        if 'emergency_contact' in validated_data:
            value = validated_data['emergency_contact']
            instance.emergency_contact = (
                encryption_util.encrypt(value.strip()) if value.strip() else ''
            )

        if 'aadhaar_number' in validated_data:
            value = validated_data['aadhaar_number']
            instance.aadhaar_number = (
                encryption_util.encrypt(value.strip()) if value.strip() else ''
            )

        if 'pan_number' in validated_data:
            value = validated_data['pan_number']
            instance.pan_number = (
                encryption_util.encrypt(value.strip()) if value.strip() else ''
            )

        instance.save()
        return instance


class UserProfileReadSerializer(serializers.ModelSerializer):
    phone_number = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    emergency_contact = serializers.SerializerMethodField()
    aadhaar_number = serializers.SerializerMethodField()
    pan_number = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone_number', 'address', 'date_of_birth',
            'emergency_contact', 'gender', 'blood_group',
            'aadhaar_number', 'pan_number',
        ]

    def get_phone_number(self, obj):
        return obj.get_decrypted_phone()

    def get_address(self, obj):
        return obj.get_decrypted_address()

    def get_emergency_contact(self, obj):
        return obj.get_decrypted_emergency_contact()

    def get_aadhaar_number(self, obj):
        return obj.get_decrypted_aadhaar()

    def get_pan_number(self, obj):
        return obj.get_decrypted_pan()


# =====================================================
# User serializers
# =====================================================
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    groups = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_pk = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'is_superuser',
            'role',
            'profile',
            'groups',
            'employee_id',
            'employee_pk'
        ]

    def get_groups(self, obj):
        return list(obj.groups.values_list('name', flat=True))

    def get_role(self, obj):
        return getattr(getattr(obj, 'profile', None), 'role', None)

    def get_employee_id(self, obj):
        employee = getattr(obj, 'employee', None)
        return employee.employee_id if employee else None

    def get_employee_pk(self, obj):
        employee = getattr(obj, 'employee', None)
        return employee.id if employee else None


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileUpdateSerializer(required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)

        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        if profile_data:
            profile_serializer = UserProfileUpdateSerializer(
                instance.profile,
                data=profile_data,
                partial=True
            )
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

        return instance


class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileReadSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


# =====================================================
# Admin serializer (THIS FIXES YOUR BUG)
# =====================================================
class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileUpdateSerializer(required=False)
    groups = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), required=False
    )
    user_permissions = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(), required=False
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser',
            'last_login', 'date_joined',
            'profile',
            'groups', 'user_permissions'
        ]
        read_only_fields = ['last_login', 'date_joined']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        groups = validated_data.pop('groups', None)
        user_perms = validated_data.pop('user_permissions', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        if user_perms is not None:
            instance.user_permissions.set(user_perms)

        from .models import UserProfile

        if profile_data:
            # 🔥 Ensure profile exists
            profile, _ = UserProfile.objects.get_or_create(user=instance)

            serializer = UserProfileUpdateSerializer(
                profile,
                data=profile_data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return instance