# assets/serializers.py
from rest_framework import serializers
from .models import AssetType, Asset, AssetAssignment, AssetHistory, OffboardingAssetReturn, AssetReturn, EmployeeStatus, AssetRepair

class AssetTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetType
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    current_employee = serializers.SerializerMethodField()
    previously_used_by_info = serializers.SerializerMethodField(read_only=True)
    laptop_age_pretty = serializers.SerializerMethodField(read_only=True)
    is_under_repair = serializers.BooleanField(read_only=True)
    current_repair_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Asset
        fields = '__all__'
        depth = 0

    def get_current_employee(self, obj):
        try:
            assignment = obj.assignments.order_by('-assigned_at').first()
            if not assignment:
                return None
            user = assignment.employee
            name = getattr(user, 'get_full_name', lambda: '')() or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'name': name,
                'email': getattr(user, 'email', ''),
            }
        except Exception:
            return None

    def get_previously_used_by_info(self, obj):
        try:
            user = getattr(obj, 'previously_used_by', None)
            if not user:
                return None
            full_name = (getattr(user, 'get_full_name', lambda: '')() or '').strip()
            name = full_name or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'name': name,
            }
        except Exception:
            return None

    def get_laptop_age_pretty(self, obj):
        try:
            delta = getattr(obj, 'laptop_age', None)
            if not delta:
                return None
            days_total = getattr(delta, 'days', None)
            if days_total is None:
                return str(delta)
            years, rem_days = divmod(days_total, 365)
            months, days = divmod(rem_days, 30)
            parts = []
            if years:
                parts.append(f"{years}y")
            if months:
                parts.append(f"{months}m")
            if days:
                parts.append(f"{days}d")
            return " ".join(parts) if parts else "0d"
        except Exception:
            return None
    
    def get_current_repair_info(self, obj):
        try:
            repair = obj.current_repair
            if not repair:
                return None
            return {
                'id': repair.id,
                'status': repair.status,
                'status_display': repair.get_status_display(),
                'issue_description': repair.issue_description,
                'reported_at': repair.reported_at,
            }
        except Exception:
            return None

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
    employee_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AssetAssignment
        fields = ['id', 'employee', 'employee_info', 'assets', 'asset_types', 'manager_email', 'notes', 'assigned_at', 'updated_at']
        read_only_fields = ['assigned_at', 'updated_at']

    def validate(self, data):
        # Ensure at least one asset or asset type is provided
        if not data.get('assets') and not data.get('asset_types'):
            raise serializers.ValidationError("At least one asset or asset type must be provided.")
        
        # Category-aware validation
        if 'assets' in data and data['assets']:
            # Prefetch categories to minimize queries
            asset_map = {a.id: a for a in data['assets']}
            from .models import AssetType
            type_map = {t.id: t for t in AssetType.objects.filter(id__in=[a.asset_type_id for a in asset_map.values()])}

            for asset in asset_map.values():
                atype = type_map.get(asset.asset_type_id)
                category = getattr(atype, 'category', None)
                if category == 'SOFTWARE':
                    if asset.status in ['DAMAGED', 'LOST']:
                        raise serializers.ValidationError(
                            f"Software asset {asset.asset_tag} cannot be assigned because it is {asset.status}."
                        )
                else:
                    if asset.status != 'AVAILABLE':
                        raise serializers.ValidationError(
                            f"Hardware asset {asset.asset_tag} is not available for assignment. Current status: {asset.status}"
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

    def get_employee_info(self, obj):
        try:
            user = obj.employee
            full_name = (getattr(user, 'get_full_name', lambda: '')() or '').strip()
            name = full_name or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'name': name,
            }
        except Exception:
            return None

class AssetHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetHistory
        fields = '__all__'

class AssetRepairSerializer(serializers.ModelSerializer):
    asset_info = serializers.SerializerMethodField(read_only=True)
    reported_by_info = serializers.SerializerMethodField(read_only=True)
    repair_duration_days = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = AssetRepair
        fields = '__all__'
        read_only_fields = ['reported_at', 'started_at', 'completed_at']
    
    def get_asset_info(self, obj):
        try:
            asset = obj.asset
            return {
                'id': asset.id,
                'asset_tag': asset.asset_tag,
                'name': asset.name,
                'asset_type': asset.asset_type.name if asset.asset_type else None,
            }
        except Exception:
            return None
    
    def get_reported_by_info(self, obj):
        try:
            user = obj.reported_by
            if not user:
                return None
            full_name = (getattr(user, 'get_full_name', lambda: '')() or '').strip()
            name = full_name or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'name': name,
            }
        except Exception:
            return None
    
    def get_repair_duration_days(self, obj):
        try:
            if obj.completed_at and obj.started_at:
                delta = obj.completed_at - obj.started_at
                return delta.days
            elif obj.started_at:
                from django.utils import timezone
                delta = timezone.now() - obj.started_at
                return delta.days
            return None
        except Exception:
            return None

class OffboardingAssetReturnSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = OffboardingAssetReturn
        fields = '__all__'

    def get_user_info(self, obj):
        try:
            user = obj.user
            full_name = (getattr(user, 'get_full_name', lambda: '')() or '').strip()
            name = full_name or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'name': name,
            }
        except Exception:
            return None

class AssetReturnSerializer(serializers.ModelSerializer):
    employee_info = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = AssetReturn
        fields = '__all__'

    def get_employee_info(self, obj):
        try:
            user = obj.employee
            full_name = (getattr(user, 'get_full_name', lambda: '')() or '').strip()
            name = full_name or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'name': name,
            }
        except Exception:
            return None

class EmployeeStatusSerializer(serializers.ModelSerializer):
    employee_info = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = EmployeeStatus
        fields = '__all__'

    def get_employee_info(self, obj):
        try:
            user = obj.employee
            full_name = (getattr(user, 'get_full_name', lambda: '')() or '').strip()
            name = full_name or getattr(user, 'username', '') or getattr(user, 'email', '')
            return {
                'id': getattr(user, 'id', None),
                'username': getattr(user, 'username', ''),
                'email': getattr(user, 'email', ''),
                'name': name,
            }
        except Exception:
            return None