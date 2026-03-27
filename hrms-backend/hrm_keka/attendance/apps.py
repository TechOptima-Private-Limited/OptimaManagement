# attendance/apps.py
import threading
import time
import os
import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AttendanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'attendance'

    def ready(self):
        # ✅ Ensure signals are registered
        import attendance.signals

        # ✅ Prevent duplicate threads (VERY IMPORTANT)
        if os.environ.get("RUN_MAIN") != "true":
            return

        from django.conf import settings

        # ✅ Check leader flag from .env
        is_leader = os.getenv('BIOMETRIC_SYNC_LEADER', '').lower() in {'1', 'true', 'yes'}

        # ✅ Start only if scheduler enabled + leader + not disabled
        if not (settings.SCHEDULER_AUTOSTART and is_leader) or os.getenv('DISABLE_BIOMETRIC_AUTO_SYNC'):
            logger.info("Biometric auto sync NOT started (conditions not met)")
            return

        from .tasks import auto_sync_biometric_devices

        def run_sync():
            logger.info("🚀 Background biometric sync thread started (every 15 seconds)")

            while True:
                try:
                    logger.info("🔄 Calling auto_sync_biometric_devices")

                    result = auto_sync_biometric_devices()

                    logger.info("✅ Sync completed: %s", result)

                except Exception as e:
                    logger.exception("❌ Sync error: %s", e)

                time.sleep(15)  # Run every 15 seconds

        # ✅ Start background thread
        thread = threading.Thread(target=run_sync, daemon=True)
        thread.start()

        logger.info("✅ Biometric background sync initialized")