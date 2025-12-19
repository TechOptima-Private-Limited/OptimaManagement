
# # # import uuid
# # # import base64
# # # import datetime
# # # import os
# # # import re
# # # from django.core.mail import EmailMessage, EmailMultiAlternatives
# # # from django.conf import settings
# # # from django.template.loader import render_to_string
# # # from django.utils.html import strip_tags
# # # from django.utils import timezone
# # # from django.utils.http import urlsafe_base64_encode
# # # from django.utils.encoding import force_bytes
# # # from django.core.files.storage import default_storage
# # # from django.core.files.base import ContentFile
# # # from .models import Resource, EmailThread
# # # templates_path = os.path.join(settings.BASE_DIR, 'templates/resource_management/emails/')

# # # # def extract_images_from_html(html_content):
# # # #     """
# # # #     Extract all image sources from HTML content
# # # #     Returns list of image paths found in the HTML
# # # #     """
# # # #     if not html_content:
# # # #         return []
    
# # # #     # Find all img tags with src attributes
# # # #     img_pattern = r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>'
# # # #     matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
# # # #     image_paths = []
# # # #     for src in matches:
# # # #         # Handle both relative and absolute URLs
# # # #         if src.startswith('/media/'):
# # # #             # Remove leading slash and media/ for default_storage
# # # #             clean_path = src.replace('/media/', '')
# # # #             image_paths.append(clean_path)
# # # #         elif src.startswith(settings.MEDIA_URL):
# # # #             # Handle full media URLs
# # # #             clean_path = src.replace(settings.MEDIA_URL, '')
# # # #             image_paths.append(clean_path)
    
# # # #     return image_paths

# # # def extract_images_from_html(html_content):
# # #     """
# # #     Extract all image sources from HTML content
# # #     Returns list of image paths found in the HTML
# # #     """
# # #     print(f"🔍 extract_images_from_html called with content length: {len(html_content) if html_content else 0}")
    
# # #     if not html_content:
# # #         print(f"❌ No HTML content provided")
# # #         return []
    
# # #     print(f"📝 HTML content preview (first 300 chars): {html_content[:300]}...")
    
# # #     # Find all img tags with src attributes
# # #     import re
# # #     img_pattern = r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>'
# # #     matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
# # #     print(f"🔍 Found {len(matches)} img src matches using pattern: {img_pattern}")
# # #     for i, match in enumerate(matches):
# # #         print(f"  Match {i+1}: {match}")
    
# # #     image_paths = []
# # #     for i, src in enumerate(matches):
# # #         print(f"🖼️ Processing src {i+1}: {src}")
        
# # #         # Handle both relative and absolute URLs
# # #         if src.startswith('/media/'):
# # #             # Remove leading slash and media/ for default_storage
# # #             clean_path = src.replace('/media/', '')
            
# # #             # 🔧 URL DECODE THE FILENAME
# # #             from urllib.parse import unquote
# # #             decoded_path = unquote(clean_path)
            
# # #             image_paths.append(decoded_path)
# # #             print(f"  ✅ Added relative media path: {clean_path}")
# # #             print(f"  🔧 URL decoded to: {decoded_path}")
            
# # #         elif src.startswith(settings.MEDIA_URL):
# # #             # Handle full media URLs
# # #             clean_path = src.replace(settings.MEDIA_URL, '')
            
# # #             # 🔧 URL DECODE THE FILENAME
# # #             from urllib.parse import unquote
# # #             decoded_path = unquote(clean_path)
            
# # #             image_paths.append(decoded_path)
# # #             print(f"  ✅ Added full media URL path: {clean_path}")
# # #             print(f"  🔧 URL decoded to: {decoded_path}")
# # #         else:
# # #             print(f"  ⚠️ Skipping non-media URL: {src}")
    
# # #     print(f"📸 Final image_paths extracted: {image_paths}")
# # #     return image_paths


# # # def process_html_for_email(html_content, ticket_number):
# # #     """
# # #     Process HTML content to handle images for email
# # #     Returns updated HTML and list of image attachments
# # #     """
# # #     if not html_content:
# # #         return html_content, []
    
# # #     image_paths = extract_images_from_html(html_content)
# # #     image_attachments = []
    
# # #     for image_path in image_paths:
# # #         try:
# # #             if default_storage.exists(image_path):
# # #                 # Read the image file
# # #                 with default_storage.open(image_path, 'rb') as image_file:
# # #                     image_data = image_file.read()
                
# # #                 # Get filename and extension
# # #                 filename = os.path.basename(image_path)
# # #                 file_ext = filename.split('.')[-1].lower()
                
# # #                 # Create attachment info
# # #                 image_attachments.append({
# # #                     'filename': filename,
# # #                     'data': image_data,
# # #                     'content_type': f'image/{file_ext}',
# # #                     'path': image_path
# # #                 })
                
# # #                 print(f"Found image for email: {image_path}")
# # #             else:
# # #                 print(f"Image not found in storage: {image_path}")
# # #         except Exception as e:
# # #             print(f"Error processing image {image_path}: {str(e)}")
    
# # #     return html_content, image_attachments


# # # def process_base64_images(html_content, ticket_number):
# # #     """
# # #     Process base64 embedded images and save them to storage
# # #     Returns updated HTML with saved image URLs
# # #     """
# # #     if not html_content:
# # #         return html_content, []
    
# # #     # Find all base64 images
# # #     img_pattern = r'<img[^>]*src="data:image/([^;]+);base64,([^"]+)"[^>]*>'
# # #     saved_images = []
    
# # #     def replace_image(match):
# # #         img_format = match.group(1)  # jpeg, png, etc.
# # #         img_data = match.group(2)    # base64 data
        
# # #         try:
# # #             # Decode base64
# # #             image_data = base64.b64decode(img_data)
            
# # #             # Generate unique filename
# # #             filename = f"email_images/{ticket_number}/{uuid.uuid4().hex}.{img_format}"
            
# # #             # Save to storage
# # #             path = default_storage.save(filename, ContentFile(image_data))
# # #             DOMAIN_NAME = os.getenv('SITE_URL')
# # #             # Generate URL for email
# # #             if settings.DEBUG:
# # #                 image_url = f"{DOMAIN_NAME}{settings.MEDIA_URL}{path}"
# # #             else:
# # #                 image_url = default_storage.url(path)
            
# # #             saved_images.append({
# # #                 'filename': os.path.basename(filename),
# # #                 'data': image_data,
# # #                 'content_type': f'image/{img_format}',
# # #                 'path': path
# # #             })
            
# # #             # Replace with new img tag
# # #             return f'<img src="{image_url}" style="max-width: 100%; height: auto;">'
            
# # #         except Exception as e:
# # #             print(f"Error processing base64 image: {str(e)}")
# # #             return match.group(0)  # Return original if error
    
# # #     # Replace all base64 images
# # #     updated_html = re.sub(img_pattern, replace_image, html_content)
    
# # #     return updated_html, saved_images





# # # def send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
# # #     """
# # #     Enhanced email sending function that handles images with CID embedding for inline display
# # #     """
# # #     try:
# # #         base_message_id = generate_message_id(ticket_number)
# # #         message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
# # #         thread_index = generate_thread_index(ticket_number)

# # #         if subject.startswith("Welcome to Optima Hub Management"):
# # #             subject = subject
# # #         else:
# # #             base_subject = f"Access Request {ticket_number}"
# # #             if not subject.startswith(base_subject):
# # #                 subject = base_subject if not is_reply else f"Re: {base_subject}"

# # #         headers = {
# # #             'Message-ID': message_id,
# # #             'References': base_message_id,
# # #             'In-Reply-To': base_message_id if is_reply else None,
# # #             'Thread-Index': thread_index,
# # #             'Subject': subject,
# # #         }

# # #         all_attachments = []
# # #         processed_html = html_message
# # #         cid_mapping = {}  # Store filename -> CID mapping

# # #         if html_message:
# # #             # First, process any base64 images
# # #             processed_html, base64_images = process_base64_images(html_message, ticket_number)
# # #             all_attachments.extend(base64_images)
            
# # #             # Then, find and attach existing images from media folder
# # #             final_html, media_images = process_html_for_email(processed_html, ticket_number)
# # #             all_attachments.extend(media_images)
            
# # #             processed_html = final_html

# # #         # 🔧 NEW: Create CID mappings and update HTML for inline display
# # #         if processed_html and all_attachments:
# # #             import re
            
# # #             # Create CID for each image and update HTML
# # #             for i, attachment in enumerate(all_attachments):
# # #                 filename = attachment['filename']
# # #                 cid = f"image{i+1}_{uuid.uuid4().hex[:8]}"
# # #                 cid_mapping[filename] = cid
                
# # #                 # Replace /media/ URLs with cid: URLs in HTML
# # #                 media_pattern = f"/media/{re.escape(filename.replace(' ', '%20'))}"
# # #                 cid_url = f"cid:{cid}"
# # #                 processed_html = re.sub(media_pattern, cid_url, processed_html)
                
# # #                 print(f"🔗 Mapped {filename} -> cid:{cid}")

# # #         # Create email with attachments and CID embedding
# # #         if processed_html and all_attachments:
# # #             # Use EmailMultiAlternatives for HTML with attachments
# # #             from django.core.mail import EmailMultiAlternatives
# # #             from email.mime.image import MIMEImage
            
# # #             email = EmailMultiAlternatives(
# # #                 subject=subject,
# # #                 body=strip_tags(processed_html) if processed_html else body,
# # #                 from_email=settings.DEFAULT_FROM_EMAIL,
# # #                 to=recipients,
# # #                 headers=headers
# # #             )
            
# # #             # Attach HTML version
# # #             email.attach_alternative(processed_html, "text/html")
            
# # #             # Attach all images with CID for inline display
# # #             for attachment in all_attachments:
# # #                 filename = attachment['filename']
# # #                 image_data = attachment['data']
# # #                 content_type = attachment['content_type']
                
# # #                 # Create MIMEImage for proper inline embedding
# # #                 if content_type.startswith('image/'):
# # #                     img = MIMEImage(image_data)
# # #                     cid = cid_mapping.get(filename, f"image_{uuid.uuid4().hex[:8]}")
# # #                     img.add_header('Content-ID', f'<{cid}>')
# # #                     img.add_header('Content-Disposition', 'inline', filename=filename)
# # #                     email.attach(img)
# # #                     print(f"📎 Attached inline image: {filename} with CID: {cid}")
# # #                 else:
# # #                     # Fallback for non-image files
# # #                     email.attach(filename, image_data, content_type)
# # #                     print(f"📎 Attached file: {filename}")
                
# # #         elif processed_html:
# # #             # HTML email without attachments
# # #             from django.core.mail import EmailMultiAlternatives
# # #             email = EmailMultiAlternatives(
# # #                 subject=subject,
# # #                 body=strip_tags(processed_html),
# # #                 from_email=settings.DEFAULT_FROM_EMAIL,
# # #                 to=recipients,
# # #                 headers=headers
# # #             )
# # #             email.attach_alternative(processed_html, "text/html")
# # #         else:
# # #             # Plain text email
# # #             from django.core.mail import EmailMessage
# # #             email = EmailMessage(
# # #                 subject=subject,
# # #                 body=body,
# # #                 from_email=settings.DEFAULT_FROM_EMAIL,
# # #                 to=recipients,
# # #                 headers=headers
# # #             )

# # #         email.send()
# # #         print(f"📧 Email sent successfully to {', '.join(recipients)} with {len(all_attachments)} image attachments")
# # #         print(f"🖼️ Images embedded inline with CID mapping: {cid_mapping}")
# # #         return True
        
# # #     except Exception as e:
# # #         print(f"❌ Failed to send email: {str(e)}")
# # #         import traceback
# # #         traceback.print_exc()
# # #         return False


# # # # Keep your existing utility functions
# # # def get_or_create_thread_index(ticket_number):
# # #     thread, created = EmailThread.objects.get_or_create(
# # #         ticket_number=ticket_number,
# # #         defaults={'thread_index': base64.b64encode(f"thread-{ticket_number}".encode()).decode()}
# # #     )
# # #     return thread.thread_index

# # # def generate_message_id(ticket_number):
# # #     domain = 'techoptima.ai'
# # #     return f'<access-request-{ticket_number}@{domain}>'

# # # def generate_thread_index(ticket_number):
# # #     thread_id = f"thread-{ticket_number}-{uuid.uuid4().hex[:8]}"
# # #     return base64.b64encode(thread_id.encode()).decode()

# # # # Replace your existing send_threaded_email function with this enhanced version
# # # def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
# # #     """
# # #     Updated to use the enhanced image-aware email function
# # #     """
# # #     return send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply, html_message)

# # # def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
# # #     return send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=html_message)

# # # def generate_approval_token(access_request):
# # #     """Generate a secure token for approval/rejection links"""
# # #     return urlsafe_base64_encode(force_bytes(f"{access_request.id}-{access_request.ticket_number}-{uuid.uuid4().hex}"))

# # # def get_approval_urls(request_id, token, for_resource_owner=False):
# # #     """Generate approval and rejection URLs"""
# # #     base_url = settings.SITE_URL.rstrip('/')
# # #     if for_resource_owner:
# # #         approve_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/approve/"
# # #         reject_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/reject/"
# # #     else:
# # #         approve_url = f"{base_url}/api/approve-request/{request_id}/{token}/approve/"
# # #         reject_url = f"{base_url}/api/approve-request/{request_id}/{token}/reject/"
# # #     print(f"Generated Approve URL: {approve_url}")
# # #     print(f"Generated Reject URL: {reject_url}")
# # #     return approve_url, reject_url

# # # def get_user_role(user):
# # #     if user.is_superuser:
# # #         return 'superuser'
# # #     if Resource.objects.filter(resource_team_email=user.email).exists():
# # #         return 'resource_owner'
# # #     return 'employee'


# # # def send_email_notification(obj, subject, template_name, context, recipients=None, is_reply=True):
# # #     print(f"🚀 Starting send_email_notification for template: {template_name}")
# # #     print(f"🎯 Subject: {subject}")
# # #     print(f"👥 Recipients provided: {recipients}")
    
# # #     try:
# # #         if recipients is None:
# # #             print("📝 Recipients is None, determining from obj...")
# # #             if obj is None:
# # #                 raise ValueError("Recipients must be provided if obj is None")
# # #             recipients = [obj.user.email]
# # #             print(f"📧 Added user email: {obj.user.email}")
# # #             print(f"🔍 DEBUG: obj.resource = {obj.resource}")
# # #             print(f"🔍 DEBUG: obj.resource.name = {obj.resource.name if obj.resource else 'No Resource'}")
            
# # #             if obj.resource and obj.resource.resource_team_email:
# # #                 print(f"🔍 DEBUG: Found resource_team_email = {obj.resource.resource_team_email}")
# # #                 recipients.append(obj.resource.resource_team_email)
# # #                 print(f"🔍 DEBUG: Added to recipients. Final recipients = {recipients}")
# # #             else:
# # #                 print(f"🔍 DEBUG: No resource_team_email found for resource {obj.resource.name if obj.resource else 'None'}")

# # #         print(f"👥 Final recipients list: {recipients}")
        
