from rest_framework import serializers
from .models import Category, Page,Comment
from django.conf import settings
import re

class RecursiveCommentSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    author = serializers.CharField(read_only=True) 
    created_at = serializers.DateTimeField(read_only=True)
    replies = serializers.SerializerMethodField()

    def get_replies(self, obj):
        return RecursiveCommentSerializer(obj.replies.all(), many=True).data
    
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']
       
class CommentSerializer(serializers.ModelSerializer):
    author = serializers.CharField(required=False, allow_blank=True, default='Anonymous')
    replies = RecursiveCommentSerializer(many=True, read_only=True)
    class Meta:
        model = Comment
        fields = ['id', 'page', 'content', 'author','replies','parent','created_at']
        read_only_fields = ['id', 'created_at','replies', 'page']

class PageSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, required="False")
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
            'meta_keywords',
            'comments'
        ]

    def create(self, validated_data):
        post= self.context['page']
        parent_id = self.context['request'].data.get(['parent'])
        parent = None
        if parent_id:
            try:
                parent = Comment.objects.get(id=parent_id, post=post)
            except Comment.DoesNotExist:
                raise serializers.ValidationError("Invalid parent comment ID.")
        return Comment.objects.create(post=post, parent=parent, **validated_data)
    
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

