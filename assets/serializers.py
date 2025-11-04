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
    assets = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Asset.objects.all(),
        required=True
    )
    asset_types = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AssetType.objects.all(),
        required=False
    )

    class Meta:
        model = AssetAssignment
        fields = ['id', 'employee', 'assets', 'asset_types', 'manager_email', 'notes', 'assigned_at', 'updated_at']
        read_only_fields = ['assigned_at', 'updated_at']

    def validate(self, data):
        # Ensure at least one asset or asset type is provided
        if not data.get('assets') and not data.get('asset_types'):
            raise serializers.ValidationError("At least one asset or asset type must be provided.")
        
        # Check if assets are available for assignment
        if 'assets' in data:
            for asset in data['assets']:
                if asset.status != 'AVAILABLE':
                    raise serializers.ValidationError(
                        f"Asset {asset.asset_tag} is not available for assignment. Current status: {asset.status}"
                    )
        return data

    def create(self, validated_data):
        assets = validated_data.pop('assets', [])
        asset_types = validated_data.pop('asset_types', [])
        
        # Create the assignment
        assignment = AssetAssignment.objects.create(**validated_data)
        
        # Add assets and asset types
        assignment.assets.set(assets)
        assignment.asset_types.set(asset_types)
        
        # Update asset statuses
        for asset in assets:
            asset.status = 'ASSIGNED'
            asset.save()
            
            # Log the assignment
            AssetHistory.objects.create(
                asset=asset,
                action=f"Assigned to {assignment.employee.username}",
                performed_by=self.context['request'].user
            )
        
        return assignment

class AssetHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetHistory
        fields = '__all__'