# # #         # 🖼️ DETAILED IMAGE DEBUGGING
# # #         processed_justification = context.get('justification', '')
# # #         print(f"🖼️ DEBUGGING JUSTIFICATION CONTENT:")
# # #         print(f"📝 Raw justification type: {type(processed_justification)}")
# # #         print(f"📝 Raw justification length: {len(str(processed_justification))} characters")
# # #         print(f"📝 First 200 chars: {str(processed_justification)[:200]}...")
        
# # #         # Check for image indicators
# # #         has_img_tag = '<img' in str(processed_justification)
# # #         has_src_attr = 'src=' in str(processed_justification)
# # #         has_media_url = '/media/' in str(processed_justification)
# # #         has_base64 = 'data:image' in str(processed_justification)
        
# # #         print(f"🔍 Image indicators:")
# # #         print(f"  - Has <img tag: {has_img_tag}")
# # #         print(f"  - Has src= attribute: {has_src_attr}")
# # #         print(f"  - Has /media/ URL: {has_media_url}")
# # #         print(f"  - Has base64 data: {has_base64}")
        
# # #         if processed_justification and obj:
# # #             print(f"🖼️ Processing justification content for images...")
            
# # #             # Check if justification contains images
# # #             if has_img_tag or has_src_attr:
# # #                 print(f"🖼️ Found images in justification content")
                
# # #                 # Show what images we're trying to extract
# # #                 image_paths = extract_images_from_html(str(processed_justification))
# # #                 print(f"📸 extract_images_from_html found: {len(image_paths)} images")
# # #                 for i, path in enumerate(image_paths):
# # #                     print(f"  Image {i+1}: {path}")
                
# # #                 # Process base64 images and save them
# # #                 if has_base64:
# # #                     print(f"💾 Processing base64 images...")
# # #                     processed_justification, base64_images = process_base64_images(str(processed_justification), obj.ticket_number)
# # #                     if base64_images:
# # #                         print(f"💾 Processed {len(base64_images)} base64 images")
# # #                         for i, img in enumerate(base64_images):
# # #                             print(f"  Base64 Image {i+1}: {img['filename']} ({img['content_type']})")
# # #                     else:
# # #                         print(f"💾 No base64 images processed")
# # #                 else:
# # #                     print(f"📷 No base64 images found, processing existing media images...")
                
# # #                 # Update context with processed justification
# # #                 context = context.copy()  # Don't modify original context
# # #                 context['justification'] = processed_justification
# # #                 print(f"📝 Updated context with processed justification")
# # #             else:
# # #                 print(f"📝 No images found in justification content")
# # #         else:
# # #             print(f"📝 No justification content to process (empty or no obj)")
        
# # #         # Try to render the template
# # #         print(f"🎨 Attempting to render template: {templates_path}{template_name}")
# # #         print(f"📋 Template context keys: {list(context.keys())}")
# # #         # templates/resource_management/emails
# # #         try:
# # #             html_message = render_to_string(f'{templates_path}{template_name}', context)
# # #             print(f"✅ Template rendered successfully, length: {len(html_message)} characters")
            
# # #             # Check if the rendered HTML contains images
# # #             rendered_has_img = '<img' in html_message
# # #             rendered_has_media = '/media/' in html_message
# # #             print(f"🎨 Rendered template image check:")
# # #             print(f"  - Rendered HTML has <img: {rendered_has_img}")
# # #             print(f"  - Rendered HTML has /media/: {rendered_has_media}")
            
# # #             if rendered_has_img:
# # #                 print(f"📸 Images found in rendered HTML - first 300 chars around img:")
# # #                 import re
# # #                 img_matches = re.findall(r'.{0,50}<img[^>]*>.{0,50}', html_message)
# # #                 for i, match in enumerate(img_matches[:3]):  # Show first 3 matches
# # #                     print(f"  Match {i+1}: {match}")
            
# # #         except Exception as template_error:
# # #             print(f"❌ Template rendering failed: {str(template_error)}")
# # #             raise template_error
        
# # #         plain_message = strip_tags(html_message)
# # #         print(f"📄 Plain message length: {len(plain_message)} characters")
        
# # #         # Use ticket_number from obj if available, otherwise generate a unique message ID
# # #         ticket_number = f"employee-{context['user'].id}" if obj is None else obj.ticket_number
# # #         print(f"🎫 Using ticket_number: {ticket_number}")
        
# # #         # 🖼️ Use the enhanced email function that handles images
# # #         print(f"📤 Calling send_threaded_email_with_images (image-aware)...")
# # #         email_result = send_threaded_email_with_images(
# # #             subject=subject,
# # #             body=plain_message,
# # #             recipients=recipients,
# # #             ticket_number=ticket_number,
# # #             is_reply=is_reply,
# # #             html_message=html_message
# # #         )
        
# # #         if email_result:
# # #             print(f"✅ Email sent successfully to {', '.join(recipients)}")
# # #             return True
# # #         else:
# # #             print(f"❌ send_threaded_email_with_images returned False")
# # #             return False
            
# # #     except Exception as e:
# # #         print(f"❌ EXCEPTION in send_email_notification: {str(e)}")
# # #         print(f"🔍 Exception type: {type(e)}")
# # #         import traceback
# # #         print(f"📜 Full traceback:")
# # #         traceback.print_exc()
# # #         return False




# # # from resource_management.models import ResourceType, Resource
# # # def send_request_notification(access_request):
# # #     """Send email notification for new access request"""
# # #     print("🚀 Starting send_request_notification...") 
    
# # #     # 🔍 Debug the resource assignment
# # #     print(f"🔍 DEBUG: access_request.resource = {access_request.resource}")
# # #     if access_request.resource:
# # #         print(f"🔍 DEBUG: resource.name = {access_request.resource.name}")
# # #         print(f"🔍 DEBUG: resource.resource_team_email = {access_request.resource.resource_team_email}")
# # #     else:
# # #         print(f"🔍 DEBUG: No resource found for this request")
        
# # #         # 🚨 CRITICAL FIX: Auto-assign IT Support resource if missing
# # #         if access_request.request_type == 'IT':
# # #             try:
# # #                 print("🔧 Attempting to auto-assign IT Support resource...")
# # #                 it_resource_type = ResourceType.objects.get(name='IT Support')
# # #                 it_resource = Resource.objects.filter(
# # #                     resource_type=it_resource_type,
# # #                     is_active=True
# # #                 ).first()
                
# # #                 if it_resource:
# # #                     access_request.resource = it_resource
# # #                     access_request.save()
# # #                     print(f"✅ AUTO-ASSIGNED IT resource: {it_resource.name} with email: {it_resource.resource_team_email}")
# # #                 else:
# # #                     print("❌ No active IT Support resource found in database")
# # #             except ResourceType.DoesNotExist:
# # #                 print("❌ IT Support resource type not found in database")

# # #     try:
# # #         if access_request.request_type == 'IT':
# # #             # IT support-specific context
# # #             it_support_context = {
# # #                 'ticket': access_request.ticket_number,
# # #                 'user': access_request.user,
# # #                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
# # #                 'priority': access_request.get_priority_display(),
# # #                 'justification': access_request.justification,
# # #                 'duration': access_request.duration,
# # #             }
# # #             print(f"📧 Preparing to send IT support emails with context: {list(it_support_context.keys())}")
            
# # #             # 📧 Send email to user (try multiple templates as fallback)
# # #             print("📤 Attempting to send user email...")
# # #             user_templates = [f'{templates_path}it_support_user.html', f'{templates_path}new_request_user.html']

# # #             for template in user_templates:
# # #                 print(f"🎨 Trying user template: {template}")
# # #                 result = send_email_notification(
# # #                     access_request,
# # #                     f"New IT Support Ticket - ID {access_request.ticket_number}",
# # #                     template,
# # #                     it_support_context,
# # #                     [access_request.user.email],
# # #                     is_reply=False
# # #                 )
                
# # #                 if result:
# # #                     print(f"✅ USER EMAIL SUCCESS with template: {template}")
# # #                     break
# # #                 else:
# # #                     print(f"❌ USER EMAIL FAILED with template: {template}")
            
# # #             # 📧 Send email to IT team
# # #             team_email = None
# # #             if access_request.resource and access_request.resource.resource_team_email:
# # #                 team_email = access_request.resource.resource_team_email
# # #             else:
# # #                 # Use your specific email as fallback
# # #                 team_email = access_request.user.email  # Your email
# # #                 print(f"⚠️ Using fallback email: {team_email}")
            
# # #             print(f"📧 Preparing to send IT team email to: {team_email}")
            
# # #             team_context = it_support_context.copy()
# # #             team_context['requester'] = team_context['user_name']
# # #             team_context['requester_employee_id'] = access_request.user.username
            
# # #             # Try multiple team templates as fallback
# # #             print("📤 Attempting to send team email...")
# # #             team_templates = [f'{templates_path}it_support_team.html', f'{templates_path}new_request_team.html']

# # #             for template in team_templates:
# # #                 print(f"🎨 Trying team template: {template}")
# # #                 result = send_email_notification(
# # #                     access_request,
# # #                     f"Access Request {access_request.ticket_number}",
# # #                     template,
# # #                     team_context,
# # #                     [team_email],
# # #                     is_reply=True
# # #                 )
                
# # #                 if result:
# # #                     print(f"✅ TEAM EMAIL SUCCESS with template: {template}")
# # #                     break
# # #                 else:
# # #                     print(f"❌ TEAM EMAIL FAILED with template: {template}")
            
# # #         else:
# # #             # Regular access request (non-IT)
# # #             print("📧 Processing regular access request...")
# # #             user_context = {
# # #                 'ticket': access_request.ticket_number,
# # #                 'user': access_request.user,
# # #                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
# # #                 'resource': getattr(access_request.resource, 'name', 'N/A') if access_request.resource else "N/A",
# # #                 'access_level': getattr(access_request.access_level, 'name', 'N/A') if access_request.access_level else "N/A",
# # #                 'priority': access_request.get_priority_display(),
# # #                 'justification': access_request.justification,
# # #                 'resource_type': getattr(access_request.resource.resource_type, 'name', 'N/A') if access_request.resource and access_request.resource.resource_type else "N/A",
# # #                 'duration': access_request.duration,
# # #                 'approval_token_expiry': access_request.approval_token_expiry,
# # #             }
            
# # #             # Send to user
# # #             user_result = send_email_notification(
# # #                 access_request,
# # #                 f"Access Request {access_request.ticket_number}",
# # #                 f'{templates_path}new_request_user.html',
# # #                 user_context,
# # #                 [access_request.user.email],
# # #                 is_reply=False
# # #             )
            
# # #             if user_result:
# # #                 print("✅ Regular access request user email sent")
# # #             else:
# # #                 print("❌ Regular access request user email failed")

# # #             # Send to team
# # #             if access_request.resource and access_request.resource.resource_team_email:
# # #                 team_context = user_context.copy()
# # #                 team_context['requester'] = user_context['user_name']
# # #                 team_result = send_email_notification(
# # #                     access_request,
# # #                     f"Access Request {access_request.ticket_number}",
# # #                     f'{templates_path}new_request_team.html',
# # #                     team_context,
# # #                     [access_request.resource.resource_team_email],
# # #                     is_reply=True
# # #                 )
                
# # #                 if team_result:
# # #                     print(f"✅ Regular access request team email sent to: {access_request.resource.resource_team_email}")
# # #                 else:
# # #                     print(f"❌ Regular access request team email failed")
# # #             else:
# # #                 print("❌ No resource team email found for regular access request")

# # #     except Exception as e:
# # #         print(f"❌ CRITICAL ERROR in send_request_notification: {str(e)}")
# # #         import traceback
# # #         traceback.print_exc()
# # #         return False

# # #     print("🏁 send_request_notification completed")
# # #     return True





# # # def send_approval_request_notification(obj, notes):
# # #     """Send approval request with proper URLs"""
# # #     try:
# # #         if not obj.approval_token:
# # #             obj.approval_token = uuid.uuid4().hex
# # #             obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
# # #             obj.save()
# # #             print(f"Generated and saved token: {obj.approval_token}")

# # #         approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)

# # #         context = {
# # #             'ticket': obj.ticket_number,
# # #             'requester': obj.user,  # Pass the User object instead of a string
# # #             'resource': obj.resource.name,
# # #             'access_level': obj.access_level.name,
# # #             'justification': obj.justification,
# # #             'notes': notes,
# # #             'approve_url': approve_url,
# # #             'reject_url': reject_url,
# # #             'approval_token_expiry': obj.approval_token_expiry,  # Add expiry date to context
# # #         }

# # #         print(f"Sending approval email with context: {context}")

# # #         html_message = render_to_string('resource_management/emails/approval_required_approver.html', context)
        
# # #         send_threaded_email(
# # #             subject=f"Access Request {obj.ticket_number}",
# # #             body='',
# # #             recipients=[obj.approver_email],
# # #             ticket_number=obj.ticket_number,
# # #             html_message=html_message,
# # #             is_reply=False
# # #         )
# # #         return True
# # #     except Exception as e:
# # #         print(f"Failed to send approval request email: {str(e)}")
# # #         return False

# # # def send_status_notification(obj, old_status, notes=''):
# # #     base_context = {
# # #         'ticket': obj.ticket_number,
# # #         'user': obj.user,  # Pass the User object
# # #         'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name separately
# # #         'resource': obj.resource.name,
# # #         'access_level': obj.access_level.name,
# # #         'old_status': old_status,
# # #         'new_status': obj.get_status_display(),
# # #         'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
# # #         'notes': notes
# # #     }

# # #     # Notify the requester
# # #     user_context = base_context.copy()
# # #     if obj.status == 'APPROVED':
# # #         template = f'{templates_path}approval_notification.html'
# # #     elif obj.status == 'REJECTED':
# # #         template = f'{templates_path}rejection_notification.html'
# # #     elif obj.status == 'APPROVAL_REQUIRED':
# # #         template = f'{templates_path}approval_request.html'
# # #     else:
# # #         template = f'{templates_path}status_update.html'

# # #     send_email_notification(
# # #         obj,
# # #         f"Access Request {obj.ticket_number}",
# # #         template,
# # #         user_context,
# # #         [obj.user.email],
# # #         is_reply=True
# # #     )

# # #     # Notify the resource team (only skip for APPROVER_APPROVED and APPROVER_REJECTED)
# # #     if obj.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
# # #         team_context = base_context.copy()
# # #         team_context['requester'] = base_context['user_name']
# # #         if obj.status == 'APPROVAL_REQUIRED':
# # #             template = f'{templates_path}approval_required_team.html'
# # #         else:
# # #             template = f'{templates_path}status_update.html'

# # #         send_email_notification(
# # #             obj,
# # #             f"Access Request {obj.ticket_number}",
# # #             template,
# # #             team_context,
# # #             [obj.resource.resource_team_email],
# # #             is_reply=True
# # #         )

