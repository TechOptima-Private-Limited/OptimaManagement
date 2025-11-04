from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0002_hardwareasset_softwareasset_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='assetassignment',
            name='asset_types',
            field=models.ManyToManyField(related_name='assignments', to='assets.assettype', blank=True),
        ),
    ]
