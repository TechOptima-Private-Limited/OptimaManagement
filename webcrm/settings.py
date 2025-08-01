import sys
from pathlib import Path
from django.utils.translation import gettext_lazy as _

from crm.settings import *          # NOQA
from massmail.settings import *     # NOQA
from common.settings import *       # NOQA
from tasks.settings import *        # NOQA
from voip.settings import *         # NOQA

from pathlib import Path
from dotenv import load_dotenv
import os
import dal
import dal_select2

load_dotenv()



# ---- Django settings ---- #

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
# To get new value of key use code:
# from django.core.management.utils import get_random_secret_key
# print(get_random_secret_key())
SECRET_KEY = 'j1c=6$s-dh#$ywt@(q4cm=j&0c*!0x!e-qm6k1%yoliec(15tn'

# Add your hosts to the list.
ALLOWED_HOSTS = ['192.168.1.3','192.168.1.51','192.168.0.8','192.168.1.18', '192.168.1.121','backend.techoptima.ai', 'https://backend.techoptima.ai', 'localhost', '127.0.0.1', 'dev.techoptima.ai', 'https://helpdesk.techoptima.ai', "helpdesk.techoptima.ai"]

CSRF_TRUSTED_ORIGINS = ['https://backend.techoptima.ai', 'https://helpdesk.techoptima.ai']

# Database
DATABASES = {
    'default': {
        # for PostgreSQL
        "ENGINE": "django.db.backends.postgresql",
        
        'NAME': os.getenv('DB_NAME'),     # Database name
        'USER': os.getenv('DB_USER'),          # PostgreSQL username
        'PASSWORD': os.getenv('DB_PASSWORD'),      # PostgreSQL password
        'HOST': os.getenv('DB_HOST'),              # Database host
        'PORT': os.getenv('DB_PORT'),  
    }
}

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'hr_management2',
#         'USER': 'postgres',
#         'PASSWORD': 'postgres',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_PORT = os.getenv('EMAIL_PORT')
EMAIL_SUBJECT_PREFIX = 'CRM: '
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS')
SERVER_EMAIL = 'no-reply@techoptima.ai'
DEFAULT_FROM_EMAIL = 'no-reply@techoptima.ai'

ADMINS = [("<Admin1>", "<admin1_box@example.com>")]   # specify admin

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

FORMS_URLFIELD_ASSUME_HTTPS = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.template': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        '': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
# Internationalization
LANGUAGE_CODE = 'en'
LANGUAGES = [
    ('de', _('German')),
    ('en', _('English')),
    ('es', _('Spanish')),
    ('fr', _('French')),
    ('it', _('Italian')),
    ('nl', _('Dutch')),
    ('pt-br', _('Portuguese')),
    ('ru', _('Russian')),
    ('uk', _('Ukrainian')),
]

TIME_ZONE = 'UTC'   # specify your time zone

USE_I18N = True
USE_L10N = True
USE_TZ = True

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

LOGIN_URL = '/admin/login/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Application definition
INSTALLED_APPS = [
    'dal', 
    'dal_select2',
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'crm.apps.CrmConfig',
    'massmail.apps.MassmailConfig',
    'analytics.apps.AnalyticsConfig',
    'help',
    'tasks.apps.TasksConfig',
    'chat.apps.ChatConfig',
    'voip',
    'common.apps.CommonConfig',
    'settings',
    'rest_framework',
    'corsheaders',
    'django_ckeditor_5', 
    'resource_management',
    'client',
    'content',
    'assets',
    'dashboard',
    'django_select2',
    'resource_requests.apps.ResourceRequestConfig',
    'onboarding.apps.OnboardingConfig',
   

]



MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'common.utils.usermiddleware.UserMiddleware',
    # Add IDOR protection EARLY in the middleware stack
    # 'common.middleware.IDORProtectionMiddleware',
    'common.middleware.UserProfileURLRedirectMiddleware',
    # Add security middleware in order
    'common.middleware.HSTSSecurityMiddleware',      # HSTS and security headers
    'common.middleware.CookieSecurityMiddleware',    # Cookie security
    # Add session management AFTER auth middleware
    'common.middleware.SessionManagementMiddleware',
    #'webcrm.middleware.TemplateDebugMiddleware',
    'common.middleware.LoginLockoutMiddleware',
    # Add this new one for password change:
    'common.middleware.PasswordChangeLockoutMiddleware',
    'common.middleware.SecurityMiddleware',

     # Add this ONE line:
    'common.middleware.SimplePhoneValidationMiddleware',

]

