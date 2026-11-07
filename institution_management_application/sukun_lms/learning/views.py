from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from admissions.views import SearchViewSet
from .models import Course, Lesson, Enrollment, Assignment, Submission, Quiz, Question
from .serializers import CourseSerializer, LessonSerializer, EnrollmentSerializer, AssignmentSerializer, SubmissionSerializer, QuizSerializer, QuestionSerializer

COURSE_PATH = {Course:'', Lesson:'course__', Enrollment:'course__', Assignment:'course__',
               Submission:'assignment__course__', Quiz:'course__', Question:'quiz__course__'}


class TeachingViewSet(SearchViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.user_type == 'TEACHER' and not self.request.user.is_superuser:
            qs = qs.filter(**{COURSE_PATH[self.queryset.model]+'teacher':self.request.user})
        return qs

    def validate_write(self, serializer):
        super().validate_write(serializer)
        if self.request.user.user_type == 'TEACHER':
            path = COURSE_PATH[self.queryset.model].rstrip('_').split('__') if COURSE_PATH[self.queryset.model] else []
            item = serializer.validated_data
            for index, part in enumerate(path):
                item = item.get(part) if isinstance(item,dict) else getattr(item,part,None)
                if item is None: break
            teacher = item.get('teacher') if isinstance(item,dict) else getattr(item,'teacher',None)
            if teacher and teacher != self.request.user:
                raise PermissionDenied('Teachers can only manage their assigned courses.')


class CourseViewSet(TeachingViewSet):
    queryset = Course.objects.select_related('teacher')
    serializer_class = CourseSerializer
    search_fields = ('title',)


class LessonViewSet(TeachingViewSet):
    queryset = Lesson.objects.select_related('course')
    serializer_class = LessonSerializer
    search_fields = ('title','course__title')


class EnrollmentViewSet(TeachingViewSet):
    queryset = Enrollment.objects.select_related('student__user','course')
    serializer_class = EnrollmentSerializer
    search_fields = ('student__user__first_name','course__title')


class AssignmentViewSet(TeachingViewSet):
    queryset = Assignment.objects.select_related('course')
    serializer_class = AssignmentSerializer
    search_fields = ('title','course__title')


class SubmissionViewSet(TeachingViewSet):
    queryset = Submission.objects.select_related('assignment','enrollment__student__user')
    serializer_class = SubmissionSerializer
    search_fields = ('assignment__title','enrollment__student__user__first_name')
    http_method_names = ['get','patch','head','options']
    def perform_update(self, serializer):
        self.validate_write(serializer)
        serializer.save(graded_by=self.request.user, graded_at=timezone.now())


class QuizViewSet(TeachingViewSet):
    queryset = Quiz.objects.select_related('course')
    serializer_class = QuizSerializer
    search_fields = ('title',)


class QuestionViewSet(TeachingViewSet):
    queryset = Question.objects.select_related('quiz')
    serializer_class = QuestionSerializer
    search_fields = ('prompt','quiz__title')
