from django.utils import timezone
from rest_framework.test import APITestCase
from core.test_helpers import institution, admin, academic_setup
from students.models import Student
from .models import FeeStructure, StudentFee, FeePayment


class FinanceWorkflowTests(APITestCase):
    def setUp(self):
        self.inst=institution(); self.user=admin(self.inst); self.client.force_authenticate(self.user)
        year, cls, division=academic_setup(self.inst)
        learner=admin(self.inst,'+919876543211','STUDENT')
        student=Student.objects.create(user=learner,institution=self.inst,admission_number='SK-1',roll_number='1',
            admission_date=timezone.localdate(),division=division,academic_year=year,gender='MALE')
        FeeStructure.objects.create(institution=self.inst,class_obj=cls,academic_year=year,fee_name='Tuition',fee_type='TUITION',amount=1000)
        self.fee=StudentFee.objects.get(student=student)

    def pay(self,amount,reference=''):
        return self.client.post('/api/finance/fee-payments/',{'student_fee':str(self.fee.pk),'amount':amount,
            'payment_date':timezone.now().isoformat(),'payment_method':'CASH','transaction_id':reference})

    def test_payments_and_refunds_reconcile(self):
        response=self.pay(400)
        self.assertEqual(response.status_code,201,response.data)
        self.fee.refresh_from_db(); self.assertEqual(self.fee.balance,600)
        payment=FeePayment.objects.get(pk=response.data['id'])
        response=self.client.post('/api/finance/refunds/',{'payment':str(payment.pk),'amount':150,'reason':'Correction'})
        self.assertEqual(response.status_code,201,response.data)
        self.fee.refresh_from_db(); self.assertEqual(self.fee.balance,750)
        self.assertEqual(self.client.post('/api/finance/refunds/',{'payment':str(payment.pk),'amount':300,'reason':'Too much'}).status_code,400)

    def test_reject_overpayment_and_negative_payment(self):
        self.assertEqual(self.pay(1001).status_code,400)
        self.assertEqual(self.pay(-1).status_code,400)
        self.assertEqual(self.pay(0).status_code,400)
        self.assertEqual(FeePayment.objects.count(),0)

    def test_receipts_are_immutable_and_duplicate_references_rejected(self):
        response=self.pay(100,'BANK-123')
        self.assertEqual(response.status_code,201)
        self.assertEqual(self.pay(100,'BANK-123').status_code,400)
        url='/api/finance/fee-payments/'+str(response.data['id'])+'/'
        self.assertEqual(self.client.patch(url,{'amount':50}).status_code,405)
        self.assertEqual(self.client.delete(url).status_code,405)

    def test_paid_amount_cannot_be_forged(self):
        response=self.client.patch('/api/finance/student-fees/'+str(self.fee.pk)+'/',{'amount_paid':900,'balance':100})
        self.assertEqual(response.status_code,200)
        self.fee.refresh_from_db(); self.assertEqual(self.fee.balance,1000)

    def test_bill_edit_rechecks_payments_after_acquiring_lock(self):
        from types import SimpleNamespace
        from rest_framework.exceptions import ValidationError
        from .serializers import StudentFeeSerializer
        from .views import StudentFeeViewSet
        # An edit was validated before another request collected a payment.
        serializer=StudentFeeSerializer(self.fee,data={'total_amount':100},partial=True)
        self.assertTrue(serializer.is_valid(),serializer.errors)
        self.assertEqual(self.pay(400).status_code,201)
        view=StudentFeeViewSet();view.request=SimpleNamespace(user=self.user)
        with self.assertRaises(ValidationError):view.perform_update(serializer)
        self.fee.refresh_from_db()
        self.assertEqual(self.fee.total_amount,1000)
        self.assertEqual(self.fee.amount_paid,400)
