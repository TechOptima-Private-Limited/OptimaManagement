# # common/middleware.py

# from django.contrib import messages
# from django.utils import timezone
# from datetime import timedelta

# class LoginLockoutMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         # Before processing the request
#         if request.path.endswith('/login/') and request.method == 'POST':
#             if self.is_locked_out(request):
#                 messages.error(request, "Account locked for 30 minutes due to failed attempts.")
#                 return self.get_response(request)

#         response = self.get_response(request)

#         # After processing the request
#         if (request.path.endswith('/login/') and 
#             request.method == 'POST' and 
#             response.status_code == 200 and  # Login failed (form errors)
#             not request.user.is_authenticated):
            
#             self.handle_failed_login(request)
        
#         elif (request.path.endswith('/login/') and 
#               request.method == 'POST' and 
#               request.user.is_authenticated):
            
#             # Success - clear failures
#             self.clear_failures(request)

#         return response

#     def is_locked_out(self, request):
#         lockout_time = request.session.get('lockout_time')
#         if not lockout_time:
#             return False
        
#         try:
#             lockout_dt = timezone.datetime.fromisoformat(lockout_time)
#             if timezone.now() - lockout_dt < timedelta(minutes=30):
#                 return True
#             else:
#                 self.clear_failures(request)
#                 return False
#         except:
#             self.clear_failures(request)
#             return False

#     def handle_failed_login(self, request):
#         if self.is_locked_out(request):
#             return

#         failures = request.session.get('login_failures', 0) + 1
#         request.session['login_failures'] = failures

#         if failures >= 3:
#             request.session['lockout_time'] = timezone.now().isoformat()
#             messages.error(request, "Account locked for 30 minutes due to multiple failed attempts.")
#         else:
#             remaining = 3 - failures
#             messages.warning(request, f"Invalid login. {remaining} attempt(s) remaining.")

#     def clear_failures(self, request):
#         request.session.pop('login_failures', None)
#         request.session.pop('lockout_time', None)



# # common/middleware.py - Add this to your existing middleware file

# from django.contrib import messages
# from django.utils import timezone
# from datetime import timedelta
# import logging

# logger = logging.getLogger(__name__)

# class PasswordChangeLockoutMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         # Check for password change attempts
#         is_password_change = (
#             request.method == 'POST' and 
#             (
#                 '/password-change/' in request.path or
#                 '/password_change/' in request.path or
#                 'password' in request.path.lower() and 'change' in request.path.lower()
#             )
#         )
        
#         # Before processing - check if locked out
#         if is_password_change and hasattr(request, 'session'):
#             if self.is_locked_out(request):
#                 lockout_info = self.get_lockout_info(request)
#                 messages.error(
#                     request, 
#                     f"Password change locked for {lockout_info['remaining_minutes']} more minutes due to failed attempts."
#                 )

#         response = self.get_response(request)

#         # After processing - check if password change failed
#         if is_password_change and hasattr(request, 'session'):
#             # Check if password change failed (form has errors)
#             if response.status_code == 200 and "error below" in response.content.decode('utf-8', errors='ignore').lower():
#                 self.handle_failed_password_change(request)
#             # Check if password change succeeded (redirect)
#             elif response.status_code in [302, 301]:
#                 self.clear_failures(request)

#         return response

#     def is_locked_out(self, request):
#         if not hasattr(request, 'session'):
#             return False
            
#         lockout_time = request.session.get('password_lockout_time')
#         if not lockout_time:
#             return False
        
#         try:
#             lockout_dt = timezone.datetime.fromisoformat(lockout_time)
#             time_passed = timezone.now() - lockout_dt
            
#             if time_passed < timedelta(minutes=30):
#                 return True
#             else:
#                 self.clear_failures(request)
#                 return False
#         except:
#             self.clear_failures(request)
#             return False

#     def get_lockout_info(self, request):
#         lockout_time = request.session.get('password_lockout_time')
#         if not lockout_time:
#             return {'remaining_minutes': 0}
            
