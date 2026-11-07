from django.conf import settings
from django.db import models

from core.models import BaseModel


class Institution(BaseModel):
    """Main Madrasa Institution."""

    INSTITUTION_TYPES = [
        ('MADRASA', 'Madrasa'),
        ('DARUL_HUDA', 'Darul Huda'),
        ('DARUL_ULOOM', 'Darul Uloom'),
        ('ISLAMIC_CENTER', 'Islamic Center'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=200)
    name_arabic = models.CharField(max_length=200, blank=True, null=True)
    registration_number = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Kerala')
    pincode = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    email = models.EmailField(unique=True)
    website = models.URLField(blank=True, null=True)
    established_year = models.IntegerField()
    logo = models.ImageField(upload_to='institution_logos/', blank=True, null=True)
    affiliation_board = models.CharField(max_length=200, blank=True, null=True)
    institution_type = models.CharField(max_length=50, choices=INSTITUTION_TYPES)

    class Meta:
        db_table = 'institution'
        verbose_name = 'Institution'
        verbose_name_plural = 'Institutions'

    def __str__(self):
        return self.name


class AcademicYear(BaseModel):
    """Academic year management."""

    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='academic_years')
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = 'academic_year'
        unique_together = ['institution', 'name']

    def __str__(self):
        return f'{self.name} - {self.institution.name}'


class Authority(BaseModel):
    """Institution authority or committee member."""

    POSITIONS = [
        ('PRESIDENT', 'President'),
        ('VICE_PRESIDENT', 'Vice President'),
        ('SECRETARY', 'Secretary'),
        ('JOINT_SECRETARY', 'Joint Secretary'),
        ('TREASURER', 'Treasurer'),
        ('EXECUTIVE_MEMBER', 'Executive Member'),
        ('PATRON', 'Patron'),
    ]

    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='authorities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authority_roles')
    position = models.CharField(max_length=30, choices=POSITIONS)
    joining_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)

    class Meta:
        db_table = 'authority'
        verbose_name_plural = 'Authorities'

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.get_position_display()}'
