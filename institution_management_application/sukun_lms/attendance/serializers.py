from core.serializers import build_model_serializer

from .models import StudentAttendance, TeacherAttendance


StudentAttendanceSerializer = build_model_serializer(StudentAttendance)
TeacherAttendanceSerializer = build_model_serializer(TeacherAttendance)
