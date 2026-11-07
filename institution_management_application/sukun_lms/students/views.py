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

from rest_framework.decorators import action

class StudentCertificateViewSet(SecureModelViewSet):
    queryset=StudentCertificate.objects.select_related('student__user','student__institution','issued_by')
    serializer_class=StudentCertificateSerializer
    http_method_names=['get','post','head','options']

    @action(detail=True,methods=['get'],url_path='print')
    def print_certificate(self,request,pk=None):
        from django.http import HttpResponse
        from django.utils.html import escape
        certificate=self.get_object(); student=certificate.student; institution=student.institution
        fields=[('Certificate number',certificate.certificate_number),('Issued on',certificate.issue_date),
                ('Student',student.user.full_name),('Admission number',student.admission_number),
                ('Class / division',str(student.division) if student.division else '-'),('Purpose',certificate.reason or '-')]
        rows=''.join('<tr><th>'+escape(str(k))+'</th><td>'+escape(str(v))+'</td></tr>' for k,v in fields)
        title=escape(certificate.get_certificate_type_display())
        html='<!doctype html><html><head><meta charset="utf-8"><title>'+title+'</title><style>body{font:17px system-ui;color:#183b32;max-width:800px;margin:60px auto;padding:40px;border:3px solid #183b32}h1,h2{text-align:center}table{width:100%;margin:40px 0}th,td{text-align:left;padding:12px}footer{margin-top:80px;text-align:right}@media print{button{display:none}}</style></head><body><h1>'+escape(institution.name)+'</h1><h2>'+title+'</h2><p>This document records the following certificate issued by the institution.</p><table>'+rows+'</table><footer>Authorized signature and institution seal<br><br>________________________</footer><button id="print-receipt">Print certificate</button><script src="/static/core/receipt.js"></script></body></html>'
        return HttpResponse(html)


# Pastoral and religious records are restricted to teaching staff and administrators.
for view in (HifzProgressViewSet, PrayerAttendanceViewSet, DisciplineRecordViewSet, AchievementViewSet):
    view.permission_module = "pastoral"
