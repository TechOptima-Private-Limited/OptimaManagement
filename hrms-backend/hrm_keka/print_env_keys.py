import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from django.conf import settings
wp = getattr(settings, 'WEBPUSH_SETTINGS', {})
pub = wp.get('VAPID_PUBLIC_KEY')
priv = wp.get('VAPID_PRIVATE_KEY')

print("--- CURRENT SETTINGS KEYS ---")
print(f"PUB_KEY_VAL: {pub}")
print(f"PRIV_KEY_VAL: {priv}")
print("-----------------------------")
