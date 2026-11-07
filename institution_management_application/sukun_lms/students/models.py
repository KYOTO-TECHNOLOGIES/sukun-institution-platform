from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import BaseModel


class Student(BaseModel):
    GENDER_CHOICES = [('MALE', 'Male'), ('FEMALE', 'Female')]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='students')
    admission_number = models.CharField(max_length=50, unique=True)
    roll_number = models.CharField(max_length=50)
    admission_date = models.DateField()
    division = models.ForeignKey('academics.Division', on_delete=models.SET_NULL, null=True, related_name='students')
    academic_year = models.ForeignKey('institutions.AcademicYear', on_delete=models.SET_NULL, null=True, related_name='students')
    gender = models.CharField(max_length=6, choices=GENDER_CHOICES)
    religion = models.CharField(max_length=50, default='Islam')
    caste = models.CharField(max_length=100, blank=True, null=True)
    previous_madrasa = models.CharField(max_length=200, blank=True, null=True)
    quran_memorized_portion = models.CharField(max_length=100, blank=True, null=True)
    arabic_proficiency = models.CharField(max_length=50, blank=True, null=True)
    is_hifz_student = models.BooleanField(default=False)
    hifz_start_date = models.DateField(null=True, blank=True)
    hifz_completion_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'student'

    def __str__(self):
        return f'{self.admission_number} - {self.user.get_full_name()}'


class ParentGuardian(BaseModel):
    RELATION_CHOICES = [
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('BROTHER', 'Brother'),
        ('SISTER', 'Sister'),
        ('UNCLE', 'Uncle'),
        ('AUNT', 'Aunt'),
        ('GRANDFATHER', 'Grandfather'),
        ('GRANDMOTHER', 'Grandmother'),
        ('GUARDIAN', 'Guardian'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parents')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='parent_profiles')
    relation = models.CharField(max_length=20, choices=RELATION_CHOICES)
    occupation = models.CharField(max_length=100, blank=True, null=True)
    annual_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_primary_contact = models.BooleanField(default=False)

    class Meta:
        db_table = 'parent_guardian'
        unique_together = ['student', 'user']


class HifzProgress(BaseModel):
    STATUS_CHOICES = [
        ('MEMORIZING', 'Memorizing'),
        ('MEMORIZED', 'Memorized'),
        ('REVISED', 'Revised'),
        ('NEEDS_REVISION', 'Needs Revision'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='hifz_progress')
    teacher = models.ForeignKey('staff.Teacher', on_delete=models.SET_NULL, null=True, related_name='hifz_students')
    surah_name = models.CharField(max_length=100)
    surah_name_arabic = models.CharField(max_length=100)
    juz_number = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(30)])
    ayah_from = models.IntegerField()
    ayah_to = models.IntegerField()
    date_memorized = models.DateField()
    revision_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    quality_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'hifz_progress'
        verbose_name_plural = 'Hifz Progress'

    def __str__(self):
        return f'{self.student.admission_number} - Juz {self.juz_number} - {self.surah_name}'


class PrayerAttendance(BaseModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='prayer_attendances')
    date = models.DateField()
    fajr = models.BooleanField(default=False)
    dhuhr = models.BooleanField(default=False)
    asr = models.BooleanField(default=False)
    maghrib = models.BooleanField(default=False)
    isha = models.BooleanField(default=False)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='marked_prayers')

    class Meta:
        db_table = 'prayer_attendance'
        unique_together = ['student', 'date']

    def __str__(self):
        return f'{self.student.admission_number} - {self.date}'


class DisciplineRecord(BaseModel):
    INCIDENT_TYPES = [
        ('MISBEHAVIOR', 'Misbehavior'),
        ('ABSENTEEISM', 'Absenteeism'),
        ('UNIFORM', 'Uniform Violation'),
        ('LATE', 'Late Coming'),
        ('BULLYING', 'Bullying'),
        ('OTHER', 'Other'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='discipline_records')
    incident_date = models.DateField()
    incident_type = models.CharField(max_length=30, choices=INCIDENT_TYPES)
    description = models.TextField()
    action_taken = models.TextField()
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='reported_discipline')

    class Meta:
        db_table = 'discipline_record'

    def __str__(self):
        return f'{self.student.admission_number} - {self.incident_date}'


class Achievement(BaseModel):
    ACHIEVEMENT_TYPES = [
        ('QURAN', 'Quran Competition'),
        ('HADITH', 'Hadith Competition'),
        ('SPEECH', 'Speech Competition'),
        ('QUIZ', 'Islamic Quiz'),
        ('ACADEMIC', 'Academic Excellence'),
        ('SPORTS', 'Sports'),
        ('OTHER', 'Other'),
    ]
    LEVEL_CHOICES = [
        ('MADRASA', 'Madrasa Level'),
        ('DISTRICT', 'District Level'),
        ('STATE', 'State Level'),
        ('NATIONAL', 'National Level'),
        ('INTERNATIONAL', 'International Level'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='achievements')
    achievement_title = models.CharField(max_length=300)
    achievement_type = models.CharField(max_length=30, choices=ACHIEVEMENT_TYPES)
    date = models.DateField()
    organizer = models.CharField(max_length=200)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    position = models.CharField(max_length=30, blank=True, null=True)
    certificate = models.FileField(upload_to='achievements/', blank=True, null=True)

    class Meta:
        db_table = 'achievement'

    def __str__(self):
        return f'{self.student.admission_number} - {self.achievement_title}'


class StudentCertificate(BaseModel):
    CERTIFICATE_TYPES = [
        ('TRANSFER', 'Transfer Certificate'),
        ('CHARACTER', 'Character Certificate'),
        ('BONAFIDE', 'Bonafide Certificate'),
        ('HIFZ_COMPLETION', 'Hifz Completion'),
        ('COURSE_COMPLETION', 'Course Completion'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    certificate_type = models.CharField(max_length=50, choices=CERTIFICATE_TYPES)
    certificate_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField()
    reason = models.TextField(blank=True, null=True)
    issued_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='issued_certificates')
    is_printed = models.BooleanField(default=False)

    class Meta:
        db_table = 'student_certificate'

    def __str__(self):
        return f'{self.certificate_number} - {self.student.admission_number}'
