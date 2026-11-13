from rest_framework.routers import DefaultRouter
from .views import InboxViewSet
router = DefaultRouter()
router.register('', InboxViewSet, basename='inbox')
urlpatterns = router.urls
