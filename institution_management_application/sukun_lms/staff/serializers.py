from rest_framework import serializers

from core.serializers import build_model_serializer
from .models import StaffLeaveRecord, StaffNote, Teacher


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = Teacher
        fields = '__all__'


StaffLeaveRecordSerializer = build_model_serializer(StaffLeaveRecord)
StaffNoteSerializer = build_model_serializer(StaffNote)
