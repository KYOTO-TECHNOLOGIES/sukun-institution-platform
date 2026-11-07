from django.urls import path
from .views import TeachingStaffView, DirectoryView
from rest_framework.routers import DefaultRouter

from .viewsets import UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')

urlpatterns = [path('directory/', DirectoryView.as_view()), path('teaching-staff/', TeachingStaffView.as_view())] + router.urls
