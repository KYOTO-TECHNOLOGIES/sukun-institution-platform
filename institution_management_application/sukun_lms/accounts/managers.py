from django.contrib.auth.base_user import BaseUserManager
from django.core.exceptions import ValidationError

from .utils import normalize_phone_number


class UserManager(BaseUserManager):
    use_in_migrations = True

    def normalize_phone_number(self, phone_number: str) -> str:
        return normalize_phone_number(phone_number)

    def _create_user(self, phone_number: str, password: str, **extra_fields):
        if not phone_number:
            raise ValueError('The phone number must be set.')
        if not password:
            raise ValueError('The password must be set.')

        try:
            normalized_phone_number = self.normalize_phone_number(phone_number)
        except ValidationError as exc:
            raise ValueError(exc.messages[0]) from exc

        user = self.model(phone_number=normalized_phone_number, **extra_fields)
        user.set_password(password)
        user.full_clean()
        user.save(using=self._db)
        return user

    def create_user(self, phone_number: str, password: str = None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('user_type', 'STUDENT')
        return self._create_user(phone_number, password, **extra_fields)

    def create_superuser(self, phone_number: str, password: str, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'SUPER_ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(phone_number, password, **extra_fields)