# # #     # Notify the assignee for any status change
# # #     if obj.assigned_to:
# # #         assignee_context = base_context.copy()
# # #         assignee_context['assignee'] = obj.assigned_to.get_full_name() or obj.assigned_to.username
# # #         assignee_context['assignee_employee_id'] = obj.assigned_to.username
# # #         template = f'{templates_path}status_update_assignee.html' if obj.status == 'APPROVED' else f'{templates_path}rejection_notification_assignee.html' if obj.status == 'REJECTED' else f'{templates_path}status_update_assignee.html'
# # #         send_email_notification(
# # #             obj,
# # #             f"Access Request {obj.ticket_number} - {obj.get_status_display()}",
# # #             template,
# # #             assignee_context,
# # #             [obj.assigned_to.email],
# # #             is_reply=True
# # #         )

# # #     # Notify the approver if the status is APPROVAL_REQUIRED
# # #     if obj.status == 'APPROVAL_REQUIRED' and obj.approver_email:
# # #         approver_context = base_context.copy()
# # #         approver_context['requester'] = base_context['user_name']
# # #         send_approval_request_notification(obj, notes)

# # # def send_final_approval_notification(obj):
# # #     """Send a final approval notification to the employee when the request is approved"""
# # #     try:
# # #         context = {
# # #             'ticket': obj.ticket_number,
# # #             'user': obj.user,  # Pass the User object
# # #             'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name
# # #             'resource': obj.resource.name,
# # #             'access_level': obj.access_level.name,
# # #             'status': obj.get_status_display(),
# # #             'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
# # #         }

# # #         send_email_notification(
# # #             obj,
# # #             f"Access Request {obj.ticket_number} - Final Approval",
# # #             f'{templates_path}final_approval_notification.html',
# # #             context,
# # #             [obj.user.email],
# # #             is_reply=True
# # #         )
# # #         return True
# # #     except Exception as e:
# # #         print(f"Failed to send final approval notification: {str(e)}")
# # #         return False




# # import uuid
# # import base64
# # import datetime
# # import os
# # import re
# # from django.core.mail import EmailMessage, EmailMultiAlternatives
# # from django.conf import settings
# # from django.template.loader import render_to_string
# # from django.utils.html import strip_tags
# # from django.utils import timezone
# # from django.utils.http import urlsafe_base64_encode
# # from django.utils.encoding import force_bytes
# # from django.core.files.storage import default_storage
# # from django.core.files.base import ContentFile
# # from .models import Resource, EmailThread

# # def extract_images_from_html(html_content):
# #     """
# #     Extract all image sources from HTML content
# #     Returns list of image paths found in the HTML
# #     """
# #     print(f"extract_images_from_html called with content length: {len(html_content) if html_content else 0}")
    
# #     if not html_content:
# #         print(f"No HTML content provided")
# #         return []
    
# #     print(f"HTML content preview (first 300 chars): {html_content[:300]}...")
    
# #     # Find all img tags with src attributes
# #     import re
# #     img_pattern = r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>'
# #     matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
# #     print(f"Found {len(matches)} img src matches using pattern: {img_pattern}")
# #     for i, match in enumerate(matches):
# #         print(f"  Match {i+1}: {match}")
    
# #     image_paths = []
# #     for i, src in enumerate(matches):
# #         print(f"Processing src {i+1}: {src}")
        
# #         # Handle both relative and absolute URLs
# #         if src.startswith('/media/'):
# #             # Remove leading slash and media/ for default_storage
# #             clean_path = src.replace('/media/', '')
            
# #             # URL DECODE THE FILENAME
# #             from urllib.parse import unquote
# #             decoded_path = unquote(clean_path)
            
# #             image_paths.append(decoded_path)
# #             print(f"  Added relative media path: {clean_path}")
# #             print(f"  URL decoded to: {decoded_path}")
            
# #         elif src.startswith(settings.MEDIA_URL):
# #             # Handle full media URLs
# #             clean_path = src.replace(settings.MEDIA_URL, '')
            
# #             # URL DECODE THE FILENAME
# #             from urllib.parse import unquote
# #             decoded_path = unquote(clean_path)
            
# #             image_paths.append(decoded_path)
# #             print(f"  Added full media URL path: {clean_path}")
# #             print(f"  URL decoded to: {decoded_path}")
# #         else:
# #             print(f"  Skipping non-media URL: {src}")
    
# #     print(f"Final image_paths extracted: {image_paths}")
# #     return image_paths


# # def process_html_for_email(html_content, ticket_number):
# #     """
# #     Process HTML content to handle images for email
# #     Returns updated HTML and list of image attachments
# #     """
# #     if not html_content:
# #         return html_content, []
    
# #     image_paths = extract_images_from_html(html_content)
# #     image_attachments = []
    
# #     for image_path in image_paths:
# #         try:
# #             if default_storage.exists(image_path):
# #                 # Read the image file
# #                 with default_storage.open(image_path, 'rb') as image_file:
# #                     image_data = image_file.read()
                
# #                 # Get filename and extension
# #                 filename = os.path.basename(image_path)
# #                 file_ext = filename.split('.')[-1].lower()
                
# #                 # Create attachment info
# #                 image_attachments.append({
# #                     'filename': filename,
# #                     'data': image_data,
# #                     'content_type': f'image/{file_ext}',
# #                     'path': image_path
# #                 })
                
# #                 print(f"Found image for email: {image_path}")
# #             else:
# #                 print(f"Image not found in storage: {image_path}")
# #         except Exception as e:
# #             print(f"Error processing image {image_path}: {str(e)}")
    
# #     return html_content, image_attachments


# # def process_base64_images(html_content, ticket_number):
# #     """
# #     Process base64 embedded images and save them to storage
# #     Returns updated HTML with saved image URLs
# #     """
# #     if not html_content:
# #         return html_content, []
    
# #     # Find all base64 images
# #     img_pattern = r'<img[^>]*src="data:image/([^;]+);base64,([^"]+)"[^>]*>'
# #     saved_images = []
    
# #     def replace_image(match):
# #         img_format = match.group(1)  # jpeg, png, etc.
# #         img_data = match.group(2)    # base64 data
        
# #         try:
# #             # Decode base64
# #             image_data = base64.b64decode(img_data)
            
# #             # Generate unique filename
# #             filename = f"email_images/{ticket_number}/{uuid.uuid4().hex}.{img_format}"
            
# #             # Save to storage
# #             path = default_storage.save(filename, ContentFile(image_data))
# #             DOMAIN_NAME = os.getenv('SITE_URL')
# #             # Generate URL for email
# #             if settings.DEBUG:
# #                 image_url = f"{DOMAIN_NAME}{settings.MEDIA_URL}{path}"
# #             else:
# #                 image_url = default_storage.url(path)
            
# #             saved_images.append({
# #                 'filename': os.path.basename(filename),
# #                 'data': image_data,
# #                 'content_type': f'image/{img_format}',
# #                 'path': path
# #             })
            
# #             # Replace with new img tag
# #             return f'<img src="{image_url}" style="max-width: 100%; height: auto;">'
            
# #         except Exception as e:
# #             print(f"Error processing base64 image: {str(e)}")
# #             return match.group(0)  # Return original if error
    
# #     # Replace all base64 images
# #     updated_html = re.sub(img_pattern, replace_image, html_content)
    
# #     return updated_html, saved_images


# # def send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
# #     """
# #     Enhanced email sending function that handles images with CID embedding for inline display
# #     """
# #     try:
# #         base_message_id = generate_message_id(ticket_number)
# #         message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
# #         thread_index = generate_thread_index(ticket_number)

# #         if subject.startswith("Welcome to Optima Hub Management"):
# #             subject = subject
# #         else:
# #             base_subject = f"Access Request {ticket_number}"
# #             if not subject.startswith(base_subject):
# #                 subject = base_subject if not is_reply else f"Re: {base_subject}"

# #         headers = {
# #             'Message-ID': message_id,
# #             'References': base_message_id,
# #             'In-Reply-To': base_message_id if is_reply else None,
# #             'Thread-Index': thread_index,
# #             'Subject': subject,
# #         }

# #         all_attachments = []
# #         processed_html = html_message
# #         cid_mapping = {}  # Store filename -> CID mapping

# #         if html_message:
# #             # First, process any base64 images
# #             processed_html, base64_images = process_base64_images(html_message, ticket_number)
# #             all_attachments.extend(base64_images)
            
# #             # Then, find and attach existing images from media folder
# #             final_html, media_images = process_html_for_email(processed_html, ticket_number)
# #             all_attachments.extend(media_images)
            
# #             processed_html = final_html

# #         # Create CID mappings and update HTML for inline display
# #         if processed_html and all_attachments:
# #             import re
            
# #             # Create CID for each image and update HTML
# #             for i, attachment in enumerate(all_attachments):
# #                 filename = attachment['filename']
# #                 cid = f"image{i+1}_{uuid.uuid4().hex[:8]}"
# #                 cid_mapping[filename] = cid
                
# #                 # Replace /media/ URLs with cid: URLs in HTML
# #                 media_pattern = f"/media/{re.escape(filename.replace(' ', '%20'))}"
# #                 cid_url = f"cid:{cid}"
# #                 processed_html = re.sub(media_pattern, cid_url, processed_html)
                
# #                 print(f"Mapped {filename} -> cid:{cid}")

# #         # Create email with attachments and CID embedding
# #         if processed_html and all_attachments:
# #             # Use EmailMultiAlternatives for HTML with attachments
# #             from django.core.mail import EmailMultiAlternatives
# #             from email.mime.image import MIMEImage
            
# #             email = EmailMultiAlternatives(
# #                 subject=subject,
# #                 body=strip_tags(processed_html) if processed_html else body,
# #                 from_email=settings.DEFAULT_FROM_EMAIL,
# #                 to=recipients,
# #                 headers=headers
# #             )
            
# #             # Attach HTML version
# #             email.attach_alternative(processed_html, "text/html")
            
# #             # Attach all images with CID for inline display
# #             for attachment in all_attachments:
# #                 filename = attachment['filename']
# #                 image_data = attachment['data']
# #                 content_type = attachment['content_type']
                
# #                 # Create MIMEImage for proper inline embedding
# #                 if content_type.startswith('image/'):
# #                     img = MIMEImage(image_data)
# #                     cid = cid_mapping.get(filename, f"image_{uuid.uuid4().hex[:8]}")
# #                     img.add_header('Content-ID', f'<{cid}>')
# #                     img.add_header('Content-Disposition', 'inline', filename=filename)
# #                     email.attach(img)
# #                     print(f"Attached inline image: {filename} with CID: {cid}")
# #                 else:
# #                     # Fallback for non-image files
# #                     email.attach(filename, image_data, content_type)
# #                     print(f"Attached file: {filename}")
                
# #         elif processed_html:
# #             # HTML email without attachments
# #             from django.core.mail import EmailMultiAlternatives
# #             email = EmailMultiAlternatives(
# #                 subject=subject,
# #                 body=strip_tags(processed_html),
# #                 from_email=settings.DEFAULT_FROM_EMAIL,
# #                 to=recipients,
# #                 headers=headers
# #             )
# #             email.attach_alternative(processed_html, "text/html")
# #         else:
# #             # Plain text email
# #             from django.core.mail import EmailMessage
# #             email = EmailMessage(
# #                 subject=subject,
# #                 body=body,
# #                 from_email=settings.DEFAULT_FROM_EMAIL,
# #                 to=recipients,
# #                 headers=headers
# #             )

# #         email.send()
# #         print(f"Email sent successfully to {', '.join(recipients)} with {len(all_attachments)} image attachments")
# #         print(f"Images embedded inline with CID mapping: {cid_mapping}")
# #         return True
        
# #     except Exception as e:
# #         print(f"Failed to send email: {str(e)}")
# #         import traceback
# #         traceback.print_exc()
# #         return False


# # # Keep your existing utility functions
# # def get_or_create_thread_index(ticket_number):
# #     thread, created = EmailThread.objects.get_or_create(
# #         ticket_number=ticket_number,
# #         defaults={'thread_index': base64.b64encode(f"thread-{ticket_number}".encode()).decode()}
# #     )
# #     return thread.thread_index

# # def generate_message_id(ticket_number):
# #     domain = 'techoptima.ai'
# #     return f'<access-request-{ticket_number}@{domain}>'

# # def generate_thread_index(ticket_number):
# #     thread_id = f"thread-{ticket_number}-{uuid.uuid4().hex[:8]}"
# #     return base64.b64encode(thread_id.encode()).decode()

# # # Replace your existing send_threaded_email function with this enhanced version
# # def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
# #     """
# #     Updated to use the enhanced image-aware email function
# #     """
# #     return send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply, html_message)

# # def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
# #     return send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=html_message)

# # def generate_approval_token(access_request):
# #     """Generate a secure token for approval/rejection links"""
# #     return urlsafe_base64_encode(force_bytes(f"{access_request.id}-{access_request.ticket_number}-{uuid.uuid4().hex}"))

# # def get_approval_urls(request_id, token, for_resource_owner=False):
# #     """Generate approval and rejection URLs"""
# #     base_url = settings.SITE_URL.rstrip('/')
# #     if for_resource_owner:
# #         approve_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/approve/"
# #         reject_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/reject/"
# #     else:
# #         approve_url = f"{base_url}/api/approve-request/{request_id}/{token}/approve/"
# #         reject_url = f"{base_url}/api/approve-request/{request_id}/{token}/reject/"
# #     print(f"Generated Approve URL: {approve_url}")
# #     print(f"Generated Reject URL: {reject_url}")
# #     return approve_url, reject_url

# # def get_user_role(user):
# #     if user.is_superuser:
# #         return 'superuser'
# #     if Resource.objects.filter(resource_team_email=user.email).exists():
# #         return 'resource_owner'
# #     return 'employee'


# # def send_email_notification(obj, subject, template_name, context, recipients=None, is_reply=True):
# #     print(f"Starting send_email_notification for template: {template_name}")
# #     print(f"Subject: {subject}")
# #     print(f"Recipients provided: {recipients}")
    
# #     try:
# #         if recipients is None:
# #             print("Recipients is None, determining from obj...")
# #             if obj is None:
# #                 raise ValueError("Recipients must be provided if obj is None")
# #             recipients = [obj.user.email]
# #             print(f"Added user email: {obj.user.email}")
# #             print(f"DEBUG: obj.resource = {obj.resource}")
# #             print(f"DEBUG: obj.resource.name = {obj.resource.name if obj.resource else 'No Resource'}")
            
# #             if obj.resource and obj.resource.resource_team_email:
# #                 print(f"DEBUG: Found resource_team_email = {obj.resource.resource_team_email}")
# #                 recipients.append(obj.resource.resource_team_email)
# #                 print(f"DEBUG: Added to recipients. Final recipients = {recipients}")
# #             else:
# #                 print(f"DEBUG: No resource_team_email found for resource {obj.resource.name if obj.resource else 'None'}")

# #         print(f"Final recipients list: {recipients}")
        
# #         # DETAILED IMAGE DEBUGGING
# #         processed_justification = context.get('justification', '')
# #         print(f"DEBUGGING JUSTIFICATION CONTENT:")
# #         print(f"Raw justification type: {type(processed_justification)}")
# #         print(f"Raw justification length: {len(str(processed_justification))} characters")
# #         print(f"First 200 chars: {str(processed_justification)[:200]}...")
        
