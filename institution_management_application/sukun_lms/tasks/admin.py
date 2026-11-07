from django.contrib import admin

from .models import DailyTask, TaskSubmission

admin.site.register([DailyTask, TaskSubmission])
