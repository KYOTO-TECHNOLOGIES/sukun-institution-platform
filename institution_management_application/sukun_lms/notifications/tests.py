import asyncio
from datetime import timedelta
from unittest.mock import patch
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.security.websocket import OriginValidator
from channels.testing import WebsocketCommunicator
from django.apps import apps
from django.test import TestCase, TransactionTestCase, override_settings
from django.urls import path
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from core.test_helpers import institution, admin, academic_setup
from students.models import Student, ParentGuardian
from admissions.models import Lead
from communications.models import Notification
from learning.models import Course, Enrollment, Assignment
from .catalog import CATALOG, MODULE_LABELS
from .consumers import InboxConsumer
from .models import InboxItem
from .services import user_room

class InboxTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.inst = institution('Inbox School')
        cls.other = institution('Other Inbox School')
        cls.actor = admin(cls.inst, '+919800001001')
        cls.manager = admin(cls.inst, '+919800001002')
        cls.marketing = admin(cls.inst, '+919800001003', 'MARKETING')
        cls.teacher = admin(cls.inst, '+919800001004', 'TEACHER')
        cls.other_teacher = admin(cls.inst, '+919800001005', 'TEACHER')
        cls.outsider = admin(cls.other, '+919800001006')
        cls.parent = admin(cls.inst, '+919800001007', 'PARENT')
        cls.student_user = admin(cls.inst, '+919800001008', 'STUDENT')
        cls.other_parent = admin(cls.inst, '+919800001009', 'PARENT')
        cls.year, cls.class_obj, cls.division = academic_setup(cls.inst)
        cls.student = Student.objects.create(user=cls.student_user, institution=cls.inst,
            admission_number='INBOX-1', roll_number='1', admission_date='2026-06-01',
            division=cls.division, academic_year=cls.year, gender='MALE')
        cls.guardian = ParentGuardian.objects.create(student=cls.student, user=cls.parent, relation='FATHER')
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.actor)
        self.pusher = patch('notifications.services.publish_batch')
        self.push = self.pusher.start()
        self.addCleanup(self.pusher.stop)
    def mutate(self, method, url, data=None):
        with self.captureOnCommitCallbacks(execute=True):
            return getattr(self.client, method)(url, data, format='json')
    def create_lead(self):
        response = self.mutate('post', '/api/admissions/leads/', {'institution':str(self.inst.pk),'full_name':'Private prospect','phone':'1234567890','source':'Walk-in'})
        self.assertEqual(response.status_code, 201, response.data)
        return response.data['id']
    def item(self, user, **kwargs):
        return InboxItem.objects.create(recipient=user, institution=self.inst, module='admissions',
            title='An update', message='Details', href='/workspace/enquiries', **kwargs)
    def inbox(self, user):
        self.client.force_authenticate(user)
        return self.client.get('/api/notifications/').data['results']
    def test_registry_covers_every_module_and_real_models(self):
        self.assertEqual(set(MODULE_LABELS), {entry[0] for entry in CATALOG.values()})
        for label in CATALOG:
            self.assertIsNotNone(apps.get_model(label))
    def test_committed_change_reaches_only_authorized_same_tenant_recipients(self):
        self.create_lead()
        self.assertSetEqual(set(InboxItem.objects.values_list('recipient_id', flat=True)), {self.manager.pk, self.marketing.pk})
        item = InboxItem.objects.first()
        self.assertFalse(item.attention)
        self.assertNotIn('Private prospect', item.message)
        self.assertTrue(self.push.called)
    def test_seed_writes_failed_requests_and_noops_stay_quiet(self):
        Lead.objects.create(institution=self.inst, full_name='Seed', phone='123')
        self.assertEqual(InboxItem.objects.count(), 0)
        response = self.mutate('post', '/api/admissions/leads/', {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(InboxItem.objects.count(), 0)
        pk = self.create_lead()
        count = InboxItem.objects.count()
        self.mutate('patch', f'/api/admissions/leads/{pk}/', {'full_name':'Private prospect'})
        self.assertEqual(InboxItem.objects.count(), count)
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.mutate('patch', f'/api/admissions/leads/{pk}/', {'full_name':'Blocked'}).status_code,403)
        self.assertEqual(InboxItem.objects.count(), count)
    def test_no_inbox_or_push_before_commit(self):
        with self.captureOnCommitCallbacks(execute=False) as callbacks:
            response = self.client.post('/api/admissions/leads/', {'institution':str(self.inst.pk),'full_name':'Pending','phone':'123','source':'Walk-in'}, format='json')
        self.assertEqual(response.status_code,201)
        self.assertTrue(callbacks)
        self.assertEqual(InboxItem.objects.count(),0)
        self.push.assert_not_called()
    def test_read_is_per_user_and_cannot_address_someone_elses_item(self):
        mine, theirs = self.item(self.manager), self.item(self.marketing)
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.client.get(f'/api/notifications/{theirs.pk}/').status_code,404)
        self.assertEqual(self.mutate('post', f'/api/notifications/{theirs.pk}/read/').status_code,404)
        self.assertEqual(self.mutate('post', f'/api/notifications/{mine.pk}/read/').status_code,200)
        mine.refresh_from_db(); theirs.refresh_from_db()
        self.assertIsNotNone(mine.read_at)
        self.assertIsNone(theirs.read_at)
        self.assertEqual(self.client.get('/api/notifications/summary/').data['unread_count'],0)
    def test_read_all_is_scoped_and_idempotent(self):
        own = self.item(self.manager)
        other = self.item(self.marketing)
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.mutate('post', '/api/notifications/read-all/').data['updated'],1)
        self.assertEqual(self.mutate('post', '/api/notifications/read-all/').data['updated'],0)
        own.refresh_from_db(); other.refresh_from_db()
        self.assertIsNotNone(own.read_at)
        self.assertIsNone(other.read_at)
    def test_permission_revocation_hides_historical_items(self):
        self.item(self.marketing)
        self.assertEqual(len(self.inbox(self.marketing)),1)
        self.marketing.permission_overrides = {'admissions_read':False}
        self.marketing.save()
        self.assertEqual(self.inbox(self.marketing),[])
    def test_addressed_notice_has_individual_read_state_and_checks_current_recipients(self):
        response = self.mutate('post','/api/communications/notifications/', {
            'institution':str(self.inst.pk),'title':'Bring your handbook','message':'A private class notice.','notification_type':'GENERAL',
            'recipients':[self.parent.pk,self.student_user.pk],
        })
        self.assertEqual(response.status_code,201,response.data)
        self.assertEqual(InboxItem.objects.count(),2)
        self.assertEqual(len(self.inbox(self.parent)),1)
        self.assertEqual(self.inbox(self.other_parent),[])
        notice = Notification.objects.get(pk=response.data['id'])
        item = InboxItem.objects.get(recipient=self.parent)
        self.assertTrue(item.attention)
        self.client.force_authenticate(self.parent)
        self.mutate('post',f'/api/notifications/{item.pk}/read/')
        self.assertIsNone(InboxItem.objects.get(recipient=self.student_user).read_at)
        notice.refresh_from_db(); self.assertFalse(notice.is_read)
        notice.recipients.remove(self.parent)
        self.assertEqual(self.inbox(self.parent),[])
    def test_attendance_alert_targets_only_linked_family_and_batches_staff_updates(self):
        second_user = admin(self.inst,'+919800001010','STUDENT')
        second = Student.objects.create(user=second_user,institution=self.inst,admission_number='INBOX-2',
            roll_number='2',admission_date='2026-06-01',division=self.division,academic_year=self.year,gender='FEMALE')
        response = self.mutate('post','/api/attendance/student-attendance/bulk/',{
            'division':str(self.division.pk),'date':'2026-11-11',
            'records':[{'student':str(self.student.pk),'status':'ABSENT'},{'student':str(second.pk),'status':'PRESENT'}],
        })
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(InboxItem.objects.filter(recipient=self.manager).count(),1)
        self.assertIn('2 attendance updates',InboxItem.objects.get(recipient=self.manager).title)
        self.assertEqual(len(self.inbox(self.parent)),1)
        self.assertTrue(InboxItem.objects.get(recipient=self.parent).attention)
        self.assertFalse(InboxItem.objects.get(recipient=second_user).attention)
        self.assertEqual(self.inbox(self.other_parent),[])
        self.guardian.is_active=False; self.guardian.save()
        self.assertEqual(self.inbox(self.parent),[])
    def test_draft_learning_is_quiet_for_family_and_teacher_scope_is_respected(self):
        course=Course.objects.create(institution=self.inst,teacher=self.teacher,title='Course',status='PUBLISHED')
        Enrollment.objects.create(course=course,student=self.student)
        response=self.mutate('post','/api/learning/assignments/',{
            'course':str(course.pk),'title':'Essay','instructions':'Write an essay',
            'due_at':(timezone.now()+timedelta(days=2)).isoformat(),'max_score':'100','is_published':False,
        })
        self.assertEqual(response.status_code,201,response.data)
        self.assertEqual(self.inbox(self.parent),[])
        self.assertEqual(len(self.inbox(self.teacher)),1)
        self.assertEqual(self.inbox(self.other_teacher),[])
        self.client.force_authenticate(self.actor)
        self.mutate('patch',f'/api/learning/assignments/{response.data["id"]}/',{'is_published':True})
        self.assertEqual(len(self.inbox(self.parent)),1)
        course.teacher=self.other_teacher;course.save()
        self.assertEqual(self.inbox(self.teacher),[])
        course.status='DRAFT';course.save()
        self.assertEqual(self.inbox(self.parent),[])
    def test_preferences_validate_and_persist_without_dropping_inbox(self):
        self.item(self.parent,scope='personal')
        self.client.force_authenticate(self.parent)
        response=self.mutate('patch','/api/notifications/preferences/',{'toasts_enabled':False,'muted_modules':['finance']})
        self.assertEqual(response.status_code,200,response.data)
        self.assertFalse(self.client.get('/api/notifications/summary/').data['preferences']['toasts_enabled'])
        self.assertEqual(len(self.inbox(self.parent)),1)
        self.assertEqual(self.mutate('patch','/api/notifications/preferences/',{'muted_modules':['arbitrary']}).status_code,400)
    def test_pagination_unread_and_module_filters(self):
        for _ in range(25): self.item(self.manager)
        self.client.force_authenticate(self.manager)
        response=self.client.get('/api/notifications/?page=2&page_size=20')
        self.assertEqual(response.data['count'],25)
        self.assertEqual(len(response.data['results']),5)
        self.assertEqual(self.client.get('/api/notifications/?module=finance').data['count'],0)
        item=InboxItem.objects.filter(recipient=self.manager).first()
        self.mutate('post',f'/api/notifications/{item.pk}/read/')
        self.assertEqual(self.client.get('/api/notifications/?unread=true').data['count'],24)
    def test_live_channel_failure_does_not_lose_the_committed_inbox(self):
        self.pusher.stop()
        class BrokenLayer:
            async def group_send(self, *args, **kwargs):
                raise ConnectionError('Redis unavailable in test')
        with patch('notifications.services.get_channel_layer', return_value=BrokenLayer()), self.assertLogs('notifications.services', level='WARNING'):
            self.create_lead()
        self.assertEqual(InboxItem.objects.count(), 2)
        self.assertEqual(len(self.inbox(self.marketing)), 1)

    def test_fee_bill_alerts_linked_family_only(self):
        from finance.models import FeeStructure
        structure = FeeStructure.objects.create(institution=self.inst, class_obj=self.class_obj,
            academic_year=self.year, fee_name='Tuition', fee_type='TUITION', amount=100, is_mandatory=False)
        response = self.mutate('post', '/api/finance/student-fees/', {
            'student':str(self.student.pk), 'fee_structure':str(structure.pk),
            'academic_year':str(self.year.pk), 'total_amount':'100', 'due_date':'2026-12-01',
        })
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(self.inbox(self.parent)), 1)
        item = InboxItem.objects.get(recipient=self.parent)
        self.assertTrue(item.attention)
        self.assertIn('tab=fees', item.href)
        self.assertEqual(self.inbox(self.other_parent), [])
        self.assertEqual(self.inbox(self.teacher), [])

    def test_automatically_generated_bills_notify_families_once(self):
        response = self.mutate('post', '/api/finance/fee-structures/', {
            'institution':str(self.inst.pk), 'class_obj':str(self.class_obj.pk),
            'academic_year':str(self.year.pk), 'fee_name':'New tuition', 'fee_type':'TUITION',
            'amount':'100', 'is_mandatory':True, 'due_days':7,
        })
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(InboxItem.objects.filter(recipient=self.parent).count(), 1)
        self.assertEqual(InboxItem.objects.filter(recipient=self.manager).count(), 1)
        self.assertIn('tab=fees', InboxItem.objects.get(recipient=self.parent).href)
        self.mutate('patch', '/api/finance/fee-structures/' + response.data['id'] + '/', {'fee_name':'Renamed tuition'})
        self.assertEqual(InboxItem.objects.filter(recipient=self.parent).count(), 1)

    def test_unauthenticated_inbox_is_rejected(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/notifications/').status_code,401)
    def test_deleted_record_uses_list_destination(self):
        pk=self.create_lead()
        self.mutate('delete',f'/api/admissions/leads/{pk}/')
        item=InboxItem.objects.filter(recipient=self.manager).first()
        self.assertEqual(item.title,'Enquiry removed')
        self.assertEqual(item.href,'/workspace/enquiries')

@override_settings(CHANNEL_LAYERS={'default':{'BACKEND':'channels.layers.InMemoryChannelLayer'}})
class SocketTests(TransactionTestCase):
    def setUp(self):
        self.inst=institution('Socket School')
        self.one=admin(self.inst,'+919800002001')
        self.two=admin(self.inst,'+919800002002')
        self.token=str(AccessToken.for_user(self.one))
        self.token_two=str(AccessToken.for_user(self.two))
        self.application=OriginValidator(URLRouter([path('ws/notifications/',InboxConsumer.as_asgi())]),['http://localhost:5173'])
    def socket(self, token=None, origin='http://localhost:5173'):
        headers=[(b'origin',origin.encode())]
        if token: headers.append((b'cookie',('access_token='+token).encode()))
        return WebsocketCommunicator(self.application,'/ws/notifications/',headers=headers)
    def test_cookie_auth_origin_validation_and_expired_tokens(self):
        expired=AccessToken.for_user(self.one)
        expired.set_exp(from_time=timezone.now()-timedelta(hours=1),lifetime=timedelta(seconds=1))
        async def run():
            for socket in [self.socket(),self.socket('invalid'),self.socket(str(expired)),self.socket(self.token,'https://untrusted.example')]:
                accepted,_=await socket.connect()
                self.assertFalse(accepted)
                await socket.disconnect()
            socket=self.socket(self.token)
            self.assertTrue((await socket.connect())[0])
            self.assertEqual((await socket.receive_json_from())['type'],'notifications.ready')
            await socket.send_json_to({'type':'ping'})
            self.assertEqual((await socket.receive_json_from())['type'],'pong')
            await socket.disconnect()
        async_to_sync(run)()
    def test_private_rooms_do_not_leak_and_client_cannot_choose_room(self):
        async def run():
            one,two=self.socket(self.token),self.socket(self.token_two)
            for socket in [one,two]:
                self.assertTrue((await socket.connect())[0]);await socket.receive_json_from()
            await two.send_json_to({'type':'join','room':user_room(self.inst.pk,self.one.pk)})
            await get_channel_layer().group_send(user_room(self.inst.pk,self.one.pk),{'type':'notifications.changed','ids':['test-event'],'reason':'created'})
            self.assertEqual((await one.receive_json_from())['ids'],['test-event'])
            self.assertTrue(await two.receive_nothing(timeout=0.15))
            await one.disconnect();await two.disconnect()
        async_to_sync(run)()
    def test_deactivation_closes_existing_connection(self):
        async def run():
            socket=self.socket(self.token)
            self.assertTrue((await socket.connect())[0]);await socket.receive_json_from()
            await database_sync_to_async(type(self.one).objects.filter(pk=self.one.pk).update)(is_active=False)
            await socket.send_json_to({'type':'ping'})
            output=await socket.receive_output()
            self.assertEqual(output['type'],'websocket.close')
            self.assertEqual(output['code'],4401)
            await socket.disconnect()
        async_to_sync(run)()
