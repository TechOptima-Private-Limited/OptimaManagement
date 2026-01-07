from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0007_assetrepair_case_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='assetrepair',
            name='total_repair_cost',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
    ]
