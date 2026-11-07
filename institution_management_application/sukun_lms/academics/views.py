from core.viewsets import build_model_viewset

from .models import Class, ClassSubject, Division, Subject, Syllabus, SyllabusProgress, TimeTable
from .serializers import (
    ClassSerializer,
    ClassSubjectSerializer,
    DivisionSerializer,
    SubjectSerializer,
    SyllabusProgressSerializer,
    SyllabusSerializer,
    TimeTableSerializer,
)


SyllabusViewSet = build_model_viewset(Syllabus, SyllabusSerializer, institution_lookup='institution_id')
ClassViewSet = build_model_viewset(Class, ClassSerializer, institution_lookup='institution_id')
DivisionViewSet = build_model_viewset(Division, DivisionSerializer, institution_lookup='class_obj__institution_id')
SubjectViewSet = build_model_viewset(Subject, SubjectSerializer, institution_lookup='institution_id')
ClassSubjectViewSet = build_model_viewset(ClassSubject, ClassSubjectSerializer, institution_lookup='class_obj__institution_id')
SyllabusProgressViewSet = build_model_viewset(SyllabusProgress, SyllabusProgressSerializer, institution_lookup='class_subject__class_obj__institution_id')
TimeTableViewSet = build_model_viewset(TimeTable, TimeTableSerializer, institution_lookup='division__class_obj__institution_id')
