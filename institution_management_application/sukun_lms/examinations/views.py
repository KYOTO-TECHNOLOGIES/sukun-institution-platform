from core.viewsets import build_model_viewset

from .models import Exam, ExamResult, ExamType
from .serializers import ExamResultSerializer, ExamSerializer, ExamTypeSerializer


ExamTypeViewSet = build_model_viewset(ExamType, ExamTypeSerializer, institution_lookup='institution_id')
ExamViewSet = build_model_viewset(Exam, ExamSerializer, institution_lookup='class_obj__institution_id')
ExamResultViewSet = build_model_viewset(ExamResult, ExamResultSerializer, institution_lookup='student__institution_id')
