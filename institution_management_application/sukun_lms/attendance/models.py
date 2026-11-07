from django.conf import settings
from django.db import models

from core.models import BaseModel


class StudentAttendance(BaseModel):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
        ('EXCUSED', 'Excused'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    division = models.ForeignKey('academics.Division', on_delete=models.CASCADE, related_name='student_attendances')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'student_attendance'
        unique_together = ['student', 'date']

    def __str__(self):
        return f'{self.student.admission_number} - {self.date} - {self.status}'


class TeacherAttendance(BaseModel):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
        ('EXCUSED', 'Excused'),
    ]

    teacher = models.ForeignKey('staff.Teacher', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    time_in = models.TimeField(null=True, blank=True)
    time_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='verified_teacher_attendances')
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'teacher_attendance'
        unique_together = ['teacher', 'date']

    def __str__(self):
        return f'{self.teacher.employee_id} - {self.date} - {self.status}'
