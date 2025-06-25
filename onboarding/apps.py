from django.apps import AppConfig

class OnboardingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'onboarding'
    verbose_name = 'HR Management'

    def ready(self):
        import onboarding.signals  # 👈 this ensures the signal is registered
