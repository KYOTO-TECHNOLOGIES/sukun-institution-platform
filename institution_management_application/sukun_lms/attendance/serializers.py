from core.serializers import build_model_serializer

from .models import StudentAttendance, TeacherAttendance


StudentAttendanceSerializer = build_model_serializer(StudentAttendance)
from rest_framework import serializers
class TeacherAttendanceSerializer(serializers.ModelSerializer):
    teacher_name=serializers.CharField(source='teacher.user.full_name',read_only=True)
    class Meta:
        model=TeacherAttendance; fields='__all__'; read_only_fields=('marked_by',)

