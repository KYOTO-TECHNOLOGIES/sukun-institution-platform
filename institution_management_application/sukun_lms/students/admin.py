from django.contrib import admin

from .models import Achievement, DisciplineRecord, HifzProgress, ParentGuardian, PrayerAttendance, Student, StudentCertificate

admin.site.register([Student, ParentGuardian, HifzProgress, PrayerAttendance, DisciplineRecord, Achievement, StudentCertificate])
