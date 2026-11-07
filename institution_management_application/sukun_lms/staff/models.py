from django.conf import settings
from django.db import models

from core.models import BaseModel


class Teacher(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='teachers')
    employee_id = models.CharField(max_length=50, unique=True)
    joining_date = models.DateField()
    qualification = models.CharField(max_length=200)
    qualification_arabic = models.CharField(max_length=200, blank=True, null=True)
    specialization = models.CharField(max_length=200, blank=True, null=True)
    years_of_experience = models.IntegerField(default=0)
    islamic_qualification = models.CharField(max_length=200, blank=True, null=True)
    is_alim = models.BooleanField(default=False)
    is_hafiz = models.BooleanField(default=False)
    is_qari = models.BooleanField(default=False)
    can_teach_quran = models.BooleanField(default=False)
    can_teach_hadith = models.BooleanField(default=False)
    can_teach_fiqh = models.BooleanField(default=False)
    # Extended profile fields
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    profile_photo = models.ImageField(upload_to='staff/photos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'teacher'

    def __str__(self):
        return f'{self.employee_id} - {self.user.get_full_name()}'


class StaffLeaveRecord(BaseModel):
    LEAVE_TYPES = [
        ('CASUAL', 'Casual Leave'),
        ('SICK', 'Sick Leave'),
        ('EARNED', 'Earned Leave'),
        ('MATERNITY', 'Maternity Leave'),
        ('PATERNITY', 'Paternity Leave'),
        ('EMERGENCY', 'Emergency Leave'),
        ('UNPAID', 'Unpaid Leave'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='leave_records')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    from_date = models.DateField()
    to_date = models.DateField()
    days_count = models.DecimalField(max_digits=5, decimal_places=1, default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_leaves'
    )
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'staff_leave_record'
        ordering = ['-from_date']

    def __str__(self):
        return f'{self.teacher.employee_id} - {self.leave_type} ({self.from_date})'


class StaffNote(BaseModel):
    NOTE_TYPES = [
        ('GENERAL', 'General Note'),
        ('PERFORMANCE', 'Performance'),
        ('DISCIPLINARY', 'Disciplinary'),
        ('ACHIEVEMENT', 'Achievement'),
        ('WARNING', 'Warning'),
        ('COMMENDATION', 'Commendation'),
    ]

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES, default='GENERAL')
    title = models.CharField(max_length=200)
    content = models.TextField()
    noted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='staff_notes_added'
    )
    is_private = models.BooleanField(default=False)

    class Meta:
        db_table = 'staff_note'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.teacher.employee_id} - {self.note_type}: {self.title}'
