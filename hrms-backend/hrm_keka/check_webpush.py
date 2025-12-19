import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from django.conf import settings
from django.db import connection
from webpush.models import PushInformation

def diag():
    print("--- Webpush Diagnostics ---")
    
    # 1. Check Settings
    wp_settings = getattr(settings, 'WEBPUSH_SETTINGS', {})
    print(f"VAPID_PUBLIC_KEY: {wp_settings.get('VAPID_PUBLIC_KEY', 'MISSING')[:10]}...")
    print(f"VAPID_PRIVATE_KEY: {'SET' if wp_settings.get('VAPID_PRIVATE_KEY') else 'MISSING'}")
    
    # 2. Check Tables
    tables = connection.introspection.table_names()
    wp_tables = [t for t in tables if 'webpush' in t]
    print(f"Webpush tables in DB: {wp_tables}")
    
    # 3. Check Subscriptions
    count = PushInformation.objects.count()
    print(f"Total Push Subscriptions: {count}")
    
    if count > 0:
        latest = PushInformation.objects.latest('id')
        print(f"Latest subscription for user: {latest.user.email}")

if __name__ == "__main__":
    diag()
