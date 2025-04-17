from django import forms
from django.forms.widgets import DateInput

class CustomDatePickerWidget(DateInput):
    """
    A custom DateInput widget that renders with specific HTML attributes
    for better datepicker functionality.
    """
    template_name = 'admin/widgets/date.html'
    
    def __init__(self, attrs=None, format=None):
        attrs = attrs or {}
        attrs.update({
            'class': 'custom-datepicker', 
            'autocomplete': 'off',
            'data-date-format': 'yyyy-mm-dd',
            'placeholder': 'YYYY-MM-DD'
        })
        super().__init__(attrs=attrs, format=format or '%Y-%m-%d')
        
    class Media:
        css = {
            'all': ('admin/css/widgets/custom_date.css',)
        }
        js = ('admin/js/custom_admin.js',)