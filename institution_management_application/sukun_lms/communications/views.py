from core.viewsets import build_model_viewset

from .models import IslamicEvent, Notification
from .serializers import IslamicEventSerializer, NotificationSerializer


IslamicEventViewSet = build_model_viewset(IslamicEvent, IslamicEventSerializer, institution_lookup='institution_id')
NotificationViewSet = build_model_viewset(Notification, NotificationSerializer, institution_lookup='institution_id')
