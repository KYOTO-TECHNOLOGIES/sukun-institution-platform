from core.viewsets import build_model_viewset

from .models import AcademicYear, Authority, Institution
from .serializers import AcademicYearSerializer, AuthoritySerializer, InstitutionSerializer


InstitutionViewSet = build_model_viewset(Institution, InstitutionSerializer, institution_lookup='id')
from django.db import transaction
from core.viewsets import SecureModelViewSet

class AcademicYearViewSet(SecureModelViewSet):
    queryset=AcademicYear.objects.all(); serializer_class=AcademicYearSerializer
    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer)
        inst=serializer.validated_data['institution']
        Institution.objects.select_for_update().get(pk=inst.pk)
        if serializer.validated_data.get('is_current'):
            AcademicYear.objects.filter(institution=inst,is_current=True).update(is_current=False)
        serializer.save()
    @transaction.atomic
    def perform_update(self,serializer):
        self.validate_write(serializer)
        Institution.objects.select_for_update().get(pk=serializer.instance.institution_id)
        if serializer.validated_data.get('is_current'):
            AcademicYear.objects.filter(institution=serializer.instance.institution,is_current=True).exclude(pk=serializer.instance.pk).update(is_current=False)
        serializer.save()

AuthorityViewSet = build_model_viewset(Authority, AuthoritySerializer, institution_lookup='institution_id')
