import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from django.contrib.auth import get_user_model
from webpush import send_user_notification
import logging

# Set logging to see what's happening
logging.basicConfig(level=logging.INFO)

User = get_user_model()

def test_push():
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    
    payload = {
        "head": "🔥 Test Notification",
        "body": "This is a real-time test from the server!",
        "icon": "/logo192.png",
        "url": "/attendance"
    }
    
    for user in users:
        try:
            print(f"Targeting: {user.email}")
            # Try to send
            response = send_user_notification(user=user, payload=payload, ttl=1000)
            print(f"Response for {user.email}: {response}")
        except Exception as e:
            print(f"FAILED for {user.email}: {str(e)}")

if __name__ == "__main__":
    test_push()