# # For production security, also add:
# DEBUG = False  # Set to False in production
# SECURE_BROWSER_XSS_FILTER = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# X_FRAME_OPTIONS = 'DENY'

# Session security settings
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True
# SESSION_COOKIE_SECURE = True  # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'

# Cache for session management (if not already configured)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'session-cache',
    }
}

# COOKIE SECURITY SETTINGS
SESSION_COOKIE_SECURE = True          # Send session cookie only over HTTPS
SESSION_COOKIE_HTTPONLY = True        # Prevent JavaScript access to session cookie
SESSION_COOKIE_SAMESITE = 'Strict'    # CSRF protection

CSRF_COOKIE_SECURE = True             # Send CSRF cookie only over HTTPS  
# CSRF_COOKIE_HTTPONLY = True           # Prevent JavaScript access to CSRF cookie
# CSRF_COOKIE_SAMESITE = 'Strict'       # CSRF protection

# HTTPS ENFORCEMENT (HSTS)
SECURE_HSTS_SECONDS = 31536000        # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ADDITIONAL SECURITY HEADERS
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Fix for CKEditor image upload
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
# # HTTPS REDIRECTION (Enable in production)
# SECURE_SSL_REDIRECT = True            # Automatically redirect HTTP to HTTPS
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


ADMIN_HELP_URL = None
ADMIN_COPYRIGHT_STRING = None
ADMIN_PROJECT_SITE = None

ROOT_URLCONF = 'webcrm.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'resource_requests.context_processors.admin_settings',
                'dashboard.context_processors.dashboard_data',
            ],
            'debug': False,
        },
    },
]

WSGI_APPLICATION = 'webcrm.wsgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'static'
# STATIC_ROOT = BASE_DIR / "staticfiles"  # ✅ use a clean folder name

STATICFILES_DIRS = [
    BASE_DIR / "assets/static",
    BASE_DIR / "resource_requests/static",
    BASE_DIR / "resource_management/static",
]

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

FIXTURE_DIRS = ['tests/fixtures']

MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'

SITE_ID = 1

SECURE_HSTS_SECONDS = 0  # set to 31536000 for production server
# Set all the following to True for production server
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_PRELOAD = False


# ---- CRM settings ---- #

# For more security, replace the url prefixes
# with your own unique value.
SECRET_CRM_PREFIX = '123/'
SECRET_ADMIN_PREFIX = '456/'
SECRET_LOGIN_PREFIX = '789-login/'

# Specify ip of host to avoid importing emails sent by CRM
CRM_IP = "127.0.0.1"

CRM_REPLY_TO = ["'Do not reply' <crm@example.com>"]

# List of addresses to which users are not allowed to send mail.
NOT_ALLOWED_EMAILS = []

# List of applications on the main page and in the left sidebar.
APP_ON_INDEX_PAGE = [
    'tasks', 'crm', 'analytics',
    'massmail', 'common', 'settings'
]
MODEL_ON_INDEX_PAGE = {
    'tasks': {
        'app_model_list': ['Task', 'Memo']
    },
    'crm': {
        'app_model_list': [
            'Request', 'Deal', 'Lead', 'Company',
            'CrmEmail', 'Payment', 'Shipment'
        ]
    },
    'analytics': {
        'app_model_list': [
            'IncomeStat', 'RequestStat'
        ]
    },
    'massmail': {
        'app_model_list': [
            'MailingOut', 'EmlMessage'
        ]
    },
    'common': {
        'app_model_list': [
            'UserProfile', 'Reminder'
        ]
    },
    'settings': {
        'app_model_list': [
            'PublicEmailDomain', 'StopPhrase'
        ]
    }
}

# Country VAT value
VAT = 0    # %

# 2-Step Verification Credentials for Google Accounts.
#  OAuth 2.0
CLIENT_ID = ''
CLIENT_SECRET = ''
OAUTH2_DATA = {
    'smtp.gmail.com': {
        'scope': "https://mail.google.com/",
        'accounts_base_url': 'https://accounts.google.com',
        'auth_command': 'o/oauth2/auth',
        'token_command': 'o/oauth2/token',
    }
}
# Hardcoded dummy redirect URI for non-web apps.
REDIRECT_URI = ''

# Credentials for Google reCAPTCHA.
GOOGLE_RECAPTCHA_SITE_KEY = ''
GOOGLE_RECAPTCHA_SECRET_KEY = ''

GEOIP = False
GEOIP_PATH = MEDIA_ROOT / 'geodb'

# For user profile list
SHOW_USER_CURRENT_TIME_ZONE = False

NO_NAME_STR = _('Untitled')

