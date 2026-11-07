export interface PagePermissions {
	dashboard_read?: boolean;
	classes_read?: boolean;
	classes_write?: boolean;
	students_read?: boolean;
	students_write?: boolean;
	sessions_read?: boolean;
	sessions_write?: boolean;
	schedules_read?: boolean;
	schedules_write?: boolean;
	rooms_read?: boolean;
	rooms_write?: boolean;
	rules_read?: boolean;
	rules_write?: boolean;
	arrangements_read?: boolean;
	arrangements_write?: boolean;
	attendance_read?: boolean;
	attendance_write?: boolean;
	malpractice_read?: boolean;
	malpractice_write?: boolean;
	settings_read?: boolean;
	settings_write?: boolean;

	// Legacy keys
	queue_management_read?: boolean;
	queue_management_write?: boolean;
	serving_point_read?: boolean;
	serving_point_write?: boolean;
	users_read?: boolean;
	users_write?: boolean;
	screens_read?: boolean;
	screens_write?: boolean;
	templates_read?: boolean;
	templates_write?: boolean;
	controllers_read?: boolean;
	controllers_write?: boolean;
	token_users_read?: boolean;
	token_users_write?: boolean;
}

/** Fallback used for admin/superuser accounts that have no explicit page_permission record. */
export const ALL_PERMISSIONS_TRUE: PagePermissions = {
	dashboard_read: true,
	classes_read: true,
	classes_write: true,
	students_read: true,
	students_write: true,
	sessions_read: true,
	sessions_write: true,
	schedules_read: true,
	schedules_write: true,
	rooms_read: true,
	rooms_write: true,
	rules_read: true,
	rules_write: true,
	arrangements_read: true,
	arrangements_write: true,
	attendance_read: true,
	attendance_write: true,
	malpractice_read: true,
	malpractice_write: true,
	settings_read: true,
	settings_write: true,

	queue_management_read: true,
	queue_management_write: true,
	serving_point_read: true,
	serving_point_write: true,
	users_read: true,
	users_write: true,
	screens_read: true,
	screens_write: true,
	templates_read: true,
	templates_write: true,
	controllers_read: true,
	controllers_write: true,
	token_users_read: true,
	token_users_write: true,
};
