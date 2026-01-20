from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0005_remove_asset_currently_assigned_to_assetimage'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AssetRepair',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('REPORTED', 'Reported'), ('IN_REPAIR', 'In Repair'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')], default='REPORTED', max_length=20)),
                ('issue_description', models.TextField(blank=True)),
                ('vendor', models.CharField(blank=True, max_length=255)),
                ('ticket_reference', models.CharField(blank=True, max_length=100)),
                ('started_at', models.DateField(blank=True, null=True)),
                ('completed_at', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='repairs', to='assets.asset')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '7. Asset Repair',
                'verbose_name_plural': '7. Asset Repairs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='assetrepair',
            index=models.Index(fields=['asset'], name='assets_asse_asset_id_0e6f6a_idx'),
        ),
        migrations.AddIndex(
            model_name='assetrepair',
            index=models.Index(fields=['status'], name='assets_asse_status_1c3a69_idx'),
        ),
        migrations.AddIndex(
            model_name='assetrepair',
            index=models.Index(fields=['created_at'], name='assets_asse_created__9f7a8e_idx'),
        ),
    ]