# For automated getting currency exchange rate
LOAD_EXCHANGE_RATE = False
LOADING_EXCHANGE_RATE_TIME = "6:30"
LOAD_RATE_BACKEND = ""  # "crm.backends.<specify_backend>.<specify_class>"

# Ability to mark payments through a representation
MARK_PAYMENTS_THROUGH_REP = False


# Site headers
SITE_TITLE = 'CRM'
ADMIN_HEADER = "ADMIN"
ADMIN_TITLE = "CRM Admin"
INDEX_TITLE = _('Main Menu')


# This is copyright information. Please don't change it!
COPYRIGHT_STRING = "TechOptima Pvt Ltd. Copyright (c) 2024"
PROJECT_NAME = "Optima Management"
PROJECT_SITE = "https://github.com/DjangoCRM/django-crm/"


TESTING = sys.argv[1:2] == ['test']
if TESTING:
    SECURE_SSL_REDIRECT = False


CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000", "https://techoptima.ai", "https://www.techoptima.ai","http://127.0.0.1:8000"
]
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]



REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
}

import os
# CKEditor 5 settings
CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': ['heading', '|', 'bold', 'italic', 'link',
                   'bulletedList', 'numberedList', 'blockQuote', 'imageUpload', '|', 'sourceEditing' '|', 'blockQuote', 'insertTable', '|',
            'undo', 'redo'],
        'height': '400px',
        'extraAllowedContent': 'figure[class], img[class](*)',  # Allow custom classes for images
        'contentsCss': '/static/css/ckeditor_styles.css',  # Load custom styles
        'image': {
            'toolbar': [
                'imageTextAlternative', '|',
                'imageStyle:inline',
                'imageStyle:alignLeft',
                'imageStyle:alignCenter',
                'imageStyle:alignRight',
                'imageStyle:block',
                'imageStyle:side'
            ],
            'styles': {
                'options': [
                    'inline',
                    'alignLeft',
                    'alignCenter',
                    'alignRight',
                    'block',
                    'side'
                ]
            }
        },
        'heading': {
            'options': [
                {'model': 'paragraph', 'title': 'Paragraph', 'class': 'ck-heading_paragraph'},
                {'model': 'heading1', 'view': 'h1', 'title': 'Heading 1', 'class': 'ck-heading_heading1'},
                {'model': 'heading2', 'view': 'h2', 'title': 'Heading 2', 'class': 'ck-heading_heading2'},
                {'model': 'heading3', 'view': 'h3', 'title': 'Heading 3', 'class': 'ck-heading_heading3'},
            ]
        }
    }
}

DOMAIN_NAME = os.getenv('SITE_URL')
# DOMAIN_NAME = 'http://127.0.0.1:8000'
ADMIN_SITE_HEADER = "Optima CMS"
ADMIN_SITE_TITLE = "Optima CMS"
ADMIN_INDEX_TITLE = "Welcome to Optima CMS"

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

CKEDITOR_5_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"


# Initial data for AccessLevel
access_levels = [
    {
        'name': 'Read',
        'description': 'Read-only access to the resource'
    },
    {
        'name': 'Write',
        'description': 'Read and write access to the resource'
    },
    {
        'name': 'Admin',
        'description': 'Full administrative access to the resource'
    }
]

# Initial data for ResourceType
resource_types = [
    {
        'name': 'Repository',
        'description': 'Code repositories (Git, SVN, etc.)'
    },
    {
        'name': 'Database',
        'description': 'Database instances (MySQL, PostgreSQL, MongoDB, etc.)'
    },
    {
        'name': 'VM Instance',
        'description': 'Virtual Machine instances'
    }
]


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.office365.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'no-reply@techoptima.ai'
EMAIL_HOST_PASSWORD = 'G!556540298118om'
DEFAULT_FROM_EMAIL = 'no-reply@techoptima.ai'
EMAIL_DOMAIN = 'techoptima.ai' 
IT_SUPPORT_EMAIL = 'support@techoptima.com'
EMAIL_THREAD_ID = '1'
SITE_URL = os.getenv('SITE_URL') 
pmo_emails_str = os.getenv('PMO_EMAILS', '')

# Convert to list by splitting on commas
PMO_EMAILS = [email.strip() for email in pmo_emails_str.split(',') if email.strip()]

team_emails_str = os.getenv('TEAM_EMAILS', '')

# Convert to list by splitting on commas
TEAM_EMAILS = [email.strip() for email in team_emails_str.split(',') if email.strip()]


# USE_TZ = True
# TIME_ZONE = 'Asia/Kolkata' 
