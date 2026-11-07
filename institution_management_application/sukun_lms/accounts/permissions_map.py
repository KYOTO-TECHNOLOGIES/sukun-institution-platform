from core.permissions import ADMIN_ROLES, ROLE_MODULES


def page_permissions(user):
    admin = user.is_superuser or user.user_type in ADMIN_ROLES
    read, write = ROLE_MODULES.get(user.user_type, (set(), set()))
    modules = {
        'classes': 'academics', 'students': 'students', 'staff': 'staff', 'finance': 'finance',
        'library': 'library', 'communications': 'communications', 'admissions': 'admissions',
        'learning': 'learning', 'attendance': 'attendance', 'tasks': 'tasks',
        'examinations': 'examinations', 'operations': 'operations',
        'sessions': 'exam_seating', 'schedules': 'exam_seating', 'rooms': 'exam_seating',
        'rules': 'exam_seating', 'arrangements': 'exam_seating', 'malpractice': 'exam_seating',
    }
    result = {'dashboard_read': True, 'settings_read': admin, 'settings_write': admin,
              'users_read': admin, 'users_write': admin, 'portal_read': user.user_type in {'STUDENT', 'PARENT'},
              'reports_read': admin, 'audit_read': admin}
    for key, module in modules.items():
        result[key + '_read'] = admin or module in read
        result[key + '_write'] = admin or module in write
    return result