# #         # Check for image indicators
# #         has_img_tag = '<img' in str(processed_justification)
# #         has_src_attr = 'src=' in str(processed_justification)
# #         has_media_url = '/media/' in str(processed_justification)
# #         has_base64 = 'data:image' in str(processed_justification)
        
# #         print(f"Image indicators:")
# #         print(f"  - Has <img tag: {has_img_tag}")
# #         print(f"  - Has src= attribute: {has_src_attr}")
# #         print(f"  - Has /media/ URL: {has_media_url}")
# #         print(f"  - Has base64 data: {has_base64}")
        
# #         if processed_justification and obj:
# #             print(f"Processing justification content for images...")
            
# #             # Check if justification contains images
# #             if has_img_tag or has_src_attr:
# #                 print(f"Found images in justification content")
                
# #                 # Show what images we're trying to extract
# #                 image_paths = extract_images_from_html(str(processed_justification))
# #                 print(f"extract_images_from_html found: {len(image_paths)} images")
# #                 for i, path in enumerate(image_paths):
# #                     print(f"  Image {i+1}: {path}")
                
# #                 # Process base64 images and save them
# #                 if has_base64:
# #                     print(f"Processing base64 images...")
# #                     processed_justification, base64_images = process_base64_images(str(processed_justification), obj.ticket_number)
# #                     if base64_images:
# #                         print(f"Processed {len(base64_images)} base64 images")
# #                         for i, img in enumerate(base64_images):
# #                             print(f"  Base64 Image {i+1}: {img['filename']} ({img['content_type']})")
# #                     else:
# #                         print(f"No base64 images processed")
# #                 else:
# #                     print(f"No base64 images found, processing existing media images...")
                
# #                 # Update context with processed justification
# #                 context = context.copy()  # Don't modify original context
# #                 context['justification'] = processed_justification
# #                 print(f"Updated context with processed justification")
# #             else:
# #                 print(f"No images found in justification content")
# #         else:
# #             print(f"No justification content to process (empty or no obj)")
        
# #         # Try to render the template
# #         print(f"Attempting to render template: resource_management/{template_name}")
# #         print(f"Template context keys: {list(context.keys())}")
        
# #         try:
# #             html_message = render_to_string(f'resource_management/emails/{template_name}', context)
# #             print(f"Template rendered successfully, length: {len(html_message)} characters")
            
# #             # Check if the rendered HTML contains images
# #             rendered_has_img = '<img' in html_message
# #             rendered_has_media = '/media/' in html_message
# #             print(f"Rendered template image check:")
# #             print(f"  - Rendered HTML has <img: {rendered_has_img}")
# #             print(f"  - Rendered HTML has /media/: {rendered_has_media}")
            
# #             if rendered_has_img:
# #                 print(f"Images found in rendered HTML - first 300 chars around img:")
# #                 import re
# #                 img_matches = re.findall(r'.{0,50}<img[^>]*>.{0,50}', html_message)
# #                 for i, match in enumerate(img_matches[:3]):  # Show first 3 matches
# #                     print(f"  Match {i+1}: {match}")
            
# #         except Exception as template_error:
# #             print(f"Template rendering failed: {str(template_error)}")
# #             raise template_error
        
# #         plain_message = strip_tags(html_message)
# #         print(f"Plain message length: {len(plain_message)} characters")
        
# #         # Use ticket_number from obj if available, otherwise generate a unique message ID
# #         ticket_number = f"employee-{context['user'].id}" if obj is None else obj.ticket_number
# #         print(f"Using ticket_number: {ticket_number}")
        
# #         # Use the enhanced email function that handles images
# #         print(f"Calling send_threaded_email_with_images (image-aware)...")
# #         email_result = send_threaded_email_with_images(
# #             subject=subject,
# #             body=plain_message,
# #             recipients=recipients,
# #             ticket_number=ticket_number,
# #             is_reply=is_reply,
# #             html_message=html_message
# #         )
        
# #         if email_result:
# #             print(f"Email sent successfully to {', '.join(recipients)}")
# #             return True
# #         else:
# #             print(f"send_threaded_email_with_images returned False")
# #             return False
            
# #     except Exception as e:
# #         print(f"EXCEPTION in send_email_notification: {str(e)}")
# #         print(f"Exception type: {type(e)}")
# #         import traceback
# #         print(f"Full traceback:")
# #         traceback.print_exc()
# #         return False


# # from resource_management.models import ResourceType, Resource

# # def send_request_notification(access_request):
# #     """Send email notification for new access request"""
# #     print("Starting send_request_notification...") 
    
# #     # Debug the resource assignment
# #     print(f"DEBUG: access_request.resource = {access_request.resource}")
# #     if access_request.resource:
# #         print(f"DEBUG: resource.name = {access_request.resource.name}")
# #         print(f"DEBUG: resource.resource_team_email = {access_request.resource.resource_team_email}")
# #     else:
# #         print(f"DEBUG: No resource found for this request")
        
# #         # CRITICAL FIX: Auto-assign IT Support resource if missing
# #         if access_request.request_type == 'IT':
# #             try:
# #                 print("Attempting to auto-assign IT Support resource...")
# #                 it_resource_type = ResourceType.objects.get(name='IT Support')
# #                 it_resource = Resource.objects.filter(
# #                     resource_type=it_resource_type,
# #                     is_active=True
# #                 ).first()
                
# #                 if it_resource:
# #                     access_request.resource = it_resource
# #                     access_request.save()
# #                     print(f"AUTO-ASSIGNED IT resource: {it_resource.name} with email: {it_resource.resource_team_email}")
# #                 else:
# #                     print("No active IT Support resource found in database")
# #             except ResourceType.DoesNotExist:
# #                 print("IT Support resource type not found in database")

# #     try:
# #         if access_request.request_type == 'IT':
# #             # IT support-specific context
# #             it_support_context = {
# #                 'ticket': access_request.ticket_number,
# #                 'user': access_request.user,
# #                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
# #                 'priority': access_request.get_priority_display(),
# #                 'justification': access_request.justification,
# #                 'duration': access_request.duration,
# #             }
# #             print(f"Preparing to send IT support emails with context: {list(it_support_context.keys())}")
            
# #             # Send email to user (try multiple templates as fallback)
# #             print("Attempting to send user email...")
# #             user_templates = ['it_support_user.html', 'new_request_user.html']

# #             for template in user_templates:
# #                 print(f"Trying user template: {template}")
# #                 result = send_email_notification(
# #                     access_request,
# #                     f"New IT Support Ticket - ID {access_request.ticket_number}",
# #                     template,
# #                     it_support_context,
# #                     [access_request.user.email],
# #                     is_reply=False
# #                 )
                
# #                 if result:
# #                     print(f"USER EMAIL SUCCESS with template: {template}")
# #                     break
# #                 else:
# #                     print(f"USER EMAIL FAILED with template: {template}")
            
# #             # Send email to IT team
# #             team_email = None
# #             if access_request.resource and access_request.resource.resource_team_email:
# #                 team_email = access_request.resource.resource_team_email
# #             else:
# #                 # Use your specific email as fallback
# #                 team_email = access_request.user.email  # Your email
# #                 print(f"Using fallback email: {team_email}")
            
# #             print(f"Preparing to send IT team email to: {team_email}")
            
# #             team_context = it_support_context.copy()
# #             team_context['requester'] = team_context['user_name']
# #             team_context['requester_employee_id'] = access_request.user.username
            
# #             # Try multiple team templates as fallback
# #             print("Attempting to send team email...")
# #             team_templates = ['it_support_team.html', 'new_request_team.html']

# #             for template in team_templates:
# #                 print(f"Trying team template: {template}")
# #                 result = send_email_notification(
# #                     access_request,
# #                     f"Access Request {access_request.ticket_number}",
# #                     template,
# #                     team_context,
# #                     [team_email],
# #                     is_reply=True
# #                 )
                
# #                 if result:
# #                     print(f"TEAM EMAIL SUCCESS with template: {template}")
# #                     break
# #                 else:
# #                     print(f"TEAM EMAIL FAILED with template: {template}")
            
# #         else:
# #             # Regular access request (non-IT)
# #             print("Processing regular access request...")
# #             user_context = {
# #                 'ticket': access_request.ticket_number,
# #                 'user': access_request.user,
# #                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
# #                 'resource': getattr(access_request.resource, 'name', 'N/A') if access_request.resource else "N/A",
# #                 'access_level': getattr(access_request.access_level, 'name', 'N/A') if access_request.access_level else "N/A",
# #                 'priority': access_request.get_priority_display(),
# #                 'justification': access_request.justification,
# #                 'resource_type': getattr(access_request.resource.resource_type, 'name', 'N/A') if access_request.resource and access_request.resource.resource_type else "N/A",
# #                 'duration': access_request.duration,
# #                 'approval_token_expiry': access_request.approval_token_expiry,
# #             }
            
# #             # Send to user
# #             user_result = send_email_notification(
# #                 access_request,
# #                 f"Access Request {access_request.ticket_number}",
# #                 'new_request_user.html',
# #                 user_context,
# #                 [access_request.user.email],
# #                 is_reply=False
# #             )
            
# #             if user_result:
# #                 print("Regular access request user email sent")
# #             else:
# #                 print("Regular access request user email failed")

# #             # Send to team
# #             if access_request.resource and access_request.resource.resource_team_email:
# #                 team_context = user_context.copy()
# #                 team_context['requester'] = user_context['user_name']
# #                 team_result = send_email_notification(
# #                     access_request,
# #                     f"Access Request {access_request.ticket_number}",
# #                     'new_request_team.html',
# #                     team_context,
# #                     [access_request.resource.resource_team_email],
# #                     is_reply=True
# #                 )
                
# #                 if team_result:
# #                     print(f"Regular access request team email sent to: {access_request.resource.resource_team_email}")
# #                 else:
# #                     print(f"Regular access request team email failed")
# #             else:
# #                 print("No resource team email found for regular access request")

# #     except Exception as e:
# #         print(f"CRITICAL ERROR in send_request_notification: {str(e)}")
# #         import traceback
# #         traceback.print_exc()
# #         return False

# #     print("send_request_notification completed")
# #     return True


# # def send_approval_request_notification(obj, notes):
# #     """Send approval request with proper URLs"""
# #     try:
# #         print(f"Starting send_approval_request_notification for ticket: {obj.ticket_number}")
# #         print(f"Approver email: {obj.approver_email}")
        
# #         if not obj.approval_token:
# #             obj.approval_token = uuid.uuid4().hex
# #             obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
# #             obj.save()
# #             print(f"Generated and saved token: {obj.approval_token}")

# #         approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)
# #         print(f"Generated approve URL: {approve_url}")
# #         print(f"Generated reject URL: {reject_url}")

# #         context = {
# #             'ticket': obj.ticket_number,
# #             'requester': obj.user.get_full_name() or obj.user.username,
# #             'requester_employee_id': obj.user.username,
# #             'resource': obj.resource.name if obj.resource else 'N/A',
# #             'access_level': obj.access_level.name if obj.access_level else 'N/A',
# #             'justification': obj.justification,
# #             'notes': notes,
# #             'approve_url': approve_url,
# #             'reject_url': reject_url,
# #             'approval_token_expiry': obj.approval_token_expiry,
# #         }

# #         print(f"Sending approval email with context: {list(context.keys())}")

# #         # Use the enhanced email function that handles images
# #         result = send_email_notification(
# #             obj,
# #             f"Access Request {obj.ticket_number} - Approval Required",
# #             'approval_required_approver.html',
# #             context,
# #             [obj.approver_email],
# #             is_reply=True
# #         )
        
# #         if result:
# #             print(f"Approval email sent successfully to: {obj.approver_email}")
# #             return True
# #         else:
# #             print(f"Failed to send approval email to: {obj.approver_email}")
# #             return False
            
# #     except Exception as e:
# #         print(f"Failed to send approval request email: {str(e)}")
# #         import traceback
# #         traceback.print_exc()
# #         return False


# # def send_status_notification(obj, old_status, notes=''):
# #     print(f"Starting send_status_notification - Status: {old_status} -> {obj.status}")
    
# #     base_context = {
# #         'ticket': obj.ticket_number,
# #         'user': obj.user,  # Pass the User object
# #         'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name separately
# #         'resource': obj.resource.name if obj.resource else 'N/A',
# #         'access_level': obj.access_level.name if obj.access_level else 'N/A',
# #         'old_status': old_status,
# #         'new_status': obj.get_status_display(),
# #         'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
# #         'notes': notes
# #     }

# #     # Notify the requester
# #     user_context = base_context.copy()
    
# #     # Choose template based on status
# #     if obj.status == 'APPROVED':
# #         template = 'approval_notification.html'
# #     elif obj.status == 'REJECTED':
# #         template = 'rejection_notification.html'
# #     elif obj.status == 'APPROVAL_REQUIRED':
# #         template = 'approval_request.html'
# #     elif obj.status in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
# #         template = 'status_update.html'  # You can create a specific template for this
# #     else:
# #         template = 'status_update.html'

# #     print(f"Sending notification to requester: {obj.user.email}")
# #     print(f"Using template: {template}")
    
# #     send_email_notification(
# #         obj,
# #         f"Access Request {obj.ticket_number} - Status Update",
# #         template,
# #         user_context,
# #         [obj.user.email],
# #         is_reply=True
# #     )

# #     # Notify the resource team (only skip for APPROVER_APPROVED and APPROVER_REJECTED)
# #     if obj.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
# #         team_context = base_context.copy()
# #         team_context['requester'] = base_context['user_name']
# #         if obj.status == 'APPROVAL_REQUIRED':
# #             template = 'approval_required_team.html'
# #         else:
# #             template = 'status_update.html'

# #         if obj.resource and obj.resource.resource_team_email:
# #             print(f"Sending notification to resource team: {obj.resource.resource_team_email}")
# #             send_email_notification(
# #                 obj,
# #                 f"Access Request {obj.ticket_number} - Status Update",
# #                 template,
# #                 team_context,
# #                 [obj.resource.resource_team_email],
# #                 is_reply=True
# #             )

# #     # Notify the assignee for any status change
# #     if obj.assigned_to:
# #         assignee_context = base_context.copy()
# #         assignee_context['assignee'] = obj.assigned_to.get_full_name() or obj.assigned_to.username
# #         assignee_context['assignee_employee_id'] = obj.assigned_to.username
# #         template = 'status_update_assignee.html' if obj.status == 'APPROVED' else 'rejection_notification_assignee.html' if obj.status == 'REJECTED' else 'status_update_assignee.html'
        
# #         print(f"Sending notification to assignee: {obj.assigned_to.email}")
# #         send_email_notification(
# #             obj,
# #             f"Access Request {obj.ticket_number} - {obj.get_status_display()}",
# #             template,
# #             assignee_context,
# #             [obj.assigned_to.email],
# #             is_reply=True
# #         )

# #     # Notify the approver if the status is APPROVAL_REQUIRED
# #     if obj.status == 'APPROVAL_REQUIRED' and obj.approver_email:
# #         print(f"Sending approval request to approver: {obj.approver_email}")
# #         send_approval_request_notification(obj, notes)


