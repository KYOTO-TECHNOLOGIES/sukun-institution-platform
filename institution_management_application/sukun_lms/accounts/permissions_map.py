from core.permissions import ADMIN_ROLES, ROLE_MODULES, can_access


def page_permissions(user):
    admin = user.is_superuser or user.user_type in ADMIN_ROLES
    read, write = ROLE_MODULES.get(user.user_type, (set(), set()))
    modules = {
        'classes': 'academics', 'students': 'students', 'staff': 'staff', 'finance': 'finance',
        'library': 'library', 'communications': 'communications', 'admissions': 'admissions',
        'learning': 'learning', 'attendance': 'attendance', 'tasks': 'tasks',
        'examinations': 'examinations', 'expenses':'expenses', 'payroll':'payroll', 'assets':'assets',
        'transport':'transport', 'hostel':'hostel', 'support':'support', 'frontdesk':'frontdesk', 'pastoral':'pastoral',
        'sessions': 'exam_seating', 'schedules': 'exam_seating', 'rooms': 'exam_seating',
        'rules': 'exam_seating', 'arrangements': 'exam_seating', 'malpractice': 'exam_seating',
    }
    result = {'dashboard_read': True, 'settings_read': admin, 'settings_write': admin,
              'users_read': admin, 'users_write': admin, 'portal_read': user.user_type in {'STUDENT', 'PARENT'},
              'reports_read': admin, 'audit_read': admin}
    for key, module in modules.items():
        result[key + '_read'] = can_access(user,module)
        result[key + '_write'] = can_access(user,module,True)
    result['leave_read']=can_access(user,'staff')
    result['leave_write']=can_access(user,'staff',True) or user.user_type=='TEACHER'
    return result
