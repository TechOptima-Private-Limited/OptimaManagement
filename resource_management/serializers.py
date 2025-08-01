# # resource_management/serializers.py
# from rest_framework import serializers
# from .models import *
# import re
# from django.conf import settings

# class ResourceTypeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ResourceType
#         fields = '__all__'

# class ResourceSerializer(serializers.ModelSerializer):
#     resource_type_name = serializers.CharField(source='resource_type.name', read_only=True)

#     class Meta:
#         model = Resource
#         fields = '__all__'

# class AccessLevelSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = AccessLevel
#         fields = '__all__'

# class AccessRequestSerializer(serializers.ModelSerializer):
#     user_name = serializers.CharField(source='user.get_full_name', read_only=True)
#     resource_name = serializers.CharField(source='resource.name', read_only=True)
#     access_level_name = serializers.CharField(source='access_level.name', read_only=True)
#     status_display = serializers.CharField(source='get_status_display', read_only=True)
#     priority_display = serializers.CharField(source='get_priority_display', read_only=True)
#     justification = serializers.SerializerMethodField()

#     class Meta:
#         model = AccessRequest
#         fields = '__all__'
#         read_only_fields = ('ticket_number', 'user', 'status', 'approved_by', 
#                           'approved_at', 'requested_at', 'expires_at')
   
#     def get_justification(self, obj):
#         if obj.justification:
#             # Replace relative media URLs with absolute URLs
#             justification = obj.justification
#             # Find all image sources in the content
#             img_pattern = r'src=\"(/media/[^\"]+)\"'
#             # Replace with absolute URLs
#             justification = re.sub(img_pattern, f'src="{settings.DOMAIN_NAME}\\1"', justification)
#             return justification
#         return None
  

# class AccessHistorySerializer(serializers.ModelSerializer):
#     performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

#     class Meta:
#         model = AccessHistory
#         fields = '__all__'



# resource_management/serializers.py
from rest_framework import serializers
from .models import *
import re
from django.conf import settings
from django.utils.html import strip_tags

class ResourceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceType
        fields = '__all__'

class ResourceSerializer(serializers.ModelSerializer):
    resource_type_name = serializers.CharField(source='resource_type.name', read_only=True)

    class Meta:
        model = Resource
        fields = '__all__'

class AccessLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessLevel
        fields = '__all__'

class AccessRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    access_level_name = serializers.CharField(source='access_level.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    justification = serializers.SerializerMethodField()
    justification_preview = serializers.SerializerMethodField()  # New field for preview

    class Meta:
        model = AccessRequest
        fields = '__all__'
        read_only_fields = ('ticket_number', 'user', 'status', 'approved_by', 
                          'approved_at', 'requested_at', 'expires_at')
   
    def get_justification(self, obj):
        """Return full HTML content with absolute URLs for detail views"""
        if obj.justification:
            # Replace relative media URLs with absolute URLs
            justification = obj.justification
            # Find all image sources in the content
            img_pattern = r'src=\"(/media/[^\"]+)\"'
            # Replace with absolute URLs
            justification = re.sub(img_pattern, f'src="{settings.DOMAIN_NAME}\\1"', justification)
            return justification
        return None

    def get_justification_preview(self, obj):
        """Return stripped text preview for list views"""
        if obj.justification:
            # Strip HTML tags and truncate for preview
            stripped_text = strip_tags(obj.justification)
            # Truncate to first 150 characters
            if len(stripped_text) > 150:
                return stripped_text[:150] + "..."
            return stripped_text
        return None

class AccessHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = AccessHistory
        fields = '__all__'