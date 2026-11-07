from core.viewsets import build_model_viewset

from .models import AcademicYear, Authority, Institution
from .serializers import AcademicYearSerializer, AuthoritySerializer, InstitutionSerializer


InstitutionViewSet = build_model_viewset(Institution, InstitutionSerializer, institution_lookup='id')
AcademicYearViewSet = build_model_viewset(AcademicYear, AcademicYearSerializer, institution_lookup='institution_id')
AuthorityViewSet = build_model_viewset(Authority, AuthoritySerializer, institution_lookup='institution_id')
