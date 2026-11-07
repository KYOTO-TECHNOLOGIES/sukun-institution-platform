from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from core.models import BaseModel


class Campaign(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE)
    name = models.CharField(max_length=180)
    channel = models.CharField(max_length=30, choices=[(x, x.title()) for x in ['SOCIAL', 'SEARCH', 'REFERRAL', 'EVENT', 'PRINT', 'OTHER']])
    status = models.CharField(max_length=20, default='DRAFT', choices=[(x, x.title()) for x in ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']])
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Lead(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE)
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    guardian_name = models.CharField(max_length=200, blank=True)
    interested_class = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, blank=True)
    source = models.CharField(max_length=80, default='Walk-in')
    stage = models.CharField(max_length=20, default='NEW', choices=[(x, x.title()) for x in ['NEW', 'CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'APPLICATION', 'LOST']])
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    next_follow_up = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    lost_reason = models.CharField(max_length=250, blank=True)

    def __str__(self):
        return self.full_name


class FollowUp(BaseModel):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='follow_ups')
    due_at = models.DateTimeField()
    channel = models.CharField(max_length=20, default='CALL', choices=[(x, x.title()) for x in ['CALL', 'EMAIL', 'VISIT', 'MESSAGE']])
    notes = models.TextField()
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)


class Application(BaseModel):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE)
    lead = models.OneToOneField(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='application')
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=6, choices=[('MALE', 'Male'), ('FEMALE', 'Female')])
    guardian_name = models.CharField(max_length=200, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    division = models.ForeignKey('academics.Division', on_delete=models.PROTECT)
    academic_year = models.ForeignKey('institutions.AcademicYear', on_delete=models.PROTECT)
    status = models.CharField(max_length=20, default='SUBMITTED', choices=[(x, x.title()) for x in ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED']])
    documents_verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    student = models.OneToOneField('students.Student', on_delete=models.PROTECT, null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    def __str__(self):
        return self.first_name + ' ' + self.last_name
