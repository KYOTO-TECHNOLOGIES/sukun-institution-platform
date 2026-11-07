from django.conf import settings
from django.db import models

from core.models import BaseModel


class IslamicEvent(BaseModel):
    EVENT_TYPES = [
        ('EID', 'Eid Celebration'),
        ('MILAD', 'Milad-un-Nabi'),
        ('MIRAJ', 'Shab-e-Miraj'),
        ('BARAT', 'Shab-e-Barat'),
        ('RAMADAN', 'Ramadan Program'),
        ('COMPETITION', 'Islamic Competition'),
        ('SEMINAR', 'Islamic Seminar'),
        ('QURAN_CAMP', 'Quran Camp'),
        ('PRAYER', 'Special Prayer'),
        ('OTHER', 'Other'),
    ]

    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='islamic_events')
    event_name = models.CharField(max_length=200)
    event_name_arabic = models.CharField(max_length=200, blank=True, null=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    event_date = models.DateField()
    hijri_date = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField()
    venue = models.CharField(max_length=200)

    class Meta:
        db_table = 'islamic_event'

    def __str__(self):
        return f'{self.event_name} - {self.event_date}'


class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ('GENERAL', 'General'),
        ('FEE', 'Fee Reminder'),
        ('EXAM', 'Exam Notice'),
        ('EVENT', 'Event Notice'),
        ('ATTENDANCE', 'Attendance Alert'),
        ('TASK', 'Task Alert'),
    ]

    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_notifications')
    recipients = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='received_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification'

    def __str__(self):
        return f'{self.title} - {self.sent_at}'
