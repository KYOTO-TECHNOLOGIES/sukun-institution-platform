from rest_framework.routers import DefaultRouter

from .views import StaffLeaveRecordViewSet, StaffNoteViewSet, TeacherViewSet

router = DefaultRouter()
router.register('teachers', TeacherViewSet, basename='teacher')
router.register('leave-records', StaffLeaveRecordViewSet, basename='staff-leave-record')
router.register('notes', StaffNoteViewSet, basename='staff-note')

urlpatterns = router.urls
