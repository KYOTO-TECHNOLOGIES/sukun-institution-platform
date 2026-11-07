from rest_framework.routers import DefaultRouter

from .views import (
    AchievementViewSet,
    DisciplineRecordViewSet,
    HifzProgressViewSet,
    ParentGuardianViewSet,
    PrayerAttendanceViewSet,
    StudentCertificateViewSet,
    StudentViewSet,
)

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('parent-guardians', ParentGuardianViewSet, basename='parent-guardian')
router.register('hifz-progress', HifzProgressViewSet, basename='hifz-progress')
router.register('prayer-attendance', PrayerAttendanceViewSet, basename='prayer-attendance')
router.register('discipline-records', DisciplineRecordViewSet, basename='discipline-record')
router.register('achievements', AchievementViewSet, basename='achievement')
router.register('student-certificates', StudentCertificateViewSet, basename='student-certificate')

urlpatterns = router.urls
