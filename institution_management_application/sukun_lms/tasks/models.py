from django.conf import settings
from django.db import models

from core.models import BaseModel


class DailyTask(BaseModel):
    TASK_TYPES = [
        ('HOMEWORK', 'Homework'),
        ('QURAN_RECITATION', 'Quran Recitation'),
        ('HIFZ_REVISION', 'Hifz Revision'),
        ('HIFZ_NEW', 'New Hifz Lesson'),
        ('DUA_MEMORIZATION', 'Dua Memorization'),
        ('HADITH_MEMORIZATION', 'Hadith Memorization'),
        ('PROJECT', 'Project'),
        ('OTHER', 'Other'),
    ]

    class_subject = models.ForeignKey('academics.ClassSubject', on_delete=models.CASCADE, related_name='daily_tasks')
    division = models.ForeignKey('academics.Division', on_delete=models.CASCADE, related_name='daily_tasks')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks')
    date_assigned = models.DateField()
    due_date = models.DateField()
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    title = models.CharField(max_length=300)
    description = models.TextField()
    surah_reference = models.CharField(max_length=100, blank=True, null=True)
    ayah_from = models.IntegerField(null=True, blank=True)
    ayah_to = models.IntegerField(null=True, blank=True)
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        db_table = 'daily_task'

    def __str__(self):
        return f'{self.title} - {self.date_assigned}'


class TaskSubmission(BaseModel):
    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),
        ('EVALUATED', 'Evaluated'),
        ('LATE', 'Late Submission'),
        ('INCOMPLETE', 'Incomplete'),
    ]

    task = models.ForeignKey(DailyTask, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='task_submissions')
    submission_date = models.DateTimeField(auto_now_add=True)
    submission_text = models.TextField(blank=True, null=True)
    submission_file = models.FileField(upload_to='task_submissions/', blank=True, null=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    teacher_remarks = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')

    class Meta:
        db_table = 'task_submission'
        unique_together = ['task', 'student']
