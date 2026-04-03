# leave_management/apps.py
import threading
import time
import os
import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)

class LeaveManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'leave_management'
    
    def ready(self):
        import leave_management.signals
        
        import sys
        if 'manage.py' in sys.argv and not 'runserver' in sys.argv:
            return
            
        from django.conf import settings
        is_leader = os.getenv('LEAVE_RESET_LEADER', 'true').lower() in {'1', 'true', 'yes'}
        
        # We can reuse SCHEDULER_AUTOSTART for background threads
        if not (getattr(settings, 'SCHEDULER_AUTOSTART', False) and is_leader):
            logger.warning(
                "Leave scheduler disabled (set SCHEDULER_AUTOSTART=true in env for EL monthly accrual, expiry, yearly reset)."
            )
            return
            
        def run_reset():
            logger.info("🚀 Background leave reset thread started (checks every hour)")
            from .tasks import auto_reset_yearly_leaves, auto_monthly_el_accrual, auto_expire_el_ledgers, auto_encash_client_el
            
            # Initial sleep to allow full server startup
            time.sleep(30)
            
            while True:
                try:
                    auto_reset_yearly_leaves()
                    auto_monthly_el_accrual()
                    auto_expire_el_ledgers()
                    auto_encash_client_el()
                except Exception as e:
                    logger.exception(f"❌ Leave reset/ledger error: {e}")
                
                time.sleep(3600)  # Check every hour
                
        thread = threading.Thread(target=run_reset, daemon=True)
        thread.start()
        logger.info("✅ Leave reset background thread initialized")