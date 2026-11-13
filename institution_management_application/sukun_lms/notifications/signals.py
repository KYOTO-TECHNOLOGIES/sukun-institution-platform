"""Collect changes within an authenticated HTTP request; seed scripts stay quiet."""
from contextvars import ContextVar
from django.db.models.signals import pre_save, post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .catalog import CATALOG
from core.tenancy import owner_id

current_batch = ContextVar('notification_batch', default=None)
IGNORE = {'updated_at', 'last_login', 'password'}

def snapshot(instance):
    return {field.attname: getattr(instance, field.attname) for field in instance._meta.concrete_fields if field.name not in IGNORE}

@receiver(pre_save)
def remember_before(sender, instance, raw=False, **kwargs):
    batch = current_batch.get()
    if raw or batch is None or sender._meta.label_lower not in CATALOG:
        return
    old = sender.objects.filter(pk=instance.pk).first() if instance.pk else None
    instance._notification_before = snapshot(old) if old else None

def collect(instance, deleted=False, force=False):
    batch = current_batch.get()
    key = instance._meta.label_lower
    if batch is None or key not in CATALOG:
        return
    request = batch['request']
    view = getattr(getattr(request, 'resolver_match', None), 'func', None)
    queryset = getattr(getattr(view, 'cls', None), 'queryset', None)
    # A workflow can touch many models. Summarize its primary resource, not every side effect.
    if queryset is not None and queryset.model is not type(instance):
        return
    before = getattr(instance, '_notification_before', None)
    if not deleted and not force and before == snapshot(instance):
        return
    identity = (key, str(instance.pk))
    first = batch['changes'].get(identity)
    batch['changes'][identity] = {
        'instance': instance, 'before': first['before'] if first else before,
        'deleted': deleted, 'forced': force or bool(first and first['forced']),
        'pk': str(instance.pk), 'institution_id': owner_id(instance), 'after': snapshot(instance),
    }

@receiver(post_save)
def saved(sender, instance, raw=False, **kwargs):
    if not raw:
        collect(instance)

@receiver(post_delete)
def deleted(sender, instance, **kwargs):
    collect(instance, deleted=True)

@receiver(m2m_changed)
def recipients_changed(sender, instance, action, reverse=False, **kwargs):
    if action in {'post_add', 'post_remove', 'post_clear'} and instance._meta.label_lower == 'communications.notification' and not reverse:
        collect(instance, force=True)
