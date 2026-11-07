from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_ROLES = {'INSTITUTION_ADMIN', 'PRINCIPAL'}
ROLE_MODULES = {
    'MARKETING': ({'admissions', 'academics', 'institutions'}, {'admissions'}),
    'ADMISSIONS': ({'admissions', 'academics', 'institutions', 'students'}, {'admissions', 'students'}),
    'HR': ({'staff', 'institutions', 'operations'}, {'staff', 'operations'}),
    'TEACHER': ({'institutions', 'academics', 'students', 'staff', 'attendance', 'examinations', 'exam_seating', 'tasks', 'communications', 'learning'},
                {'attendance', 'examinations', 'exam_seating', 'tasks', 'learning'}),
    'ACCOUNTANT': ({'institutions', 'academics', 'students', 'finance'}, {'finance'}),
    'LIBRARIAN': ({'institutions', 'students', 'library'}, {'library'}),
}


class InstitutionRolePermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if not user.institution_id:
            return False
        if user.user_type in ADMIN_ROLES:
            return True
        module = view.queryset.model._meta.app_label
        readable, writable = ROLE_MODULES.get(user.user_type, (set(), set()))
        return module in (readable if request.method in SAFE_METHODS else writable)
