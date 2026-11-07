from rest_framework.test import APITestCase
from core.test_helpers import institution, admin, academic_setup
from accounts.models import User
from finance.models import FeeStructure, StudentFee
from .models import Application, Lead


class AdmissionWorkflowTests(APITestCase):
    def setUp(self):
        self.inst = institution()
        self.user = admin(self.inst)
        self.year, self.cls, self.division = academic_setup(self.inst)
        self.client.force_authenticate(self.user)
        self.application = Application.objects.create(institution=self.inst, first_name='Learner',
            phone='+919876543211', gender='MALE', division=self.division, academic_year=self.year,
            documents_verified=True)
        self.url = f'/api/admissions/applications/{self.application.pk}/'

    def test_approve_enroll_and_fee_assignment_are_atomic_and_idempotent(self):
        FeeStructure.objects.create(institution=self.inst, class_obj=self.cls, academic_year=self.year,
            fee_name='Tuition', fee_type='TUITION', amount=1000)
        self.assertEqual(self.client.post(self.url+'review/', {'status': 'APPROVED'}).status_code, 200)
        response = self.client.post(self.url+'enroll/', {'initial_password': 'StudentStrong123!'})
        self.assertEqual(response.status_code, 201, response.data)
        self.application.refresh_from_db()
        self.assertEqual(self.application.student.user.user_type, 'STUDENT')
        self.assertEqual(StudentFee.objects.get(student=self.application.student).balance, 1000)
        self.assertEqual(self.client.post(self.url+'enroll/', {}).status_code, 200)
        self.assertEqual(User.objects.filter(phone_number='+919876543211').count(), 1)

    def test_unapproved_enrollment_is_rejected(self):
        self.assertEqual(self.client.post(self.url+'enroll/', {'initial_password': 'StudentStrong123!'}).status_code, 400)

    def test_documents_required_for_approval(self):
        self.application.documents_verified = False; self.application.save()
        self.assertEqual(self.client.post(self.url+'review/', {'status': 'APPROVED'}).status_code, 400)

    def test_marketer_cannot_approve_or_enroll(self):
        self.user.user_type = 'MARKETING'; self.user.save()
        self.assertEqual(self.client.post(self.url+'review/', {'status': 'APPROVED'}).status_code, 403)
        self.assertEqual(self.client.post(self.url+'enroll/', {}).status_code, 403)

    def test_full_division_rejects_enrollment(self):
        self.application.status = 'APPROVED'; self.application.save()
        self.division.capacity = 0; self.division.save()
        self.assertEqual(self.client.post(self.url+'enroll/', {'initial_password': 'StudentStrong123!'}).status_code, 400)

    def test_leads_are_tenant_scoped(self):
        other = institution('Other')
        Lead.objects.create(institution=other, full_name='Other lead', phone='123')
        self.assertEqual(self.client.get('/api/admissions/leads/').data['count'], 0)
