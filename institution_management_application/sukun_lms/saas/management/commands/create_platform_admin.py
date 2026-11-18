import getpass
import os
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User
from accounts.utils import normalize_phone_number


class Command(BaseCommand):
    help = 'Create a software administrator. Password is prompted or read from PLATFORM_ADMIN_PASSWORD; never overwritten.'

    def add_arguments(self, parser):
        parser.add_argument('--phone', required=True)
        parser.add_argument('--name', default='Software administrator')

    def handle(self, *args, **options):
        try:
            phone = normalize_phone_number(options['phone'])
            if User.objects.filter(phone_number=phone).exists():
                raise CommandError('This phone number already belongs to an account. No changes were made.')
            password = os.environ.get('PLATFORM_ADMIN_PASSWORD') or getpass.getpass('New platform password: ')
            user = User(phone_number=phone, first_name=options['name'])
            validate_password(password, user)
            User.objects.create_superuser(phone_number=phone, password=password, first_name=options['name'])
        except (ValidationError, ValueError) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(self.style.SUCCESS('Software administrator created. Sign in to open the platform console.'))