# # def send_final_approval_notification(obj):
# #     """Send a final approval notification to the employee when the request is approved"""
# #     try:
# #         context = {
# #             'ticket': obj.ticket_number,
# #             'user': obj.user,  # Pass the User object
# #             'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name
# #             'resource': obj.resource.name if obj.resource else 'N/A',
# #             'access_level': obj.access_level.name if obj.access_level else 'N/A',
# #             'status': obj.get_status_display(),
# #             'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
# #         }

# #         send_email_notification(
# #             obj,
# #             f"Access Request {obj.ticket_number} - Final Approval",
# #             'final_approval_notification.html',
# #             context,
# #             [obj.user.email],
# #             is_reply=True
# #         )
# #         return True
# #     except Exception as e:
# #         print(f"Failed to send final approval notification: {str(e)}")
# #         return False




# import uuid
# import base64
# import datetime
# import os
# import re
# from django.core.mail import EmailMessage, EmailMultiAlternatives
# from django.conf import settings
# from django.template.loader import render_to_string
# from django.utils.html import strip_tags
# from django.utils import timezone
# from django.utils.http import urlsafe_base64_encode
# from django.utils.encoding import force_bytes
# from django.core.files.storage import default_storage
# from django.core.files.base import ContentFile
# from .models import Resource, EmailThread

# def extract_images_from_html(html_content):
#     """
#     Extract all image sources from HTML content
#     Returns list of image paths found in the HTML
#     """
#     print(f"extract_images_from_html called with content length: {len(html_content) if html_content else 0}")
    
#     if not html_content:
#         print(f"No HTML content provided")
#         return []
    
#     print(f"HTML content preview (first 300 chars): {html_content[:300]}...")
    
#     # Find all img tags with src attributes
#     import re
#     img_pattern = r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>'
#     matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
#     print(f"Found {len(matches)} img src matches using pattern: {img_pattern}")
#     for i, match in enumerate(matches):
#         print(f"  Match {i+1}: {match}")
    
#     image_paths = []
#     for i, src in enumerate(matches):
#         print(f"Processing src {i+1}: {src}")
        
#         # Handle both relative and absolute URLs
#         if src.startswith('/media/'):
#             # Remove leading slash and media/ for default_storage
#             clean_path = src.replace('/media/', '')
            
#             # URL DECODE THE FILENAME
#             from urllib.parse import unquote
#             decoded_path = unquote(clean_path)
            
#             image_paths.append(decoded_path)
#             print(f"  Added relative media path: {clean_path}")
#             print(f"  URL decoded to: {decoded_path}")
            
#         elif src.startswith(settings.MEDIA_URL):
#             # Handle full media URLs
#             clean_path = src.replace(settings.MEDIA_URL, '')
            
#             # URL DECODE THE FILENAME
#             from urllib.parse import unquote
#             decoded_path = unquote(clean_path)
            
#             image_paths.append(decoded_path)
#             print(f"  Added full media URL path: {clean_path}")
#             print(f"  URL decoded to: {decoded_path}")
#         else:
#             print(f"  Skipping non-media URL: {src}")
    
#     print(f"Final image_paths extracted: {image_paths}")
#     return image_paths


# def process_html_for_email(html_content, ticket_number):
#     """
#     Process HTML content to handle images for email
#     Returns updated HTML and list of image attachments
#     """
#     if not html_content:
#         return html_content, []
    
#     image_paths = extract_images_from_html(html_content)
#     image_attachments = []
    
#     for image_path in image_paths:
#         try:
#             if default_storage.exists(image_path):
#                 # Read the image file
#                 with default_storage.open(image_path, 'rb') as image_file:
#                     image_data = image_file.read()
                
#                 # Get filename and extension
#                 filename = os.path.basename(image_path)
#                 file_ext = filename.split('.')[-1].lower()
                
#                 # Create attachment info
#                 image_attachments.append({
#                     'filename': filename,
#                     'data': image_data,
#                     'content_type': f'image/{file_ext}',
#                     'path': image_path
#                 })
                
#                 print(f"Found image for email: {image_path}")
#             else:
#                 print(f"Image not found in storage: {image_path}")
#         except Exception as e:
#             print(f"Error processing image {image_path}: {str(e)}")
    
#     return html_content, image_attachments


# def process_base64_images(html_content, ticket_number):
#     """
#     Process base64 embedded images and save them to storage
#     Returns updated HTML with saved image URLs
#     """
#     if not html_content:
#         return html_content, []
    
#     # Find all base64 images
#     img_pattern = r'<img[^>]*src="data:image/([^;]+);base64,([^"]+)"[^>]*>'
#     saved_images = []
    
#     def replace_image(match):
#         img_format = match.group(1)  # jpeg, png, etc.
#         img_data = match.group(2)    # base64 data
        
#         try:
#             # Decode base64
#             image_data = base64.b64decode(img_data)
            
#             # Generate unique filename
#             filename = f"email_images/{ticket_number}/{uuid.uuid4().hex}.{img_format}"
            
#             # Save to storage
#             path = default_storage.save(filename, ContentFile(image_data))
#             DOMAIN_NAME = os.getenv('SITE_URL')
#             # Generate URL for email
#             if settings.DEBUG:
#                 image_url = f"{DOMAIN_NAME}{settings.MEDIA_URL}{path}"
#             else:
#                 image_url = default_storage.url(path)
            
#             saved_images.append({
#                 'filename': os.path.basename(filename),
#                 'data': image_data,
#                 'content_type': f'image/{img_format}',
#                 'path': path
#             })
            
#             # Replace with new img tag
#             return f'<img src="{image_url}" style="max-width: 100%; height: auto;">'
            
#         except Exception as e:
#             print(f"Error processing base64 image: {str(e)}")
#             return match.group(0)  # Return original if error
    
#     # Replace all base64 images
#     updated_html = re.sub(img_pattern, replace_image, html_content)
    
#     return updated_html, saved_images


# def send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
#     """
#     Enhanced email sending function that handles images with CID embedding for inline display
#     """
#     try:
#         base_message_id = generate_message_id(ticket_number)
#         message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
#         thread_index = generate_thread_index(ticket_number)

#         if subject.startswith("Welcome to Optima Hub Management"):
#             subject = subject
#         else:
#             base_subject = f"Access Request {ticket_number}"
#             if not subject.startswith(base_subject):
#                 subject = base_subject if not is_reply else f"Re: {base_subject}"

#         headers = {
#             'Message-ID': message_id,
#             'References': base_message_id,
#             'In-Reply-To': base_message_id if is_reply else None,
#             'Thread-Index': thread_index,
#             'Subject': subject,
#         }

#         all_attachments = []
#         processed_html = html_message
#         cid_mapping = {}  # Store filename -> CID mapping

#         if html_message:
#             # First, process any base64 images
#             processed_html, base64_images = process_base64_images(html_message, ticket_number)
#             all_attachments.extend(base64_images)
            
#             # Then, find and attach existing images from media folder
#             final_html, media_images = process_html_for_email(processed_html, ticket_number)
#             all_attachments.extend(media_images)
            
#             processed_html = final_html

#         # Create CID mappings and update HTML for inline display
#         if processed_html and all_attachments:
#             import re
            
#             # Create CID for each image and update HTML
#             for i, attachment in enumerate(all_attachments):
#                 filename = attachment['filename']
#                 cid = f"image{i+1}_{uuid.uuid4().hex[:8]}"
#                 cid_mapping[filename] = cid
                
#                 # Replace /media/ URLs with cid: URLs in HTML
#                 media_pattern = f"/media/{re.escape(filename.replace(' ', '%20'))}"
#                 cid_url = f"cid:{cid}"
#                 processed_html = re.sub(media_pattern, cid_url, processed_html)
                
#                 print(f"Mapped {filename} -> cid:{cid}")

#         # Create email with attachments and CID embedding
#         if processed_html and all_attachments:
#             # Use EmailMultiAlternatives for HTML with attachments
#             from django.core.mail import EmailMultiAlternatives
#             from email.mime.image import MIMEImage
            
#             email = EmailMultiAlternatives(
#                 subject=subject,
#                 body=strip_tags(processed_html) if processed_html else body,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=recipients,
#                 headers=headers
#             )
            
#             # Attach HTML version
#             email.attach_alternative(processed_html, "text/html")
            
#             # Attach all images with CID for inline display
#             for attachment in all_attachments:
#                 filename = attachment['filename']
#                 image_data = attachment['data']
#                 content_type = attachment['content_type']
                
#                 # Create MIMEImage for proper inline embedding
#                 if content_type.startswith('image/'):
#                     img = MIMEImage(image_data)
#                     cid = cid_mapping.get(filename, f"image_{uuid.uuid4().hex[:8]}")
#                     img.add_header('Content-ID', f'<{cid}>')
#                     img.add_header('Content-Disposition', 'inline', filename=filename)
#                     email.attach(img)
#                     print(f"Attached inline image: {filename} with CID: {cid}")
#                 else:
#                     # Fallback for non-image files
#                     email.attach(filename, image_data, content_type)
#                     print(f"Attached file: {filename}")
                
#         elif processed_html:
#             # HTML email without attachments
#             from django.core.mail import EmailMultiAlternatives
#             email = EmailMultiAlternatives(
#                 subject=subject,
#                 body=strip_tags(processed_html),
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=recipients,
#                 headers=headers
#             )
#             email.attach_alternative(processed_html, "text/html")
#         else:
#             # Plain text email
#             from django.core.mail import EmailMessage
#             email = EmailMessage(
#                 subject=subject,
#                 body=body,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=recipients,
#                 headers=headers
#             )

#         email.send()
#         print(f"Email sent successfully to {', '.join(recipients)} with {len(all_attachments)} image attachments")
#         print(f"Images embedded inline with CID mapping: {cid_mapping}")
#         return True
        
#     except Exception as e:
#         print(f"Failed to send email: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return False


# # Keep your existing utility functions
# def get_or_create_thread_index(ticket_number):
#     thread, created = EmailThread.objects.get_or_create(
#         ticket_number=ticket_number,
#         defaults={'thread_index': base64.b64encode(f"thread-{ticket_number}".encode()).decode()}
#     )
#     return thread.thread_index

# def generate_message_id(ticket_number):
#     domain = 'techoptima.ai'
#     return f'<access-request-{ticket_number}@{domain}>'

# def generate_thread_index(ticket_number):
#     thread_id = f"thread-{ticket_number}-{uuid.uuid4().hex[:8]}"
#     return base64.b64encode(thread_id.encode()).decode()

# # Replace your existing send_threaded_email function with this enhanced version
# def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
#     """
#     Updated to use the enhanced image-aware email function
#     """
#     return send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply, html_message)

# def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
#     return send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=html_message)

# def generate_approval_token(access_request):
#     """Generate a secure token for approval/rejection links"""
#     return urlsafe_base64_encode(force_bytes(f"{access_request.id}-{access_request.ticket_number}-{uuid.uuid4().hex}"))

# def get_approval_urls(request_id, token, for_resource_owner=False):
#     """Generate approval and rejection URLs"""
#     base_url = settings.SITE_URL.rstrip('/')
#     if for_resource_owner:
#         approve_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/approve/"
#         reject_url = f"{base_url}/api/resource-owner-approve/{request_id}/{token}/reject/"
#     else:
#         approve_url = f"{base_url}/api/approve-request/{request_id}/{token}/approve/"
#         reject_url = f"{base_url}/api/approve-request/{request_id}/{token}/reject/"
#     print(f"Generated Approve URL: {approve_url}")
#     print(f"Generated Reject URL: {reject_url}")
#     return approve_url, reject_url

# def get_user_role(user):
#     if user.is_superuser:
#         return 'superuser'
#     if Resource.objects.filter(resource_team_email=user.email).exists():
#         return 'resource_owner'
#     return 'employee'


# def send_email_notification(obj, subject, template_name, context, recipients=None, is_reply=True):
#     print(f"Starting send_email_notification for template: {template_name}")
#     print(f"Subject: {subject}")
#     print(f"Recipients provided: {recipients}")
    
#     try:
#         if recipients is None:
#             print("Recipients is None, determining from obj...")
#             if obj is None:
#                 raise ValueError("Recipients must be provided if obj is None")
#             recipients = [obj.user.email]
#             print(f"Added user email: {obj.user.email}")
#             print(f"DEBUG: obj.resource = {obj.resource}")
#             print(f"DEBUG: obj.resource.name = {obj.resource.name if obj.resource else 'No Resource'}")
            
#             if obj.resource and obj.resource.resource_team_email:
#                 print(f"DEBUG: Found resource_team_email = {obj.resource.resource_team_email}")
#                 recipients.append(obj.resource.resource_team_email)
#                 print(f"DEBUG: Added to recipients. Final recipients = {recipients}")
#             else:
#                 print(f"DEBUG: No resource_team_email found for resource {obj.resource.name if obj.resource else 'None'}")

#         print(f"Final recipients list: {recipients}")
        
#         # DETAILED IMAGE DEBUGGING
#         processed_justification = context.get('justification', '')
#         print(f"DEBUGGING JUSTIFICATION CONTENT:")
#         print(f"Raw justification type: {type(processed_justification)}")
#         print(f"Raw justification length: {len(str(processed_justification))} characters")
#         print(f"First 200 chars: {str(processed_justification)[:200]}...")
        
#         # Check for image indicators
#         has_img_tag = '<img' in str(processed_justification)
#         has_src_attr = 'src=' in str(processed_justification)
#         has_media_url = '/media/' in str(processed_justification)
#         has_base64 = 'data:image' in str(processed_justification)
        
#         print(f"Image indicators:")
#         print(f"  - Has <img tag: {has_img_tag}")
#         print(f"  - Has src= attribute: {has_src_attr}")
#         print(f"  - Has /media/ URL: {has_media_url}")
#         print(f"  - Has base64 data: {has_base64}")
        
#         if processed_justification and obj:
#             print(f"Processing justification content for images...")
            
#             # Check if justification contains images
#             if has_img_tag or has_src_attr:
#                 print(f"Found images in justification content")
                
#                 # Show what images we're trying to extract
#                 image_paths = extract_images_from_html(str(processed_justification))
#                 print(f"extract_images_from_html found: {len(image_paths)} images")
#                 for i, path in enumerate(image_paths):
#                     print(f"  Image {i+1}: {path}")
                
#                 # Process base64 images and save them
#                 if has_base64:
#                     print(f"Processing base64 images...")
#                     processed_justification, base64_images = process_base64_images(str(processed_justification), obj.ticket_number)
#                     if base64_images:
#                         print(f"Processed {len(base64_images)} base64 images")
#                         for i, img in enumerate(base64_images):
#                             print(f"  Base64 Image {i+1}: {img['filename']} ({img['content_type']})")
#                     else:
#                         print(f"No base64 images processed")
#                 else:
#                     print(f"No base64 images found, processing existing media images...")
                
#                 # Update context with processed justification
#                 context = context.copy()  # Don't modify original context
#                 context['justification'] = processed_justification
#                 print(f"Updated context with processed justification")
#             else:
#                 print(f"No images found in justification content")
#         else:
#             print(f"No justification content to process (empty or no obj)")
        
