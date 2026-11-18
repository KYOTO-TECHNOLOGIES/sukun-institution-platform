from unittest.mock import patch
from django.test import override_settings
from django.core.cache import cache
from rest_framework.test import APITestCase
from core.test_helpers import institution, admin, academic_setup
from .models import OrganizationAccount, AssistantUsage


class WorkspaceIntelligenceTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.inst = institution()
        self.user = admin(self.inst)
        self.account = OrganizationAccount.objects.create(institution=self.inst, billing_email=self.inst.email, status='ACTIVE')
        self.client.force_authenticate(self.user)

    def test_hierarchy_is_tenant_scoped(self):
        _, own_class, own_division = academic_setup(self.inst)
        _, other_class, other_division = academic_setup(institution('Other'))
        response = self.client.get('/api/saas/hierarchy/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row['id'] for row in response.data['classes']], [str(own_class.pk)])
        self.assertEqual([row['id'] for row in response.data['divisions']], [str(own_division.pk)])
        self.assertEqual(self.client.get('/api/saas/hierarchy/?class_id='+str(other_class.pk)).data['classes'], [])
        self.assertEqual(self.client.get('/api/saas/hierarchy/?class_id=bad').status_code, 400)

    def test_learner_cannot_read_hierarchy_or_setup(self):
        self.user.user_type = 'STUDENT'; self.user.save()
        self.assertEqual(self.client.get('/api/saas/hierarchy/').status_code, 403)
        self.assertEqual(self.client.get('/api/saas/setup/').status_code, 403)

    def test_setup_reflects_real_records(self):
        before = self.client.get('/api/saas/setup/').data
        self.assertFalse(before['steps'][0]['complete'])
        academic_setup(self.inst)
        after = self.client.get('/api/saas/setup/').data
        self.assertTrue(after['steps'][0]['complete'])
        self.assertTrue(after['steps'][1]['complete'])

    def test_local_assistant_calls_no_provider(self):
        with patch('saas.assistant.generate_answer') as generate:
            response = self.client.post('/api/saas/assistant/', {'message':'How do I mark attendance?'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['mode'], 'local')
        self.assertIn('/daily-attendance', str(response.data['sources']))
        generate.assert_not_called()

    def test_learner_context_has_no_institution_aggregates(self):
        self.user.user_type = 'STUDENT'; self.user.save()
        response = self.client.post('/api/saas/assistant/', {'message':'Give me an overview'}, format='json')
        self.assertNotIn('Active students', response.data['answer'])
        self.assertEqual(response.data['sources'][0]['href'], '/portal')

    def test_role_permissions_filter_help_and_statistics(self):
        self.user.user_type = 'TEACHER'; self.user.save()
        response = self.client.post('/api/saas/assistant/', {'message':'Show software invoices'}, format='json')
        self.assertIn('not available to your role', response.data['answer'])
        self.assertNotIn('/subscription', str(response.data['sources']))

    @override_settings(OPENAI_API_KEY='test-only', ASSISTANT_MODEL='configured-model')
    def test_ai_requires_institution_consent(self):
        with patch('saas.assistant.generate_answer') as generate:
            response = self.client.post('/api/saas/assistant/', {'message':'Help with attendance','use_ai':True}, format='json')
        self.assertEqual(response.status_code, 403)
        generate.assert_not_called()

    @override_settings(OPENAI_API_KEY='test-only', ASSISTANT_MODEL='configured-model', ASSISTANT_DAILY_LIMIT=1)
    def test_ai_context_minimization_and_daily_cap(self):
        self.account.external_ai_enabled = True; self.account.save()
        with patch('saas.assistant.generate_answer', return_value=('A grounded explanation.', {'input_tokens':25,'output_tokens':12})) as generate:
            first = self.client.post('/api/saas/assistant/', {'message':'Overview please','use_ai':True}, format='json')
            second = self.client.post('/api/saas/assistant/', {'message':'Overview again','use_ai':True}, format='json')
        self.assertEqual(first.data['mode'], 'ai')
        self.assertEqual(second.data['mode'], 'local')
        self.assertIn('daily AI allowance', second.data['notice'])
        self.assertEqual(generate.call_count, 1)
        context = generate.call_args.args[1]
        self.assertNotIn('institution', context)
        self.assertNotIn('alerts', context)
        self.assertNotIn(self.user.phone_number, str(context))
        meter = AssistantUsage.objects.get()
        self.assertEqual(meter.input_tokens, 25)
        self.assertEqual(meter.external_requests, 1)

    @override_settings(OPENAI_API_KEY='test-only', ASSISTANT_MODEL='configured-model')
    def test_provider_timeout_returns_local_help_without_leaking_errors(self):
        self.account.external_ai_enabled = True; self.account.save()
        with patch('saas.assistant.generate_answer', side_effect=TimeoutError('secret-provider-details')):
            response = self.client.post('/api/saas/assistant/', {'message':'How to mark attendance?','use_ai':True}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['mode'], 'local')
        self.assertNotIn('secret-provider-details', str(response.data))

    def test_question_limits(self):
        self.assertEqual(self.client.post('/api/saas/assistant/', {'message':'x'*1501}).status_code, 400)
        self.assertEqual(self.client.post('/api/saas/assistant/', {'message':''}).status_code, 400)

    def test_only_institution_admin_can_consent(self):
        self.user.user_type = 'PRINCIPAL'; self.user.save()
        self.assertEqual(self.client.patch('/api/saas/subscription/', {'external_ai_enabled':True}, format='json').status_code, 403)
        self.user.user_type = 'INSTITUTION_ADMIN'; self.user.save()
        self.assertEqual(self.client.patch('/api/saas/subscription/', {'external_ai_enabled':True}, format='json').status_code, 200)
