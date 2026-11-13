import os
from django.conf import settings
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sukun_lms.settings')
http_application = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from django.urls import path
from notifications.consumers import InboxConsumer

if settings.DEBUG:
    from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
    http_application = ASGIStaticFilesHandler(http_application)

application = ProtocolTypeRouter({
    'http': http_application,
    'websocket': OriginValidator(
        URLRouter([path('ws/notifications/', InboxConsumer.as_asgi())]),
        settings.WEBSOCKET_ALLOWED_ORIGINS,
    ),
})
