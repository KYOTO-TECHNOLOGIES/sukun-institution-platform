from core.serializers import build_model_serializer

from .models import AcademicYear, Authority, Institution


InstitutionSerializer = build_model_serializer(Institution)
AcademicYearSerializer = build_model_serializer(AcademicYear)
AuthoritySerializer = build_model_serializer(Authority)
