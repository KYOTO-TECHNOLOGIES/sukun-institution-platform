import os
import django
from datetime import date, time, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sukun_lms.settings")
django.setup()

from accounts.models import User
from institutions.models import Institution, AcademicYear
from academics.models import Syllabus, Class, Division
from students.models import Student
from exam_seating.models import (
    ExamInstitution,
    ExamStudent,
    ExamSession,
    ExamDay,
    ExamSubjectSchedule,
    ExamRoom,
    BenchTemplate,
    RoomLayout,
    LayoutRow,
    LayoutBench,
    LayoutSeat,
    SeatingRule,
    ClassProximityRule
)
from exam_seating.services import sync_exam_institution_from_lms, import_students_from_lms

print("--- Seeding database with initial data ---")

# 1. Create Main Institution
institution, created = Institution.objects.get_or_create(
    registration_number="SUKUN1001",
    defaults={
        "name": "Sukun Islamic Academy",
        "name_arabic": "أكاديمية السكون الإسلامية",
        "address": "Green Valley Campus, Calicut",
        "city": "Calicut",
        "district": "Kozhikode",
        "state": "Kerala",
        "pincode": "673001",
        "phone": "9876543210",
        "email": "admin@sukun.edu",
        "established_year": 2015,
        "institution_type": "MADRASA"
    }
)
print(f"[SUCCESS] Institution: {institution.name}")

# 2. Create Admin User
admin_phone = "9876543210"
admin_user = User.objects.filter(phone_number=admin_phone).first() or User.objects.filter(email="admin@sukun.edu").first()
if not admin_user:
    admin_user = User.objects.create_user(
        phone_number=admin_phone,
        password="Password@123",
        first_name="Admin",
        last_name="User",
        email="admin@sukun.edu",
        user_type="INSTITUTION_ADMIN",
        institution=institution,
        is_staff=True,
        is_superuser=True
    )
    print("[SUCCESS] Admin User created (Phone: 9876543210, Password: Password@123)")
else:
    admin_user.institution = institution
    admin_user.phone_number = admin_phone
    admin_user.user_type = "INSTITUTION_ADMIN"
    admin_user.set_password("Password@123")
    admin_user.save()
    print("[SUCCESS] Admin User updated (Phone: 9876543210, Password: Password@123)")

# 3. Create Academic Year
ay, _ = AcademicYear.objects.get_or_create(
    institution=institution,
    name="2025-2026",
    defaults={
        "start_date": date(2025, 6, 1),
        "end_date": date(2026, 5, 31),
        "is_current": True
    }
)

# 4. Sync Exam Institution
exam_institution = sync_exam_institution_from_lms(institution)
print(f"[SUCCESS] Exam Institution synced: {exam_institution.name}")

# 5. Create Syllabus, Classes & Divisions
syllabus, _ = Syllabus.objects.get_or_create(
    institution=institution,
    name="Standard Islamic Syllabus",
    defaults={"total_years": 10, "is_arabic_focused": True}
)

classes = []
for order, c_name in enumerate(["Class 1", "Class 2", "Class 3"], start=1):
    cls_obj, _ = Class.objects.get_or_create(
        institution=institution,
        name=c_name,
        defaults={"syllabus": syllabus, "class_order": order}
    )
    div_obj, _ = Division.objects.get_or_create(
        class_obj=cls_obj,
        name="A",
        defaults={"capacity": 30}
    )
    classes.append((cls_obj, div_obj))

print("[SUCCESS] Classes & Divisions created (Class 1, Class 2, Class 3)")

# 6. Create Sample Students
student_names = [
    ("Abdullah", "Rahman", "MALE"),
    ("Aisha", "Siddiqua", "FEMALE"),
    ("Fatima", "Zahra", "FEMALE"),
    ("Umar", "Farooq", "MALE"),
    ("Ali", "Ibn Abi Talib", "MALE"),
    ("Zaid", "Harith", "MALE"),
    ("Khadija", "Kubra", "FEMALE"),
    ("Mariam", "Imran", "FEMALE"),
    ("Hamza", "Abdul Muttalib", "MALE"),
    ("Bilal", "Rabah", "MALE"),
    ("Youssef", "Yaqub", "MALE"),
    ("Hassan", "Ali", "MALE"),
    ("Hussain", "Ali", "MALE"),
    ("Zainab", "Ali", "FEMALE"),
    ("Ruqayya", "Muhammad", "FEMALE"),
]

for idx, (first_name, last_name, gender) in enumerate(student_names, start=1):
    st_phone = f"9876543{idx:03d}"
    st_email = f"{first_name.lower()}{idx}@student.sukun.edu"
    st_user = User.objects.filter(phone_number=st_phone).first() or User.objects.filter(email=st_email).first()
    if not st_user:
        st_user = User.objects.create_user(
            phone_number=st_phone,
            password="Password@123",
            first_name=first_name,
            last_name=last_name,
            email=st_email,
            user_type="STUDENT",
            institution=institution
        )
    
    cls_idx = (idx - 1) % len(classes)
    cls_obj, div_obj = classes[cls_idx]
    
    student, _ = Student.objects.get_or_create(
        admission_number=f"ADM{idx:03d}",
        defaults={
            "user": st_user,
            "institution": institution,
            "roll_number": f"{idx}",
            "admission_date": date(2025, 6, 1),
            "division": div_obj,
            "academic_year": ay,
            "gender": gender
        }
    )

