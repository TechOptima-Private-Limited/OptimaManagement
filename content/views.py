from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import base64
from rest_framework import status
from .models import Category, Page
from .serializers import CategorySerializer, PageSerializer
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated ,AllowAny
from rest_framework.response import Response


        
from django.db.models import Q        
@api_view(['GET'])
def search_users(request):
    search_query = request.GET.get('q', '')
    print("search_query -----------------",search_query)
    User = get_user_model()
    print("User -----------------",User)
    users = User.objects.filter(
        Q(username__icontains=search_query) |
        Q(email__icontains=search_query)
    )[:10]  # Limit to 10 results
    
    user_data = [{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff
    } for user in users]
    
    return Response(user_data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]  # Allow any user to create posts
    lookup_field = 'slug'

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()  # Add this line
    serializer_class = PageSerializer
    permission_classes = [AllowAny]  # Allow any user to create posts
    # lookup_field = 'slug'

    def get_queryset(self):
        queryset = Page.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save()  # Save without author if user is not authenticated
            
    @action(detail=False, methods=['post'])
    def upload_image(self, request):
        try:
            image_data = request.data['image']
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            data = ContentFile(base64.b64decode(imgstr))
            file_name = f'page_images/{request.data["filename"]}'
            path = default_storage.save(file_name, data)
            return Response({'url': default_storage.url(path)})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    def retrieve(self, request, pk=None):
        try:
            page = Page.objects.get(pk=pk)
            serializer = self.get_serializer(page)
            return Response(serializer.data)
        except Page.DoesNotExist:
            return Response(
                {"error": "Post not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context