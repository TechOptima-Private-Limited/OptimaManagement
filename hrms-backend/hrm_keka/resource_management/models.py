# # resource_management/models.py
# from django.db import models
# from django.conf import settings
# import datetime
# import uuid
# from django.utils import timezone
# from django_ckeditor_5.fields import CKEditor5Field 
# from bs4 import BeautifulSoup


# class ResourceType(models.Model):
#     name = models.CharField(max_length=100)
#     description = models.TextField()
#     is_active = models.BooleanField(default=True)

#     def __str__(self):
#         return self.name

# class Resource(models.Model):
#     name = models.CharField(max_length=200)
#     resource_type = models.ForeignKey(ResourceType, on_delete=models.CASCADE, related_name='resources')
#     description = models.TextField()
#     endpoint = models.CharField(max_length=255, blank=True, null=True)
#     environment = models.CharField(max_length=50, choices=[
#         ('DEV', 'Development'),
#         ('QA', 'Quality Assurance'),
#         ('UAT', 'User Acceptance Testing'),
#         ('PROD', 'Production')
#     ])
#     resource_team_email = models.EmailField(default='resource-team@example.com')
#     requires_approval = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     is_active = models.BooleanField(default=True)

#     class Meta:
#         ordering = ['resource_type', 'name']

#     def __str__(self):
#         return f"{self.resource_type.name} - {self.name}"

# class AccessLevel(models.Model):
#     name = models.CharField(max_length=50)
#     description = models.TextField()

#     def __str__(self):
#         return self.name

# class AccessRequest(models.Model):
#     PRIORITY_CHOICES = [
#         ('LOW', 'Low'),
#         ('MEDIUM', 'Medium'),
#         ('HIGH', 'High'),
#         ('URGENT', 'Urgent')
#     ]
#     STATUS_CHOICES = [
#         ('PENDING', 'Pending'),
#         ('APPROVAL_REQUIRED', 'Approval Required'),
#         ('APPROVER_APPROVED', 'Approver Approved'),
#         ('APPROVER_REJECTED', 'Approver Rejected'),
#         ('APPROVED', 'Approved'),
#         ('REJECTED', 'Rejected'),
#         ('REVOKED', 'Revoked')
#     ]
#     REQUEST_TYPE_CHOICES = [
#         ('NEW', 'New Access'),
#         ('IT', 'IT Support'),
#     ]

#     request_type = models.CharField(
#         max_length=20,
#         choices=REQUEST_TYPE_CHOICES,
#         default='NEW',
#     )

#     ticket_number = models.CharField(max_length=20, unique=True, default='ACC000000001', verbose_name="Ticket Number")
#     user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='access_requests', verbose_name="Requester")
#     resource = models.ForeignKey(Resource, on_delete=models.CASCADE, null=True,blank=True,verbose_name="Resource")
#     access_level = models.ForeignKey(AccessLevel, on_delete=models.CASCADE, null=True,blank=True,verbose_name="Access Level")
#     priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM', verbose_name="Priority")
#     justification = CKEditor5Field('Justification', config_name='default')
#     duration = models.IntegerField(help_text="Access duration in days", verbose_name="Duration (days)")
#     assigned_to = models.ForeignKey(
#         User,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='assigned_requests',
#         verbose_name="Assigned To"
#     )

#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Status")
#     requires_approval = models.BooleanField(default=False, verbose_name="Requires Approval")
#     notes = models.TextField(blank=True, null=True, help_text="Additional notes or comments", verbose_name="Notes")
#     approver_email = models.EmailField(null=True, blank=True, verbose_name="Approver Email")
#     approved_by = models.ForeignKey(
#         User,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='approved_requests',
#         verbose_name="Approved By"
#     )
#     approved_at = models.DateTimeField(null=True, blank=True, verbose_name="Approved At")
#     requested_at = models.DateTimeField(auto_now_add=True, verbose_name="Requested At")
#     expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Expires At")
#     approval_token = models.CharField(max_length=100, blank=True, null=True, unique=True, verbose_name="Approval Token")
#     approval_token_expiry = models.DateTimeField(blank=True, null=True, verbose_name="Approval Token Expiry")
#     request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, default='NEW', verbose_name="Request Type")

