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
        # In development (`runserver`), Django's autoreloader imports twice; only start in the main process.
        if settings.DEBUG:
            run_main = os.getenv("RUN_MAIN", "").lower()
            if run_main not in {"true", "1", "yes"}:
                return

        is_leader = os.getenv('BIOMETRIC_SYNC_LEADER', '').lower() in {'1', 'true', 'yes'}
        # Production uses explicit flags; in DEBUG we default to starting to make local sync work out-of-the-box.
        should_autostart = settings.SCHEDULER_AUTOSTART or settings.DEBUG

        if should_autostart and (is_leader or settings.DEBUG) and not os.getenv('DISABLE_BIOMETRIC_AUTO_SYNC'):
            from .tasks import auto_sync_biometric_devices  # Import your sync task

            def run_sync():
                # Your LOGGING config only shows WARNING+ by default, so INFO won't appear in the terminal.
                # Use WARNING so you can confirm the thread is actively syncing.
                logger.warning("Biometric auto-sync thread started (every 15 seconds)")
                while True:
                    try:
                        logger.warning("Calling auto_sync_biometric_devices")
                        result = auto_sync_biometric_devices()
                        logger.warning("Sync completed: %s", result)
                    except Exception as e:
                        logger.exception("Sync error: %s", e)
                    time.sleep(15)  # Run every 15 seconds

            thread = threading.Thread(target=run_sync, daemon=True)
            thread.start()
            logger.info("Background sync thread started")
