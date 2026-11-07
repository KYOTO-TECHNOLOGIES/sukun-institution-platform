from decimal import Decimal
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone

from core.models import BaseModel


class FeeStructure(BaseModel):
    FEE_TYPES = [
        ('TUITION', 'Tuition Fee'),
        ('ADMISSION', 'Admission Fee'),
        ('EXAM', 'Examination Fee'),
        ('LIBRARY', 'Library Fee'),
        ('SPORTS', 'Sports Fee'),
        ('MADRASA', 'Madrasa Fee'),
        ('HIFZ', 'Hifz Fee'),
        ('TRANSPORT', 'Transport Fee'),
        ('DONATION', 'Donation'),
        ('OTHER', 'Other'),
    ]

    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='fee_structures')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='fee_structures')
    academic_year = models.ForeignKey('institutions.AcademicYear', on_delete=models.CASCADE, related_name='fee_structures')
    fee_name = models.CharField(max_length=200)
    fee_type = models.CharField(max_length=20, choices=FEE_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)
    due_days = models.IntegerField(default=7)

    class Meta:
        db_table = 'fee_structure'

    def __str__(self):
        return f'{self.fee_name} - {self.class_obj.name}'


class StudentFee(BaseModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('WAIVED', 'Waived'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='student_fees')
    academic_year = models.ForeignKey('institutions.AcademicYear', on_delete=models.CASCADE, related_name='student_fees')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'student_fee'
        constraints = [models.UniqueConstraint(fields=['student','fee_structure'], name='unique_student_fee_structure')]

    def __str__(self):
        return f'{self.student.admission_number} - {self.fee_structure.fee_name}'

    def recalculate_payment_status(self):
        paid = self.payments.aggregate(total=models.Sum('amount'))['total'] or 0
        refunded = FeeRefund.objects.filter(payment__student_fee=self).aggregate(total=models.Sum('amount'))['total'] or 0
        self.amount_paid = paid - refunded
        self.balance = self.total_amount - self.amount_paid
        if self.balance <= 0:
            self.status = 'PAID'
        elif self.due_date and self.due_date < timezone.localdate():
            self.status = 'OVERDUE'
        elif self.amount_paid > 0:
            self.status = 'PARTIALLY_PAID'
        else:
            self.status = 'PENDING'
        self.save(update_fields=['amount_paid', 'balance', 'status'])


class FeePayment(BaseModel):
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('ONLINE', 'Online Transfer'),
        ('UPI', 'UPI'),
    ]

    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateTimeField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='fee_collections')
    receipt_number = models.CharField(max_length=50, unique=True, blank=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'fee_payment'

    def __str__(self):
        return f'Payment {self.receipt_number} - {self.amount}'

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            import uuid
            self.receipt_number = 'RCPT-' + timezone.localdate().strftime('%Y%m%d') + '-' + uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)


class FeeRefund(BaseModel):
    payment = models.ForeignKey(FeePayment, on_delete=models.PROTECT, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    reason = models.TextField()
    refunded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    reference = models.CharField(max_length=100, blank=True)
