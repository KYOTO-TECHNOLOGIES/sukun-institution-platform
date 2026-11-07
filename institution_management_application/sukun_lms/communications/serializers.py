from core.serializers import build_model_serializer

from .models import IslamicEvent, Notification


IslamicEventSerializer = build_model_serializer(IslamicEvent)
NotificationSerializer = build_model_serializer(Notification)
