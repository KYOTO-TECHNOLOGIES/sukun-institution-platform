from datetime import timedelta
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission
from .models import OrganizationAccount


def is_platform_admin(user):
    return bool(user and user.is_authenticated and user.is_active and user.is_superuser
                and user.user_type == 'SUPER_ADMIN' and not user.institution_id)


class PlatformPermission(BasePermission):
    message = 'This area is reserved for software administrators.'

    def has_permission(self, request, view):
        return is_platform_admin(request.user)


def access_state(account):
    today = timezone.localdate()
    if not account.institution.is_active:
        return {'allowed': False, 'status': 'SUSPENDED', 'reason': 'This institution has been deactivated. Contact the software administrator.'}
    if account.status in {'SUSPENDED', 'CANCELLED'}:
        return {'allowed': False, 'status': account.status, 'reason': account.suspension_reason or 'Contact the software administrator to restore access.'}
    if account.status == 'TRIAL' and (not account.trial_ends_on or account.trial_ends_on < today):
        return {'allowed': False, 'status': 'TRIAL_EXPIRED', 'reason': 'Your demonstration period has ended. Contact us to activate your subscription.'}
    if account.enforce_overdue:
        overdue = account.invoices.filter(status='ISSUED', due_on__lt=today-timedelta(days=account.grace_days)).exists()
        expired = account.status == 'ACTIVE' and account.paid_until and account.paid_until < today-timedelta(days=account.grace_days)
        if overdue or expired:
            return {'allowed': False, 'status': 'PAST_DUE', 'reason': 'Your subscription requires a billing review. Your records are safely retained.'}
    return {'allowed': True, 'status': account.status, 'reason': ''}


def user_access(user):
    if is_platform_admin(user) or not user.institution_id:
        return {'allowed': True, 'status': 'PLATFORM' if is_platform_admin(user) else 'UNASSIGNED', 'reason': ''}
    account = OrganizationAccount.objects.select_related('institution').filter(institution_id=user.institution_id).first()
    if account:
        return access_state(account)
    # Existing unmanaged installations retain access; disabled institutions never do.
    return {'allowed': user.institution.is_active, 'status': 'UNMANAGED', 'reason': 'Contact your institution administrator.' if not user.institution.is_active else ''}


def enforce_request_access(user, path):
    if path in {'/api/auth/me/', '/api/auth/change-password/', '/api/auth/logout/'}:
        return
    if user.must_change_password:
        raise PermissionDenied({'code': 'password_change_required', 'detail': 'Set a new password in Profile & security before continuing.'})
    if is_platform_admin(user):
        if not path.startswith('/api/saas/platform/'):
            raise PermissionDenied('Software administrators use the platform console. Institution records require an institution account.')
        return
    # Billing recovery remains reachable even when all institution operations are blocked.
    if path == '/api/saas/subscription/' or path.startswith('/api/saas/my-invoices/'):
        return
    state = user_access(user)
    if not state['allowed']:
        raise PermissionDenied({'code': 'organization_restricted', 'detail': state['reason']})
