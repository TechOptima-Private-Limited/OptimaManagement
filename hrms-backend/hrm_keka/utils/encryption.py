from cryptography.fernet import Fernet
from django.conf import settings
import base64

class EncryptionUtil:
    def __init__(self):
        if not settings.ENCRYPTION_KEY:
            self.key = Fernet.generate_key()
        else:
            self.key = settings.ENCRYPTION_KEY
        self.cipher_suite = Fernet(self.key)
    
    def encrypt(self, data):
        """Encrypt sensitive data"""
        if not data:
            return data
        return self.cipher_suite.encrypt(str(data).encode()).decode()
    
    def decrypt(self, encrypted_data):
        """Decrypt sensitive data"""
        if not encrypted_data:
            return encrypted_data
        try:
            return self.cipher_suite.decrypt(encrypted_data.encode()).decode()
        except Exception:
            return encrypted_data

# Global instance
encryption_util = EncryptionUtil()