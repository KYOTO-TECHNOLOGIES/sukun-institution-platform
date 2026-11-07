from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
from .serializers import (
    BenchTemplateSerializer,
    ClassProximityRuleSerializer,
    ExamAttendanceSerializer,
    ExamDaySerializer,
    ExamInstitutionSerializer,
    ExamRoomSerializer,
    ExamSeatingArrangementSerializer,
    ExamSessionSerializer,
    ExamStudentSerializer,
    ExamSubjectScheduleSerializer,
    LayoutBenchSerializer,
    LayoutRowSerializer,
    LayoutSeatSerializer,
    MalpracticeRecordSerializer,
    RoomAssignmentSerializer,
    RoomLayoutSerializer,
    SeatingRuleSerializer,
    StudentSeatAssignmentSerializer,
    StudentSeatHistorySerializer,
    TeacherAvailabilitySerializer,
    TeacherInvigilationSerializer,
)
from .services import import_students_from_lms, validate_seating_arrangement


from core.viewsets import SecureModelViewSet


class ExamSeatingScopedViewSet(SecureModelViewSet):
    pass


def build_model_viewset(model, serializer_class, institution_lookup=None):
    attrs = {
        "queryset": model.objects.all(),
        "serializer_class": serializer_class,
        "institution_lookup": institution_lookup,
    }
    return type(f"{model.__name__}ViewSet", (ExamSeatingScopedViewSet,), attrs)


class ExamInstitutionViewSet(ExamSeatingScopedViewSet):
    queryset = ExamInstitution.objects.all()
    serializer_class = ExamInstitutionSerializer
    institution_lookup = "external_institution_id"

    @action(detail=True, methods=["post"], url_path="import-students")
    def import_students(self, request, pk=None):
        exam_institution = self.get_object()
        imported_count = import_students_from_lms(exam_institution)
        return Response({"imported_count": imported_count}, status=status.HTTP_200_OK)


class ExamSeatingArrangementViewSet(ExamSeatingScopedViewSet):
    queryset = ExamSeatingArrangement.objects.all()
    serializer_class = ExamSeatingArrangementSerializer
    institution_lookup = (
        "exam_subject_schedule__exam_day__exam_session__"
        "exam_institution__external_institution_id"
    )

    @action(detail=True, methods=["get"], url_path="validate")
    def validate_arrangement(self, request, pk=None):
        arrangement = self.get_object()
        violations = validate_seating_arrangement(arrangement.id)
        return Response({"violations": violations}, status=status.HTTP_200_OK)


ExamStudentViewSet = build_model_viewset(
    ExamStudent,
    ExamStudentSerializer,
    "exam_institution__external_institution_id",
)
ExamSessionViewSet = build_model_viewset(
    ExamSession,
    ExamSessionSerializer,
    "exam_institution__external_institution_id",
)
ExamDayViewSet = build_model_viewset(
    ExamDay,
    ExamDaySerializer,
    "exam_session__exam_institution__external_institution_id",
)
ExamSubjectScheduleViewSet = build_model_viewset(
    ExamSubjectSchedule,
    ExamSubjectScheduleSerializer,
    "exam_day__exam_session__exam_institution__external_institution_id",
)
ExamRoomViewSet = build_model_viewset(
    ExamRoom,
    ExamRoomSerializer,
    "exam_institution__external_institution_id",
)
BenchTemplateViewSet = build_model_viewset(
    BenchTemplate,
    BenchTemplateSerializer,
    "exam_institution__external_institution_id",
)
RoomLayoutViewSet = build_model_viewset(
    RoomLayout,
    RoomLayoutSerializer,
    "exam_room__exam_institution__external_institution_id",
)
LayoutRowViewSet = build_model_viewset(
    LayoutRow,
    LayoutRowSerializer,
    "room_layout__exam_room__exam_institution__external_institution_id",
)
LayoutBenchViewSet = build_model_viewset(
    LayoutBench,
    LayoutBenchSerializer,
    "layout_row__room_layout__exam_room__exam_institution__external_institution_id",
)
LayoutSeatViewSet = build_model_viewset(
    LayoutSeat,
    LayoutSeatSerializer,
    "layout_bench__layout_row__room_layout__exam_room__exam_institution__external_institution_id",
)
RoomAssignmentViewSet = build_model_viewset(
    RoomAssignment,
    RoomAssignmentSerializer,
    "seating_arrangement__exam_subject_schedule__exam_day__exam_session__exam_institution__external_institution_id",
)
StudentSeatAssignmentViewSet = build_model_viewset(
    StudentSeatAssignment,
    StudentSeatAssignmentSerializer,
    "seating_arrangement__exam_subject_schedule__exam_day__exam_session__exam_institution__external_institution_id",
)
SeatingRuleViewSet = build_model_viewset(
    SeatingRule,
    SeatingRuleSerializer,
    "exam_institution__external_institution_id",
)
ClassProximityRuleViewSet = build_model_viewset(
    ClassProximityRule,
    ClassProximityRuleSerializer,
    "exam_institution__external_institution_id",
)
TeacherInvigilationViewSet = build_model_viewset(
    TeacherInvigilation,
    TeacherInvigilationSerializer,
    "room_assignment__seating_arrangement__exam_subject_schedule__exam_day__exam_session__exam_institution__external_institution_id",
)
TeacherAvailabilityViewSet = build_model_viewset(
    TeacherAvailability,
    TeacherAvailabilitySerializer,
    "exam_institution__external_institution_id",
)
StudentSeatHistoryViewSet = build_model_viewset(
    StudentSeatHistory,
    StudentSeatHistorySerializer,
    "seating_arrangement__exam_subject_schedule__exam_day__exam_session__exam_institution__external_institution_id",
)
ExamAttendanceViewSet = build_model_viewset(
    ExamAttendance,
    ExamAttendanceSerializer,
    "student_assignment__seating_arrangement__exam_subject_schedule__exam_day__exam_session__exam_institution__external_institution_id",
)
MalpracticeRecordViewSet = build_model_viewset(
    MalpracticeRecord,
    MalpracticeRecordSerializer,
    "student_assignment__seating_arrangement__exam_subject_schedule__exam_day__exam_session__exam_institution__external_institution_id",
)
