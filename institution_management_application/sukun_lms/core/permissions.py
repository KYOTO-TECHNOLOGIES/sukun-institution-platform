from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_ROLES = {'INSTITUTION_ADMIN', 'PRINCIPAL'}
MODULES = {'academics','students','staff','attendance','examinations','exam_seating','tasks','communications',
           'learning','admissions','finance','library','expenses','payroll','assets','transport','hostel','support','frontdesk','pastoral'}
ROLE_MODULES = {
    'TEACHER': ({'institutions','academics','students','staff','attendance','examinations','exam_seating','tasks','communications','learning','support','pastoral'},
                {'attendance','examinations','exam_seating','tasks','learning','support','pastoral'}),
    'ACCOUNTANT': ({'institutions','academics','students','finance','expenses','payroll'}, {'finance','expenses','payroll'}),
    'LIBRARIAN': ({'institutions','students','library'}, {'library'}),
    'MARKETING': ({'admissions','academics','institutions','frontdesk'}, {'admissions','frontdesk'}),
    'ADMISSIONS': ({'admissions','academics','institutions','students','frontdesk'}, {'admissions','students','frontdesk'}),
    'HR': ({'staff','institutions','payroll','assets','support'}, {'staff','payroll','assets','support'}),
    'FRONT_DESK': ({'institutions','frontdesk','transport','support'}, {'frontdesk','support'}),
}


def can_access(user,module,write=False):
    if not user or not user.is_authenticated: return False
    if user.is_superuser: return True
    if not user.institution_id: return False
    if user.user_type in {'STUDENT','PARENT'}: return False
    override=getattr(user,'permission_overrides',{}).get(module+('_write' if write else '_read'))
    if override is not None: return override is True
    if user.user_type in ADMIN_ROLES: return True
    readable,writable=ROLE_MODULES.get(user.user_type,(set(),set()))
    return module in (writable if write else readable)


class InstitutionRolePermission(BasePermission):
    def has_permission(self, request, view):
        module=getattr(view,'permission_module',None) or view.queryset.model._meta.app_label
        return can_access(request.user,module,request.method not in SAFE_METHODS)
