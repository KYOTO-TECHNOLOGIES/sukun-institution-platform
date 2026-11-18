"""Enforce active seats across every model-save path, including admissions and reactivation."""
from contextlib import contextmanager
from django.core.exceptions import ValidationError
from django.db import transaction


@contextmanager
def check_seat(instance, kind):
    from .models import OrganizationAccount
    with transaction.atomic():
        if instance.institution_id and instance.is_active:
            account = OrganizationAccount.objects.select_for_update().filter(institution_id=instance.institution_id).first()
            if account and account.plan_id:
                # Existing active records consume no additional seat.
                existing = type(instance).objects.filter(pk=instance.pk, institution_id=instance.institution_id, is_active=True).exists() if instance.pk else False
                if not existing:
                    limit = getattr(account.plan, kind+'_limit')
                    count = type(instance).objects.filter(institution_id=instance.institution_id, is_active=True).count()
                    if count >= limit:
                        raise ValidationError({'institution': f'The subscription limit of {limit} active {kind}s has been reached. Contact your administrator to upgrade the plan.'})
        yield
