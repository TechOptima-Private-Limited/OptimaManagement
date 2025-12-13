
# Register your models here.
from django.contrib import admin
from .models import User, UserProfile

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_staff', 'is_active')
    def save_model(self, request, obj, form, change):
            # If password is changed or newly set, encrypt it properly
        raw_password = form.cleaned_data.get('password')
        if raw_password and not raw_password.startswith('pbkdf2_'):
            obj.set_password(raw_password)
        super().save_model(request, obj, form, change)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'get_phone')

    def get_phone(self, obj):
        return obj.get_decrypted_phone()
