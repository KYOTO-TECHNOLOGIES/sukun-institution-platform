"""Recipient and inbox visibility rules are enforced on the server."""
from django.db.models import Q
from core.permissions import can_access
from .catalog import MODULE_LABELS
from .models import InboxItem

def visible_inbox(user):
    if not user.institution_id:
        return InboxItem.objects.none()
    modules = [module for module in MODULE_LABELS if can_access(user, module)]
    staff = Q(scope='module', module__in=modules)
    if user.user_type == 'TEACHER' and not user.is_superuser:
        staff &= (
            ~Q(module__in=['learning', 'staff', 'support'])
            | Q(module='learning', course__teacher=user)
            | Q(module__in=['staff', 'support'], staff_user=user, staff_private=False)
        )
    family = Q(scope='student', student__is_active=True, student__institution_id=user.institution_id)
    family &= Q(student__user=user) | Q(student__parents__user=user, student__parents__is_active=True)
    family &= Q(course__isnull=True) | Q(course__status='PUBLISHED', course__is_active=True)
    family &= Q(exam_period__isnull=True) | Q(exam_period__is_published=True)
    addressed = Q(scope='notice', notice__recipients=user, notice__is_active=True, notice__institution_id=user.institution_id)
    return InboxItem.objects.filter(
        recipient=user, institution_id=user.institution_id,
    ).filter(staff | family | addressed | Q(scope='personal')).distinct()
