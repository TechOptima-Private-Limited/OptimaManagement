from django.core.management.base import BaseCommand
from django.db import transaction
from assets.models import Asset, AssetReturn


class Command(BaseCommand):
    help = "Backfill Asset.previously_used_by from the latest AssetReturn per asset"

    def add_arguments(self, parser):
        parser.add_argument(
            "--commit",
            action="store_true",
            dest="commit",
            help="Apply changes to the database",
        )
        parser.add_argument(
            "--only-missing",
            action="store_true",
            dest="only_missing",
            help="Only update assets where previously_used_by is null",
        )

    def handle(self, *args, **options):
        commit = options.get("commit", False)
        only_missing = options.get("only_missing", False)

        returns = (
            AssetReturn.objects.select_related("asset", "assignment__employee")
            .order_by("asset_id", "-returned_at", "-id")
        )

        latest_by_asset = {}
        for r in returns:
            aid = r.asset_id
            if aid not in latest_by_asset:
                latest_by_asset[aid] = r

        asset_ids = list(latest_by_asset.keys())
        if not asset_ids:
            self.stdout.write("No AssetReturn records found.")
            return

        assets = {a.id: a for a in Asset.objects.filter(id__in=asset_ids)}

        updates = []
        for aid, ret in latest_by_asset.items():
            asset = assets.get(aid)
            if not asset:
                continue
            prev_user = getattr(asset, "previously_used_by", None)
            new_user = ret.assignment.employee if ret.assignment else None
            if only_missing and prev_user:
                continue
            if prev_user != new_user:
                asset.previously_used_by = new_user
                updates.append(asset)

        if not updates:
            self.stdout.write("No assets need updating.")
            return

        self.stdout.write(f"Will update {len(updates)} assets.")
        for a in updates[:20]:
            old = getattr(a, "_loaded_values", {}).get("previously_used_by_id") if hasattr(a, "_loaded_values") else None
            self.stdout.write(f"Asset {a.id} -> previously_used_by_id: {getattr(a, 'previously_used_by_id', None)}")

        if not commit:
            self.stdout.write("Dry run complete. Re-run with --commit to apply.")
            return

        with transaction.atomic():
            Asset.objects.bulk_update(updates, ["previously_used_by"]) 
        self.stdout.write("Backfill complete.")
