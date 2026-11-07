from rest_framework.routers import DefaultRouter

from .views import ExamResultViewSet, ExamTypeViewSet, ExamViewSet

router = DefaultRouter()
router.register('exam-types', ExamTypeViewSet, basename='exam-type')
router.register('exams', ExamViewSet, basename='exam')
router.register('exam-results', ExamResultViewSet, basename='exam-result')

urlpatterns = router.urls
