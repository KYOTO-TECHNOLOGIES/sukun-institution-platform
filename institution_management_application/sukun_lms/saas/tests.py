import uuid
from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError as ModelValidationError
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from core.test_helpers import institution, admin
from accounts.models import User
from .models import Plan, OrganizationAccount, Invoice, PlatformEvent, BillingEvent
from .access import access_state


class ControlPlaneTests(APITestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.inst = institution()
        self.admin = admin(self.inst)
        self.operator = User.objects.create_superuser('+919876543211', 'OperatorSecure123!', first_name='Operator')
        self.plan = Plan.objects.create(name='Standard', monthly_price='2500', student_limit=100, user_limit=200)
        self.account = OrganizationAccount.objects.create(institution=self.inst, billing_email=self.inst.email,
            plan=self.plan, status='ACTIVE', paid_until=self.today+timedelta(days=30))
        self.client.force_authenticate(self.operator)

    def bearer(self, user):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Bearer '+str(RefreshToken.for_user(user).access_token))
        return client

    def invoice(self, **kwargs):
        due = kwargs.pop('due_on', self.today+timedelta(days=7))
        return Invoice.objects.create(account=self.account, description='Subscription', amount=Decimal('2500.00'),
            issued_on=min(self.today, due)-timedelta(days=30), due_on=due,
            service_from=self.today, service_until=self.today+timedelta(days=60), **kwargs)

    def decision(self, invoice, outcome='PAID', event_id=None, reference='BANK-123'):
        return self.client.post(f'/api/saas/platform/invoices/{invoice.pk}/settle/',
            {'event_id': str(event_id or uuid.uuid4()), 'outcome': outcome, 'reference': reference, 'reason': 'Verified against bank statement'}, format='json')

    def test_tenant_and_forged_role_cannot_access_platform(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get('/api/saas/platform/organizations/').status_code, 403)
        self.admin.user_type = 'SUPER_ADMIN'; self.admin.save()
        self.assertEqual(self.client.get('/api/saas/platform/overview/').status_code, 403)

    def test_operator_is_not_an_institution_data_session(self):
        self.assertEqual(self.bearer(self.operator).get('/api/academics/classes/').status_code, 403)
        profile = self.bearer(self.operator).get('/api/auth/me/').data
        self.assertTrue(profile['is_platform_admin'])
        self.assertNotIn('students_read', profile['page_permission'])

    def test_provision_creates_isolated_admin_with_password_rotation(self):
        payload = dict(name='New School', registration_number='NEW', phone='+919876543212', email='new@test.example',
            address='Campus', city='City', district='District', state='State', pincode='673001', established_year=2026,
            institution_type='OTHER', admin_phone='+919876543212', admin_first_name='New', admin_password='TemporarySecure123!',
            plan=self.plan.pk, trial_days=14)
        response = self.client.post('/api/saas/platform/organizations/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(phone_number=payload['admin_phone'])
        self.assertTrue(user.must_change_password)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.user_type, 'INSTITUTION_ADMIN')
        self.assertNotIn('admin_password', str(response.data))
        auth = self.bearer(user)
        self.assertEqual(auth.get('/api/academics/classes/').status_code, 403)
        self.assertEqual(auth.get('/api/auth/me/').status_code, 200)
        self.assertEqual(auth.post('/api/auth/change-password/', {'current_password': payload['admin_password'], 'new_password': 'PermanentSafePass123!'}).status_code, 200)
        user.refresh_from_db(); self.assertFalse(user.must_change_password)
        self.assertEqual(auth.get('/api/auth/me/').status_code, 401)

    def test_provision_failure_is_atomic(self):
        count = OrganizationAccount.objects.count()
        response = self.client.post('/api/saas/platform/organizations/', {'name':'Invalid'}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(OrganizationAccount.objects.count(), count)

    def test_suspension_blocks_existing_token_but_allows_billing_recovery(self):
        auth = self.bearer(self.admin)
        self.assertEqual(auth.get('/api/academics/classes/').status_code, 200)
        response = self.client.post(f'/api/saas/platform/organizations/{self.account.pk}/change-status/', {'status':'SUSPENDED', 'reason':'Payment review required'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(auth.get('/api/academics/classes/').status_code, 403)
        self.assertEqual(auth.get('/api/saas/subscription/').status_code, 200)
        self.assertFalse(auth.get('/api/auth/me/').data['organization_access']['allowed'])
        self.assertEqual(self.client.delete(f'/api/saas/platform/organizations/{self.account.pk}/').status_code, 405)

    def test_overdue_and_trial_expiry_apply_without_a_scheduler(self):
        self.invoice(due_on=self.today-timedelta(days=8))
        self.assertEqual(access_state(self.account)['status'], 'PAST_DUE')
        self.account.enforce_overdue = False; self.account.status = 'TRIAL'
        self.account.trial_ends_on = self.today-timedelta(days=1); self.account.save()
        self.assertEqual(self.bearer(self.admin).get('/api/academics/classes/').status_code, 403)

    def test_grace_is_inclusive_and_next_day_blocks(self):
        invoice = self.invoice(due_on=self.today-timedelta(days=7))
        self.assertTrue(access_state(self.account)['allowed'])
        invoice.due_on -= timedelta(days=1); invoice.save()
        self.assertFalse(access_state(self.account)['allowed'])

    def test_payment_is_idempotent_and_extends_service(self):
        invoice = self.invoice(); event_id = uuid.uuid4()
        self.assertEqual(self.decision(invoice, event_id=event_id).status_code, 200)
        self.assertEqual(self.decision(invoice, event_id=event_id).status_code, 200)
        self.assertEqual(BillingEvent.objects.count(), 1)
        self.account.refresh_from_db()
        self.assertEqual(self.account.paid_until, invoice.service_until)
        self.assertEqual(self.decision(invoice, event_id=event_id, reference='CHANGED').status_code, 400)
        self.assertEqual(self.decision(invoice).status_code, 400)

    def test_duplicate_reference_cannot_pay_two_invoices(self):
        self.assertEqual(self.decision(self.invoice()).status_code, 200)
        invoice = self.invoice()
        self.assertEqual(self.decision(invoice).status_code, 400)
        invoice.refresh_from_db(); self.assertEqual(invoice.status, 'ISSUED')
        self.assertEqual(BillingEvent.objects.count(), 1)

    def test_payment_does_not_reverse_manual_suspension(self):
        self.account.status = 'SUSPENDED'; self.account.save()
        self.assertEqual(self.decision(self.invoice()).status_code, 200)
        self.account.refresh_from_db(); self.assertEqual(self.account.status, 'SUSPENDED')

    def test_payment_failure_respects_operator_policy(self):
        self.account.suspend_on_failure = True; self.account.save()
        self.assertEqual(self.decision(self.invoice(), 'FAILED').status_code, 200)
        self.account.refresh_from_db(); self.assertEqual(self.account.status, 'SUSPENDED')

    def test_void_is_retained_and_cannot_be_paid(self):
        invoice = self.invoice()
        self.assertEqual(self.decision(invoice, 'VOID').status_code, 200)
        self.assertEqual(self.decision(invoice).status_code, 400)
        self.assertTrue(Invoice.objects.filter(pk=invoice.pk).exists())

    def test_invoice_snapshot_and_dates(self):
        payload = dict(account=str(self.account.pk), description='Annual software', amount='20000', tax_amount='3600', currency='INR',
            due_on=str(self.today), service_from=str(self.today), service_until=str(self.today+timedelta(days=365)))
        response = self.client.post('/api/saas/platform/invoices/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        invoice = Invoice.objects.get(pk=response.data['id'])
        self.inst.name = 'Renamed'; self.inst.save()
        self.assertEqual(invoice.bill_to['name'], 'One')
        self.assertEqual(response.data['total'], '23600.00')
        payload['service_until'] = str(self.today-timedelta(days=1))
        self.assertEqual(self.client.post('/api/saas/platform/invoices/', payload, format='json').status_code, 400)

    def test_tenant_billing_never_exposes_other_institution_or_operator_notes(self):
        self.account.operator_notes = 'Private operator notes'; self.account.save()
        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/saas/subscription/')
        self.assertNotIn('operator_notes', response.data)
        other = OrganizationAccount.objects.create(institution=institution('Other'), billing_email='other@test.example')
        invoice = self.invoice(); invoice.account = other; invoice.save()
        self.assertEqual(self.client.get(f'/api/saas/my-invoices/{invoice.pk}/print/').status_code, 404)
        self.assertEqual(self.client.patch('/api/saas/subscription/', {'status':'ACTIVE'}, format='json').status_code, 400)

    def test_user_limit_and_reactivation(self):
        self.plan.user_limit = 1; self.plan.save()
        with self.assertRaises(ModelValidationError):
            admin(self.inst, '+919876543213')
        user = User.objects.create_user('+919876543213', 'StrongPass123!', institution=self.inst, is_active=False)
        user.is_active = True
        with self.assertRaises(ModelValidationError): user.save()
        self.admin.first_name = 'Updated'; self.admin.save()

    def test_student_limit(self):
        from students.models import Student
        self.plan.student_limit = 1; self.plan.save()
        Student.objects.create(institution=self.inst, user=self.admin, admission_number='A1', roll_number='1', admission_date=self.today, gender='MALE')
        user = admin(self.inst, '+919876543213')
        with self.assertRaises(ModelValidationError):
            Student.objects.create(institution=self.inst, user=user, admission_number='A2', roll_number='2', admission_date=self.today, gender='MALE')

    def test_active_usage_prevents_undersized_plan_change(self):
        admin(self.inst, '+919876543213')
        response = self.client.patch(f'/api/saas/platform/plans/{self.plan.pk}/', {'user_limit':1}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_revenue_keeps_currencies_separate(self):
        self.invoice(currency='INR'); self.invoice(currency='USD')
        response = self.client.get('/api/saas/platform/overview/')
        self.assertEqual({row['currency'] for row in response.data['receivables']}, {'INR', 'USD'})

    def test_csrf_applies_to_platform_writes(self):
        client = APIClient(enforce_csrf_checks=True)
        client.cookies['access_token'] = str(RefreshToken.for_user(self.operator).access_token)
        self.assertEqual(client.post('/api/saas/platform/plans/', {}).status_code, 403)

    def test_status_needs_reason_and_valid_trial(self):
        url = f'/api/saas/platform/organizations/{self.account.pk}/change-status/'
        self.assertEqual(self.client.post(url, {'status':'SUSPENDED'}).status_code, 400)
        self.assertEqual(self.client.post(url, {'status':'TRIAL','reason':'Renewing trial'}).status_code, 400)

    def test_administrator_recovery_revokes_sessions_and_never_crosses_tenants(self):
        old = self.bearer(self.admin)
        url = f'/api/saas/platform/organizations/{self.account.pk}/reset-administrator/'
        response = self.client.post(url, {'administrator':self.admin.pk,'temporary_password':'Recovered!Secure789', 'reason':'Identity verified through support'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.must_change_password)
        self.assertEqual(old.get('/api/auth/me/').status_code, 401)
        other = admin(institution('Other'),'+919876543214')
        self.assertEqual(self.client.post(url, {'administrator':other.pk,'temporary_password':'Recovered!Secure987','reason':'Cross institution attempt'}, format='json').status_code,404)
        self.assertNotIn('Recovered!', str(list(PlatformEvent.objects.values_list('detail',flat=True))))

    def test_active_status_restores_a_deactivated_institution(self):
        self.inst.is_active = False; self.inst.save()
        response = self.client.post(f'/api/saas/platform/organizations/{self.account.pk}/change-status/', {'status':'ACTIVE','reason':'Institution owner verified reopening'})
        self.assertEqual(response.status_code,200)
        self.inst.refresh_from_db(); self.assertTrue(self.inst.is_active)

    def test_suspended_users_cannot_open_notification_socket(self):
        from asgiref.sync import async_to_sync
        from notifications.consumers import authenticated_user
        token = str(RefreshToken.for_user(self.admin).access_token)
        self.assertIsNotNone(async_to_sync(authenticated_user)(token))
        self.account.status = 'SUSPENDED'; self.account.save()
        self.assertIsNone(async_to_sync(authenticated_user)(token))