#         # Try to render the template
#         print(f"Attempting to render template: resource_management/{template_name}")
#         print(f"Template context keys: {list(context.keys())}")
        
#         try:
#             html_message = render_to_string(f'resource_management/emails/{template_name}', context)
#             print(f"Template rendered successfully, length: {len(html_message)} characters")
            
#             # Check if the rendered HTML contains images
#             rendered_has_img = '<img' in html_message
#             rendered_has_media = '/media/' in html_message
#             print(f"Rendered template image check:")
#             print(f"  - Rendered HTML has <img: {rendered_has_img}")
#             print(f"  - Rendered HTML has /media/: {rendered_has_media}")
            
#             if rendered_has_img:
#                 print(f"Images found in rendered HTML - first 300 chars around img:")
#                 import re
#                 img_matches = re.findall(r'.{0,50}<img[^>]*>.{0,50}', html_message)
#                 for i, match in enumerate(img_matches[:3]):  # Show first 3 matches
#                     print(f"  Match {i+1}: {match}")
            
#         except Exception as template_error:
#             print(f"Template rendering failed: {str(template_error)}")
#             raise template_error
        
#         plain_message = strip_tags(html_message)
#         print(f"Plain message length: {len(plain_message)} characters")
        
#         # Use ticket_number from obj if available, otherwise generate a unique message ID
#         ticket_number = f"employee-{context['user'].id}" if obj is None else obj.ticket_number
#         print(f"Using ticket_number: {ticket_number}")
        
#         # Use the enhanced email function that handles images
#         print(f"Calling send_threaded_email_with_images (image-aware)...")
#         email_result = send_threaded_email_with_images(
#             subject=subject,
#             body=plain_message,
#             recipients=recipients,
#             ticket_number=ticket_number,
#             is_reply=is_reply,
#             html_message=html_message
#         )
        
#         if email_result:
#             print(f"Email sent successfully to {', '.join(recipients)}")
#             return True
#         else:
#             print(f"send_threaded_email_with_images returned False")
#             return False
            
#     except Exception as e:
#         print(f"EXCEPTION in send_email_notification: {str(e)}")
#         print(f"Exception type: {type(e)}")
#         import traceback
#         print(f"Full traceback:")
#         traceback.print_exc()
#         return False


# from resource_management.models import ResourceType, Resource

# def send_request_notification(access_request):
#     """Send email notification for new access request"""
#     print("Starting send_request_notification...") 
    
#     # Debug the resource assignment
#     print(f"DEBUG: access_request.resource = {access_request.resource}")
#     if access_request.resource:
#         print(f"DEBUG: resource.name = {access_request.resource.name}")
#         print(f"DEBUG: resource.resource_team_email = {access_request.resource.resource_team_email}")
#     else:
#         print(f"DEBUG: No resource found for this request")
        
#         # CRITICAL FIX: Auto-assign IT Support resource if missing
#         if access_request.request_type == 'IT':
#             try:
#                 print("Attempting to auto-assign IT Support resource...")
#                 it_resource_type = ResourceType.objects.get(name='IT Support')
#                 it_resource = Resource.objects.filter(
#                     resource_type=it_resource_type,
#                     is_active=True
#                 ).first()
                
#                 if it_resource:
#                     access_request.resource = it_resource
#                     access_request.save()
#                     print(f"AUTO-ASSIGNED IT resource: {it_resource.name} with email: {it_resource.resource_team_email}")
#                 else:
#                     print("No active IT Support resource found in database")
#             except ResourceType.DoesNotExist:
#                 print("IT Support resource type not found in database")

#     try:
#         if access_request.request_type == 'IT':
#             # IT support-specific context
#             it_support_context = {
#                 'ticket': access_request.ticket_number,
#                 'user': access_request.user,
#                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
#                 'priority': access_request.get_priority_display(),
#                 'justification': access_request.justification,
#                 'duration': access_request.duration,
#             }
#             print(f"Preparing to send IT support emails with context: {list(it_support_context.keys())}")
            
#             # Send email to user (try multiple templates as fallback)
#             print("Attempting to send user email...")
#             user_templates = ['it_support_user.html', 'new_request_user.html']

#             for template in user_templates:
#                 print(f"Trying user template: {template}")
#                 result = send_email_notification(
#                     access_request,
#                     f"New IT Support Ticket - ID {access_request.ticket_number}",
#                     template,
#                     it_support_context,
#                     [access_request.user.email],
#                     is_reply=False
#                 )
                
#                 if result:
#                     print(f"USER EMAIL SUCCESS with template: {template}")
#                     break
#                 else:
#                     print(f"USER EMAIL FAILED with template: {template}")
            
#             # Send email to IT team
#             team_email = None
#             if access_request.resource and access_request.resource.resource_team_email:
#                 team_email = access_request.resource.resource_team_email
#             else:
#                 # Use your specific email as fallback
#                 team_email = access_request.user.email  # Your email
#                 print(f"Using fallback email: {team_email}")
            
#             print(f"Preparing to send IT team email to: {team_email}")
            
#             team_context = it_support_context.copy()
#             team_context['requester'] = team_context['user_name']
#             team_context['requester_employee_id'] = access_request.user.username
            
#             # Try multiple team templates as fallback
#             print("Attempting to send team email...")
#             team_templates = ['it_support_team.html', 'new_request_team.html']

#             for template in team_templates:
#                 print(f"Trying team template: {template}")
#                 result = send_email_notification(
#                     access_request,
#                     f"Access Request {access_request.ticket_number}",
#                     template,
#                     team_context,
#                     [team_email],
#                     is_reply=True
#                 )
                
#                 if result:
#                     print(f"TEAM EMAIL SUCCESS with template: {template}")
#                     break
#                 else:
#                     print(f"TEAM EMAIL FAILED with template: {template}")
            
#         else:
#             # Regular access request (non-IT)
#             print("Processing regular access request...")
#             user_context = {
#                 'ticket': access_request.ticket_number,
#                 'user': access_request.user,
#                 'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
#                 'resource': getattr(access_request.resource, 'name', 'N/A') if access_request.resource else "N/A",
#                 'access_level': getattr(access_request.access_level, 'name', 'N/A') if access_request.access_level else "N/A",
#                 'priority': access_request.get_priority_display(),
#                 'justification': access_request.justification,
#                 'resource_type': getattr(access_request.resource.resource_type, 'name', 'N/A') if access_request.resource and access_request.resource.resource_type else "N/A",
#                 'duration': access_request.duration,
#                 'approval_token_expiry': access_request.approval_token_expiry,
#             }
            
#             # Send to user
#             user_result = send_email_notification(
#                 access_request,
#                 f"Access Request {access_request.ticket_number}",
#                 'new_request_user.html',
#                 user_context,
#                 [access_request.user.email],
#                 is_reply=False
#             )
            
#             if user_result:
#                 print("Regular access request user email sent")
#             else:
#                 print("Regular access request user email failed")

#             # Send to team
#             if access_request.resource and access_request.resource.resource_team_email:
#                 team_context = user_context.copy()
#                 team_context['requester'] = user_context['user_name']
#                 team_result = send_email_notification(
#                     access_request,
#                     f"Access Request {access_request.ticket_number}",
#                     'new_request_team.html',
#                     team_context,
#                     [access_request.resource.resource_team_email],
#                     is_reply=True
#                 )
                
#                 if team_result:
#                     print(f"Regular access request team email sent to: {access_request.resource.resource_team_email}")
#                 else:
#                     print(f"Regular access request team email failed")
#             else:
#                 print("No resource team email found for regular access request")

#     except Exception as e:
#         print(f"CRITICAL ERROR in send_request_notification: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return False

#     print("send_request_notification completed")
#     return True


# def send_approval_request_notification(obj, notes):
#     """Send approval request with proper URLs"""
#     try:
#         print(f"Starting send_approval_request_notification for ticket: {obj.ticket_number}")
#         print(f"Approver email: {obj.approver_email}")
        
#         if not obj.approval_token:
#             obj.approval_token = uuid.uuid4().hex
#             obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
#             obj.save()
#             print(f"Generated and saved token: {obj.approval_token}")

#         approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)
#         print(f"Generated approve URL: {approve_url}")
#         print(f"Generated reject URL: {reject_url}")

#         context = {
#             'ticket': obj.ticket_number,
#             'requester': obj.user.get_full_name() or obj.user.username,
#             'requester_employee_id': obj.user.username,
#             'resource': obj.resource.name if obj.resource else 'N/A',
#             'access_level': obj.access_level.name if obj.access_level else 'N/A',
#             'justification': obj.justification,
#             'notes': notes,
#             'approve_url': approve_url,
#             'reject_url': reject_url,
#             'approval_token_expiry': obj.approval_token_expiry,
#         }

#         print(f"Sending approval email with context: {list(context.keys())}")

#         # Use the enhanced email function that handles images
#         result = send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number} - Approval Required",
#             'approval_required_approver.html',
#             context,
#             [obj.approver_email],
#             is_reply=True
#         )
        
#         if result:
#             print(f"Approval email sent successfully to: {obj.approver_email}")
#             return True
#         else:
#             print(f"Failed to send approval email to: {obj.approver_email}")
#             return False
            
#     except Exception as e:
#         print(f"Failed to send approval request email: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return False


# def send_status_notification(obj, old_status, notes=''):
#     print(f"Starting send_status_notification - Status: {old_status} -> {obj.status}")
    
#     base_context = {
#         'ticket': obj.ticket_number,
#         'user': obj.user,  # Pass the User object
#         'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name separately
#         'resource': obj.resource.name if obj.resource else 'N/A',
#         'access_level': obj.access_level.name if obj.access_level else 'N/A',
#         'old_status': old_status,
#         'new_status': obj.get_status_display(),
#         'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
#         'notes': notes
#     }

#     # Notify the requester - FIXED: Don't send approval_notification.html for APPROVAL_REQUIRED
#     user_context = base_context.copy()
    
#     # Choose template based on status
#     if obj.status == 'APPROVED':
#         template = 'approval_notification.html'
#     elif obj.status == 'REJECTED':
#         template = 'rejection_notification.html'
#     elif obj.status == 'APPROVAL_REQUIRED':
#         template = 'approval_request.html'  # This tells requester their request needs approval
#     elif obj.status in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
#         template = 'status_update.html'  # Generic status update
#     else:
#         template = 'status_update.html'

#     print(f"Sending notification to requester: {obj.user.email}")
#     print(f"Using template: {template}")
    
#     send_email_notification(
#         obj,
#         f"Access Request {obj.ticket_number} - Status Update",
#         template,
#         user_context,
#         [obj.user.email],
#         is_reply=True
#     )

#     # Notify the resource team (only skip for APPROVER_APPROVED and APPROVER_REJECTED)
#     if obj.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
#         team_context = base_context.copy()
#         team_context['requester'] = base_context['user_name']
#         if obj.status == 'APPROVAL_REQUIRED':
#             template = 'approval_required_team.html'
#         else:
#             template = 'status_update.html'

#         if obj.resource and obj.resource.resource_team_email:
#             print(f"Sending notification to resource team: {obj.resource.resource_team_email}")
#             send_email_notification(
#                 obj,
#                 f"Access Request {obj.ticket_number} - Status Update",
#                 template,
#                 team_context,
#                 [obj.resource.resource_team_email],
#                 is_reply=True
#             )

#     # Notify the assignee for any status change
#     if obj.assigned_to:
#         assignee_context = base_context.copy()
#         assignee_context['assignee'] = obj.assigned_to.get_full_name() or obj.assigned_to.username
#         assignee_context['assignee_employee_id'] = obj.assigned_to.username
#         template = 'status_update_assignee.html' if obj.status == 'APPROVED' else 'rejection_notification_assignee.html' if obj.status == 'REJECTED' else 'status_update_assignee.html'
        
#         print(f"Sending notification to assignee: {obj.assigned_to.email}")
#         send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number} - {obj.get_status_display()}",
#             template,
#             assignee_context,
#             [obj.assigned_to.email],
#             is_reply=True
#         )

#     # REMOVED: Don't send approval request here - it's handled separately
#     # The approval email is sent by send_approval_request_notification() which is called from admin.py


# def send_final_approval_notification(obj):
#     """Send a final approval notification to the employee when the request is approved"""
#     try:
#         context = {
#             'ticket': obj.ticket_number,
#             'user': obj.user,  # Pass the User object
#             'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name
#             'resource': obj.resource.name if obj.resource else 'N/A',
#             'access_level': obj.access_level.name if obj.access_level else 'N/A',
#             'status': obj.get_status_display(),
#             'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
#         }

#         send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number} - Final Approval",
#             'final_approval_notification.html',
#             context,
#             [obj.user.email],
#             is_reply=True
#         )
#         return True
#     except Exception as e:
#         print(f"Failed to send final approval notification: {str(e)}")
#         return False



import uuid
import base64
import datetime
import os
import re
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Resource, EmailThread

def extract_images_from_html(html_content):
    """
    Extract all image sources from HTML content
    Returns list of image paths found in the HTML
    """
    print(f"extract_images_from_html called with content length: {len(html_content) if html_content else 0}")
    
    if not html_content:
        print(f"No HTML content provided")
        return []
    
    print(f"HTML content preview (first 300 chars): {html_content[:300]}...")
    
    # Find all img tags with src attributes
    import re
    img_pattern = r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>'
    matches = re.findall(img_pattern, html_content, re.IGNORECASE)
    
    print(f"Found {len(matches)} img src matches using pattern: {img_pattern}")
    for i, match in enumerate(matches):
        print(f"  Match {i+1}: {match}")
    
    image_paths = []
    for i, src in enumerate(matches):
        print(f"Processing src {i+1}: {src}")
        
        # Handle both relative and absolute URLs
        if src.startswith('/media/'):
            # Remove leading slash and media/ for default_storage
            clean_path = src.replace('/media/', '')
            
            # URL DECODE THE FILENAME
            from urllib.parse import unquote
            decoded_path = unquote(clean_path)
            
            image_paths.append(decoded_path)
            print(f"  Added relative media path: {clean_path}")
            print(f"  URL decoded to: {decoded_path}")
            
        elif src.startswith(settings.MEDIA_URL):
            # Handle full media URLs
            clean_path = src.replace(settings.MEDIA_URL, '')
            
            # URL DECODE THE FILENAME
            from urllib.parse import unquote
            decoded_path = unquote(clean_path)
            
            image_paths.append(decoded_path)
            print(f"  Added full media URL path: {clean_path}")
            print(f"  URL decoded to: {decoded_path}")
        else:
            print(f"  Skipping non-media URL: {src}")
    
    print(f"Final image_paths extracted: {image_paths}")
    return image_paths


def process_html_for_email(html_content, ticket_number):
    """
    Process HTML content to handle images for email
    Returns updated HTML and list of image attachments
    """
    if not html_content:
        return html_content, []
    
    image_paths = extract_images_from_html(html_content)
    image_attachments = []
    
    for image_path in image_paths:
        try:
            if default_storage.exists(image_path):
                # Read the image file
                with default_storage.open(image_path, 'rb') as image_file:
                    image_data = image_file.read()
                
                # Get filename and extension
                filename = os.path.basename(image_path)
                file_ext = filename.split('.')[-1].lower()
                
                # Create attachment info
                image_attachments.append({
                    'filename': filename,
                    'data': image_data,
                    'content_type': f'image/{file_ext}',
                    'path': image_path
                })
                
                print(f"Found image for email: {image_path}")
            else:
                print(f"Image not found in storage: {image_path}")
        except Exception as e:
            print(f"Error processing image {image_path}: {str(e)}")
    
    return html_content, image_attachments


