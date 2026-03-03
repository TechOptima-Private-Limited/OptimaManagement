import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from django.contrib.auth import get_user_model
from webpush.models import PushInformation, SubscriptionInfo

User = get_user_model()

def cleanup(email):
    print(f"\n--- Cleaning up User: {email} ---")
    try:
        user = User.objects.get(email=email)
        # Find all PushInformation for this user
        push_infos = PushInformation.objects.filter(user=user)
        count = push_infos.count()
        print(f"Found {count} subscriptions. Deleting...")
        
        for pi in push_infos:
            sub = pi.subscription
            pi.delete()
            # Also delete the actual subscription record if no one else is using it
            if not PushInformation.objects.filter(subscription=sub).exists():
                sub.delete()
                
        print("Cleanup complete.")
    except User.DoesNotExist:
        print(f"User NOT found for email: {email}")

if __name__ == "__main__":
    cleanup('jayavardhanreddy152@gmail.com')
    cleanup('jayavardhan.pakanati@techoptima.ai')
