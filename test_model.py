import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webcrm.settings')
django.setup()

from assets.models import OffboardingAssetReturn
print('Model exists')
print(f'Records count: {OffboardingAssetReturn.objects.all().count()}')

# Try to create a basic instance to test
from django.contrib.auth.models import User
try:
    user = User.objects.first()
    if user:
        obj = OffboardingAssetReturn.objects.create(user=user, laptop_status='AVAILABLE')
        print(f'Created object: {obj}')
        obj.delete()  # Clean up
        print('Test successful')
    else:
        print('No users found for testing')
except Exception as e:
    print(f'Error: {e}')
