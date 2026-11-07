from django.urls import path
from .views import TeachingStaffView
from rest_framework.routers import DefaultRouter

from .viewsets import UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')

urlpatterns = [path('teaching-staff/', TeachingStaffView.as_view())] + router.urls
