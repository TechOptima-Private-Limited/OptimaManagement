
import os
import django
from django.conf import settings
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_keka.settings')
django.setup()

from django.contrib.auth import get_user_model
from resource_management.models import AccessRequest, Resource, ResourceType
from assets.models import Asset, AssetType
from resource_management.utils import send_request_notification

def debug_recipients():
    print("--- Starting Recipient Restriction Debug ---")
    
    user = get_user_model().objects.first()
    print(f"Test User: {user.email}")
    
    types_to_test = ['IT', 'ASSET_REPAIR', 'ACCESS']
    
    for req_type in types_to_test:
        print(f"\n>> Testing for request type: {req_type}")
        request = AccessRequest.objects.create(
            user=user,
            request_type=req_type,
            justification=f'Debug notification for {req_type}',
            duration=1
        )
        # We call the notification function which prints recipient lists
        send_request_notification(request)
        # request.delete()
    
    print("\n--- Recipient Restriction Debug Complete ---")

if __name__ == '__main__':
    debug_recipients()
