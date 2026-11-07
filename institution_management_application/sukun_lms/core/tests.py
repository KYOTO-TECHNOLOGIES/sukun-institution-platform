from rest_framework.test import APITestCase, APIClient
from accounts.models import User
from .test_helpers import institution, admin, academic_setup


class TenantSecurityTests(APITestCase):
    def setUp(self):
        self.one, self.two = institution(), institution('Two')
        self.user = admin(self.one)
        self.client.force_authenticate(self.user)
        self.year, self.cls, self.division = academic_setup(self.one)
        self.other_year, self.other_cls, self.other_division = academic_setup(self.two)

    def test_list_and_detail_are_scoped(self):
        response = self.client.get('/api/academics/classes/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(self.client.get(f'/api/academics/classes/{self.other_cls.pk}/').status_code, 404)

    def test_cross_institution_create_and_reassignment_rejected(self):
        response = self.client.post('/api/academics/divisions/', {'class_obj': str(self.other_cls.pk), 'name': 'B', 'capacity': 20})
        self.assertEqual(response.status_code, 400)
        response = self.client.patch(f'/api/academics/classes/{self.cls.pk}/', {'institution': str(self.two.pk)})
        self.assertEqual(response.status_code, 400)

    def test_student_cannot_read_staff_directory_or_write_academics(self):
        self.user.user_type = 'STUDENT'; self.user.save()
        self.assertEqual(self.client.get('/api/accounts/users/').status_code, 403)
        self.assertEqual(self.client.post('/api/academics/classes/', {}).status_code, 403)

    def test_unassigned_user_has_no_institution_access(self):
        self.user.institution = None; self.user.save()
        self.assertEqual(self.client.get('/api/academics/classes/').status_code, 403)

    def test_role_cannot_be_escalated(self):
        response = self.client.patch(f'/api/accounts/users/{self.user.pk}/', {'user_type': 'SUPER_ADMIN'})
        self.assertEqual(response.status_code, 400)

    def test_invalid_filter_returns_validation_error(self):
        self.assertEqual(self.client.get('/api/academics/classes/?id=invalid').status_code, 400)


from django.test import override_settings

@override_settings(ALLOW_INSTITUTION_REGISTRATION=True)
class RegistrationSecurityTests(APITestCase):
    def payload(self):
        return dict(name='New', registration_number='NEW', phone='+919876543210',
                    email='new@example.test', address='Campus', city='City', district='District',
                    state='Kerala', pincode='673001', established_year=2026, institution_type='OTHER',
                    admin_phone='+919876543210', admin_password='StrongPass123!')

    def test_registration_does_not_replace_existing_password(self):
        existing = User.objects.create_user(phone_number='+919876543210', password='OriginalPassword123!')
        response = self.client.post('/api/auth/register-institution/', self.payload(), format='json')
        self.assertEqual(response.status_code, 400)
        existing.refresh_from_db()
        self.assertTrue(existing.check_password('OriginalPassword123!'))
        self.assertIsNone(existing.institution_id)

    def test_registration_rejects_weak_password(self):
        data = self.payload(); data['admin_password'] = '123'
        self.assertEqual(self.client.post('/api/auth/register-institution/', data, format='json').status_code, 400)

    def test_registration_creates_institution_and_admin(self):
        response = self.client.post('/api/auth/register-institution/', self.payload(), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(User.objects.get(phone_number='+919876543210').user_type, 'INSTITUTION_ADMIN')

    def test_login_csrf_is_enforced_for_browsers(self):
        client = APIClient(enforce_csrf_checks=True)
        self.assertEqual(client.post('/api/auth/login/', {}).status_code, 403)
        response = client.get('/api/auth/csrf/')
        response = client.post('/api/auth/login/', {}, HTTP_X_CSRFTOKEN=response.data['csrfToken'])
        self.assertEqual(response.status_code, 400)


class OperationalIntegrityTests(APITestCase):
    def setUp(self):
        from students.models import Student
        self.inst = institution()
        self.user = admin(self.inst)
        self.year, self.cls, self.division = academic_setup(self.inst)
        student_user = admin(self.inst, '+919876543211', 'STUDENT')
        self.student = Student.objects.create(user=student_user, institution=self.inst, division=self.division,
            academic_year=self.year, admission_number='TEST-1', roll_number='1', admission_date='2026-06-01', gender='MALE')
        self.client.force_authenticate(self.user)

    def test_bulk_attendance_is_atomic_and_overwrites_once(self):
        from attendance.models import StudentAttendance
        import uuid
        url = '/api/attendance/student-attendance/bulk/'
        body = {'division':str(self.division.pk), 'date':'2026-07-01',
                'records':[{'student':str(self.student.pk),'status':'PRESENT'}, {'student':str(uuid.uuid4()),'status':'ABSENT'}]}
        self.assertEqual(self.client.post(url,body,format='json').status_code,400)
        self.assertEqual(StudentAttendance.objects.count(),0)
        body['records'] = body['records'][:1]
        self.assertEqual(self.client.post(url,body,format='json').status_code,200)
        body['records'][0]['status']='ABSENT'
        self.assertEqual(self.client.post(url,body,format='json').status_code,200)
        record=StudentAttendance.objects.get()
        self.assertEqual(record.status,'ABSENT')
        self.assertEqual(record.marked_by,self.user)

    def test_student_delete_and_class_overcapacity_are_rejected(self):
        self.assertEqual(self.client.delete(f'/api/students/students/{self.student.pk}/').status_code,400)
        self.division.capacity=0; self.division.save()
        response=self.client.patch(f'/api/students/students/{self.student.pk}/',{'roll_number':'2'})
        self.assertEqual(response.status_code,400)

    def test_password_change_revokes_existing_access_and_refresh(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        token=RefreshToken.for_user(self.user); access=str(token.access_token)
        response=self.client.post('/api/auth/change-password/',{'current_password':'StrongPass123!','new_password':'UpdatedSecurePass998!'},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/auth/me/',HTTP_AUTHORIZATION='Bearer '+access).status_code,401)
        response=self.client.post('/api/auth/refresh/',{'refresh':str(token)},format='json')
        self.assertEqual(response.status_code,403)
        self.assertIn('Invalid or expired',str(response.data))

    def test_learner_role_never_inherits_staff_override(self):
        from core.permissions import can_access
        student=self.student.user
        student.permission_overrides={'finance_read':True}
        self.assertFalse(can_access(student,'finance'))

    def test_private_media_is_not_shared_across_institutions(self):
        import tempfile
        from pathlib import Path
        from django.test import override_settings
        with tempfile.TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            Path(directory,'avatar.txt').write_text('Private attachment')
            self.user.profile_picture='avatar.txt';self.user.save()
            response=self.client.get('/media/avatar.txt')
            self.assertEqual(response.status_code,200)
            response.close()
            other=admin(institution('Other'),'+919876543212')
            self.client.force_authenticate(other)
            self.assertEqual(self.client.get('/media/avatar.txt').status_code,404)


    def test_sensitive_student_support_is_restricted_and_certificates_are_immutable(self):
        from students.models import DisciplineRecord, StudentCertificate
        record=DisciplineRecord.objects.create(student=self.student,incident_date='2026-07-01',incident_type='OTHER',description='Private observation',action_taken='Support arranged')
        accountant=admin(self.inst,'+919876543215','ACCOUNTANT')
        self.client.force_authenticate(accountant)
        self.assertEqual(self.client.get('/api/students/discipline-records/').status_code,403)
        teacher=admin(self.inst,'+919876543216','TEACHER')
        self.client.force_authenticate(teacher)
        self.assertEqual(self.client.get('/api/students/discipline-records/').status_code,200)
        self.client.force_authenticate(self.user)
        certificate=StudentCertificate.objects.create(student=self.student,certificate_type='BONAFIDE',certificate_number='CERT-1',issue_date='2026-07-01',issued_by=self.user)
        url=f'/api/students/student-certificates/{certificate.pk}/'
        self.assertEqual(self.client.get(url+'print/').status_code,200)
        self.assertEqual(self.client.patch(url,{'certificate_number':'CHANGED'}).status_code,405)
