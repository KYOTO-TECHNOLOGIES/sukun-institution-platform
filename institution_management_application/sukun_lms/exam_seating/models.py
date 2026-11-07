import uuid

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ExamSeatingBaseModel(models.Model):
    """Base model for the reusable exam seating app."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class ExamInstitution(ExamSeatingBaseModel):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, default="Kerala")
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_standalone = models.BooleanField(default=False)
    external_institution_id = models.UUIDField(null=True, blank=True, db_index=True)
    external_source = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "exam_institution"
        verbose_name = "Exam Institution"
        verbose_name_plural = "Exam Institutions"

    def __str__(self):
        mode = "Standalone" if self.is_standalone else "Integrated"
        return f"{self.name} ({mode})"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"EXM{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class ExamStudent(ExamSeatingBaseModel):
    GENDER_CHOICES = [("MALE", "Male"), ("FEMALE", "Female")]

    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="exam_students",
    )
    external_student_id = models.UUIDField(null=True, blank=True, db_index=True)
    registration_number = models.CharField(max_length=50)
    roll_number = models.CharField(max_length=50, blank=True)
    full_name = models.CharField(max_length=200)
    gender = models.CharField(max_length=6, choices=GENDER_CHOICES)
    class_name = models.CharField(max_length=100)
    division_name = models.CharField(max_length=10, blank=True)
    class_group = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    parent_phone = models.CharField(max_length=15, blank=True)
    is_specially_abled = models.BooleanField(default=False)
    special_requirements = models.TextField(blank=True)

    class Meta:
        db_table = "exam_student"
        verbose_name = "Exam Student"
        verbose_name_plural = "Exam Students"
        ordering = ["class_name", "division_name", "roll_number", "registration_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["exam_institution", "registration_number"],
                name="unique_exam_student_registration_per_institution",
            )
        ]

    def __str__(self):
        return f"{self.registration_number} - {self.full_name} ({self.class_name})"


class ExamSession(ExamSeatingBaseModel):
    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="exam_sessions",
    )
    name = models.CharField(max_length=200)
    academic_year = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True)
    external_exam_type_id = models.UUIDField(null=True, blank=True, db_index=True)
    external_exam_type_name = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "exam_session"
        verbose_name = "Exam Session"
        verbose_name_plural = "Exam Sessions"

    def __str__(self):
        return f"{self.name} ({self.academic_year})"

    def clean(self):
        super().clean()
        if self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be before start date."})


class ExamDay(ExamSeatingBaseModel):
    exam_session = models.ForeignKey(
        ExamSession,
        on_delete=models.CASCADE,
        related_name="exam_days",
    )
    date = models.DateField()
    day_number = models.IntegerField(validators=[MinValueValidator(1)])
    has_morning_session = models.BooleanField(default=True)
    has_afternoon_session = models.BooleanField(default=False)
    has_evening_session = models.BooleanField(default=False)

    class Meta:
        db_table = "exam_day"
        ordering = ["date"]
        constraints = [
            models.UniqueConstraint(
                fields=["exam_session", "date"],
                name="unique_exam_day_per_session",
            ),
            models.UniqueConstraint(
                fields=["exam_session", "day_number"],
                name="unique_exam_day_number_per_session",
            ),
        ]

    def __str__(self):
        return f"Day {self.day_number} - {self.date}"


class ExamSubjectSchedule(ExamSeatingBaseModel):
    SESSION_CHOICES = [
        ("MORNING", "Morning"),
        ("AFTERNOON", "Afternoon"),
        ("EVENING", "Evening"),
    ]

    exam_day = models.ForeignKey(
        ExamDay,
        on_delete=models.CASCADE,
        related_name="subject_schedules",
    )
    subject_name = models.CharField(max_length=200)
    subject_code = models.CharField(max_length=20, blank=True)
    session = models.CharField(max_length=10, choices=SESSION_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    participating_class_groups = models.JSONField(default=list)
    external_subject_id = models.UUIDField(null=True, blank=True, db_index=True)
    external_subject_name = models.CharField(max_length=200, blank=True)
    external_exam_id = models.UUIDField(null=True, blank=True, db_index=True)
    max_students_per_room = models.IntegerField(
        default=30,
        validators=[MinValueValidator(1)],
    )
    requires_seat_change_from_previous = models.BooleanField(default=True)

    class Meta:
        db_table = "exam_subject_schedule"
        verbose_name = "Exam Subject Schedule"
        verbose_name_plural = "Exam Subject Schedules"
        ordering = ["exam_day__date", "start_time"]

    def __str__(self):
        return (
            f"{self.subject_name} - {self.exam_day.date} "
            f"({self.get_session_display()})"
        )

    def clean(self):
        super().clean()
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after start time."})


class ExamRoom(ExamSeatingBaseModel):
    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="exam_rooms",
    )
    room_name = models.CharField(max_length=100)
    room_code = models.CharField(max_length=20, unique=True)
    floor = models.IntegerField(default=0)
    building_name = models.CharField(max_length=100, blank=True)
    total_capacity = models.IntegerField(validators=[MinValueValidator(1)])
    current_capacity_used = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    is_accessible = models.BooleanField(default=False)
    has_cctv = models.BooleanField(default=False)
    allowed_class_groups = models.JSONField(default=list, blank=True)
    excluded_class_groups = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "exam_room"
        verbose_name = "Exam Room"
        verbose_name_plural = "Exam Rooms"

    def __str__(self):
        return f"{self.room_name} (Capacity: {self.total_capacity})"

    def clean(self):
        super().clean()
        if self.allowed_class_groups and self.excluded_class_groups:
            raise ValidationError("Cannot set both allowed and excluded class groups.")


class BenchTemplate(ExamSeatingBaseModel):
    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="bench_templates",
    )
    name = models.CharField(max_length=100)
    seats_per_bench = models.IntegerField(validators=[MinValueValidator(1)])
    bench_width_cm = models.IntegerField(default=120, validators=[MinValueValidator(1)])
    bench_depth_cm = models.IntegerField(default=60, validators=[MinValueValidator(1)])
    is_desk_type = models.BooleanField(default=True)

    class Meta:
        db_table = "bench_template"
        verbose_name = "Bench Template"
        verbose_name_plural = "Bench Templates"

    def __str__(self):
        return f"{self.name} ({self.seats_per_bench} seats)"


class RoomLayout(ExamSeatingBaseModel):
    exam_room = models.ForeignKey(
        ExamRoom,
        on_delete=models.CASCADE,
        related_name="layouts",
    )
    layout_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "room_layout"
        verbose_name = "Room Layout"
        verbose_name_plural = "Room Layouts"

    def __str__(self):
        return f"{self.exam_room.room_name} - {self.layout_name}"

    @property
    def total_seats(self):
        return sum(row.total_seats for row in self.rows.all())


class LayoutRow(ExamSeatingBaseModel):
    room_layout = models.ForeignKey(
        RoomLayout,
        on_delete=models.CASCADE,
        related_name="rows",
    )
    row_number = models.IntegerField(validators=[MinValueValidator(1)])
    row_label = models.CharField(max_length=10)
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    gap_before_cm = models.IntegerField(default=30, validators=[MinValueValidator(0)])

    class Meta:
        db_table = "layout_row"
        ordering = ["row_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["room_layout", "row_number"],
                name="unique_layout_row_number",
            ),
            models.UniqueConstraint(
                fields=["room_layout", "row_label"],
                name="unique_layout_row_label",
            ),
        ]

    def __str__(self):
        return f"Row {self.row_label} - {self.room_layout.layout_name}"

    @property
    def total_seats(self):
        return sum(bench.seats_per_bench for bench in self.benches.all())


class LayoutBench(ExamSeatingBaseModel):
    BENCH_TYPE_CHOICES = [
        ("BENCH", "Bench with Seats"),
        ("EMPTY_SPACE", "Empty Space/Gap"),
        ("DOOR", "Door/Entrance"),
        ("WINDOW", "Window"),
        ("PILLAR", "Pillar/Column"),
    ]

    layout_row = models.ForeignKey(
        LayoutRow,
        on_delete=models.CASCADE,
        related_name="benches",
    )
    bench_template = models.ForeignKey(
        BenchTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="layout_benches",
    )
    bench_number = models.IntegerField(validators=[MinValueValidator(1)])
    bench_type = models.CharField(
        max_length=20,
        choices=BENCH_TYPE_CHOICES,
        default="BENCH",
    )
    seats_per_bench = models.IntegerField(
        default=1,
        validators=[MinValueValidator(0)],
    )
    position_x = models.FloatField(default=0)
    gap_before_cm = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    seat_label_prefix = models.CharField(max_length=5, blank=True)

    class Meta:
        db_table = "layout_bench"
        ordering = ["layout_row", "bench_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["layout_row", "bench_number"],
                name="unique_layout_bench_number",
            )
        ]

    def __str__(self):
        if self.bench_type == "BENCH":
            return f"Bench {self.bench_number} ({self.seats_per_bench} seats)"
        return f"{self.get_bench_type_display()} - Position {self.bench_number}"

    def save(self, *args, **kwargs):
        if self.bench_template and self.bench_type == "BENCH":
            self.seats_per_bench = self.bench_template.seats_per_bench
        if self.bench_type != "BENCH":
            self.seats_per_bench = 0
        super().save(*args, **kwargs)


class LayoutSeat(ExamSeatingBaseModel):
    layout_bench = models.ForeignKey(
        LayoutBench,
        on_delete=models.CASCADE,
        related_name="seats",
    )
    seat_number = models.IntegerField(validators=[MinValueValidator(1)])
    seat_label = models.CharField(max_length=20, blank=True)
    seat_x = models.FloatField(default=0)
    seat_y = models.FloatField(default=0)
    is_reserved = models.BooleanField(default=False)
    is_broken = models.BooleanField(default=False)
    reservation_reason = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "layout_seat"
        ordering = ["layout_bench", "seat_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["layout_bench", "seat_number"],
                name="unique_layout_seat_number",
            )
        ]

    def __str__(self):
        return f"Seat {self.seat_label} in {self.layout_bench}"

    def generate_label(self):
        row_label = self.layout_bench.layout_row.row_label
        bench_num = self.layout_bench.bench_number
        seat_num = self.seat_number
        prefix = (
            self.layout_bench.seat_label_prefix.strip()
            if self.layout_bench.seat_label_prefix
            else ""
        )
        if prefix:
            return f"{prefix}{bench_num}-{seat_num}"
        return f"{row_label}{bench_num}-{seat_num}"

    def save(self, *args, **kwargs):
        if not self.seat_label:
            self.seat_label = self.generate_label()
        super().save(*args, **kwargs)


class ExamSeatingArrangement(ExamSeatingBaseModel):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("GENERATED", "Generated"),
        ("PUBLISHED", "Published"),
        ("ARCHIVED", "Archived"),
    ]
    SESSION_CHOICES = [
        ("MORNING", "Morning"),
        ("AFTERNOON", "Afternoon"),
        ("EVENING", "Evening"),
    ]

    exam_subject_schedule = models.ForeignKey(
        ExamSubjectSchedule,
        on_delete=models.CASCADE,
        related_name="seating_arrangements",
    )
    arrangement_name = models.CharField(max_length=200)
    arrangement_date = models.DateField()
    arrangement_session = models.CharField(max_length=10, choices=SESSION_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    used_max_gap_algorithm = models.BooleanField(default=True)
    used_randomization = models.BooleanField(default=True)

    class Meta:
        db_table = "exam_seating_arrangement"
        verbose_name = "Exam Seating Arrangement"
        verbose_name_plural = "Exam Seating Arrangements"

    def __str__(self):
        return f"{self.arrangement_name} - {self.arrangement_date}"

    def clean(self):
        super().clean()
        if self.arrangement_session != self.exam_subject_schedule.session:
            raise ValidationError(
                {
                    "arrangement_session": (
                        "Arrangement session must match the exam subject session."
                    )
                }
            )
        if self.arrangement_date != self.exam_subject_schedule.exam_day.date:
            raise ValidationError(
                {"arrangement_date": "Arrangement date must match the scheduled exam day."}
            )


class RoomAssignment(ExamSeatingBaseModel):
    seating_arrangement = models.ForeignKey(
        ExamSeatingArrangement,
        on_delete=models.CASCADE,
        related_name="room_assignments",
    )
    exam_room = models.ForeignKey(
        ExamRoom,
        on_delete=models.CASCADE,
        related_name="exam_assignments",
    )
    room_layout = models.ForeignKey(
        RoomLayout,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_assignments",
    )
    assigned_class_groups = models.JSONField(default=list)
    total_students_assigned = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    total_seats_used = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    vacant_seats = models.IntegerField(default=0)

    class Meta:
        db_table = "room_assignment"
        verbose_name = "Room Assignment"
        verbose_name_plural = "Room Assignments"
        constraints = [
            models.UniqueConstraint(
                fields=["seating_arrangement", "exam_room"],
                name="unique_room_assignment_per_arrangement",
            )
        ]

    def __str__(self):
        return f"{self.exam_room.room_name} - {self.seating_arrangement.arrangement_name}"

    def clean(self):
        super().clean()
        if self.room_layout and self.room_layout.exam_room_id != self.exam_room_id:
            raise ValidationError(
                {"room_layout": "Selected room layout must belong to the assigned room."}
            )


class StudentSeatAssignment(ExamSeatingBaseModel):
    room_assignment = models.ForeignKey(
        RoomAssignment,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    seating_arrangement = models.ForeignKey(
        ExamSeatingArrangement,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    exam_student = models.ForeignKey(
        ExamStudent,
        on_delete=models.CASCADE,
        related_name="seat_assignments",
    )
    layout_seat = models.ForeignKey(
        LayoutSeat,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    assignment_sequence = models.IntegerField(validators=[MinValueValidator(1)])
    is_present = models.BooleanField(default=None, null=True, blank=True)
    attendance_marked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "student_seat_assignment"
        verbose_name = "Student Seat Assignment"
        verbose_name_plural = "Student Seat Assignments"
        constraints = [
            models.UniqueConstraint(
                fields=["seating_arrangement", "exam_student"],
                name="unique_student_per_arrangement",
            ),
            models.UniqueConstraint(
                fields=["seating_arrangement", "layout_seat"],
                name="unique_seat_per_arrangement",
            ),
        ]

    def __str__(self):
        return f"{self.exam_student.full_name} -> {self.layout_seat.seat_label}"

    def clean(self):
        super().clean()
        if self.room_assignment.seating_arrangement_id != self.seating_arrangement_id:
            raise ValidationError(
                {
                    "room_assignment": (
                        "Room assignment must belong to the same seating arrangement."
                    )
                }
            )
        room_layout_id = self.room_assignment.room_layout_id
        if room_layout_id and (
            self.layout_seat.layout_bench.layout_row.room_layout_id != room_layout_id
        ):
            raise ValidationError(
                {"layout_seat": "Seat must belong to the selected room layout."}
            )


class SeatingRule(ExamSeatingBaseModel):
    RULE_TYPE_CHOICES = [
        ("MIN_DISTANCE", "Minimum Distance Between Classes"),
        ("SAME_SUBJECT_SEPARATION", "Separate Same Subject Classes"),
        ("NO_ADJACENT_CLASSES", "No Adjacent Classes"),
        ("CLASS_GROUPING", "Class Grouping"),
        ("PREFERRED_ZONE", "Preferred Zone for Class"),
        ("GENDER_SEPARATION", "Gender Separation"),
        ("SPECIAL_NEEDS_FRONT", "Special Needs Students in Front"),
    ]

    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="seating_rules",
    )
    rule_name = models.CharField(max_length=200)
    rule_type = models.CharField(max_length=30, choices=RULE_TYPE_CHOICES)
    description = models.TextField(blank=True)
    rule_config = models.JSONField(default=dict)
    apply_to_all_exams = models.BooleanField(default=True)
    specific_subject_schedules = models.ManyToManyField(
        ExamSubjectSchedule,
        blank=True,
        related_name="applicable_rules",
    )
    is_enabled = models.BooleanField(default=True)
    priority = models.IntegerField(default=10)

    class Meta:
        db_table = "seating_rule"
        verbose_name = "Seating Rule"
        verbose_name_plural = "Seating Rules"
        ordering = ["priority", "rule_name"]

    def __str__(self):
        return f"{self.rule_name} (Priority: {self.priority})"


class ClassProximityRule(ExamSeatingBaseModel):
    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="proximity_rules",
    )
    rule_name = models.CharField(max_length=200)
    class_group_a = models.CharField(max_length=100)
    class_group_b = models.CharField(max_length=100)
    reason = models.CharField(max_length=200, blank=True)
    minimum_distance_seats = models.IntegerField(
        default=3,
        validators=[MinValueValidator(0)],
    )
    minimum_distance_rows = models.IntegerField(
        default=1,
        validators=[MinValueValidator(0)],
    )
    exam_sessions = models.ManyToManyField(
        ExamSession,
        blank=True,
        related_name="class_proximity_rules",
    )
    is_strict = models.BooleanField(default=True)

    class Meta:
        db_table = "class_proximity_rule"
        verbose_name = "Class Proximity Rule"
        verbose_name_plural = "Class Proximity Rules"

    def __str__(self):
        return (
            f"{self.class_group_a} ↔ {self.class_group_b} "
            f"(Min {self.minimum_distance_seats} seats)"
        )


class TeacherInvigilation(ExamSeatingBaseModel):
    ROLE_CHOICES = [
        ("CHIEF", "Chief Invigilator"),
        ("ASSISTANT", "Assistant Invigilator"),
        ("RELIEF", "Relief Invigilator"),
        ("FLOATING", "Floating Invigilator"),
    ]

    room_assignment = models.ForeignKey(
        RoomAssignment,
        on_delete=models.CASCADE,
        related_name="invigilators",
    )
    teacher_name = models.CharField(max_length=200)
    teacher_id = models.CharField(max_length=50, blank=True)
    external_teacher_id = models.UUIDField(null=True, blank=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="ASSISTANT")
    is_confirmed = models.BooleanField(default=False)
    confirmation_time = models.DateTimeField(null=True, blank=True)
    swap_requested = models.BooleanField(default=False)
    swap_with_teacher = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="swap_requests",
    )
    phone_contact = models.CharField(max_length=15, blank=True)

    class Meta:
        db_table = "teacher_invigilation"
        verbose_name = "Teacher Invigilation"
        verbose_name_plural = "Teacher Invigilations"

    def __str__(self):
        return (
            f"{self.teacher_name} - {self.get_role_display()} - "
            f"{self.room_assignment.exam_room.room_name}"
        )


class TeacherAvailability(ExamSeatingBaseModel):
    exam_institution = models.ForeignKey(
        ExamInstitution,
        on_delete=models.CASCADE,
        related_name="teacher_availabilities",
    )
    teacher_name = models.CharField(max_length=200)
    external_teacher_id = models.UUIDField(null=True, blank=True, db_index=True)
    available_dates = models.JSONField(default=list)
    available_sessions = models.JSONField(default=list)
    preferred_rooms = models.ManyToManyField(
        ExamRoom,
        blank=True,
        related_name="preferred_teachers",
    )
    max_duties_per_day = models.IntegerField(
        default=2,
        validators=[MinValueValidator(1)],
    )
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = "teacher_availability"
        verbose_name = "Teacher Availability"
        verbose_name_plural = "Teacher Availabilities"

    def __str__(self):
        return f"{self.teacher_name} Availability"


class StudentSeatHistory(ExamSeatingBaseModel):
    exam_student = models.ForeignKey(
        ExamStudent,
        on_delete=models.CASCADE,
        related_name="seat_history",
    )
    seating_arrangement = models.ForeignKey(
        ExamSeatingArrangement,
        on_delete=models.CASCADE,
        related_name="seat_history",
    )
    previous_seat = models.CharField(max_length=20)
    current_seat = models.CharField(max_length=20)
    change_date = models.DateField()
    row_change = models.IntegerField(default=0)
    column_change = models.IntegerField(default=0)
    is_significant_change = models.BooleanField(default=False)

    class Meta:
        db_table = "student_seat_history"
        verbose_name = "Student Seat History"
        verbose_name_plural = "Student Seat Histories"
        ordering = ["-change_date"]

    def __str__(self):
        return f"{self.exam_student.full_name}: {self.previous_seat} → {self.current_seat}"


class ExamAttendance(ExamSeatingBaseModel):
    ABSENCE_REASONS = [
        ("SICK", "Medical/Sick"),
        ("PERSONAL", "Personal"),
        ("FAMILY_EMERGENCY", "Family Emergency"),
        ("TRANSPORT", "Transport Issue"),
        ("LATE", "Came Late - Not Allowed"),
        ("OTHER", "Other"),
    ]

    student_assignment = models.OneToOneField(
        StudentSeatAssignment,
        on_delete=models.CASCADE,
        related_name="attendance",
    )
    is_present = models.BooleanField()
    marked_at = models.DateTimeField(auto_now_add=True)
    marked_by = models.CharField(max_length=200, blank=True)
    remarks = models.TextField(blank=True)
    reason = models.CharField(max_length=50, choices=ABSENCE_REASONS, blank=True)

    class Meta:
        db_table = "exam_attendance"
        verbose_name = "Exam Attendance"
        verbose_name_plural = "Exam Attendances"

    def __str__(self):
        status = "Present" if self.is_present else "Absent"
        return f"{self.student_assignment.exam_student.full_name} - {status}"


class MalpracticeRecord(ExamSeatingBaseModel):
    INCIDENT_TYPES = [
        ("COPYING", "Copying"),
        ("CHEAT_SHEET", "Cheat Sheet Found"),
        ("MOBILE_PHONE", "Mobile Phone"),
        ("COMMUNICATION", "Communicating with Others"),
        ("IMPERSONATION", "Impersonation"),
        ("OTHER", "Other"),
    ]

    student_assignment = models.ForeignKey(
        StudentSeatAssignment,
        on_delete=models.CASCADE,
        related_name="malpractice_records",
    )
    incident_type = models.CharField(max_length=30, choices=INCIDENT_TYPES)
    description = models.TextField()
    reported_by = models.CharField(max_length=200)
    reported_at = models.DateTimeField(auto_now_add=True)
    evidence_file = models.FileField(upload_to="malpractice_evidence/", blank=True, null=True)
    action_taken = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "malpractice_record"
        verbose_name = "Malpractice Record"
        verbose_name_plural = "Malpractice Records"

    def __str__(self):
        return f"{self.student_assignment.exam_student.full_name} - {self.incident_type}"
