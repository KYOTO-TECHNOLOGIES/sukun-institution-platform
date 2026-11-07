from rest_framework.routers import DefaultRouter

from .views import (
    ClassSubjectViewSet,
    ClassViewSet,
    DivisionViewSet,
    SubjectViewSet,
    SyllabusProgressViewSet,
    SyllabusViewSet,
    TimeTableViewSet,
)

router = DefaultRouter()
router.register('syllabi', SyllabusViewSet, basename='syllabus')
router.register('classes', ClassViewSet, basename='class')
router.register('divisions', DivisionViewSet, basename='division')
router.register('subjects', SubjectViewSet, basename='subject')
router.register('class-subjects', ClassSubjectViewSet, basename='class-subject')
router.register('syllabus-progress', SyllabusProgressViewSet, basename='syllabus-progress')
router.register('time-tables', TimeTableViewSet, basename='time-table')

urlpatterns = router.urls