#         try:
#             lockout_dt = timezone.datetime.fromisoformat(lockout_time)
#             time_passed = timezone.now() - lockout_dt
#             remaining = timedelta(minutes=30) - time_passed
#             remaining_minutes = max(0, int(remaining.total_seconds() / 60))
            
#             return {'remaining_minutes': remaining_minutes}
#         except:
#             return {'remaining_minutes': 0}

#     def handle_failed_password_change(self, request):
#         if self.is_locked_out(request):
#             return

#         failures = request.session.get('password_failures', 0) + 1
#         request.session['password_failures'] = failures
        
#         if failures >= 3:
#             request.session['password_lockout_time'] = timezone.now().isoformat()
            
#             messages.error(
#                 request, 
#                 "🔒 Password change locked for 30 minutes due to multiple failed attempts."
#             )
                
#         else:
#             remaining = 3 - failures
#             messages.warning(
#                 request,
#                 f"⚠️ Incorrect old password. {remaining} attempt(s) remaining before 30-minute lockout."
#             )

#     def clear_failures(self, request):
#         if hasattr(request, 'session'):
#             if 'password_failures' in request.session:
#                 del request.session['password_failures']
#             if 'password_lockout_time' in request.session:
#                 del request.session['password_lockout_time']




# common/middleware.py

