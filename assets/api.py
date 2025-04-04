from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AssetType, Asset, AssetAssignment, AssetHistory
from .serializers import AssetTypeSerializer, AssetSerializer, AssetAssignmentSerializer, AssetHistorySerializer

class AssetTypeViewSet(viewsets.ModelViewSet):
    queryset = AssetType.objects.all()
    serializer_class = AssetTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser:
            qs = qs.filter(asset_team_email=self.request.user.email)
        return qs

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser and self.request.user.email not in AssetType.objects.values_list('asset_team_email', flat=True):
            return qs.filter(assignments__employee=self.request.user).distinct()
        if not self.request.user.is_superuser:
            asset_team_emails = AssetType.objects.filter(asset_team_email=self.request.user.email).values_list('id', flat=True)
            return qs.filter(asset_type__id__in=asset_team_emails)
        return qs

class AssetAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AssetAssignment.objects.all()
    serializer_class = AssetAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser and self.request.user.email not in AssetType.objects.values_list('asset_team_email', flat=True):
            return qs.filter(employee=self.request.user)
        if not self.request.user.is_superuser:
            asset_team_emails = AssetType.objects.filter(asset_team_email=self.request.user.email).values_list('id', flat=True)
            return qs.filter(asset__asset_type__id__in=asset_team_emails)
        return qs

class AssetHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetHistory.objects.all()
    serializer_class = AssetHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_superuser and self.request.user.email not in AssetType.objects.values_list('asset_team_email', flat=True):
            return qs.filter(asset__assignments__employee=self.request.user).distinct()
        if not self.request.user.is_superuser:
            asset_team_emails = AssetType.objects.filter(asset_team_email=self.request.user.email).values_list('id', flat=True)
            return qs.filter(asset__asset_type__id__in=asset_team_emails)
        return qs