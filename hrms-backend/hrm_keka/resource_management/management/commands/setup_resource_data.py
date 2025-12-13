from django.core.management.base import BaseCommand
from resource_management.models import AccessLevel, ResourceType

class Command(BaseCommand):
    help = 'Sets up initial data for resource management'

    def handle(self, *args, **kwargs):
        # Create access levels
        access_levels = [
            ('Read', 'Read-only access to the resource'),
            ('Write', 'Read and write access to the resource'),
            ('Admin', 'Full administrative access to the resource'),
        ]
        
        for name, description in access_levels:
            AccessLevel.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
            self.stdout.write(f'Created access level: {name}')

        # Create resource types
        resource_types = [
            ('Repository', 'Code repositories (Git, SVN, etc.)'),
            ('Database', 'Database instances (MySQL, PostgreSQL, MongoDB, etc.)'),
            ('VM Instance', 'Virtual Machine instances'),
        ]
        
        for name, description in resource_types:
            ResourceType.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
            self.stdout.write(f'Created resource type: {name}')

        self.stdout.write(self.style.SUCCESS('Successfully set up initial data'))