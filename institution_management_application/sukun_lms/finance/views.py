from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from admissions.views import SearchViewSet
from .models import FeePayment, FeeStructure, StudentFee, FeeRefund
from .serializers import FeePaymentSerializer, FeeStructureSerializer, StudentFeeSerializer, FeeRefundSerializer


class FeeStructureViewSet(SearchViewSet):
    queryset = FeeStructure.objects.select_related('class_obj','academic_year')
    serializer_class = FeeStructureSerializer
    search_fields = ('fee_name','class_obj__name')
    def perform_destroy(self,instance):
        if instance.student_fees.exists():
            raise ValidationError('This fee structure has issued bills. Deactivate it instead.')
        super().perform_destroy(instance)


class StudentFeeViewSet(SearchViewSet):
    queryset = StudentFee.objects.select_related('student__user','fee_structure')
    serializer_class = StudentFeeSerializer
    search_fields = ('student__user__first_name','student__admission_number','fee_structure__fee_name')
    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer)
        fee=serializer.save(balance=serializer.validated_data['total_amount'])
        fee.recalculate_payment_status()
    @transaction.atomic
    def perform_update(self,serializer):
        StudentFee.objects.select_for_update().get(pk=serializer.instance.pk)
        self.validate_write(serializer)
        fee=serializer.save()
        fee.recalculate_payment_status()
    def perform_destroy(self,instance):
        if instance.payments.exists():
            raise ValidationError('A bill with payments cannot be deleted.')
        super().perform_destroy(instance)


class FeePaymentViewSet(SearchViewSet):
    queryset = FeePayment.objects.select_related('student_fee__student__user','student_fee__fee_structure')
    serializer_class = FeePaymentSerializer
    search_fields = ('receipt_number','student_fee__student__user__first_name','transaction_id')
    http_method_names = ['get','post','head','options']
    @action(detail=True,methods=['get'])
    def receipt(self,request,pk=None):
        from django.http import HttpResponse
        from django.utils.html import escape
        payment=self.get_object()
        student=payment.student_fee.student
        institution=student.institution
        rows=[('Receipt',payment.receipt_number),('Date',payment.payment_date.strftime('%d %b %Y %H:%M')),
              ('Student',student.user.full_name),('Admission number',student.admission_number),
              ('Fee',payment.student_fee.fee_structure.fee_name),('Amount received',payment.amount),
              ('Payment method',payment.payment_method),('Reference',payment.transaction_id or '-'),
              ('Received by',payment.received_by.full_name if payment.received_by else '-')]
        body=''.join('<tr><th>'+escape(str(k))+'</th><td>'+escape(str(v))+'</td></tr>' for k,v in rows)
        html='<!doctype html><html><head><meta charset="utf-8"><title>Fee receipt</title><style>body{font:16px system-ui;max-width:700px;margin:60px auto;color:#18382f}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:14px;border-bottom:1px solid #ddd}h1{margin-bottom:5px}@media print{button{display:none}}</style></head><body><h1>'+escape(institution.name)+'</h1><p>Fee payment receipt</p><table>'+body+'</table><p>This receipt records a payment received. Any later refund is recorded separately.</p><button onclick="window.print()">Print receipt</button></body></html>'
        response=HttpResponse(html)
        response['Cache-Control']='private, no-store'
        return response

    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer)
        fee=StudentFee.objects.select_for_update().get(pk=serializer.validated_data['student_fee'].pk)
        fee.recalculate_payment_status()
        if serializer.validated_data['amount'] > fee.balance:
            raise ValidationError({'amount':'Payment exceeds the outstanding balance.'})
        reference=serializer.validated_data.get('transaction_id')
        if reference and FeePayment.objects.filter(student_fee=fee,transaction_id=reference).exists():
            raise ValidationError({'transaction_id':'This payment reference has already been recorded.'})
        serializer.save(received_by=self.request.user,student_fee=fee)


class FeeRefundViewSet(SearchViewSet):
    queryset = FeeRefund.objects.select_related('payment')
    serializer_class = FeeRefundSerializer
    search_fields = ('payment__receipt_number','reason','reference')
    http_method_names = ['get','post','head','options']
    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer)
        payment=serializer.validated_data['payment']
        StudentFee.objects.select_for_update().get(pk=payment.student_fee_id)
        paid_refunds=payment.refunds.aggregate(total=Sum('amount'))['total'] or 0
        if serializer.validated_data['amount'] > payment.amount-paid_refunds:
            raise ValidationError({'amount':'Refund exceeds the unrefunded payment amount.'})
        serializer.save(refunded_by=self.request.user)
