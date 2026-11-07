from rest_framework.routers import DefaultRouter

from .views import DailyTaskViewSet, TaskSubmissionViewSet

router = DefaultRouter()
router.register('daily-tasks', DailyTaskViewSet, basename='daily-task')
router.register('task-submissions', TaskSubmissionViewSet, basename='task-submission')

urlpatterns = router.urls
