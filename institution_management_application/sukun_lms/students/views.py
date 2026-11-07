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


StudentViewSet = build_model_viewset(Student, StudentSerializer, institution_lookup='institution_id')
ParentGuardianViewSet = build_model_viewset(ParentGuardian, ParentGuardianSerializer, institution_lookup='student__institution_id')
HifzProgressViewSet = build_model_viewset(HifzProgress, HifzProgressSerializer, institution_lookup='student__institution_id')
PrayerAttendanceViewSet = build_model_viewset(PrayerAttendance, PrayerAttendanceSerializer, institution_lookup='student__institution_id')
DisciplineRecordViewSet = build_model_viewset(DisciplineRecord, DisciplineRecordSerializer, institution_lookup='student__institution_id')
AchievementViewSet = build_model_viewset(Achievement, AchievementSerializer, institution_lookup='student__institution_id')
StudentCertificateViewSet = build_model_viewset(StudentCertificate, StudentCertificateSerializer, institution_lookup='student__institution_id')