from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class LoginLockoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check for login attempts
        is_login_attempt = (
            request.method == 'POST' and 
            (
                '/login/' in request.path or 
                request.path.endswith('/login/') or
                'login' in request.path.lower()
            )
        )
        
        if is_login_attempt:
            username = request.POST.get('username', '').strip()
            
            # Before processing - check if THIS USER is locked out
            if username and self.is_user_locked_out(username):
                lockout_info = self.get_user_lockout_info(username)
                messages.error(
                    request, 
                    f"User '{username}' is locked for {lockout_info['remaining_minutes']} more minutes due to failed attempts."
                )
                logger.warning(f"Blocked login attempt for locked user: {username}")

        response = self.get_response(request)

        # After processing - check if login failed for specific user
        if is_login_attempt:
            username = request.POST.get('username', '').strip()
            
            if username:
                # Check if login failed (user not authenticated and got form back)
                if (response.status_code == 200 and not request.user.is_authenticated):
                    logger.info(f"Login failed for user: {username}")
                    self.handle_user_failed_login(request, username)
                    
                # Check if login succeeded 
                elif request.user.is_authenticated:
                    logger.info(f"Login succeeded for user: {username}")
                    self.clear_user_failures(username)

        return response

    def is_user_locked_out(self, username):
        """Check if specific user is locked out"""
        lockout_key = f"user_lockout_{username}"
        lockout_time = cache.get(lockout_key)
        
        if not lockout_time:
            return False
        
        try:
            if isinstance(lockout_time, str):
                lockout_dt = timezone.datetime.fromisoformat(lockout_time)
            else:
                lockout_dt = lockout_time
                
            time_passed = timezone.now() - lockout_dt
            
            if time_passed < timedelta(minutes=30):
                return True
            else:
                # Lockout expired
                self.clear_user_failures(username)
                logger.info(f"Lockout expired for user: {username}")
                return False
        except Exception as e:
            logger.error(f"Error checking lockout for {username}: {e}")
            self.clear_user_failures(username)
            return False

    def get_user_lockout_info(self, username):
        """Get remaining lockout time for user"""
        lockout_key = f"user_lockout_{username}"
        lockout_time = cache.get(lockout_key)
        
        if not lockout_time:
            return {'remaining_minutes': 0}
            
        try:
            if isinstance(lockout_time, str):
                lockout_dt = timezone.datetime.fromisoformat(lockout_time)
            else:
                lockout_dt = lockout_time
                
            time_passed = timezone.now() - lockout_dt
            remaining = timedelta(minutes=30) - time_passed
            remaining_minutes = max(0, int(remaining.total_seconds() / 60))
            
            return {'remaining_minutes': remaining_minutes}
        except:
            return {'remaining_minutes': 0}

    def handle_user_failed_login(self, request, username):
        """Handle failed login for specific user"""
        # ❗ Check if the user exists
        from django.contrib.auth import get_user_model

        User = get_user_model()
        user_exists = User.objects.filter(username=username).exists()

        if not user_exists:
            logger.warning(f"Login attempt for non-existent user: {username} from IP: {self.get_client_ip(request)}")
            messages.error(request, f"⚠️ '{username}' has not been onboarded. Please contact your HR team to create your account.")
            return  # Exit early — no tracking or locking

        if self.is_user_locked_out(username):
            return

        # Get current failure count for this user
        failures_key = f"user_failures_{username}"
        failures = cache.get(failures_key, 0) + 1
        
        # Store failure count (expires in 30 minutes)
        cache.set(failures_key, failures, timeout=1800)
        
        logger.warning(f"Failed login attempt #{failures} for user: {username} from IP: {self.get_client_ip(request)}")

        if failures >= 3:
            # Lock this specific user
            lockout_key = f"user_lockout_{username}"
            cache.set(lockout_key, timezone.now().isoformat(), timeout=1800)  # 30 minutes
            
            ip_address = self.get_client_ip(request)
            
            logger.critical(f"USER LOCKED: '{username}' from IP {ip_address} after {failures} failed attempts")
            
            messages.error(
                request, 
                f"🔒 User '{username}' locked for 30 minutes due to multiple failed login attempts."
            )
            
            # Optional: Send email notification
            try:
                self.send_lockout_notification(username, ip_address)
            except Exception as e:
                logger.error(f"Failed to send lockout notification: {e}")
                
        else:
            remaining = 3 - failures
            messages.warning(
                request,
                f"⚠️ Invalid credentials for '{username}'. {remaining} attempt(s) remaining before 30-minute lockout."
            )

    def send_lockout_notification(self, username, ip_address):
        """Send email notification about user lockout"""
        if '@' in username:  # Only send if username is an email
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                
                send_mail(
                    subject='🔒 Account Locked - Security Alert',
                    message=(
                        f"Hello {username},\n\n"
                        f"Your account has been locked for 30 minutes due to multiple failed login attempts "
                        f"from IP address: {ip_address}.\n\n"
                        f"Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
                        f"If this wasn't you, please contact support immediately.\n\n"
                        f"Best regards,\n"
                        f"Security Team"
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
                    recipient_list=[username],
                    fail_silently=True
                )
                logger.info(f"Lockout notification sent to: {username}")
            except Exception as e:
                logger.error(f"Failed to send email to {username}: {e}")

    def clear_user_failures(self, username):
        """Clear failures for specific user"""
        failures_key = f"user_failures_{username}"
        lockout_key = f"user_lockout_{username}"
        
        cache.delete(failures_key)
        cache.delete(lockout_key)
        
        logger.info(f"Cleared failures for user: {username}")

    def get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')
    


# common/middleware.py - Update the password change middleware

class PasswordChangeLockoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check for password change attempts - Fixed URL pattern
        is_password_change = (
            request.method == 'POST' and 
            'password_change' in request.path  # This will match /en/456/password_change/
        )
        
        # Debug logging
        if request.method == 'POST':
            print(f"POST request to: {request.path}")
            print(f"Is password change: {is_password_change}")
        
        if is_password_change and request.user.is_authenticated:
            username = request.user.username
            print(f"Password change attempt by user: {username}")
            
            # Before processing - check if THIS USER is locked out from password changes
            if self.is_user_locked_out_password(username):
                lockout_info = self.get_user_lockout_info_password(username)
                messages.error(
                    request, 
                    f"Password change locked for {lockout_info['remaining_minutes']} more minutes due to failed attempts."
                )
                print(f"User {username} is locked out from password changes")

        response = self.get_response(request)

        # After processing - check if password change failed
        if is_password_change and request.user.is_authenticated:
            username = request.user.username
            
            # Check if password change failed (look for the specific error message)
            response_content = response.content.decode('utf-8', errors='ignore')
            has_old_password_error = (
                "Your old password was entered incorrectly" in response_content or
                "error below" in response_content.lower() or
                "Please correct the errors below" in response_content
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Has old password error: {has_old_password_error}")
            
            if response.status_code == 200 and has_old_password_error:
                print(f"Password change failed for user: {username}")
                self.handle_user_failed_password_change(request, username)
            # Check if password change succeeded (redirect)
            elif response.status_code in [302, 301]:
                print(f"Password change succeeded for user: {username}")
                self.clear_user_password_failures(username)

        return response

    def is_user_locked_out_password(self, username):
        """Check if specific user is locked out from password changes"""
        from django.core.cache import cache
        
        lockout_key = f"user_password_lockout_{username}"
        lockout_time = cache.get(lockout_key)
        
        if not lockout_time:
            return False
        
        try:
            if isinstance(lockout_time, str):
                lockout_dt = timezone.datetime.fromisoformat(lockout_time)
            else:
                lockout_dt = lockout_time
                
            time_passed = timezone.now() - lockout_dt
            
            if time_passed < timedelta(minutes=30):
                return True
            else:
                self.clear_user_password_failures(username)
                return False
        except Exception as e:
            print(f"Error checking password lockout: {e}")
            self.clear_user_password_failures(username)
            return False

    def get_user_lockout_info_password(self, username):
        """Get remaining lockout time for password changes"""
        from django.core.cache import cache
        
        lockout_key = f"user_password_lockout_{username}"
        lockout_time = cache.get(lockout_key)
        
        if not lockout_time:
            return {'remaining_minutes': 0}
            
        try:
            if isinstance(lockout_time, str):
                lockout_dt = timezone.datetime.fromisoformat(lockout_time)
            else:
                lockout_dt = lockout_time
                
            time_passed = timezone.now() - lockout_dt
            remaining = timedelta(minutes=30) - time_passed
            remaining_minutes = max(0, int(remaining.total_seconds() / 60))
            
            return {'remaining_minutes': remaining_minutes}
        except:
            return {'remaining_minutes': 0}

    def handle_user_failed_password_change(self, request, username):
        """Handle failed password change for specific user"""
        from django.core.cache import cache
        
        if self.is_user_locked_out_password(username):
            return

        # Get current failure count for this user's password changes
        failures_key = f"user_password_failures_{username}"
        failures = cache.get(failures_key, 0) + 1
        
        # Store failure count (expires in 30 minutes)
        cache.set(failures_key, failures, timeout=1800)
        
        print(f"Password change failure #{failures} for user: {username}")

        if failures >= 3:
            # Lock this specific user from password changes
            lockout_key = f"user_password_lockout_{username}"
            cache.set(lockout_key, timezone.now().isoformat(), timeout=1800)  # 30 minutes
            
            print(f"PASSWORD CHANGE LOCKED: User '{username}' after {failures} failed attempts")
            
            messages.error(
                request, 
                f"🔒 Password change locked for user '{username}' for 30 minutes due to multiple failed attempts."
            )
                
        else:
            remaining = 3 - failures
            messages.warning(
                request,
                f"⚠️ Incorrect old password for '{username}'. {remaining} attempt(s) remaining before 30-minute lockout."
            )

    def clear_user_password_failures(self, username):
        """Clear password change failures for specific user"""
        from django.core.cache import cache
        
        failures_key = f"user_password_failures_{username}"
        lockout_key = f"user_password_lockout_{username}"
        
        cache.delete(failures_key)
        cache.delete(lockout_key)
        
        print(f"Cleared password change failures for user: {username}")

# Update your existing common/middleware.py - Just add this class at the end

class SecurityMiddleware:
    """Simple security middleware to hide error details"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """Hide sensitive error information in production"""
        from django.conf import settings
        from django.http import JsonResponse, HttpResponse
        import logging
        
        # Log the actual error for debugging
        logging.error(f"Error in {request.path}: {exception}", exc_info=True)
        
        # In production, return generic error message
        if not settings.DEBUG:
            if request.headers.get('Accept', '').startswith('application/json'):
                return JsonResponse({
                    'error': 'An unexpected error occurred. Please try again later.'
                }, status=500)
            else:
                return HttpResponse(
                    '<h1>Server Error</h1>'
                    '<p>An unexpected error occurred. Please try again later.</p>'
                    '<a href="javascript:history.back()">Go Back</a>',
                    status=500
                )
        
        # In debug mode, let Django show the details
        return None
    

# # Add this to your existing common/middleware.py

# from django.contrib.auth import logout
# from django.contrib import messages
# from django.core.cache import cache
# from django.utils import timezone
# import logging

# logger = logging.getLogger(__name__)

# class SessionManagementMiddleware:
#     """
#     Middleware to manage concurrent sessions
#     """
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         # Check session before processing request
#         if request.user.is_authenticated:
#             if not self.is_session_valid(request):
#                 logout(request)
#                 messages.warning(request, "Your session was terminated due to login from another device.")
#                 logger.warning(f"Session invalidated for user {request.user.username} - concurrent login detected")

#         response = self.get_response(request)

#         # Update session info after successful login
#         if (request.user.is_authenticated and 
#             request.path.endswith('/login/') and 
#             request.method == 'POST'):
#             self.update_user_session(request)

#         return response

#     def is_session_valid(self, request):
#         """Check if current session is valid (not replaced by newer login)"""
#         user_session_key = f"user_session_{request.user.username}"
#         stored_session = cache.get(user_session_key)
#         current_session = request.session.session_key
        
#         # If no stored session or sessions match, it's valid
#         if not stored_session or stored_session == current_session:
#             return True
        
#         return False

#     def update_user_session(self, request):
#         """Update the user's active session"""
#         user_session_key = f"user_session_{request.user.username}"
        
#         # Store the new session key
#         cache.set(user_session_key, request.session.session_key, timeout=86400)  # 24 hours
        
#         # Log the session update
#         logger.info(f"Session updated for user {request.user.username} from IP {self.get_client_ip(request)}")

#     def get_client_ip(self, request):
#         """Get client IP address"""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             return x_forwarded_for.split(',')[0].strip()
#         return request.META.get('REMOTE_ADDR', 'Unknown')
    

# Add this to your existing common/middleware.py

class CookieSecurityMiddleware:
    """
    Middleware to ensure all cookies have proper security attributes
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Apply security attributes to all cookies
        self.secure_cookies(response)
        
        return response

    def secure_cookies(self, response):
        """Apply security attributes to all cookies"""
        if hasattr(response, 'cookies'):
            for cookie in response.cookies.values():
                # Set Secure flag (cookies only sent over HTTPS)
                cookie['secure'] = True
                
                # Set HttpOnly flag (prevents JavaScript access)
                if cookie.key in ['sessionid', 'csrftoken']:
                    cookie['httponly'] = True
                
                # Set SameSite attribute (CSRF protection)
                cookie['samesite'] = 'Strict'



# Add this class to your existing common/middleware.py

class HSTSSecurityMiddleware:
    """
    Middleware to add security headers including HSTS
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        self.add_security_headers(response)
        
        return response

    def add_security_headers(self, response):
        """Add comprehensive security headers"""
        
        # HTTP Strict Transport Security (HSTS)
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Content Security Policy (basic)
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data: https://fonts.gstatic.com; "
        )
        
        # Additional security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Remove server information
        if 'Server' in response:
            del response['Server']


import re
import uuid
import hashlib
from django.shortcuts import redirect
from django.contrib.auth.models import User
from common.models import UserProfile
from django.conf import settings


class UserProfileURLRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.userprofile_pattern = re.compile(
            r'^(/[a-z]{2}/[^/]+/common/userprofile/)([0-9a-f-]+)(/(?:change|delete|history)?/?)$'
        )
    
    def _generate_secure_uuid(self, user_id):
        """Generate a secure, consistent UUID from user ID using app secret"""
        secret_data = f"{settings.SECRET_KEY}:userprofile:{user_id}"
        hash_digest = hashlib.sha256(secret_data.encode()).hexdigest()
        secure_uuid = uuid.UUID(hash_digest[:32])
        return str(secure_uuid)
    
    def _reverse_secure_uuid(self, secure_uuid_str):
        """Find user ID from secure UUID"""
        try:
            for user in User.objects.all():
                if self._generate_secure_uuid(user.id) == secure_uuid_str:
                    return user.id
            return None
        except:
            return None
    
    def __call__(self, request):
        match = self.userprofile_pattern.match(request.path)
        
        if match:
            prefix = match.group(1)
            id_value = match.group(2)
            suffix = match.group(3)
            
            # Check if it's an integer (old format) - convert to UUID
            try:
                user_id = int(id_value)
                try:
                    profile = UserProfile.objects.get(user__id=user_id)
                    secure_uuid = self._generate_secure_uuid(user_id)
                    new_url = f"{prefix}{secure_uuid}{suffix}"
                    
                    if request.GET:
                        new_url += f"?{request.GET.urlencode()}"
                    
                    return redirect(new_url, permanent=False)
                except UserProfile.DoesNotExist:
                    pass
                    
            except ValueError:
                # It's a UUID - convert back to user ID for Django admin
                user_id = self._reverse_secure_uuid(id_value)
                if user_id:
                    # Modify the request path to use the real user ID
                    real_path = f"{prefix}{user_id}{suffix}"
                    request.path = real_path
                    request.path_info = real_path
                    # Continue processing with the real user ID
                else:
                    # Invalid UUID - let Django handle the 404
                    pass
        
        response = self.get_response(request)
        return response
# Add this to your existing common/middleware.py

# import re
# from django.http import HttpResponseForbidden, JsonResponse
# from django.contrib import messages
# from django.shortcuts import redirect
# import logging

# logger = logging.getLogger(__name__)

# class IDORProtectionMiddleware:
#     """
#     Middleware to prevent Insecure Direct Object Reference (IDOR) attacks
#     """
#     def __init__(self, get_response):
#         self.get_response = get_response
        
#         # Define URL patterns that require IDOR protection
#         self.protected_patterns = [
#             r'/userprofile/(\d+)/',           # User profile URLs
#             r'/common/userprofile/(\d+)/',    # Common user profile URLs  
#             r'/users/(\d+)/',                 # Generic user URLs
#             r'/profile/(\d+)/',               # Profile URLs
#             r'/user/(\d+)/',                  # User detail URLs
#             r'/employee/(\d+)/',              # Employee URLs
#         ]
        
#         # Compile patterns for better performance
#         self.compiled_patterns = [re.compile(pattern) for pattern in self.protected_patterns]

#     def __call__(self, request):
#         # Check for IDOR attempts before processing
#         if not self.check_access_authorization(request):
#             return self.forbidden_response(request, "Unauthorized access attempt detected")
        
#         response = self.get_response(request)
#         return response

#     def check_access_authorization(self, request):
#         """Check if user is authorized to access the requested resource"""
        
#         # Skip check for unauthenticated users (they'll be redirected to login)
#         if not request.user.is_authenticated:
#             return True
            
#         # Check each protected pattern
#         for pattern in self.compiled_patterns:
#             match = pattern.search(request.path)
#             if match:
#                 requested_user_id = int(match.group(1))
                
#                 # Log the access attempt
#                 logger.warning(
#                     f"User {request.user.username} (ID: {request.user.id}) "
#                     f"attempting to access user profile {requested_user_id} "
#                     f"from IP: {self.get_client_ip(request)}"
#                 )
                
#                 # Check authorization
#                 if not self.is_authorized_access(request, requested_user_id):
#                     logger.critical(
#                         f"IDOR ATTACK BLOCKED: User {request.user.username} "
#                         f"attempted unauthorized access to user {requested_user_id}"
#                     )
#                     return False
        
#         return True

#     def is_authorized_access(self, request, requested_user_id):
#         """Check if user is authorized to access the requested user profile"""
        
#         # Users can access their own profile
#         if request.user.id == requested_user_id:
#             return True
        
#         # Superusers can access any profile
#         if request.user.is_superuser:
#             return True
        
#         # Staff users can access profiles (optional - adjust based on your needs)
#         if request.user.is_staff:
#             return True
        
#         # Check if user has specific permissions (customize based on your app)
#         if request.user.has_perm('common.view_userprofile'):
#             return True
        
#         # Add custom business logic here
#         # For example, managers can view their team members
#         if self.is_manager_of_user(request.user, requested_user_id):
#             return True
        
#         # Deny access by default
#         return False

#     def is_manager_of_user(self, current_user, target_user_id):
#         """Check if current user is manager of target user (customize this)"""
#         # Implement your business logic here
#         # Example: Check if current_user is in a manager role for target_user
        
#         try:
#             # This is just an example - adjust based on your user model
#             from django.contrib.auth.models import User
#             target_user = User.objects.get(id=target_user_id)
            
#             # Example logic: Check if users are in same department
#             # if hasattr(current_user, 'department') and hasattr(target_user, 'department'):
#             #     return current_user.department == target_user.department and current_user.is_manager
            
#             return False
#         except:
#             return False

#     def forbidden_response(self, request, message):
#         """Return appropriate forbidden response"""
#         logger.warning(f"Access denied: {message} for user {request.user.username}")
        
#         if request.headers.get('Accept', '').startswith('application/json'):
#             return JsonResponse({
#                 'error': 'Access denied',
#                 'message': 'You do not have permission to access this resource'
#             }, status=403)
#         else:
#             messages.error(request, "Access denied. You can only view your own profile.")
#             return redirect('home')  # Redirect to home page

#     def get_client_ip(self, request):
#         """Get client IP address"""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             return x_forwarded_for.split(',')[0].strip()
#         return request.META.get('REMOTE_ADDR', 'Unknown')
    


# Just add this class to your existing common/middleware.py file

import re
import logging
from django.contrib import messages

logger = logging.getLogger(__name__)

class SimplePhoneValidationMiddleware:
    """Simple middleware to validate phone number input"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check phone number input before processing
        if request.method == 'POST' and 'pbx_number' in request.POST:
            phone = request.POST.get('pbx_number', '')
            
            if phone and not self.is_valid_phone(phone):
                logger.warning(f"Invalid phone number blocked: {phone} from user {getattr(request.user, 'username', 'Anonymous')}")
                messages.error(request, "Please enter your phone number using digits only. Do not include spaces, hyphens, parentheses, or the '+' symbol.")
                
                # Redirect back to the same page
                from django.shortcuts import redirect
                return redirect(request.path)

        response = self.get_response(request)
        return response

    def is_valid_phone(self, phone):
        """Check if phone number is valid"""
        phone_str = str(phone).strip()
        
        # Block dangerous patterns
        dangerous_patterns = [
            r'<script',
            r'javascript:',
            r'vbscript:',
            r'onload=',
            r'onerror=',
            r'onclick=',
        ]
        
        for pattern in dangerous_patterns:
            if pattern.lower() in phone_str.lower():
                return False
        
        # Check valid phone format (digits, spaces, hyphens, parentheses, plus)
        if not re.match(r'^[\+]?[\d\s\-\(\)]{0,15}$', phone_str):
            return False
        
        return True