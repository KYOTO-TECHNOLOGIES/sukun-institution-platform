from django.utils import timezone
from rest_framework.test import APITestCase
from core.test_helpers import institution, admin, academic_setup
from students.models import Student
from .models import Expense, TransportRoute, TransportAllocation, QueueTicket


class OperationsWorkflowTests(APITestCase):
    def setUp(self):
        self.inst=institution(); self.user=admin(self.inst); self.client.force_authenticate(self.user)

    def test_accountant_cannot_approve_own_expense_but_can_record_approved_payment(self):
        accountant=admin(self.inst,'+919876543211','ACCOUNTANT')
        expense=Expense.objects.create(institution=self.inst,title='Electricity',category='UTILITIES',amount=100,date=timezone.localdate())
        url=f'/api/operations/expenses/{expense.pk}/transition/'
        self.client.force_authenticate(accountant)
        self.assertEqual(self.client.post(url,{'status':'APPROVED'}).status_code,403)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post(url,{'status':'APPROVED'}).status_code,200)
        self.assertEqual(self.client.patch(f'/api/operations/expenses/{expense.pk}/',{'amount':200}).status_code,400)
        self.client.force_authenticate(accountant)
        self.assertEqual(self.client.post(url,{'status':'PAID'}).status_code,200)

    def test_transport_capacity_is_enforced(self):
        route=TransportRoute.objects.create(institution=self.inst,name='Route',vehicle_number='TEST',driver_name='Driver',driver_phone='123',capacity=1,stops='Gate')
        year,cls,division=academic_setup(self.inst)
        for i in range(2):
            user=admin(self.inst,'+91987654321'+str(i+1),'STUDENT')
            student=Student.objects.create(user=user,institution=self.inst,admission_number='SK-'+str(i),roll_number=str(i+1),admission_date=timezone.localdate(),division=division,academic_year=year,gender='MALE')
            response=self.client.post('/api/operations/transport-allocations/',{'route':str(route.pk),'student':str(student.pk),'pickup_stop':'Gate','monthly_fee':100},format='json')
            self.assertEqual(response.status_code,201 if i==0 else 400,response.data)

    def test_front_desk_cannot_access_payroll(self):
        user=admin(self.inst,'+919876543211','FRONT_DESK'); self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/api/operations/queue/').status_code,200)
        self.assertEqual(self.client.get('/api/operations/payroll/').status_code,403)

    def test_queue_transitions(self):
        ticket=QueueTicket.objects.create(institution=self.inst,visitor_name='Visitor',service='ADMISSIONS')
        url=f'/api/operations/queue/{ticket.pk}/transition/'
        self.assertEqual(self.client.post(url,{'status':'COMPLETED'}).status_code,400)
        for state in ['CALLED','SERVING','COMPLETED']:
            self.assertEqual(self.client.post(url,{'status':state}).status_code,200)

    def test_permission_override_is_enforced_by_api(self):
        user=admin(self.inst,'+919876543211','MARKETING'); user.permission_overrides={'admissions_write':False}; user.save()
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/api/admissions/leads/').status_code,200)
        self.assertEqual(self.client.post('/api/admissions/leads/',{}).status_code,403)

    def test_dashboard_totals_and_export_permissions(self):
        self.assertEqual(self.client.get('/api/reports/overview/').status_code,200)
        user=admin(self.inst,'+919876543211','MARKETING'); self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/api/reports/export/fees/').status_code,403)
        self.assertEqual(self.client.get('/api/reports/export/enquiries/').status_code,200)
