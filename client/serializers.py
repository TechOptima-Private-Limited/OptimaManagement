from rest_framework import serializers
from .models import ClientInformation

class ClientInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientInformation
        fields = '__all__'