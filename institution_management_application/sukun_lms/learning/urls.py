from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, LessonViewSet, EnrollmentViewSet, AssignmentViewSet, SubmissionViewSet, QuizViewSet, QuestionViewSet
router = DefaultRouter()
for prefix, view in [('courses',CourseViewSet),('lessons',LessonViewSet),('enrollments',EnrollmentViewSet),
                     ('assignments',AssignmentViewSet),('submissions',SubmissionViewSet),('quizzes',QuizViewSet),('questions',QuestionViewSet)]:
    router.register(prefix, view)
urlpatterns = router.urls
