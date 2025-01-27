from django.contrib import admin
from .models import ClientInformation

@admin.register(ClientInformation)
class ClientInformationAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'company', 'email', 'page_name', 'created_at')
    list_filter = ('page_name', 'country', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'company')
    date_hierarchy = 'created_at'