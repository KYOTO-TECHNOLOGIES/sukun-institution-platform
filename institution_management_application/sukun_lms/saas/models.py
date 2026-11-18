"""The operator control plane. No institution API can mutate these records."""
import uuid
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


def invoice_number():
    return 'SK-' + uuid.uuid4().hex[:16].upper()


class Plan(models.Model):
    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=400, blank=True)
    monthly_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='INR', choices=[('INR', 'INR'), ('USD', 'USD'), ('AED', 'AED'), ('GBP', 'GBP'), ('EUR', 'EUR')])
    student_limit = models.PositiveIntegerField(default=500, validators=[MinValueValidator(1)])
    user_limit = models.PositiveIntegerField(default=1000, validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['monthly_price', 'id']
        constraints = [models.CheckConstraint(condition=models.Q(monthly_price__gte=0), name='plan_price_positive')]


class OrganizationAccount(models.Model):
    class Status(models.TextChoices):
        TRIAL = 'TRIAL', 'Trial'
        ACTIVE = 'ACTIVE', 'Active'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField('institutions.Institution', on_delete=models.PROTECT, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.TRIAL)
    billing_email = models.EmailField()
    trial_ends_on = models.DateField(null=True, blank=True)
    paid_until = models.DateField(null=True, blank=True)
    grace_days = models.PositiveSmallIntegerField(default=7, validators=[MaxValueValidator(60)])
    enforce_overdue = models.BooleanField(default=True)
    suspend_on_failure = models.BooleanField(default=False)
    suspension_reason = models.CharField(max_length=500, blank=True)
    operator_notes = models.TextField(blank=True, max_length=4000)
    external_ai_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    number = models.CharField(max_length=40, unique=True, default=invoice_number, editable=False)
    account = models.ForeignKey(OrganizationAccount, on_delete=models.PROTECT, related_name='invoices')
    description = models.CharField(max_length=300)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, choices=Plan._meta.get_field('currency').choices, default='INR')
    status = models.CharField(max_length=10, choices=[('ISSUED', 'Issued'), ('PAID', 'Paid'), ('VOID', 'Void')], default='ISSUED')
    issued_on = models.DateField()
    due_on = models.DateField()
    service_from = models.DateField()
    service_until = models.DateField()
    bill_to = models.JSONField(default=dict)
    issuer = models.JSONField(default=dict)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        return self.amount + self.tax_amount

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gt=0, tax_amount__gte=0), name='invoice_amounts_positive'),
            models.CheckConstraint(condition=models.Q(service_until__gte=models.F('service_from')), name='invoice_period_order'),
            models.CheckConstraint(condition=models.Q(due_on__gte=models.F('issued_on')), name='invoice_due_order'),
            models.UniqueConstraint(fields=['payment_reference'], condition=models.Q(status='PAID'), name='invoice_paid_reference_unique'),
        ]
        indexes = [models.Index(fields=['account', 'status', 'due_on'])]


class PlatformEvent(models.Model):
    """Append-only through the API; snapshots contain operational metadata, never credentials."""
    account = models.ForeignKey(OrganizationAccount, on_delete=models.PROTECT, null=True, related_name='events')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=60)
    detail = models.CharField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']


class BillingEvent(models.Model):
    """Idempotent payment facts, entered by an operator or a verified integration."""
    event_id = models.UUIDField(unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payment_events')
    outcome = models.CharField(max_length=10, choices=[('PAID', 'Paid'), ('FAILED', 'Failed'), ('VOID', 'Void')])
    reference = models.CharField(max_length=160)
    reason = models.CharField(max_length=500)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AssistantUsage(models.Model):
    institution = models.ForeignKey('institutions.Institution', on_delete=models.PROTECT)
    date = models.DateField()
    external_requests = models.PositiveIntegerField(default=0)
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['institution', 'date'], name='assistant_daily_usage_unique')]
