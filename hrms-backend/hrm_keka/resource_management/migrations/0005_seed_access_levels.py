from django.db import migrations

def seed_access_levels(apps, schema_editor):
    AccessLevel = apps.get_model('resource_management', 'AccessLevel')
    access_levels = [
        {'name': 'read only', 'description': 'Read-only access'},
        {'name': 'write only', 'description': 'Write-only access'},
        {'name': 'read and write', 'description': 'Read and write access'},
    ]
    for al in access_levels:
        AccessLevel.objects.get_or_create(name=al['name'], defaults={'description': al['description']})

class Migration(migrations.Migration):
    dependencies = [
        ('resource_management', '0004_alter_accesslevel_description_and_more'),
    ]
    operations = [
        migrations.RunPython(seed_access_levels),
    ]
