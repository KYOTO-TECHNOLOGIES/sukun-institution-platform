from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .managers import UserManager
from .utils import normalize_phone_number


class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('INSTITUTION_ADMIN', 'Institution Admin'),
        ('PRINCIPAL', 'Principal'),
        ('TEACHER', 'Teacher'),
        ('ACCOUNTANT', 'Accountant'),
        ('MARKETING', 'Marketing'),
        ('ADMISSIONS', 'Admissions Officer'),
        ('HR', 'Human Resources'),
        ('FRONT_DESK', 'Front Desk'),
        ('LIBRARIAN', 'Librarian'),
        ('PARENT', 'Parent'),
        ('STUDENT', 'Student'),
    ]

    phone_number = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='STUDENT')
    permission_overrides = models.JSONField(default=dict, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ('-date_joined',)
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self) -> str:
        return f'{self.get_full_name() or self.phone_number} ({self.get_user_type_display()})'

    @property
    def full_name(self) -> str:
        return ' '.join(
            part for part in [self.first_name.strip(), self.last_name.strip()] if part
        )

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.first_name or self.phone_number

    def clean(self):
        super().clean()
        if self.phone_number:
            try:
                self.phone_number = normalize_phone_number(self.phone_number)
            except ValidationError as exc:
                raise ValidationError({'phone_number': exc.messages}) from exc

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
