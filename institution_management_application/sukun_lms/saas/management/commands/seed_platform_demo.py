import os
from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from accounts.models import User
from institutions.models import Institution
from saas.models import Plan, OrganizationAccount, Invoice


class Command(BaseCommand):
    help = 'Add a software-admin demo login and demonstration subscription to the isolated local seed.'

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('This command is for local development only.')
        password = os.environ.get('DEMO_PASSWORD')
        if not password:
            raise CommandError('Set DEMO_PASSWORD first.')
        institution = Institution.objects.filter(registration_number='SUKUN-DEMO').first()
        if not institution:
            raise CommandError('Run seed_demo first.')
        phone = '+919900009001'
        operator = User.objects.filter(phone_number=phone).first()
        if operator and (not operator.is_superuser or operator.institution_id):
            raise CommandError('The demo operator phone belongs to another account. No changes were made.')
        if not operator:
            User.objects.create_superuser(phone_number=phone, password=password, first_name='Kyoto', last_name='Operator')
        plan, _ = Plan.objects.get_or_create(name='Demonstration', defaults={'description':'Local example only. Set your own commercial plans.',
            'monthly_price':'2500.00','student_limit':500,'user_limit':1000})
        account, created = OrganizationAccount.objects.get_or_create(institution=institution,
            defaults={'plan':plan,'status':'ACTIVE','billing_email':institution.email})
        if not account.plan_id:
            account.plan = plan; account.save(update_fields=['plan','updated_at'])
        if not account.invoices.exists():
            today = timezone.localdate()
            Invoice.objects.create(account=account, description='Demonstration subscription — sample invoice',
                amount='2500.00',tax_amount=0,currency='INR',issued_on=today,due_on=today+timedelta(days=30),
                service_from=today,service_until=today+timedelta(days=365),
                bill_to={'name':institution.name,'email':institution.email,'address':institution.address},
                issuer={'name':'Sukun · Kyoto (local demonstration)','address':'Demo only','email':''})
        self.stdout.write('Platform demo prepared; existing passwords and institution records preserved.')
