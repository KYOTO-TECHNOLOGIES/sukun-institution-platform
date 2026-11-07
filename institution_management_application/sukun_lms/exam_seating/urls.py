from rest_framework.routers import DefaultRouter

from .viewsets import (
    BenchTemplateViewSet,
    ClassProximityRuleViewSet,
    ExamAttendanceViewSet,
    ExamDayViewSet,
    ExamInstitutionViewSet,
    ExamRoomViewSet,
    ExamSeatingArrangementViewSet,
    ExamSessionViewSet,
    ExamStudentViewSet,
    ExamSubjectScheduleViewSet,
    LayoutBenchViewSet,
    LayoutRowViewSet,
    LayoutSeatViewSet,
    MalpracticeRecordViewSet,
    RoomAssignmentViewSet,
    RoomLayoutViewSet,
    SeatingRuleViewSet,
    StudentSeatAssignmentViewSet,
    StudentSeatHistoryViewSet,
    TeacherAvailabilityViewSet,
    TeacherInvigilationViewSet,
)

router = DefaultRouter()
router.register("institutions", ExamInstitutionViewSet, basename="exam-seating-institution")
router.register("students", ExamStudentViewSet, basename="exam-seating-student")
router.register("sessions", ExamSessionViewSet, basename="exam-seating-session")
router.register("days", ExamDayViewSet, basename="exam-seating-day")
router.register(
    "subject-schedules",
    ExamSubjectScheduleViewSet,
    basename="exam-seating-subject-schedule",
)
router.register("rooms", ExamRoomViewSet, basename="exam-seating-room")
router.register(
    "bench-templates",
    BenchTemplateViewSet,
    basename="exam-seating-bench-template",
)
router.register("room-layouts", RoomLayoutViewSet, basename="exam-seating-room-layout")
router.register("layout-rows", LayoutRowViewSet, basename="exam-seating-layout-row")
router.register("layout-benches", LayoutBenchViewSet, basename="exam-seating-layout-bench")
router.register("layout-seats", LayoutSeatViewSet, basename="exam-seating-layout-seat")
router.register(
    "arrangements",
    ExamSeatingArrangementViewSet,
    basename="exam-seating-arrangement",
)
router.register(
    "room-assignments",
    RoomAssignmentViewSet,
    basename="exam-seating-room-assignment",
)
router.register(
    "student-seat-assignments",
    StudentSeatAssignmentViewSet,
    basename="exam-seating-student-seat-assignment",
)
router.register("seating-rules", SeatingRuleViewSet, basename="exam-seating-rule")
router.register(
    "class-proximity-rules",
    ClassProximityRuleViewSet,
    basename="exam-seating-class-proximity-rule",
)
router.register(
    "teacher-invigilations",
    TeacherInvigilationViewSet,
    basename="exam-seating-teacher-invigilation",
)
router.register(
    "teacher-availabilities",
    TeacherAvailabilityViewSet,
    basename="exam-seating-teacher-availability",
)
router.register("seat-history", StudentSeatHistoryViewSet, basename="exam-seating-seat-history")
router.register("attendance", ExamAttendanceViewSet, basename="exam-seating-attendance")
router.register(
    "malpractice-records",
    MalpracticeRecordViewSet,
    basename="exam-seating-malpractice-record",
)

urlpatterns = router.urls
