# assets/serializers.py
from rest_framework import serializers
from .models import AssetType, Asset, AssetAssignment, AssetHistory

class AssetTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetType
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'

class AssetAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetAssignment
        fields = '__all__'

class AssetHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetHistory
        fields = '__all__'