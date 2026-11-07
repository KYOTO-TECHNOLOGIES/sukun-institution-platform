from django.contrib import admin

from .models import StudentAttendance, TeacherAttendance

admin.site.register([StudentAttendance, TeacherAttendance])
