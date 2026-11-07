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
