from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0006_assetrepair'),
    ]

    operations = [
        migrations.AddField(
            model_name='assetrepair',
            name='case_id',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
