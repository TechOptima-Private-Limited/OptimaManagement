from django.apps import AppConfig

class ResourceManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'resource_management'

    def ready(self):
        import resource_management.signals  # Import the signals module