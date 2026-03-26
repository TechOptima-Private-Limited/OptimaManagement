from django.apps import AppConfig
import threading
import time
import os
import logging

logger = logging.getLogger(__name__)

class AttendanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'attendance'

    def ready(self):
        import attendance.signals  # ✅ This line is required to trigger the signal registration

        # Start background thread for biometric sync
        from django.conf import settings
        is_leader = os.getenv('BIOMETRIC_SYNC_LEADER', '').lower() in {'1', 'true', 'yes'}
        if settings.SCHEDULER_AUTOSTART and is_leader and not os.getenv('DISABLE_BIOMETRIC_AUTO_SYNC'):
            from .tasks import auto_sync_biometric_devices  # Import your sync task

            def run_sync():
                logger.info("Background sync thread started (every 15 seconds)")
                while True:
                    try:
                        logger.info("Calling auto_sync_biometric_devices")
                        result = auto_sync_biometric_devices()
                        logger.info("Sync completed: %s", result)
                    except Exception as e:
                        logger.exception("Sync error: %s", e)
                    time.sleep(15)  # Run every 15 seconds

            thread = threading.Thread(target=run_sync, daemon=True)
            thread.start()
            logger.info("Background sync thread started")