#     def process_content_images(self, justification):
#         if not justification:
#             return justification

#         soup = BeautifulSoup(justification, 'html.parser')

#         # First, handle all paragraph and text content for word-wrap
#         for paragraph in soup.find_all(['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
#             current_style = paragraph.get('style', '')
#             style_dict = {}

#             # Parse existing style
#             if current_style:
#                 style_parts = current_style.split(';')
#                 for part in style_parts:
#                     if ':' in part:
#                         key_val = part.split(':', 1)
#                         if len(key_val) == 2:
#                             prop, val = key_val
#                             style_dict[prop.strip()] = val.strip()

#             # Add word-wrap and overflow properties
#             style_dict['word-wrap'] = 'break-word'
#             style_dict['overflow-wrap'] = 'break-word'
#             style_dict['word-break'] = 'break-word'
#             style_dict['max-width'] = '100%'
#             style_dict['overflow'] = 'hidden'

#             # Update the style attribute
#             style_str = '; '.join([f"{prop}: {val}" for prop, val in style_dict.items()])
#             paragraph['style'] = style_str

#         # Then handle images
#         images = soup.find_all('img')

#         for img in images:
#             # Get original width/height/style attributes before processing
#             original_width = img.get('width')
#             original_height = img.get('height')
#             # Parse existing inline styles
#             style_dict = {}
#             if img.get('style'):
#                 style_parts = img.get('style').split(';')
#                 for part in style_parts:
#                     if ':' in part:
#                         key_val = part.split(':', 1)
#                         if len(key_val) == 2:
#                             prop, val = key_val
#                             style_dict[prop.strip()] = val.strip()

#             # Determine alignment from classes or align attribute
#             alignment = None
#             img_classes = img.get('class', '')
#             if isinstance(img_classes, list):
#                 img_class_str = ' '.join(img_classes)
#             else:
#                 img_class_str = img_classes

#             if 'align-left' in img_class_str or 'left' in img_class_str:
#                 alignment = 'left'
#             elif 'align-right' in img_class_str or 'right' in img_class_str:
#                 alignment = 'right'
#             elif 'align-center' in img_class_str or 'center' in img_class_str:
#                 alignment = 'center'
#             elif img.get('align'):
#                 alignment = img['align']

#             # Remove problematic attributes that could override our styles
#             for attr in ['align', 'width', 'height']:
#                 if attr in img.attrs:
#                     del img[attr]

#             # Apply responsive width that preserves editor sizing
#             if original_width:
#                 # Convert percentage widths directly
#                 if str(original_width).endswith('%'):
#                     style_dict['width'] = original_width
#                 else:
#                     # For pixel values, set max-width and let width be 100%
#                     width_val = original_width + 'px' if str(original_width).isdigit() else original_width
#                     style_dict['max-width'] = width_val
#                     style_dict['width'] = '100%'
#             else:
#                 # Default responsive behavior
#                 style_dict['max-width'] = '100%'
#                 style_dict['width'] = 'auto'

#             # Always set height to auto for proper aspect ratio
#             style_dict['height'] = 'auto'

#             # Apply alignment styles
#             if alignment:
#                 # Wrap in div for better alignment control
#                 wrapper = soup.new_tag('div')
#                 wrapper['class'] = f'image-wrapper image-{alignment}'

#                 if alignment == 'left':
#                     wrapper['style'] = 'float: left; margin: 0 1rem 1rem 0; max-width: 50%; overflow: hidden;'
#                 elif alignment == 'right':
#                     wrapper['style'] = 'float: right; margin: 0 0 1rem 1rem; max-width: 50%; overflow: hidden;'
#                 elif alignment == 'center':
#                     wrapper['style'] = 'text-align: center; margin: 1rem auto; overflow: hidden;'
#                     style_dict['display'] = 'inline-block'

#                 # Add the wrapper around the image
#                 img.wrap(wrapper)
#             else:
#                 # Default center alignment for standalone images
#                 style_dict['display'] = 'block'
#                 style_dict['margin-left'] = 'auto'
#                 style_dict['margin-right'] = 'auto'

#             # Set the final inline styles
#             style_str = '; '.join([f"{prop}: {val}" for prop, val in style_dict.items()])
#             img['style'] = style_str

