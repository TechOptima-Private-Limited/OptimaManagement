from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction

class Command(BaseCommand):
    help = "Loads sample data into the CRM module (leads, companies, contacts, and deals)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting to load sample CRM data..."))
        
        try:
            with transaction.atomic():
                # Load the sample data fixture
                call_command('loaddata', 'sample_crm_data.json', verbosity=1)
                
            self.stdout.write(self.style.SUCCESS("Successfully loaded sample CRM data."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error loading sample CRM data: {str(e)}"))
