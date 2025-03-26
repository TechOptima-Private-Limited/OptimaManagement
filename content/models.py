from django.db import models

from django.db import models
from django.contrib.auth.models import User
from django_ckeditor_5.fields import CKEditor5Field  # Change this import
from django.utils.text import slugify
from bs4 import BeautifulSoup
import re

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=200, blank=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'

class Page(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True,max_length=500, blank=True)
    content = CKEditor5Field('Content', config_name='default')  # Change this field
    featured_image = models.ImageField(upload_to='pages/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    meta_description = models.CharField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=200, blank=True)

    def process_content_images(self, content):
        if not content:
            return content

        soup = BeautifulSoup(content, 'html.parser')

        # First, handle all paragraph and text content for word-wrap
        for paragraph in soup.find_all(['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            current_style = paragraph.get('style', '')
            style_dict = {}

            # Parse existing style
            if current_style:
                style_parts = current_style.split(';')
                for part in style_parts:
                    if ':' in part:
                        key_val = part.split(':', 1)
                        if len(key_val) == 2:
                            prop, val = key_val
                            style_dict[prop.strip()] = val.strip()

            # Add word-wrap and overflow properties
            style_dict['word-wrap'] = 'break-word'
            style_dict['overflow-wrap'] = 'break-word'
            style_dict['word-break'] = 'break-word'
            style_dict['max-width'] = '100%'
            style_dict['overflow'] = 'hidden'

            # Update the style attribute
            style_str = '; '.join([f"{prop}: {val}" for prop, val in style_dict.items()])
            paragraph['style'] = style_str

        # Then handle images
        images = soup.find_all('img')

        for img in images:
            # Get original width/height/style attributes before processing
            original_width = img.get('width')
            original_height = img.get('height')

            # Parse existing inline styles
            style_dict = {}
            if img.get('style'):
                style_parts = img.get('style').split(';')
                for part in style_parts:
                    if ':' in part:
                        key_val = part.split(':', 1)
                        if len(key_val) == 2:
                            prop, val = key_val
                            style_dict[prop.strip()] = val.strip()

            # Determine alignment from classes or align attribute
            alignment = None
            img_classes = img.get('class', '')
            if isinstance(img_classes, list):
                img_class_str = ' '.join(img_classes)
            else:
                img_class_str = img_classes

            if 'align-left' in img_class_str or 'left' in img_class_str:
                alignment = 'left'
            elif 'align-right' in img_class_str or 'right' in img_class_str:
                alignment = 'right'
            elif 'align-center' in img_class_str or 'center' in img_class_str:
                alignment = 'center'
            elif img.get('align'):
                alignment = img['align']

            # Remove problematic attributes that could override our styles
            for attr in ['align', 'width', 'height']:
                if attr in img.attrs:
                    del img[attr]

            # Apply responsive width that preserves editor sizing
            if original_width:
                # Convert percentage widths directly
                if str(original_width).endswith('%'):
                    style_dict['width'] = original_width
                else:
                    # For pixel values, set max-width and let width be 100%
                    width_val = original_width + 'px' if str(original_width).isdigit() else original_width
                    style_dict['max-width'] = width_val
                    style_dict['width'] = '100%'
            else:
                # Default responsive behavior
                style_dict['max-width'] = '100%'
                style_dict['width'] = 'auto'

            # Always set height to auto for proper aspect ratio
            style_dict['height'] = 'auto'

            # Apply alignment styles
            if alignment:
                # Wrap in div for better alignment control
                wrapper = soup.new_tag('div')
                wrapper['class'] = f'image-wrapper image-{alignment}'

                if alignment == 'left':
                    wrapper['style'] = 'float: left; margin: 0 1rem 1rem 0; max-width: 50%; overflow: hidden;'
                elif alignment == 'right':
                    wrapper['style'] = 'float: right; margin: 0 0 1rem 1rem; max-width: 50%; overflow: hidden;'
                elif alignment == 'center':
                    wrapper['style'] = 'text-align: center; margin: 1rem auto; overflow: hidden;'
                    style_dict['display'] = 'inline-block'

                # Add the wrapper around the image
                img.wrap(wrapper)
            else:
                # Default center alignment for standalone images
                style_dict['display'] = 'block'
                style_dict['margin-left'] = 'auto'
                style_dict['margin-right'] = 'auto'

            # Set the final inline styles
            style_str = '; '.join([f"{prop}: {val}" for prop, val in style_dict.items()])
            img['style'] = style_str

            # Add responsive class
            img_classes = img.get('class', '')
            if isinstance(img_classes, list):
                if 'responsive-img' not in img_classes:
                    img_classes.append('responsive-img')
                img['class'] = ' '.join(img_classes)
            else:
                # If it's a string
                if img_classes and 'responsive-img' not in img_classes:
                    img['class'] = f"{img_classes} responsive-img"
                elif not img_classes:
                    img['class'] = 'responsive-img'

        # Wrap the entire content in a container for word-wrap
        content_div = soup.new_tag('div')
        content_div['class'] = 'blog-content-wrapper'
        content_div['style'] = 'word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%; overflow: hidden;'

        # Move all body contents into this new div
        for child in list(soup.body.children) if soup.body else list(soup.children):
            content_div.append(child)

        if soup.body:
            soup.body.clear()
            soup.body.append(content_div)
        else:
            soup.clear()
            soup.append(content_div)

        return str(soup)

    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.title)

        # Process images in content
        self.content = self.process_content_images(self.content)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title