#             # Add responsive class
#             img_classes = img.get('class', '')
#             if isinstance(img_classes, list):
#                 if 'responsive-img' not in img_classes:
#                     img_classes.append('responsive-img')
#                 img['class'] = ' '.join(img_classes)
#             else:
#                 # If it's a string
#                 if img_classes and 'responsive-img' not in img_classes:
#                     img['class'] = f"{img_classes} responsive-img"
#                 elif not img_classes:
#                     img['class'] = 'responsive-img'

#         # Wrap the entire content in a container for word-wrap
#         content_div = soup.new_tag('div')
#         content_div['class'] = 'justification-wrapper'
#         content_div['style'] = 'word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%; overflow: hidden;'

#         # Move all body contents into this new div
#         for child in list(soup.body.children) if soup.body else list(soup.children):
#             content_div.append(child)

#         if soup.body:
#             soup.body.clear()
#             soup.body.append(content_div)
#         else:
#             soup.clear()
#             soup.append(content_div)

#         return str(soup)

#     def save(self, *args, **kwargs):
#         if self._state.adding:  # Only if creating new instance
#             prefix = 'ACC'
#             date = timezone.now().strftime('%Y%m%d')
#             last_ticket = AccessRequest.objects.filter(
#                 ticket_number__startswith=f'{prefix}{date}'
#             ).order_by('-ticket_number').first()
            
#             if last_ticket:
#                 last_number = int(last_ticket.ticket_number[-4:])
#                 new_number = str(last_number + 1).zfill(4)
#             else:
#                 new_number = '0001'
            
#             self.ticket_number = f'{prefix}{date}{new_number}'
        
#         if not self.expires_at and self.duration:
#             self.expires_at = timezone.now() + datetime.timedelta(days=self.duration)
        
#         if self.status == 'APPROVAL_REQUIRED' and not self.approval_token:
#             self.approval_token = uuid.uuid4().hex
#             self.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
#         if self.justification:
#             self.justification = self.process_content_images(self.justification)
        
#         super().save(*args, **kwargs)
        

#     def __str__(self):
#         resource_name = self.resource.name if self.resource else "No Resource"
#         username = self.user.username if self.user else "Unknown User"
#         ticket = self.ticket_number if self.ticket_number else "No Ticket"
#         return f"{ticket} - {username} - {resource_name}"

# class AccessHistory(models.Model):
#     access_request = models.ForeignKey(AccessRequest, on_delete=models.CASCADE, related_name='history')
#     action = models.CharField(max_length=50)
#     performed_by = models.ForeignKey(
#         User, 
#         on_delete=models.SET_NULL, 
#         null=True, 
#         blank=True,
#         related_name='access_history'
#     )
#     performed_at = models.DateTimeField(auto_now_add=True)
#     notes = models.TextField(blank=True, null=True)

#     def __str__(self):
#         return f"{self.action} on {self.access_request.ticket_number} at {self.performed_at}"
    
# class EmailThread(models.Model):
#     ticket_number = models.CharField(max_length=20, unique=True)
#     thread_index = models.CharField(max_length=100)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Thread for {self.ticket_number}"





# resource_management/models.py
from django.db import models
from django.conf import settings
import datetime
import uuid
from django.utils import timezone
from django_ckeditor_5.fields import CKEditor5Field 
from bs4 import BeautifulSoup


class ResourceType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Resource(models.Model):
    name = models.CharField(max_length=200)
    resource_type = models.ForeignKey(ResourceType, on_delete=models.CASCADE, related_name='resources')
    description = models.TextField(blank=True)
    endpoint = models.CharField(max_length=255, blank=True, null=True)
    environment = models.CharField(max_length=50, choices=[
        ('DEV', 'Development'),
        ('QA', 'Quality Assurance'),
        ('UAT', 'User Acceptance Testing'),
        ('PROD', 'Production')
    ])
    resource_team_email = models.EmailField(default='resource-team@example.com')
    requires_approval = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['resource_type', 'name']

    def __str__(self):
        return f"{self.resource_type.name} - {self.name}"

