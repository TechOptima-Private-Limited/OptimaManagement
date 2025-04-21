# Create a new file named context_processors.py in your app directory

def admin_settings(request):
    """
    Custom context processor to add required admin variables.
    Add this to your settings.py TEMPLATES context_processors.
    """
    return {
        'help_url': None,
        'copyright_string': None,
        'project_site': None,
        'project_site_name': 'Resource Management',
        'original': None,
        'guidance_data_json': None
    }