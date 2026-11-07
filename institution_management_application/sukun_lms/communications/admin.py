from django.contrib import admin

from .models import IslamicEvent, Notification

admin.site.register([IslamicEvent, Notification])
