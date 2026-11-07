from django.conf import settings
from django.db import models

from core.models import BaseModel


class ExamType(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='exam_types')
    name = models.CharField(max_length=100)
    name_arabic = models.CharField(max_length=100, blank=True, null=True)
    academic_year = models.ForeignKey('institutions.AcademicYear', on_delete=models.CASCADE, related_name='exam_types')
    start_date = models.DateField()
    end_date = models.DateField()
    max_total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100.00)
    pass_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=40.00)
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = 'exam_type'

    def __str__(self):
        return f'{self.name} ({self.academic_year.name})'


class Exam(BaseModel):
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name='exams')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='exams')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='exams')
    date = models.DateField()
    time_from = models.TimeField()
    time_to = models.TimeField()
    max_marks = models.DecimalField(max_digits=6, decimal_places=2)
    pass_marks = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        db_table = 'exam'
        unique_together = ['exam_type', 'class_obj', 'subject']

    def __str__(self):
        return f'{self.exam_type.name} - {self.subject.name}'


class ExamResult(BaseModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='exam_results')
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    marks_oral = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    marks_written = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=5, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='evaluated_exams')

    class Meta:
        db_table = 'exam_result'
        unique_together = ['exam', 'student']

    def __str__(self):
        return f'{self.student.admission_number} - {self.exam.subject.name} - {self.marks_obtained}'
