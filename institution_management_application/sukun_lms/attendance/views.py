from core.viewsets import build_model_viewset

from .models import StudentAttendance, TeacherAttendance
from .serializers import StudentAttendanceSerializer, TeacherAttendanceSerializer


StudentAttendanceViewSet = build_model_viewset(StudentAttendance, StudentAttendanceSerializer, institution_lookup='student__institution_id')
TeacherAttendanceViewSet = build_model_viewset(TeacherAttendance, TeacherAttendanceSerializer, institution_lookup='teacher__institution_id')
