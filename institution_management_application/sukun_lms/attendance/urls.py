from rest_framework.routers import DefaultRouter

from .views import StudentAttendanceViewSet, TeacherAttendanceViewSet

router = DefaultRouter()
router.register('student-attendance', StudentAttendanceViewSet, basename='student-attendance')
router.register('teacher-attendance', TeacherAttendanceViewSet, basename='teacher-attendance')

urlpatterns = router.urls
