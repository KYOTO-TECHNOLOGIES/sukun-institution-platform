from core.serializers import build_model_serializer

from .models import Class, ClassSubject, Division, Subject, Syllabus, SyllabusProgress, TimeTable


SyllabusSerializer = build_model_serializer(Syllabus)
ClassSerializer = build_model_serializer(Class)
DivisionSerializer = build_model_serializer(Division)
SubjectSerializer = build_model_serializer(Subject)
ClassSubjectSerializer = build_model_serializer(ClassSubject)
SyllabusProgressSerializer = build_model_serializer(SyllabusProgress)
TimeTableSerializer = build_model_serializer(TimeTable)
