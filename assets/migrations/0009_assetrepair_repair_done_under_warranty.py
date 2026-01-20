from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0008_assetrepair_total_repair_cost'),
    ]

    operations = [
        migrations.AddField(
            model_name='assetrepair',
            name='repair_done_under_warranty',
            field=models.BooleanField(default=False),
        ),
    ]
