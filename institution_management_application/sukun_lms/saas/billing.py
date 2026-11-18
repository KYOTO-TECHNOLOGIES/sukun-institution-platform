from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import OrganizationAccount, Invoice, BillingEvent, PlatformEvent


@transaction.atomic
def settle(invoice_id, data, actor):
    # Every billing workflow locks account then invoice, in that order.
    account_id = Invoice.objects.values_list('account_id', flat=True).get(pk=invoice_id)
    account = OrganizationAccount.objects.select_for_update().get(pk=account_id)
    invoice = Invoice.objects.select_for_update().get(pk=invoice_id)
    existing = BillingEvent.objects.filter(event_id=data['event_id']).first()
    if existing:
        if (existing.invoice_id != invoice.pk or existing.outcome != data['outcome']
                or existing.reference != data['reference'] or existing.reason != data['reason']):
            raise ValidationError('This request identifier has already been used for a different payment event.')
        return invoice
    if invoice.status != 'ISSUED':
        raise ValidationError('Only an issued, unpaid invoice can receive a payment decision.')
    BillingEvent.objects.create(invoice=invoice, actor=actor, **data)
    outcome = data['outcome']
    if outcome == 'PAID':
        if Invoice.objects.filter(status='PAID', payment_reference=data['reference']).exists():
            raise ValidationError({'reference': 'This payment reference is already recorded on another invoice.'})
        invoice.status = 'PAID'
        invoice.paid_at = timezone.now()
        invoice.payment_reference = data['reference']
        account.paid_until = max(account.paid_until or invoice.service_until, invoice.service_until)
        if account.status == 'TRIAL':
            account.status = 'ACTIVE'
        # A payment never silently reverses an explicit suspension or cancellation.
        account.save()
        invoice.save()
    elif outcome == 'VOID':
        invoice.status = 'VOID'
        invoice.save()
    elif account.suspend_on_failure and account.status not in {'SUSPENDED', 'CANCELLED'}:
        account.status = 'SUSPENDED'
        account.suspension_reason = 'Payment could not be confirmed. Contact billing support for assistance.'
        account.save()
    PlatformEvent.objects.create(account=account, actor=actor, action='invoice.'+outcome.lower(),
        detail=f'{invoice.number} | {data["reference"]} | {data["reason"]}')
    return invoice
