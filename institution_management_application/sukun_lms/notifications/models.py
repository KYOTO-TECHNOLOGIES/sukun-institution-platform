import uuid
from django.conf import settings
from django.db import models

class InboxItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.UUIDField(default=uuid.uuid4)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inbox_items')
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE)
    module = models.CharField(max_length=32)
    scope = models.CharField(max_length=12, default='module')
    student = models.ForeignKey('students.Student', null=True, blank=True, on_delete=models.CASCADE)
    notice = models.ForeignKey('communications.Notification', null=True, blank=True, on_delete=models.CASCADE)
    course = models.ForeignKey('learning.Course', null=True, blank=True, on_delete=models.CASCADE)
    exam_period = models.ForeignKey('examinations.ExamType', null=True, blank=True, on_delete=models.CASCADE)
    staff_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    staff_private = models.BooleanField(default=False)
    title = models.CharField(max_length=200)
    message = models.CharField(max_length=600)
    href = models.CharField(max_length=500)
    attention = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at', '-id']
        indexes = [models.Index(fields=['recipient', 'institution', 'read_at', '-created_at'], name='inbox_user_unread')]
        constraints = [models.UniqueConstraint(fields=['recipient', 'event_id'], name='one_delivery_per_event_user')]

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preference')
    toasts_enabled = models.BooleanField(default=True)
    muted_modules = models.JSONField(default=list, blank=True)
