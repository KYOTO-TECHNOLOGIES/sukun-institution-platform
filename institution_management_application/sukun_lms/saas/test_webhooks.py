import hashlib
import hmac
import json
import time
import uuid
from datetime import timedelta
from django.test import override_settings
from django.utils import timezone
from django.core.cache import cache
from rest_framework.test import APITestCase
from core.test_helpers import institution
from .models import OrganizationAccount, Invoice, BillingEvent


@override_settings(BILLING_WEBHOOK_SECRET='a-test-only-signing-secret-of-32-characters')
class SignedBillingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.account = OrganizationAccount.objects.create(institution=institution(),status='ACTIVE',billing_email='test@example.test',suspend_on_failure=True)
        today = timezone.localdate()
        self.invoice = Invoice.objects.create(account=self.account,description='Annual software',amount='100',tax_amount='18',
            currency='INR',issued_on=today,due_on=today,service_from=today,service_until=today+timedelta(days=365))
        self.payload = {'invoice':str(self.invoice.pk),'event_id':str(uuid.uuid4()),'outcome':'PAID','reference':'PROVIDER-TEST',
            'reason':'Provider attested full payment','amount':'118.00','currency':'INR'}

    def send(self, timestamp=None, signature=None):
        raw = json.dumps(self.payload)
        timestamp = str(int(time.time()) if timestamp is None else timestamp)
        if signature is None:
            signature = hmac.new(b'a-test-only-signing-secret-of-32-characters',(timestamp+'.'+raw).encode(),hashlib.sha256).hexdigest()
        return self.client.post('/api/saas/billing-events/', raw,content_type='application/json',HTTP_X_SUKUN_TIMESTAMP=timestamp,HTTP_X_SUKUN_SIGNATURE=signature)

    def test_valid_payment_and_retry_are_idempotent(self):
        self.assertEqual(self.send().status_code, 200)
        self.assertEqual(self.send().status_code, 200)
        self.assertEqual(BillingEvent.objects.count(), 1)
        self.invoice.refresh_from_db(); self.assertEqual(self.invoice.status,'PAID')

    def test_tampered_signature_or_expired_timestamp_is_rejected(self):
        self.assertIn(self.send(signature='tampered').status_code, [401,403])
        self.assertIn(self.send(timestamp=int(time.time())-600).status_code, [401,403])
        self.assertEqual(BillingEvent.objects.count(), 0)

    def test_wrong_amount_and_currency_are_rejected(self):
        self.payload['amount'] = '0.01'
        self.assertEqual(self.send().status_code, 400)
        self.payload.update(amount='118.00',currency='USD')
        self.assertEqual(self.send().status_code, 400)

    def test_failure_can_suspend_and_retry_does_not_duplicate(self):
        self.payload['outcome'] = 'FAILED'
        self.assertEqual(self.send().status_code, 200)
        self.assertEqual(self.send().status_code, 200)
        self.account.refresh_from_db(); self.assertEqual(self.account.status,'SUSPENDED')
        self.assertEqual(BillingEvent.objects.count(),1)

    @override_settings(BILLING_WEBHOOK_SECRET='')
    def test_unconfigured_endpoint_fails_closed(self):
        self.assertEqual(self.send().status_code,503)

    def test_webhook_cannot_void_invoice(self):
        self.payload['outcome'] = 'VOID'
        self.assertEqual(self.send().status_code,400)
