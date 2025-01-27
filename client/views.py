from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import ClientInformation
from .serializers import ClientInformationSerializer
from email_service.utils import get_email_content, send_email_notification, get_email_content_for_optima
from dotenv import load_dotenv
import os

load_dotenv()

@api_view(['POST'])
@permission_classes([AllowAny])
def save_client_info(request):
    try:
        serializer = ClientInformationSerializer(data=request.data)
        if serializer.is_valid():
            client = serializer.save()
            
            # Send email notification
            subject, body = get_email_content(
                client.page_name,
                f"{client.first_name} {client.last_name}"
            )
            print("Client information ",client)
            
            send_email_notification(client.email, subject, body, is_html=False)

            subject, body = get_email_content_for_optima(
                client.page_name,
                f"{client.first_name} {client.last_name}",
                request.data
            )
            
            send_email_notification(os.getenv('SALES_EMAIL'), subject, body, is_html=True)

            return Response({
                'status': 'success',
                'message': 'Client information saved and email sent',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_client_list(request):
    try:
        clients = ClientInformation.objects.all()
        serializer = ClientInformationSerializer(clients, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)