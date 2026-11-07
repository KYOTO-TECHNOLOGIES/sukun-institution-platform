from rest_framework import serializers
from .models import Course, Lesson, Enrollment, Assignment, Submission, Quiz, Question


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    class Meta:
        model = Course
        fields = '__all__'
    def validate_teacher(self, value):
        if value.user_type not in {'TEACHER','PRINCIPAL','INSTITUTION_ADMIN'} and not value.is_superuser:
            raise serializers.ValidationError('Select a teacher or academic administrator.')
        return value


class LessonSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    class Meta:
        model = Lesson
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    class Meta:
        model = Enrollment
        fields = '__all__'


class AssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    class Meta:
        model = Assignment
        fields = '__all__'


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='enrollment.student.user.full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    max_score = serializers.DecimalField(source='assignment.max_score', max_digits=7, decimal_places=2, read_only=True)
    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ('assignment', 'enrollment', 'answer', 'attachment_url', 'graded_by', 'graded_at', 'is_late')
    def validate_score(self, value):
        if value is not None and self.instance and value > self.instance.assignment.max_score:
            raise serializers.ValidationError('Score cannot exceed the assignment maximum.')
        return value


class QuizSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    class Meta:
        model = Quiz
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    class Meta:
        model = Question
        fields = '__all__'
    def validate(self, attrs):
        answer = attrs.get('correct_answer', getattr(self.instance, 'correct_answer', 'A'))
        key = 'option_' + answer.lower()
        if not attrs.get(key, getattr(self.instance, key, '')):
            raise serializers.ValidationError({key:'The correct answer must have option text.'})
        return attrs
