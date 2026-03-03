import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from django.contrib.auth import get_user_model
from webpush.models import PushInformation
from webpush import send_user_notification

User = get_user_model()

def debug_user(email):
    print(f"\n--- Debugging User: {email} ---")
    try:
        user = User.objects.get(email=email)
        print(f"User found: ID={user.id}, Email={user.email}")
        
        subscriptions = PushInformation.objects.filter(user=user)
        print(f"PushInformation count for this user: {subscriptions.count()}")
        
        for i, sub in enumerate(subscriptions):
            print(f"  Sub {i+1}: ID={sub.id}, Endpoint={sub.subscription.endpoint[:50]}...")
            
        payload = {"head": "Debug", "body": "Deep debug test"}
        print("Calling send_user_notification...")
        response = send_user_notification(user=user, payload=payload, ttl=1000)
        print(f"Response: {response}")
        
    except User.DoesNotExist:
        print(f"User NOT found for email: {email}")
    except Exception as e:
        print(f"Error during debug: {str(e)}")

if __name__ == "__main__":
    debug_user('jayavardhanreddy152@gmail.com')
    debug_user('jayavardhan.pakanati@techoptima.ai')
