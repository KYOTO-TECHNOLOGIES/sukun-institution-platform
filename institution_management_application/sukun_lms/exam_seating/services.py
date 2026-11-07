from django.apps import apps
from django.core.exceptions import ImproperlyConfigured

from .models import (
    ClassProximityRule,
    ExamInstitution,
    ExamSeatingArrangement,
    ExamStudent,
    StudentSeatAssignment,
)


def _get_model(label):
    try:
        return apps.get_model(label)
    except (LookupError, ValueError):
        return None


def sync_exam_institution_from_lms(institution):
    exam_institution, _ = ExamInstitution.objects.update_or_create(
        external_institution_id=institution.pk,
        defaults={
            "name": institution.name,
            "code": (
                getattr(institution, "registration_number", "")[:20]
                or f"EXM{str(institution.pk).replace('-', '')[:8].upper()}"
            ),
            "address": getattr(institution, "address", ""),
            "city": getattr(institution, "city", ""),
            "district": getattr(institution, "district", ""),
            "state": getattr(institution, "state", "Kerala"),
            "phone": getattr(institution, "phone", ""),
            "email": getattr(institution, "email", ""),
            "is_standalone": False,
            "external_source": "lms",
        },
    )
    return exam_institution


def import_students_from_lms(exam_institution, student_queryset=None):
    student_model = _get_model("students.Student")
    if student_model is None:
        raise ImproperlyConfigured(
            "The `students.Student` model is not available for LMS import."
        )

    if student_queryset is None:
        if not exam_institution.external_institution_id:
            raise ImproperlyConfigured(
                "Exam institution is not linked to an LMS institution."
            )
        student_queryset = student_model.objects.filter(
            institution_id=exam_institution.external_institution_id
        )

    imported_count = 0
    for student in student_queryset.select_related("user", "division__class_obj"):
        division = getattr(student, "division", None)
        class_obj = getattr(division, "class_obj", None)
        ExamStudent.objects.update_or_create(
            exam_institution=exam_institution,
            registration_number=student.admission_number,
            defaults={
                "external_student_id": student.pk,
                "roll_number": student.roll_number or "",
                "full_name": student.user.get_full_name() or student.user.phone_number,
                "gender": student.gender,
                "class_name": class_obj.name if class_obj else "Unknown",
                "division_name": division.name if division else "",
                "class_group": class_obj.name if class_obj else "",
                "phone": getattr(student.user, "phone_number", ""),
                "parent_phone": "",
                "is_specially_abled": False,
                "special_requirements": "",
            },
        )
        imported_count += 1

    return imported_count


def calculate_seat_distance(seat_a, seat_b):
    """Calculate weighted Manhattan distance between two seats."""

    row_diff = abs(
        seat_a.layout_bench.layout_row.row_number
        - seat_b.layout_bench.layout_row.row_number
    )
    bench_diff = abs(seat_a.layout_bench.bench_number - seat_b.layout_bench.bench_number)
    seat_diff = abs(seat_a.seat_number - seat_b.seat_number)
    return row_diff * 10 + bench_diff * 3 + seat_diff


def validate_seating_arrangement(arrangement_id):
    """Validate a seating arrangement against strict proximity rules."""

    violations = []
    arrangement = ExamSeatingArrangement.objects.get(id=arrangement_id)
    assignments = StudentSeatAssignment.objects.filter(
        seating_arrangement=arrangement
    ).select_related("exam_student", "layout_seat__layout_bench__layout_row")

    proximity_rules = ClassProximityRule.objects.filter(
        exam_institution=arrangement.exam_subject_schedule.exam_day.exam_session.exam_institution,
        is_strict=True,
    )

    for rule in proximity_rules:
        if rule.exam_sessions.exists():
            session = arrangement.exam_subject_schedule.exam_day.exam_session
            if session not in rule.exam_sessions.all():
                continue

        group_a_students = assignments.filter(exam_student__class_group=rule.class_group_a)
        group_b_students = assignments.filter(exam_student__class_group=rule.class_group_b)

        for student_a in group_a_students:
            for student_b in group_b_students:
                row_distance = abs(
                    student_a.layout_seat.layout_bench.layout_row.row_number
                    - student_b.layout_seat.layout_bench.layout_row.row_number
                )
                distance = calculate_seat_distance(
                    student_a.layout_seat, student_b.layout_seat
                )
                if (
                    distance < rule.minimum_distance_seats
                    or row_distance < rule.minimum_distance_rows
                ):
                    violations.append(
                        {
                            "rule": rule.rule_name,
                            "student_a": student_a.exam_student.full_name,
                            "student_b": student_b.exam_student.full_name,
                            "distance": distance,
                            "required_distance": rule.minimum_distance_seats,
                            "row_distance": row_distance,
                            "required_row_distance": rule.minimum_distance_rows,
                        }
                    )

    return violations
