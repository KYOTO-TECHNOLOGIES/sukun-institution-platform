"""
Django settings for sukun_lms project.
"""

from datetime import timedelta
from pathlib import Path

import environ


BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['127.0.0.1', 'localhost']),
    CSRF_TRUSTED_ORIGINS=(list, []),
    ACCESS_TOKEN_LIFETIME_MINUTES=(int, 15),
    REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
    PHONE_DEFAULT_REGION=(str, 'IN'),
    JWT_COOKIE_SECURE=(bool, False),
    JWT_COOKIE_SAMESITE=(str, 'Lax'),
)
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env(
    'SECRET_KEY',
    default='django-insecure-change-me-before-production',
)
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['127.0.0.1', 'localhost'])
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

default_sqlite_url = f"sqlite:///{(BASE_DIR / 'db.sqlite3').as_posix()}"

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'core',
    'accounts',
    'administration',
    'institutions',
    'academics',
    'students',
    'staff',
    'attendance',
    'examinations',
    'exam_seating',
    'tasks',
    'finance',
    'library',
    'communications',
    'admissions',
    'learning',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'sukun_lms.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'sukun_lms.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default=default_sqlite_url),
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'
PHONE_DEFAULT_REGION = env('PHONE_DEFAULT_REGION')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_RATES': {'login': '20/min', 'registration': '10/hour'},
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=env.int('ACCESS_TOKEN_LIFETIME_MINUTES', default=15)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=env.int('REFRESH_TOKEN_LIFETIME_DAYS', default=7)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

JWT_AUTH = {
    'ACCESS_COOKIE_NAME': 'access_token',
    'REFRESH_COOKIE_NAME': 'refresh_token',
    'COOKIE_DOMAIN': env('JWT_COOKIE_DOMAIN', default=None),
    'COOKIE_PATH': '/',
    'COOKIE_SECURE': env.bool('JWT_COOKIE_SECURE', default=not DEBUG),
    'COOKIE_HTTP_ONLY': True,
    'COOKIE_SAMESITE': env('JWT_COOKIE_SAMESITE', default='Lax'),
}

CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=not DEBUG)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=not DEBUG)

if not DEBUG:
    SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=3600)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False
    SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
