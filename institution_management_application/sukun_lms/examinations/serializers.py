from core.serializers import build_model_serializer

from .models import Exam, ExamResult, ExamType


ExamTypeSerializer = build_model_serializer(ExamType)
ExamSerializer = build_model_serializer(Exam)
ExamResultSerializer = build_model_serializer(ExamResult)
