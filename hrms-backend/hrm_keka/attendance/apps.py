from django.apps import AppConfig
import threading
import time

class AttendanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'attendance'

    def ready(self):
        import attendance.signals  # ✅ This line is required to trigger the signal registration

        # Start background thread for biometric sync
        from django.conf import settings
        if settings.SCHEDULER_AUTOSTART:
            from .tasks import auto_sync_biometric_devices  # Import your sync task

            def run_sync():
                print("🔄 Background sync thread started - will run every 60 seconds")
                while True:
                    try:
                        print("🔄 Calling auto_sync_biometric_devices...")
                        result = auto_sync_biometric_devices()
                        print(f"✅ Sync completed: {result}")
                    except Exception as e:
                        print(f"❌ Sync error: {e}")
                    import time
                    time.sleep(60)  # Run every 60 seconds

            import threading
            thread = threading.Thread(target=run_sync, daemon=True)
            thread.start()
            print("✅ Background sync thread started")
