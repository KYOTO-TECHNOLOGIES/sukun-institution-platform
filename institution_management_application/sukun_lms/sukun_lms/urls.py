from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from core.audit import AuditViewSet
from core.reports import InstitutionDashboard, ReportExport
from core.health import health
from core.media import ProtectedMediaView

urlpatterns = [
    path('api/notifications/', include('notifications.urls')),
    path('health/', health),
    path('media/<path:filename>', ProtectedMediaView.as_view()),
    path('api/reports/overview/', InstitutionDashboard.as_view()),
    path('api/reports/export/<str:kind>/', ReportExport.as_view()),
    path('api/audit/', AuditViewSet.as_view({'get':'list'})),
    path('api/audit/<int:pk>/', AuditViewSet.as_view({'get':'retrieve'})),
    path('api/operations/', include('operations.urls')),
    path('api/portal/', include('learning.portal_urls')),
    path('api/learning/', include('learning.urls')),
    path('api/admissions/', include('admissions.urls')),
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


