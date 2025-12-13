from django.contrib.auth.models import AbstractUser
from django.db import models
from utils.encryption import encryption_util

class User(AbstractUser):
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('EMPLOYEE', 'Employee'),
        ('HR_MANAGER', 'HR Manager'),
        ('ADMIN', 'Admin'),
        ('IT_SUPPORTER', 'IT Supporter'),
        ('MANAGER', 'Manager'),
        
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='EMPLOYEE')
    phone_number = models.CharField(max_length=256, blank=True)
    address = models.TextField(blank=True)  # TextField is already flexible
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=256, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Encrypt sensitive data only if not already encrypted
        if self.phone_number and not self._is_encrypted(self.phone_number):
            self.phone_number = encryption_util.encrypt(self.phone_number)
        if self.address and not self._is_encrypted(self.address):
            self.address = encryption_util.encrypt(self.address)
        if self.emergency_contact and not self._is_encrypted(self.emergency_contact):
            self.emergency_contact = encryption_util.encrypt(self.emergency_contact)
        super().save(*args, **kwargs)

    def _is_encrypted(self, value):
        # Add logic to check if the value is already encrypted
        # This depends on your encryption utility implementation
        try:
            encryption_util.decrypt(value)
            return True
        except:
            return False
    
    def get_decrypted_phone(self):
        return encryption_util.decrypt(self.phone_number) if self.phone_number else ''
    
    def get_decrypted_address(self):
        return encryption_util.decrypt(self.address) if self.address else ''
    
    def get_decrypted_emergency_contact(self):
        return encryption_util.decrypt(self.emergency_contact) if self.emergency_contact else ''