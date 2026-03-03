from django.apps import AppConfig


class EmployeesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'employees'

    def ready(self):
        # Import signal handlers so they get registered
        from . import signals  # noqa: F401
