from django.contrib import admin

from .models import AcademicYear, Authority, Institution

admin.site.register([Institution, AcademicYear, Authority])
