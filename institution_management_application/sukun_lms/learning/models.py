from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from core.models import BaseModel


class Course(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='courses')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, default='DRAFT', choices=[('DRAFT','Draft'),('PUBLISHED','Published'),('ARCHIVED','Archived')])
    def __str__(self): return self.title


class Lesson(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    position = models.PositiveIntegerField(default=1)
    content = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    resource_url = models.URLField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=10)
    is_published = models.BooleanField(default=False)
    class Meta:
        ordering = ['position', 'created_at']
    def __str__(self): return self.title


class Enrollment(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='course_enrollments')
    status = models.CharField(max_length=20, default='ACTIVE', choices=[('ACTIVE','Active'),('PAUSED','Paused'),('COMPLETED','Completed')])
    class Meta:
        constraints = [models.UniqueConstraint(fields=['course','student'], name='unique_course_student')]


class LessonProgress(BaseModel):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='progress')
    completed_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['lesson','enrollment'], name='unique_lesson_enrollment')]


class Assignment(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    instructions = models.TextField()
    due_at = models.DateTimeField()
    max_score = models.DecimalField(max_digits=7, decimal_places=2, default=100, validators=[MinValueValidator(1)])
    is_published = models.BooleanField(default=False)
    def __str__(self): return self.title


class Submission(BaseModel):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='submissions')
    answer = models.TextField()
    attachment_url = models.URLField(blank=True)
    score = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    is_late = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['assignment','enrollment'], name='unique_assignment_submission')]


class Quiz(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=200)
    pass_percentage = models.PositiveIntegerField(default=60, validators=[MaxValueValidator(100)])
    max_attempts = models.PositiveIntegerField(default=3, validators=[MinValueValidator(1)])
    is_published = models.BooleanField(default=False)
    def __str__(self): return self.title


class Question(BaseModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500, blank=True)
    option_d = models.CharField(max_length=500, blank=True)
    correct_answer = models.CharField(max_length=1, choices=[(x,x) for x in 'ABCD'])
    position = models.PositiveIntegerField(default=1)


class QuizAttempt(BaseModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='attempts')
    answers = models.JSONField(default=dict)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    passed = models.BooleanField()
