from django.test import TestCase

from .models import ExamInstitution
from .services import calculate_seat_distance


class ExamSeatingSmokeTests(TestCase):
    def test_exam_institution_generates_code(self):
        institution = ExamInstitution.objects.create(name="Seat Center", is_standalone=True)
        self.assertTrue(institution.code.startswith("EXM"))

    def test_distance_formula_prefers_row_gap(self):
        class SeatStub:
            def __init__(self, row_number, bench_number, seat_number):
                self.seat_number = seat_number
                self.layout_bench = type(
                    "Bench",
                    (),
                    {
                        "bench_number": bench_number,
                        "layout_row": type("Row", (), {"row_number": row_number})(),
                    },
                )()

        seat_a = SeatStub(1, 1, 1)
        seat_b = SeatStub(2, 1, 1)
        seat_c = SeatStub(1, 2, 1)

        self.assertGreater(
            calculate_seat_distance(seat_a, seat_b),
            calculate_seat_distance(seat_a, seat_c),
        )
