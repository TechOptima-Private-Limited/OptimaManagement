# onboarding/apps.py
from django.apps import AppConfig

class OnboardingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'onboarding'
    
    # def ready(self):
    #     import onboarding.signals  # Import signals when app is ready