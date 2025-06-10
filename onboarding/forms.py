### onboarding/forms.py
from django import forms
from .models import Employee, Document, OfferLetter

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ['name', 'email', 'employee_type']

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['doc_type', 'file']

class OfferLetterForm(forms.ModelForm):
    class Meta:
        model = OfferLetter
        fields = ['letter_file']