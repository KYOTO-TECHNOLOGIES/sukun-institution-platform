from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import FeeStructure, StudentFee, FeePayment
from students.models import Student
import datetime

@receiver(post_save, sender=FeeStructure)
def generate_student_fees(sender, instance, created, **kwargs):
    if created and instance.is_mandatory:
        # Get all active students in the class
        students = Student.objects.filter(
            division__class_obj=instance.class_obj,
            is_active=True
        )
        
        standard_due_date = datetime.date.today() + datetime.timedelta(days=instance.due_days)
        
        student_fees = []
        for student in students:
            # Prevent duplicate creation
            if not StudentFee.objects.filter(student=student, fee_structure=instance).exists():
                student_fees.append(
                    StudentFee(
                        student=student,
                        fee_structure=instance,
                        academic_year=instance.academic_year,
                        total_amount=instance.amount,
                        amount_paid=0,
                        balance=instance.amount,
                        status='PENDING',
                        due_date=standard_due_date
                    )
                )
        
        if student_fees:
            StudentFee.objects.bulk_create(student_fees)

@receiver(post_save, sender=Student)
def generate_fees_for_new_student(sender, instance, created, **kwargs):
    # Triggers on student creation or division updates if division is active
    if instance.division and instance.is_active:
        class_obj = instance.division.class_obj
        
        # Fallback to current active year if student's year is None
        year = instance.academic_year
        if not year:
            from institutions.models import AcademicYear
            year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
            
        # Find mandatory fee structures for this class and academic year
        fee_structures = FeeStructure.objects.filter(
            class_obj=class_obj,
            academic_year=year,
            is_mandatory=True
        )
        
        for structure in fee_structures:
            calculated_due_date = datetime.date.today() + datetime.timedelta(days=structure.due_days)

            StudentFee.objects.get_or_create(
                student=instance,
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

@receiver(post_save, sender=FeePayment)
def update_student_fee_balance_on_save(sender, instance, **kwargs):
    # Recalculate related StudentFee on save
    instance.student_fee.recalculate_payment_status()

@receiver(post_delete, sender=FeePayment)
def update_student_fee_balance_on_delete(sender, instance, **kwargs):
    # Recalculate related StudentFee on delete
    instance.student_fee.recalculate_payment_status()
