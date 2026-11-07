from rest_framework import serializers

from .models import (
    BenchTemplate,
    ClassProximityRule,
    ExamAttendance,
    ExamDay,
    ExamInstitution,
    ExamRoom,
    ExamSeatingArrangement,
    ExamSession,
    ExamStudent,
    ExamSubjectSchedule,
    LayoutBench,
    LayoutRow,
    LayoutSeat,
    MalpracticeRecord,
    RoomAssignment,
    RoomLayout,
    SeatingRule,
    StudentSeatAssignment,
    StudentSeatHistory,
    TeacherAvailability,
    TeacherInvigilation,
)


def build_model_serializer(model):
    meta = type("Meta", (), {"model": model, "fields": "__all__"})
    return type(
        f"{model.__name__}Serializer",
        (serializers.ModelSerializer,),
        {"Meta": meta},
    )


ExamInstitutionSerializer = build_model_serializer(ExamInstitution)
ExamStudentSerializer = build_model_serializer(ExamStudent)
ExamSessionSerializer = build_model_serializer(ExamSession)
ExamDaySerializer = build_model_serializer(ExamDay)
ExamSubjectScheduleSerializer = build_model_serializer(ExamSubjectSchedule)
ExamRoomSerializer = build_model_serializer(ExamRoom)
BenchTemplateSerializer = build_model_serializer(BenchTemplate)
RoomLayoutSerializer = build_model_serializer(RoomLayout)
LayoutRowSerializer = build_model_serializer(LayoutRow)
LayoutBenchSerializer = build_model_serializer(LayoutBench)
LayoutSeatSerializer = build_model_serializer(LayoutSeat)
ExamSeatingArrangementSerializer = build_model_serializer(ExamSeatingArrangement)
RoomAssignmentSerializer = build_model_serializer(RoomAssignment)
StudentSeatAssignmentSerializer = build_model_serializer(StudentSeatAssignment)
SeatingRuleSerializer = build_model_serializer(SeatingRule)
ClassProximityRuleSerializer = build_model_serializer(ClassProximityRule)
TeacherInvigilationSerializer = build_model_serializer(TeacherInvigilation)
TeacherAvailabilitySerializer = build_model_serializer(TeacherAvailability)
StudentSeatHistorySerializer = build_model_serializer(StudentSeatHistory)
ExamAttendanceSerializer = build_model_serializer(ExamAttendance)
MalpracticeRecordSerializer = build_model_serializer(MalpracticeRecord)