def process_base64_images(html_content, ticket_number):
    """
    Process base64 embedded images and save them to storage
    Returns updated HTML with saved image URLs
    """
    if not html_content:
        return html_content, []
    
    # Find all base64 images
    img_pattern = r'<img[^>]*src="data:image/([^;]+);base64,([^"]+)"[^>]*>'
    saved_images = []
    
    def replace_image(match):
        img_format = match.group(1)  # jpeg, png, etc.
        img_data = match.group(2)    # base64 data
        
        try:
            # Decode base64
            image_data = base64.b64decode(img_data)
            
            # Generate unique filename
            filename = f"email_images/{ticket_number}/{uuid.uuid4().hex}.{img_format}"
            
            # Save to storage
            path = default_storage.save(filename, ContentFile(image_data))
            DOMAIN_NAME = os.getenv('SITE_URL')
            # Generate URL for email
            if settings.DEBUG:
                image_url = f"{DOMAIN_NAME}{settings.MEDIA_URL}{path}"
            else:
                image_url = default_storage.url(path)
            
            saved_images.append({
                'filename': os.path.basename(filename),
                'data': image_data,
                'content_type': f'image/{img_format}',
                'path': path
            })
            
            # Replace with new img tag
            return f'<img src="{image_url}" style="max-width: 100%; height: auto;">'
            
        except Exception as e:
            print(f"Error processing base64 image: {str(e)}")
            return match.group(0)  # Return original if error
    
    # Replace all base64 images
    updated_html = re.sub(img_pattern, replace_image, html_content)
    
    return updated_html, saved_images


def send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
    """
    Enhanced email sending function that handles images with CID embedding for inline display
    """
    try:
        base_message_id = generate_message_id(ticket_number)
        message_id = base_message_id if not is_reply else f"{base_message_id}.{uuid.uuid4().hex[:8]}"
        thread_index = generate_thread_index(ticket_number)

        if subject.startswith("Welcome to Optima Hub Management"):
            subject = subject
        else:
            base_subject = f"Access Request {ticket_number}"
            if not subject.startswith(base_subject):
                subject = base_subject if not is_reply else f"Re: {base_subject}"

        headers = {
            'Message-ID': message_id,
            'References': base_message_id,
            'In-Reply-To': base_message_id if is_reply else None,
            'Thread-Index': thread_index,
            'Subject': subject,
        }

        all_attachments = []
        processed_html = html_message
        cid_mapping = {}  # Store filename -> CID mapping

        if html_message:
            # First, process any base64 images
            processed_html, base64_images = process_base64_images(html_message, ticket_number)
            all_attachments.extend(base64_images)
            
            # Then, find and attach existing images from media folder
            final_html, media_images = process_html_for_email(processed_html, ticket_number)
            all_attachments.extend(media_images)
            
            processed_html = final_html

        # Create CID mappings and update HTML for inline display
        if processed_html and all_attachments:
            import re
            
            # Create CID for each image and update HTML
            for i, attachment in enumerate(all_attachments):
                filename = attachment['filename']
                cid = f"image{i+1}_{uuid.uuid4().hex[:8]}"
                cid_mapping[filename] = cid
                
                # Replace /media/ URLs with cid: URLs in HTML
                media_pattern = f"/media/{re.escape(filename.replace(' ', '%20'))}"
                cid_url = f"cid:{cid}"
                processed_html = re.sub(media_pattern, cid_url, processed_html)
                
                print(f"Mapped {filename} -> cid:{cid}")

        # Create email with attachments and CID embedding
        if processed_html and all_attachments:
            # Use EmailMultiAlternatives for HTML with attachments
            from django.core.mail import EmailMultiAlternatives
            from email.mime.image import MIMEImage
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=strip_tags(processed_html) if processed_html else body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
                headers=headers
            )
            
            # Attach HTML version
            email.attach_alternative(processed_html, "text/html")
            
            # Attach all images with CID for inline display
            for attachment in all_attachments:
                filename = attachment['filename']
                image_data = attachment['data']
                content_type = attachment['content_type']
                
                # Create MIMEImage for proper inline embedding
                if content_type.startswith('image/'):
                    img = MIMEImage(image_data)
                    cid = cid_mapping.get(filename, f"image_{uuid.uuid4().hex[:8]}")
                    img.add_header('Content-ID', f'<{cid}>')
                    img.add_header('Content-Disposition', 'inline', filename=filename)
                    email.attach(img)
                    print(f"Attached inline image: {filename} with CID: {cid}")
                else:
                    # Fallback for non-image files
                    email.attach(filename, image_data, content_type)
                    print(f"Attached file: {filename}")
                
        elif processed_html:
            # HTML email without attachments
            from django.core.mail import EmailMultiAlternatives
            email = EmailMultiAlternatives(
                subject=subject,
                body=strip_tags(processed_html),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
                headers=headers
            )
            email.attach_alternative(processed_html, "text/html")
        else:
            # Plain text email
            from django.core.mail import EmailMessage
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipients,
                headers=headers
            )

        email.send()
        print(f"Email sent successfully to {', '.join(recipients)} with {len(all_attachments)} image attachments")
        print(f"Images embedded inline with CID mapping: {cid_mapping}")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# Keep your existing utility functions
def get_or_create_thread_index(ticket_number):
    thread, created = EmailThread.objects.get_or_create(
        ticket_number=ticket_number,
        defaults={'thread_index': base64.b64encode(f"thread-{ticket_number}".encode()).decode()}
    )
    return thread.thread_index

def generate_message_id(ticket_number):
    domain = 'techoptima.ai'
    return f'<access-request-{ticket_number}@{domain}>'

def generate_thread_index(ticket_number):
    thread_id = f"thread-{ticket_number}-{uuid.uuid4().hex[:8]}"
    return base64.b64encode(thread_id.encode()).decode()

# Replace your existing send_threaded_email function with this enhanced version
def send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=None):
    """
    Updated to use the enhanced image-aware email function
    """
    return send_threaded_email_with_images(subject, body, recipients, ticket_number, is_reply, html_message)

def send_email_with_threading(subject, body, recipients, ticket_number, html_message=None):
    return send_threaded_email(subject, body, recipients, ticket_number, is_reply=True, html_message=html_message)

def generate_approval_token(access_request):
    """Generate a secure token for approval/rejection links"""
    return urlsafe_base64_encode(force_bytes(f"{access_request.id}-{access_request.ticket_number}-{uuid.uuid4().hex}"))

def get_approval_urls(request_id, token, for_resource_owner=False):
    """Generate approval and rejection URLs"""
    base_url = settings.SITE_URL.rstrip('/')
    if for_resource_owner:
        approve_url = f"{base_url}/api/resource-management/resource-owner-approve/{request_id}/{token}/approve/"
        reject_url = f"{base_url}/api/resource-management/resource-owner-approve/{request_id}/{token}/reject/"
    else:
        approve_url = f"{base_url}/api/resource-management/approve-request/{request_id}/{token}/approve/"
        reject_url = f"{base_url}/api/resource-management/approve-request/{request_id}/{token}/reject/"
    print(f"Generated Approve URL: {approve_url}")
    print(f"Generated Reject URL: {reject_url}")
    return approve_url, reject_url

def get_user_role(user):
    if user.is_superuser:
        return 'superuser'
    if Resource.objects.filter(resource_team_email=user.email).exists():
        return 'resource_owner'
    return 'employee'


def send_email_notification(obj, subject, template_name, context, recipients=None, is_reply=True):
    print(f"Starting send_email_notification for template: {template_name}")
    print(f"Subject: {subject}")
    print(f"Recipients provided: {recipients}")
    
    try:
        if recipients is None:
            print("Recipients is None, determining from obj...")
            if obj is None:
                raise ValueError("Recipients must be provided if obj is None")
            recipients = [obj.user.email]
            print(f"Added user email: {obj.user.email}")
            print(f"DEBUG: obj.resource = {obj.resource}")
            print(f"DEBUG: obj.resource.name = {obj.resource.name if obj.resource else 'No Resource'}")
            
            if obj.resource and obj.resource.resource_team_email:
                print(f"DEBUG: Found resource_team_email = {obj.resource.resource_team_email}")
                recipients.append(obj.resource.resource_team_email)
                print(f"DEBUG: Added to recipients. Final recipients = {recipients}")
            else:
                print(f"DEBUG: No resource_team_email found for resource {obj.resource.name if obj.resource else 'None'}")

        print(f"Final recipients list: {recipients}")
        
        # DETAILED IMAGE DEBUGGING
        processed_justification = context.get('justification', '')
        print(f"DEBUGGING JUSTIFICATION CONTENT:")
        print(f"Raw justification type: {type(processed_justification)}")
        print(f"Raw justification length: {len(str(processed_justification))} characters")
        print(f"First 200 chars: {str(processed_justification)[:200]}...")
        
        # Check for image indicators
        has_img_tag = '<img' in str(processed_justification)
        has_src_attr = 'src=' in str(processed_justification)
        has_media_url = '/media/' in str(processed_justification)
        has_base64 = 'data:image' in str(processed_justification)
        
        print(f"Image indicators:")
        print(f"  - Has <img tag: {has_img_tag}")
        print(f"  - Has src= attribute: {has_src_attr}")
        print(f"  - Has /media/ URL: {has_media_url}")
        print(f"  - Has base64 data: {has_base64}")
        
        if processed_justification and obj:
            print(f"Processing justification content for images...")
            
            # Check if justification contains images
            if has_img_tag or has_src_attr:
                print(f"Found images in justification content")
                
                # Show what images we're trying to extract
                image_paths = extract_images_from_html(str(processed_justification))
                print(f"extract_images_from_html found: {len(image_paths)} images")
                for i, path in enumerate(image_paths):
                    print(f"  Image {i+1}: {path}")
                
                # Process base64 images and save them
                if has_base64:
                    print(f"Processing base64 images...")
                    processed_justification, base64_images = process_base64_images(str(processed_justification), obj.ticket_number)
                    if base64_images:
                        print(f"Processed {len(base64_images)} base64 images")
                        for i, img in enumerate(base64_images):
                            print(f"  Base64 Image {i+1}: {img['filename']} ({img['content_type']})")
                    else:
                        print(f"No base64 images processed")
                else:
                    print(f"No base64 images found, processing existing media images...")
                
                # Update context with processed justification
                context = context.copy()  # Don't modify original context
                context['justification'] = processed_justification
                print(f"Updated context with processed justification")
            else:
                print(f"No images found in justification content")
        else:
            print(f"No justification content to process (empty or no obj)")
        
        # Try to render the template
        print(f"Attempting to render template: resource_management/{template_name}")
        print(f"Template context keys: {list(context.keys())}")
        
        try:
            html_message = render_to_string(f'resource_management/emails/{template_name}', context)
            print(f"Template rendered successfully, length: {len(html_message)} characters")
            
            # Check if the rendered HTML contains images
            rendered_has_img = '<img' in html_message
            rendered_has_media = '/media/' in html_message
            print(f"Rendered template image check:")
            print(f"  - Rendered HTML has <img: {rendered_has_img}")
            print(f"  - Rendered HTML has /media/: {rendered_has_media}")
            
            if rendered_has_img:
                print(f"Images found in rendered HTML - first 300 chars around img:")
                import re
                img_matches = re.findall(r'.{0,50}<img[^>]*>.{0,50}', html_message)
                for i, match in enumerate(img_matches[:3]):  # Show first 3 matches
                    print(f"  Match {i+1}: {match}")
            
        except Exception as template_error:
            print(f"Template rendering failed: {str(template_error)}")
            raise template_error
        
        plain_message = strip_tags(html_message)
        print(f"Plain message length: {len(plain_message)} characters")
        
        # Use ticket_number from obj if available, otherwise generate a unique message ID
        ticket_number = f"employee-{context['user'].id}" if obj is None else obj.ticket_number
        print(f"Using ticket_number: {ticket_number}")
        
        # Use the enhanced email function that handles images
        print(f"Calling send_threaded_email_with_images (image-aware)...")
        email_result = send_threaded_email_with_images(
            subject=subject,
            body=plain_message,
            recipients=recipients,
            ticket_number=ticket_number,
            is_reply=is_reply,
            html_message=html_message
        )
        
        if email_result:
            print(f"Email sent successfully to {', '.join(recipients)}")
            return True
        else:
            print(f"send_threaded_email_with_images returned False")
            return False
            
    except Exception as e:
        print(f"EXCEPTION in send_email_notification: {str(e)}")
        print(f"Exception type: {type(e)}")
        import traceback
        print(f"Full traceback:")
        traceback.print_exc()
        return False


from notifications.services import NotificationService
from resource_management.models import ResourceType, Resource

