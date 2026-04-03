
# resource_management/serializers.py
from rest_framework import serializers
from .models import *
import re
from django.conf import settings
from django.utils.html import strip_tags
import os


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
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_tag = serializers.CharField(source='asset.asset_tag', read_only=True)
    access_level_name = serializers.CharField(source='access_level.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    justification_preview = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    rejected_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AccessRequest
        fields = '__all__'
        read_only_fields = ('ticket_number', 'user', 'status', 'approved_by', 
                           'approved_at', 'requested_at', 'expires_at')

    def get_justification_preview(self, obj):
        if obj.justification:
            stripped_text = strip_tags(obj.justification)
            return stripped_text[:150] + "..." if len(stripped_text) > 150 else stripped_text
        return None

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            full = obj.approved_by.get_full_name()
            return full or obj.approved_by.username or obj.approved_by.email
        return None

    def get_rejected_by_name(self, obj):
        try:
            last_reject = obj.history.filter(action='REJECTED').order_by('-performed_at').first()
            if last_reject and last_reject.performed_by:
                full = last_reject.performed_by.get_full_name()
                return full or last_reject.performed_by.username or last_reject.performed_by.email
        except Exception:
            pass
        return None


class AccessHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = AccessHistory
        fields = '__all__'


class UploadImageSerializer(serializers.Serializer):
    image = serializers.CharField()
    filename = serializers.CharField(max_length=128)

    def validate_filename(self, value):
        value = os.path.basename(value)
        if not value:
            raise serializers.ValidationError('Invalid filename.')
        if not re.fullmatch(r"[A-Za-z0-9._-]+", value):
            raise serializers.ValidationError('Invalid filename.')
        return value

    def validate_image(self, value):
        if ';base64,' not in value:
            raise serializers.ValidationError('Invalid image data format.')
        fmt, imgstr = value.split(';base64,', 1)
        if '/' not in fmt:
            raise serializers.ValidationError('Invalid image data format.')
        ext = fmt.split('/')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png', 'gif']:
            raise serializers.ValidationError('Unsupported image format.')
        if not imgstr:
            raise serializers.ValidationError('Invalid image data format.')
        return value


class RequestApprovalSerializer(serializers.Serializer):
    approver_email = serializers.EmailField()
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class CompanyDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CompanyDocument
        fields = [
            'id',
            'title',
            'file',
            'file_url',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['uploaded_by', 'created_at', 'updated_at']

    def get_uploaded_by_name(self, obj):
        user = getattr(obj, 'uploaded_by', None)
        if not user:
            return None
        full_name = (user.get_full_name() or '').strip()
        return full_name or user.email or user.username

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not getattr(obj, 'file', None):
            return None
        try:
            url = obj.file.url
            return request.build_absolute_uri(url) if request else url
        except Exception:
            return None