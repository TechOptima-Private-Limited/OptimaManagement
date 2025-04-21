from django.apps import AppConfig

class ResourceRequestConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'resource_requests'

    def ready(self):
        import resource_requests.signals
        from django.contrib.admin import widgets as admin_widgets
        from .widgets import CustomDatePickerWidget
        
        # This is optional but can help ensure our widget is used
        admin_widgets.AdminDateWidget = CustomDatePickerWidget