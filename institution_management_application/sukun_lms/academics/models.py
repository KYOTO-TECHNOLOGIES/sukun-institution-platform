from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import BaseModel


class Syllabus(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='syllabi')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    total_years = models.IntegerField(validators=[MinValueValidator(1)])
    is_arabic_focused = models.BooleanField(default=True)

    class Meta:
        db_table = 'syllabus'
        verbose_name_plural = 'Syllabi'

    def __str__(self):
        return self.name


class Class(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=100)
    name_arabic = models.CharField(max_length=100, blank=True, null=True)
    syllabus = models.ForeignKey(Syllabus, on_delete=models.SET_NULL, null=True, related_name='classes')
    class_order = models.IntegerField()
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'class'
        verbose_name_plural = 'Classes'
        unique_together = ['institution', 'name']

    def __str__(self):
        return f'{self.name} - {self.institution.name}'


class Division(BaseModel):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='divisions')
    name = models.CharField(max_length=10)
    capacity = models.IntegerField(validators=[MinValueValidator(1)])
    class_teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_teacher_divisions')
    room_number = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'division'
        unique_together = ['class_obj', 'name']

    def __str__(self):
        return f'{self.class_obj.name} - {self.name}'


class Subject(BaseModel):
    SUBJECT_TYPES = [
        ('QURAN', 'Quran Studies'),
        ('HADITH', 'Hadith'),
        ('FIQH', 'Fiqh'),
        ('ARABIC', 'Arabic Language'),
        ('URDU', 'Urdu'),
        ('MALAYALAM', 'Malayalam'),
        ('ENGLISH', 'English'),
        ('MATHS', 'Mathematics'),
        ('SCIENCE', 'Science'),
        ('SOCIAL', 'Social Studies'),
        ('TAJWEED', 'Tajweed'),
        ('HIFZ', 'Hifz/Memorization'),
        ('TAFSEER', 'Tafseer'),
        ('AQAID', 'Aqaid'),
        ('AKHLAQ', 'Akhlaq'),
        ('ISLAMIC_HISTORY', 'Islamic History'),
    ]

    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=200)
    name_arabic = models.CharField(max_length=200, blank=True, null=True)
    subject_type = models.CharField(max_length=20, choices=SUBJECT_TYPES)
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='subjects')
    is_compulsory = models.BooleanField(default=True)

    class Meta:
        db_table = 'subject'

    def __str__(self):
        return self.name


class ClassSubject(BaseModel):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='class_subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='class_subjects')
    academic_year = models.ForeignKey('institutions.AcademicYear', on_delete=models.CASCADE, related_name='class_subjects')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='subject_classes')
    periods_per_week = models.IntegerField(default=1)

    class Meta:
        db_table = 'class_subject'
        unique_together = ['class_obj', 'subject', 'academic_year']

    def __str__(self):
        return f'{self.class_obj.name} - {self.subject.name}'


class SyllabusProgress(BaseModel):
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    class_subject = models.ForeignKey(ClassSubject, on_delete=models.CASCADE, related_name='syllabus_progress')
    topic_name = models.CharField(max_length=300)
    topic_name_arabic = models.CharField(max_length=300, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    date_completed = models.DateField()
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='completed_syllabus')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'syllabus_progress'
        verbose_name_plural = 'Syllabus Progress'

    def __str__(self):
        return f'{self.class_subject} - {self.topic_name}'


class TimeTable(BaseModel):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='timetables')
    day_of_week = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(6)], choices=DAY_CHOICES)
    period_number = models.IntegerField(validators=[MinValueValidator(1)])
    class_subject = models.ForeignKey(ClassSubject, on_delete=models.CASCADE, related_name='timetables')
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        db_table = 'time_table'
        unique_together = ['division', 'day_of_week', 'period_number']

    def __str__(self):
        return f'{self.division} - Period {self.period_number} - {self.class_subject.subject.name}'
