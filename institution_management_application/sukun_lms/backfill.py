import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sukun_lms.settings')
django.setup()

from finance.models import FeeStructure, StudentFee
from students.models import Student

def backfill():
    fee_structures = FeeStructure.objects.filter(is_mandatory=True)
    count = 0
    for structure in fee_structures:
        students = Student.objects.filter(
            division__class_obj=structure.class_obj,
            is_active=True
        )
        for student in students:
            import datetime
            calculated_due_date = datetime.date.today() + datetime.timedelta(days=structure.due_days)
            obj, created = StudentFee.objects.get_or_create(
                student=student,
                fee_structure=structure,
                defaults={
                    'academic_year': structure.academic_year,
                    'total_amount': structure.amount,
                    'amount_paid': 0,
                    'balance': structure.amount,
                    'status': 'PENDING',
                    'due_date': calculated_due_date
                }
            )
            if created:
                count += 1
    print(f"Backfilled {count} StudentFee records.")

if __name__ == '__main__':
    backfill()
