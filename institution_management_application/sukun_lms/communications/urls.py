from rest_framework.routers import DefaultRouter

from .views import IslamicEventViewSet, NotificationViewSet

router = DefaultRouter()
router.register('islamic-events', IslamicEventViewSet, basename='islamic-event')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls
