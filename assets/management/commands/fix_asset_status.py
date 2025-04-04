# assets/management/commands/fix_asset_status.py
from django.core.management.base import BaseCommand
from assets.models import Asset, AssetAssignment

class Command(BaseCommand):
    help = 'Fixes asset status inconsistencies'

    def handle(self, *args, **options):
        for asset in Asset.objects.all():
            active_assignments = AssetAssignment.objects.filter(
                assets=asset,
                returns__isnull=True
            )
            if active_assignments.exists() and asset.status == 'AVAILABLE':
                asset.status = 'ASSIGNED'
                asset.save()
                self.stdout.write(self.style.WARNING(f"Updated {asset.asset_tag} to ASSIGNED"))
            elif not active_assignments.exists() and asset.status != 'AVAILABLE':
                asset.status = 'AVAILABLE'
                asset.save()
                self.stdout.write(self.style.WARNING(f"Updated {asset.asset_tag} to AVAILABLE"))