def send_request_notification(access_request):
    """Send email notification for new access request"""
    print("Starting send_request_notification...") 
    
    # Debug the resource assignment
    print(f"DEBUG: access_request.resource = {access_request.resource}")
    if access_request.resource:
        print(f"DEBUG: resource.name = {access_request.resource.name}")
        print(f"DEBUG: resource.resource_team_email = {access_request.resource.resource_team_email}")
    else:
        print(f"DEBUG: No resource found for this request")
        
        # CRITICAL FIX: Auto-assign IT Support resource if missing
        if access_request.request_type == 'IT':
            try:
                print("Attempting to auto-assign IT Support resource...")
                it_resource_type = ResourceType.objects.get(name='IT Support')
                it_resource = Resource.objects.filter(
                    resource_type=it_resource_type,
                    is_active=True
                ).first()
                
                if it_resource:
                    access_request.resource = it_resource
                    access_request.save()
                    print(f"AUTO-ASSIGNED IT resource: {it_resource.name} with email: {it_resource.resource_team_email}")
                else:
                    print("No active IT Support resource found in database")
            except ResourceType.DoesNotExist:
                print("IT Support resource type not found in database")

    try:
        if access_request.request_type == 'IT':
            # IT support-specific context
            it_support_context = {
                'ticket': access_request.ticket_number,
                'user': access_request.user,
                'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
                'priority': access_request.get_priority_display(),
                'justification': access_request.justification,
                'duration': access_request.duration,
            }
            print(f"Preparing to send IT support emails with context: {list(it_support_context.keys())}")
            
            # Send email to user (try multiple templates as fallback)
            print("Attempting to send user email...")
            user_templates = ['it_support_user.html', 'new_request_user.html']

            for template in user_templates:
                print(f"Trying user template: {template}")
                result = send_email_notification(
                    access_request,
                    f"New IT Support Ticket - ID {access_request.ticket_number}",
                    template,
                    it_support_context,
                    [access_request.user.email],
                    is_reply=False
                )
                
                if result:
                    print(f"USER EMAIL SUCCESS with template: {template}")
                    # Notify user via App/Push
                    NotificationService.create_notification(
                        recipient=access_request.user,
                        notification_type='RESOURCE_REQUEST',
                        title="IT Support Request Submitted",
                        message=f"Your IT support request {access_request.ticket_number} has been submitted.",
                        action_url=f"/resource-management/requests"
                    )
                    break
                else:
                    print(f"USER EMAIL FAILED with template: {template}")
            
            # Send email to IT admins/team
            if access_request.resource and access_request.resource.resource_team_email:
                admin_recipients = [access_request.resource.resource_team_email]
            else:
                # Fallback to platform admins (staff/superusers or members of admin-like groups)
                try:
                    User = get_user_model()
                    admin_groups = ['Resource Team', 'Admin', 'HR Admin', 'HR Manager', 'IT Support']
                    qs = User.objects.filter(Q(is_superuser=True) | Q(is_staff=True) | Q(groups__name__in=admin_groups)).distinct()
                    admin_recipients = [u.email for u in qs if u.email]
                except Exception as e:
                    print(f"Failed to build admin recipients: {str(e)}")
                    admin_recipients = []

            if not admin_recipients:
                print("No admin recipients found for IT request; skipping team email")
            else:
                print(f"Preparing to send IT team email to: {', '.join(admin_recipients)}")
            
            print("Attempting to send team email...")
            team_templates = ['it_support_team.html', 'new_request_team.html']

            for template in team_templates:
                print(f"Trying team template: {template}")
                result = send_email_notification(
                    access_request,
                    f"Access Request {access_request.ticket_number}",
                    template,
                    it_support_context,
                    admin_recipients,
                    is_reply=True
                )
                
                if result:
                    print(f"TEAM EMAIL SUCCESS with template: {template}")
                    # Notify admins via App/Push
                    for admin_email in admin_recipients:
                        try:
                            from django.contrib.auth import get_user_model
                            User = get_user_model()
                            admin_user = User.objects.filter(email=admin_email).first()
                            if admin_user:
                                NotificationService.create_notification(
                                    recipient=admin_user,
                                    notification_type='RESOURCE_REQUEST',
                                    title="New IT Support Request",
                                    message=f"New IT support request {access_request.ticket_number} from {access_request.user.get_full_name()}",
                                    action_url=f"/resource-management/requests"
                                )
                        except Exception as ne:
                            print(f"Failed to send app notification to admin {admin_email}: {str(ne)}")
                    break
                else:
                    print(f"TEAM EMAIL FAILED with template: {template}")
            
        else:
            # Regular access request (non-IT)
            print("Processing regular access request...")
            user_context = {
                'ticket': access_request.ticket_number,
                'user': access_request.user,
                'user_name': access_request.user.get_full_name() if access_request.user else 'Unknown',
                'resource': getattr(access_request.resource, 'name', 'N/A') if access_request.resource else "N/A",
                'access_level': getattr(access_request.access_level, 'name', 'N/A') if access_request.access_level else "N/A",
                'priority': access_request.get_priority_display(),
                'justification': access_request.justification,
                'resource_type': getattr(access_request.resource.resource_type, 'name', 'N/A') if access_request.resource and access_request.resource.resource_type else "N/A",
                'duration': access_request.duration,
                'approval_token_expiry': access_request.approval_token_expiry,
            }
            
            # Send to user
            user_result = send_email_notification(
                access_request,
                f"Access Request {access_request.ticket_number}",
                'new_request_user.html',
                user_context,
                [access_request.user.email],
                is_reply=False
            )
            
            if user_result:
                print("Regular access request user email sent")
                # Notify user via App/Push
                NotificationService.create_notification(
                    recipient=access_request.user,
                    notification_type='RESOURCE_REQUEST',
                    title="Access Request Submitted",
                    message=f"Your access request {access_request.ticket_number} for {access_request.resource.name if access_request.resource else 'a resource'} has been submitted.",
                    action_url=f"/resource-management/requests"
                )
            else:
                print("Regular access request user email failed")

            # Send to admins/team
            team_context = user_context.copy()
            team_context['requester'] = user_context['user_name']
            if access_request.resource and access_request.resource.resource_team_email:
                admin_recipients = [access_request.resource.resource_team_email]
            else:
                try:
                    User = get_user_model()
                    admin_groups = ['Resource Team', 'Admin', 'HR Admin', 'HR Manager', 'IT Support']
                    qs = User.objects.filter(Q(is_superuser=True) | Q(is_staff=True) | Q(groups__name__in=admin_groups)).distinct()
                    admin_recipients = [u.email for u in qs if u.email]
                except Exception as e:
                    print(f"Failed to build admin recipients: {str(e)}")
                    admin_recipients = []

            if not admin_recipients:
                print("No admin recipients found for regular access request")
            else:
                team_result = send_email_notification(
                    access_request,
                    f"Access Request {access_request.ticket_number}",
                    'new_request_team.html',
                    team_context,
                    admin_recipients,
                    is_reply=True
                )
                
                if team_result:
                    print(f"Regular access request team email sent to: {', '.join(admin_recipients)}")
                    # Notify team via App/Push
                    for admin_email in admin_recipients:
                        try:
                            from django.contrib.auth import get_user_model
                            User = get_user_model()
                            admin_user = User.objects.filter(email=admin_email).first()
                            if admin_user:
                                NotificationService.create_notification(
                                    recipient=admin_user,
                                    notification_type='RESOURCE_REQUEST',
                                    title="New Access Request",
                                    message=f"New access request {access_request.ticket_number} from {access_request.user.get_full_name()}",
                                    action_url=f"/resource-management/requests"
                                )
                        except Exception as ne:
                            print(f"Failed to send app notification to admin {admin_email}: {str(ne)}")
                else:
                    print(f"Regular access request team email failed")

    except Exception as e:
        print(f"CRITICAL ERROR in send_request_notification: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    print("send_request_notification completed")
    return True


# def send_approval_request_notification(obj, notes):
#     """Send approval request with proper URLs"""
#     try:
#         print(f"Starting send_approval_request_notification for ticket: {obj.ticket_number}")
#         print(f"Approver email: {obj.approver_email}")
        
#         if not obj.approval_token:
#             obj.approval_token = uuid.uuid4().hex
#             obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)  # Token expires in 15 days
#             obj.save()
#             print(f"Generated and saved token: {obj.approval_token}")

#         approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)
#         print(f"Generated Approve URL: {approve_url}")
#         print(f"Generated Reject URL: {reject_url}")

#         context = {
#             'ticket': obj.ticket_number,
#             'requester': obj.user,  # ← Pass the User object, not a string
#             'requester_employee_id': obj.user.username,
#             'resource': obj.resource.name if obj.resource else 'N/A',
#             'access_level': obj.access_level.name if obj.access_level else 'N/A',
#             'justification': obj.justification,
#             'notes': notes,
#             'approve_url': approve_url,
#             'reject_url': reject_url,
#             'approval_token_expiry': obj.approval_token_expiry,
#         }

#         print(f"Sending approval email with context: {list(context.keys())}")

#         # Use the enhanced email function that handles images
#         result = send_email_notification(
#             obj,
#             f"Access Request {obj.ticket_number} - Approval Required",
#             'approval_required_approver.html',
#             context,
#             [obj.approver_email],
#             is_reply=True
#         )
        
#         if result:
#             print(f"Approval email sent successfully to: {obj.approver_email}")
#             return True
#         else:
#             print(f"Failed to send approval email to: {obj.approver_email}")
#             return False
            
#     except Exception as e:
#         print(f"Failed to send approval request email: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         return False

def send_approval_request_notification(obj, notes):
    """Send approval request with proper URLs"""
    try:
        print(f"🚀 Starting send_approval_request_notification for ticket: {obj.ticket_number}")
        print(f"📧 Approver email: {obj.approver_email}")
        
        if not obj.approval_token:
            obj.approval_token = uuid.uuid4().hex
            obj.approval_token_expiry = timezone.now() + datetime.timedelta(days=15)
            obj.save()
            print(f"🔑 Generated and saved token: {obj.approval_token}")

        approve_url, reject_url = get_approval_urls(obj.id, obj.approval_token)
        print(f"✅ Generated approve URL: {approve_url}")
        print(f"❌ Generated reject URL: {reject_url}")

        # Test the URLs by checking if they contain the expected parts
        expected_approve = f"/api/resource-management/approve-request/{obj.id}/{obj.approval_token}/approve/"
        expected_reject = f"/api/resource-management/approve-request/{obj.id}/{obj.approval_token}/reject/"
        
        if expected_approve in approve_url:
            print("✓ Approve URL format is correct")
        else:
            print(f"⚠️ Approve URL format issue. Expected: {expected_approve}, Got: {approve_url}")
            
        if expected_reject in reject_url:
            print("✓ Reject URL format is correct")
        else:
            print(f"⚠️ Reject URL format issue. Expected: {expected_reject}, Got: {reject_url}")

        context = {
            'ticket': obj.ticket_number,
            'requester': obj.user,  # Pass the User object, not a string
            'requester_employee_id': obj.user.username,
            'resource': obj.resource.name if obj.resource else 'N/A',
            'access_level': obj.access_level.name if obj.access_level else 'N/A',
            'justification': obj.justification,
            'notes': notes,
            'approve_url': approve_url,
            'reject_url': reject_url,
            'approval_token_expiry': obj.approval_token_expiry,
        }

        print(f"📧 Sending approval email with context: {list(context.keys())}")

        # Use the enhanced email function that handles images
        result = send_email_notification(
            obj,
            f"Access Request {obj.ticket_number} - Approval Required",
            'approval_required_approver.html',
            context,
            [obj.approver_email],
            is_reply=True
        )
        
        if result:
            print(f"✅ Approval email sent successfully to: {obj.approver_email}")
            
            # Notify approver via App/Push if they are a user in the system
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                approver_user = User.objects.filter(email=obj.approver_email).first()
                if approver_user:
                    NotificationService.create_notification(
                        recipient=approver_user,
                        notification_type='RESOURCE_APPROVAL_REQUIRED',
                        title="Approval Required",
                        message=f"Your approval is required for access request {obj.ticket_number} from {obj.user.get_full_name()}",
                        action_url=f"/resource-management/approvals"
                    )
            except Exception as ne:
                print(f"Failed to send app notification to approver: {str(ne)}")
                
            return True
        else:
            print(f"❌ Failed to send approval email to: {obj.approver_email}")
            return False
            
    except Exception as e:
        print(f"💥 Failed to send approval request email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
def send_status_notification(obj, old_status, notes=''):
    print(f"Starting send_status_notification - Status: {old_status} -> {obj.status}")
    
    base_context = {
        'ticket': obj.ticket_number,
        'user': obj.user,  # Pass the User object
        'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name separately
        'resource': obj.resource.name if obj.resource else 'N/A',
        'access_level': obj.access_level.name if obj.access_level else 'N/A',
        'old_status': old_status,
        'new_status': obj.get_status_display(),
        'updated_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
        'notes': notes
    }

    # Notify the requester - FIXED: Don't send approval_notification.html for APPROVAL_REQUIRED
    user_context = base_context.copy()
    
    # Choose template based on status
    if obj.status == 'APPROVED':
        template = 'approval_notification.html'
    elif obj.status == 'REJECTED':
        template = 'rejection_notification.html'
    elif obj.status == 'APPROVAL_REQUIRED':
        template = 'approval_request.html'  # This tells requester their request needs approval
    elif obj.status in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
        template = 'status_update.html'  # Generic status update
    else:
        template = 'status_update.html'

    print(f"Sending notification to requester: {obj.user.email}")
    print(f"Using template: {template}")
    
    send_email_notification(
        obj,
        f"Access Request {obj.ticket_number} - Status Update",
        template,
        user_context,
        [obj.user.email],
        is_reply=True
    )
    
    # Notify requester via App/Push
    n_type = 'RESOURCE_REQUEST'
    if obj.status == 'APPROVED': n_type = 'RESOURCE_APPROVED'
    elif obj.status == 'REJECTED': n_type = 'RESOURCE_REJECTED'
    elif obj.status == 'APPROVAL_REQUIRED': n_type = 'RESOURCE_APPROVAL_REQUIRED'
    
    NotificationService.create_notification(
        recipient=obj.user,
        notification_type=n_type,
        title=f"Access Request {obj.get_status_display()}",
        message=f"Your access request {obj.ticket_number} has been {obj.get_status_display().lower()}.",
        action_url=f"/resource-management/requests"
    )

    # Notify the resource team (only skip for APPROVER_APPROVED and APPROVER_REJECTED)
    if obj.status not in ['APPROVER_APPROVED', 'APPROVER_REJECTED']:
        team_context = base_context.copy()
        team_context['requester'] = base_context['user_name']
        if obj.status == 'APPROVAL_REQUIRED':
            template = 'approval_required_team.html'
        else:
            template = 'status_update.html'

        if obj.resource and obj.resource.resource_team_email:
            print(f"Sending notification to resource team: {obj.resource.resource_team_email}")
            send_email_notification(
                obj,
                f"Access Request {obj.ticket_number} - Status Update",
                template,
                team_context,
                [obj.resource.resource_team_email],
                is_reply=True
            )

    # Notify the assignee for any status change
    if obj.assigned_to:
        assignee_context = base_context.copy()
        assignee_context['assignee'] = obj.assigned_to.get_full_name() or obj.assigned_to.username
        assignee_context['assignee_employee_id'] = obj.assigned_to.username
        template = 'status_update_assignee.html' if obj.status == 'APPROVED' else 'rejection_notification_assignee.html' if obj.status == 'REJECTED' else 'status_update_assignee.html'
        
        print(f"Sending notification to assignee: {obj.assigned_to.email}")
        send_email_notification(
            obj,
            f"Access Request {obj.ticket_number} - {obj.get_status_display()}",
            template,
            assignee_context,
            [obj.assigned_to.email],
            is_reply=True
        )
        
        # Notify assignee via App/Push
        NotificationService.create_notification(
            recipient=obj.assigned_to,
            notification_type='RESOURCE_ASSIGNED',
            title="Access Request Assigned",
            message=f"Access request {obj.ticket_number} has been assigned to you.",
            action_url=f"/resource-management/requests"
        )

    # REMOVED: Don't send approval request here - it's handled separately
    # The approval email is sent by send_approval_request_notification() which is called from admin.py


def send_final_approval_notification(obj):
    """Send a final approval notification to the employee when the request is approved"""
    try:
        context = {
            'ticket': obj.ticket_number,
            'user': obj.user,  # Pass the User object
            'user_name': obj.user.get_full_name() or obj.user.username,  # Pass the display name
            'resource': obj.resource.name if obj.resource else 'N/A',
            'access_level': obj.access_level.name if obj.access_level else 'N/A',
            'status': obj.get_status_display(),
            'approved_by': obj.approved_by.get_full_name() if obj.approved_by else 'System',
        }

        send_email_notification(
            obj,
            f"Access Request {obj.ticket_number} - Final Approval",
            'final_approval_notification.html',
            context,
            [obj.user.email],
            is_reply=True
        )
        return True
    except Exception as e:
        print(f"Failed to send final approval notification: {str(e)}")
        return False