print("[SUCCESS] Sample Students created")

# 7. Import Students into Exam Seating
imported_count = import_students_from_lms(exam_institution)
print(f"[SUCCESS] Imported {imported_count} students into Exam Seating module.")

# Mark 1 student as specially abled for testing
sp_student = ExamStudent.objects.first()
if sp_student:
    sp_student.is_specially_abled = True
    sp_student.special_requirements = "Front row placement requested"
    sp_student.save()

# 8. Create Bench Templates
bench_template, _ = BenchTemplate.objects.get_or_create(
    exam_institution=exam_institution,
    name="Standard Dual Desk",
    defaults={
        "seats_per_bench": 2,
        "bench_width_cm": 120,
        "bench_depth_cm": 60,
        "is_desk_type": True
    }
)

# 9. Create Exam Rooms & Layouts
room_a, _ = ExamRoom.objects.get_or_create(
    exam_institution=exam_institution,
    room_code="HALL-A",
    defaults={
        "room_name": "Main Auditorium Hall A",
        "floor": 1,
        "building_name": "Main Academic Block",
        "total_capacity": 30,
        "has_cctv": True,
        "is_accessible": True
    }
)

room_b, _ = ExamRoom.objects.get_or_create(
    exam_institution=exam_institution,
    room_code="HALL-B",
    defaults={
        "room_name": "Examination Hall B",
        "floor": 2,
        "building_name": "Science Block",
        "total_capacity": 20,
        "has_cctv": True,
        "is_accessible": False
    }
)

# Populate Room A Grid Layout
layout_a, _ = RoomLayout.objects.get_or_create(
    exam_room=room_a,
    layout_name="Default Seating Layout",
    defaults={"is_active": True}
)

if not layout_a.rows.exists():
    for r_idx, r_label in enumerate(["A", "B", "C"], start=1):
        row = LayoutRow.objects.create(
            room_layout=layout_a,
            row_number=r_idx,
            row_label=r_label,
            position_y=r_idx * 1.5
        )
        for b_idx in range(1, 4):
            bench = LayoutBench.objects.create(
                layout_row=row,
                bench_template=bench_template,
                bench_number=b_idx,
                bench_type="BENCH",
                seats_per_bench=2
            )
            for s_idx in range(1, 3):
                LayoutSeat.objects.create(
                    layout_bench=bench,
                    seat_number=s_idx,
                    seat_label=f"{r_label}{b_idx}-{s_idx}"
                )

print("[SUCCESS] Exam Halls & Layout Grid created with active seats.")

# 10. Create Exam Session, Days & Schedules
session, _ = ExamSession.objects.get_or_create(
    exam_institution=exam_institution,
    name="Annual Board Examinations 2026",
    defaults={
        "academic_year": "2025-2026",
        "start_date": date(2026, 8, 1),
        "end_date": date(2026, 8, 10),
        "description": "Annual final evaluation exams."
    }
)

day1, _ = ExamDay.objects.get_or_create(
    exam_session=session,
    day_number=1,
    defaults={
        "date": date(2026, 8, 1),
        "has_morning_session": True,
        "has_afternoon_session": True
    }
)

schedule_math, _ = ExamSubjectSchedule.objects.get_or_create(
    exam_day=day1,
    subject_name="Mathematics & Quran Studies",
    defaults={
        "subject_code": "MATH101",
        "session": "MORNING",
        "start_time": time(9, 30),
        "end_time": time(12, 30),
        "duration_minutes": 180,
        "participating_class_groups": ["Class 1", "Class 2", "Class 3"],
        "max_students_per_room": 30,
        "requires_seat_change_from_previous": True
    }
)

# 11. Create Seating Rules
SeatingRule.objects.get_or_create(
    exam_institution=exam_institution,
    rule_name="Separate Same Subject Classes",
    defaults={
        "rule_type": "SAME_SUBJECT_SEPARATION",
        "description": "Alternates students from Class 1 and Class 2 on adjacent seats.",
        "priority": 1
    }
)

SeatingRule.objects.get_or_create(
    exam_institution=exam_institution,
    rule_name="Special Needs Front Row Placement",
    defaults={
        "rule_type": "SPECIAL_NEEDS_FRONT",
        "description": "Places specially abled students in Row A (front seats).",
        "priority": 2
    }
)

ClassProximityRule.objects.get_or_create(
    exam_institution=exam_institution,
    rule_name="Class 1 and Class 2 Min Distance",
    defaults={
        "class_group_a": "Class 1",
        "class_group_b": "Class 2",
        "minimum_distance_seats": 2,
        "minimum_distance_rows": 1,
        "reason": "Prevent cheating between Class 1 and Class 2",
        "is_strict": True
    }
)

print("[COMPLETE] Seeding finished successfully!")
