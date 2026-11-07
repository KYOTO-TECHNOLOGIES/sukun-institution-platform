from django.urls import path
from .portal import PortalOverview, PortalCourse, CompleteLesson, SubmitAssignment, AttemptQuiz, SubmitHomework
urlpatterns = [
    path('overview/',PortalOverview.as_view()),
    path('courses/<uuid:pk>/',PortalCourse.as_view()),
    path('courses/<uuid:pk>/lessons/<uuid:lesson_id>/complete/',CompleteLesson.as_view()),
    path('courses/<uuid:pk>/assignments/<uuid:assignment_id>/submit/',SubmitAssignment.as_view()),
    path('courses/<uuid:pk>/quizzes/<uuid:quiz_id>/attempt/',AttemptQuiz.as_view()),
    path('homework/<uuid:task_id>/submit/',SubmitHomework.as_view()),
]
