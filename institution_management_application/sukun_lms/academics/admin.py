from django.contrib import admin

from .models import Class, ClassSubject, Division, Subject, Syllabus, SyllabusProgress, TimeTable

admin.site.register([Syllabus, Class, Division, Subject, ClassSubject, SyllabusProgress, TimeTable])
