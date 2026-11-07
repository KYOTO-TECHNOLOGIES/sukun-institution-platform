from django.contrib import admin

from .models import Exam, ExamResult, ExamType

admin.site.register([ExamType, Exam, ExamResult])
