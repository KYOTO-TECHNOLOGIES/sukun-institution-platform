from core.serializers import build_model_serializer

from .models import Achievement, DisciplineRecord, HifzProgress, ParentGuardian, PrayerAttendance, Student, StudentCertificate


from rest_framework import serializers

class StudentSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source="division.__str__", read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Student
        fields = '__all__'
ParentGuardianSerializer = build_model_serializer(ParentGuardian)
HifzProgressSerializer = build_model_serializer(HifzProgress)
PrayerAttendanceSerializer = build_model_serializer(PrayerAttendance)
DisciplineRecordSerializer = build_model_serializer(DisciplineRecord)
AchievementSerializer = build_model_serializer(Achievement)
StudentCertificateSerializer = build_model_serializer(StudentCertificate)