class AccessLevel(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class AccessRequest(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent')
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVAL_REQUIRED', 'Approval Required'),
        ('APPROVER_APPROVED', 'Approver Approved'),
        ('APPROVER_REJECTED', 'Approver Rejected'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVOKED', 'Revoked')
    ]
    REQUEST_TYPE_CHOICES = [
        ('NEW', 'New Access'),
        ('IT', 'IT Support'),
        ('ASSET_REPAIR', 'Asset Repair'),
        ('ACCESS', 'Access Request'),
    ]

    request_type = models.CharField(
        max_length=20,
        choices=REQUEST_TYPE_CHOICES,
        default='NEW',
    )

    ticket_number = models.CharField(max_length=20, unique=True, default='ACC000000001', verbose_name="Ticket Number")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='access_requests', verbose_name="Requester")
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, null=True,blank=True,verbose_name="Resource")
    asset = models.ForeignKey('assets.Asset', on_delete=models.SET_NULL, null=True, blank=True, related_name='access_requests', verbose_name="Asset")
    access_level = models.ForeignKey(AccessLevel, on_delete=models.CASCADE, null=True,blank=True,verbose_name="Access Level")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM', verbose_name="Priority")
    justification = CKEditor5Field('Justification', config_name='default')
    # Changed: Made duration nullable and added default
    duration = models.IntegerField(null=True, blank=True, default=365, help_text="Access duration in days", verbose_name="Duration (days)")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests',
        verbose_name="Assigned To"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Status")
    requires_approval = models.BooleanField(default=False, verbose_name="Requires Approval")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes or comments", verbose_name="Notes")
    approver_email = models.EmailField(null=True, blank=True, verbose_name="Approver Email")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_requests',
        verbose_name="Approved By"
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name="Approved At")
    requested_at = models.DateTimeField(auto_now_add=True, verbose_name="Requested At")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Expires At")
    approval_token = models.CharField(max_length=100, blank=True, null=True, unique=True, verbose_name="Approval Token")
    approval_token_expiry = models.DateTimeField(blank=True, null=True, verbose_name="Approval Token Expiry")
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, default='NEW', verbose_name="Request Type")

    def process_content_images(self, justification):
        if not justification:
            return justification

        soup = BeautifulSoup(justification, 'html.parser')

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
        content_div['class'] = 'justification-wrapper'
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
        if self._state.adding:  # Only if creating new instance
            prefix = 'ACC'
            if self.request_type == 'IT':
                prefix = 'ITS'
            elif self.request_type == 'ASSET_REPAIR':
                prefix = 'REP'
            elif self.request_type == 'ACCESS':
                prefix = 'ACC'
            
            date = timezone.now().strftime('%Y%m%d')
            last_ticket = AccessRequest.objects.filter(
                ticket_number__startswith=f'{prefix}{date}'
            ).order_by('-ticket_number').first()
            
            if last_ticket:
                try:
                    # Extract numeric part (e.g., last 4 digits)
                    last_number = int(last_ticket.ticket_number[-4:])
                    new_number = str(last_number + 1).zfill(4)
                except ValueError:
                    new_number = '0001'
            else:
                new_number = '0001'
            
            self.ticket_number = f'{prefix}{date}{new_number}'
        
        # Updated: Check if duration exists before using it
        if not self.expires_at and self.duration:
            self.expires_at = timezone.now() + datetime.timedelta(days=self.duration)
        
        if self.status == 'APPROVAL_REQUIRED' and not self.approval_token:
            self.approval_token = uuid.uuid4().hex
            self.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
        if self.justification:
            self.justification = self.process_content_images(self.justification)
        
        super().save(*args, **kwargs)
        

    def __str__(self):
        resource_name = self.resource.name if self.resource else "No Resource"
        username = self.user.username if self.user else "Unknown User"
        ticket = self.ticket_number if self.ticket_number else "No Ticket"
        return f"{ticket} - {username} - {resource_name}"

class AccessHistory(models.Model):
    access_request = models.ForeignKey(AccessRequest, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='access_history'
    )
    performed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.action} on {self.access_request.ticket_number} at {self.performed_at}"
    
class EmailThread(models.Model):
    ticket_number = models.CharField(max_length=20, unique=True)
    thread_index = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Thread for {self.ticket_number}"


class CompanyDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='company_documents/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_company_documents',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
