from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction

from attendance.models import AttendanceRecord


class Command(BaseCommand):
    help = "Clean up duplicate AttendanceRecord rows per (employee,date) and biometric-only (biometric_user_id,date)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Actually delete duplicates. Without this flag, command runs in dry-run mode.',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Optional safety limit: max number of duplicate groups to process (0 = no limit).',
        )

    def _score_record(self, r: AttendanceRecord) -> tuple:
        """Higher score = record to keep.

        Priority:
        1) has check_out_time
        2) has check_in_time
        3) newest updated_at
        4) newest id
        """
        return (
            1 if r.check_out_time else 0,
            1 if r.check_in_time else 0,
            r.updated_at or r.created_at,
            r.id,
        )

    def handle(self, *args, **options):
        apply = bool(options.get('apply'))
        limit = int(options.get('limit') or 0)

        # Only fetch fields we need, but keep model instances for delete().
        records = AttendanceRecord.objects.select_related('employee').all().order_by('date', 'id')

        groups = defaultdict(list)
        for r in records:
            if r.employee_id:
                key = ('EMP', r.employee_id, r.date)
            elif r.biometric_user_id:
                key = ('BIO', r.biometric_user_id, r.date)
            else:
                # Nothing to group by; skip.
                continue
            groups[key].append(r)

        duplicate_groups = [(k, v) for k, v in groups.items() if len(v) > 1]
        total_groups = len(duplicate_groups)

        if limit and total_groups > limit:
            duplicate_groups = duplicate_groups[:limit]

        to_delete_ids = []
        keep_ids = []

        for key, group in duplicate_groups:
            keep = max(group, key=self._score_record)
            keep_ids.append(keep.id)
            for r in group:
                if r.id != keep.id:
                    to_delete_ids.append(r.id)

        self.stdout.write(self.style.WARNING(
            f"Found {total_groups} duplicate groups; processing {len(duplicate_groups)} groups."
        ))
        self.stdout.write(self.style.WARNING(
            f"Would keep {len(set(keep_ids))} records and delete {len(set(to_delete_ids))} records."
        ))

        if not apply:
            self.stdout.write(self.style.SUCCESS(
                "Dry-run complete. Re-run with --apply to delete duplicates."
            ))
            return

        if not to_delete_ids:
            self.stdout.write(self.style.SUCCESS("No duplicates to delete."))
            return

        with transaction.atomic():
            deleted_count, _ = AttendanceRecord.objects.filter(id__in=to_delete_ids).delete()

        self.stdout.write(self.style.SUCCESS(
            f"Deleted {deleted_count} AttendanceRecord rows."
        ))
