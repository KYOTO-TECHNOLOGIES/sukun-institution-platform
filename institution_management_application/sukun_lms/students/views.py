from core.viewsets import build_model_viewset

from .models import Achievement, DisciplineRecord, HifzProgress, ParentGuardian, PrayerAttendance, Student, StudentCertificate
from .serializers import (
    AchievementSerializer,
    DisciplineRecordSerializer,
    HifzProgressSerializer,
    ParentGuardianSerializer,
    PrayerAttendanceSerializer,
    StudentCertificateSerializer,
    StudentSerializer,
)


from django.db import transaction
from rest_framework.exceptions import ValidationError
from core.viewsets import SecureModelViewSet


class StudentViewSet(SecureModelViewSet):
    queryset = Student.objects.select_related('user', 'division__class_obj', 'academic_year')
    serializer_class = StudentSerializer

    def validate_write(self, serializer):
        super().validate_write(serializer)
        data, existing = serializer.validated_data, serializer.instance
        division = data.get('division', getattr(existing, 'division', None))
        year = data.get('academic_year', getattr(existing, 'academic_year', None))
        if existing and 'user' in data and data['user'] != existing.user:
            raise ValidationError({'user': 'A student login cannot be reassigned to a different account.'})
        if division and data.get('is_active', getattr(existing, 'is_active', True)):
            from academics.models import Division
            division = Division.objects.select_for_update().get(pk=division.pk)
            if Student.objects.filter(division=division, academic_year=year, is_active=True).exclude(pk=getattr(existing,'pk',None)).count() >= division.capacity:
                raise ValidationError({'division': 'This division has reached its capacity.'})

ParentGuardianViewSet = build_model_viewset(ParentGuardian, ParentGuardianSerializer, institution_lookup='student__institution_id')
HifzProgressViewSet = build_model_viewset(HifzProgress, HifzProgressSerializer, institution_lookup='student__institution_id')
PrayerAttendanceViewSet = build_model_viewset(PrayerAttendance, PrayerAttendanceSerializer, institution_lookup='student__institution_id')
DisciplineRecordViewSet = build_model_viewset(DisciplineRecord, DisciplineRecordSerializer, institution_lookup='student__institution_id')
AchievementViewSet = build_model_viewset(Achievement, AchievementSerializer, institution_lookup='student__institution_id')
StudentCertificateViewSet = build_model_viewset(StudentCertificate, StudentCertificateSerializer, institution_lookup='student__institution_id')
