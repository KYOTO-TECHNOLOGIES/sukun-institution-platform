from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/accounts/', include('accounts.api_urls')),
    path('api/institutions/', include('institutions.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/students/', include('students.urls')),
    path('api/staff/', include('staff.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/examinations/', include('examinations.urls')),
    path('api/exam-seating/', include('exam_seating.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/library/', include('library.urls')),
    path('api/communications/', include('communications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
