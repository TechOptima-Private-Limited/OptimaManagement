from rest_framework import serializers
from .models import Category, Page
from django.conf import settings
import re

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']

class PageSerializer(serializers.ModelSerializer):
    featured_image = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Page
        fields = [
            'id', 
            'title', 
            'slug', 
            'content',
            'category',
            'category_name',
            'author',
            'author_name',
            'is_published',
            'featured_image', 
            'created_at',
            'updated_at',
            'meta_description',
            'meta_keywords'
        ]
    def get_featured_image(self, obj):
        if obj.featured_image:
            return f"{settings.DOMAIN_NAME}{obj.featured_image.url}"
        return None

    def get_content(self, obj):
        if obj.content:
            # Replace relative media URLs with absolute URLs
            content = obj.content
            # Find all image sources in the content
            img_pattern = r'src=\"(/media/[^\"]+)\"'

            # Replace with absolute URLs
            content = re.sub(img_pattern, f'src="{settings.DOMAIN_NAME}\\1"', content)

            return content
        return None

